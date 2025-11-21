# Resource Sharing Architecture V3: Direct Supabase Writes

## Overview

**Key Change**: Client writes metadata directly to Supabase, backend only handles assets and serving.

```
┌─────────────────────────────────────────────────────────────┐
│ UPLOAD FLOW                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PWA Client                                                 │
│    ↓ 1. Upload assets                                       │
│  Backend API (/api/assets)                                  │
│    ↓ 2. Upload to Digital Ocean                             │
│  Digital Ocean Spaces                                       │
│    ↓ 3. Return asset IDs                                    │
│  PWA Client                                                 │
│    ↓ 4. Write metadata + asset IDs                          │
│  Supabase (direct insert)                                   │
│    ↓ 5. Return share URL                                    │
│  User                                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ VIEW FLOW (harpy.chat)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  harpy.chat Frontend                                        │
│    ↓ 1. Request shared resource                             │
│  Backend API (/api/shared/:id)                              │
│    ↓ 2. Read from Supabase                                  │
│  Supabase                                                   │
│    ↓ 3. Reconstruct package                                 │
│  Backend API                                                │
│    ↓ 4. Return package                                      │
│  harpy.chat Frontend (display)                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Supabase)

### RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE shared_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ... (all tables)

-- Anonymous INSERT for sharing (1-hour expiration enforced by trigger)
CREATE POLICY "Allow anonymous insert for sharing"
ON shared_resources
FOR INSERT
TO anon
WITH CHECK (
  expires_at <= NOW() + INTERVAL '1 hour'
);

-- Public SELECT only for non-expired resources
CREATE POLICY "Allow public read for non-expired"
ON shared_resources
FOR SELECT
TO public
USING (expires_at > NOW());

-- Cascade to related tables
CREATE POLICY "Allow public read for flows"
ON flows
FOR SELECT
TO public
USING (
  id IN (
    SELECT resource_id FROM shared_resources
    WHERE expires_at > NOW() AND resource_type = 'flow'
  )
);

-- Similar policies for characters, scenarios, sessions, agents, etc.
```

### Automatic Expiration Cleanup

```sql
-- Delete expired resources (runs every hour)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'delete-expired-shares',
  '0 * * * *', -- Every hour
  $$
  DELETE FROM shared_resources
  WHERE expires_at <= NOW();
  $$
);

-- CASCADE DELETE handles cleanup of related resources
```

---

## Implementation

### 1. Asset Upload API (Backend Only)

**Purpose**: Upload binary assets to Digital Ocean (can't expose credentials to client)

```typescript
// apps/backend/src/modules/assets/assets.controller.ts

@Controller('api/assets')
export class AssetsController {
  constructor(
    private readonly doService: DigitalOceanService,
    private readonly supabase: SupabaseClient,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadAsset(@UploadedFile() file: Express.Multer.File) {
    // 1. Calculate hash for deduplication
    const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // 2. Check if asset already exists in Supabase
    const { data: existingAsset } = await this.supabase
      .from('assets')
      .select('id')
      .eq('hash', hash)
      .single();

    if (existingAsset) {
      return { assetId: existingAsset.id }; // ✅ Deduplicate
    }

    // 3. Upload to Digital Ocean
    const assetId = crypto.randomUUID();
    const fileKey = `shared-assets/${assetId}/${file.originalname}`;

    await this.doService.upload({
      key: fileKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const fileUrl = `https://cdn.digitalocean.com/${fileKey}`;

    // 4. Insert asset record into Supabase
    const { data: asset } = await this.supabase
      .from('assets')
      .insert({
        id: assetId,
        name: file.originalname,
        hash,
        size_byte: file.size,
        mime_type: file.mimetype,
        file_path: fileUrl, // ✅ Digital Ocean URL
      })
      .select()
      .single();

    return { assetId: asset.id };
  }
}
```

### 2. Client-Side Upload (PWA)

**Purpose**: Upload flow/card/session to Supabase directly

```typescript
// apps/pwa/src/entities/shared-resource/services/share-service.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY, // ✅ Public anon key
);

export class ShareService {
  /**
   * Upload flow to Supabase (direct write)
   */
  static async shareFlow(flowId: UniqueEntityID): Promise<Result<string>> {
    try {
      // 1. Export flow using existing usecase
      const flowResult = await FlowService.exportFlowWithNodes.execute({ flowId });
      if (flowResult.isFailure) {
        return Result.fail(flowResult.getError());
      }

      const flowFile = flowResult.getValue();
      const flowData = JSON.parse(await flowFile.text());

      // 2. Generate UUIDs client-side (security)
      const shareId = crypto.randomUUID();
      const flowDbId = crypto.randomUUID();

      // 3. Write flow to Supabase (direct insert)
      const { error: flowError } = await supabase.from('flows').insert({
        id: flowDbId,
        name: flowData.name,
        description: flowData.description,
        nodes: flowData.nodes,
        edges: flowData.edges,
        response_template: flowData.responseTemplate,
      });

      if (flowError) {
        return Result.fail(`Failed to insert flow: ${flowError.message}`);
      }

      // 4. Write agents to Supabase
      const agentInserts = Object.entries(flowData.agents || {}).map(
        ([agentId, agentData]: [string, any]) => ({
          id: agentId,
          flow_id: flowDbId, // ✅ Restore relationship
          name: agentData.name,
          prompt_messages: agentData.promptMessages,
          model_tier: agentData.modelTier,
          temperature: agentData.temperature,
          max_tokens: agentData.maxTokens,
          top_p: agentData.topP,
          frequency_penalty: agentData.frequencyPenalty,
          presence_penalty: agentData.presencePenalty,
          response_format: agentData.responseFormat,
        }),
      );

      const { error: agentsError } = await supabase
        .from('agents')
        .insert(agentInserts);

      if (agentsError) {
        return Result.fail(`Failed to insert agents: ${agentsError.message}`);
      }

      // 5. Write dataStoreNodes to Supabase
      const dsInserts = Object.entries(flowData.dataStoreNodes || {}).map(
        ([nodeId, nodeData]: [string, any]) => ({
          id: nodeId,
          flow_id: flowDbId,
          name: nodeData.name,
          color: nodeData.color,
          data_store_fields: nodeData.dataStoreFields,
        }),
      );

      if (dsInserts.length > 0) {
        const { error: dsError } = await supabase
          .from('data_store_nodes')
          .insert(dsInserts);

        if (dsError) {
          return Result.fail(`Failed to insert dataStoreNodes: ${dsError.message}`);
        }
      }

      // 6. Write ifNodes to Supabase
      const ifInserts = Object.entries(flowData.ifNodes || {}).map(
        ([nodeId, nodeData]: [string, any]) => ({
          id: nodeId,
          flow_id: flowDbId,
          name: nodeData.name,
          conditions: nodeData.conditions,
        }),
      );

      if (ifInserts.length > 0) {
        const { error: ifError } = await supabase
          .from('if_nodes')
          .insert(ifInserts);

        if (ifError) {
          return Result.fail(`Failed to insert ifNodes: ${ifError.message}`);
        }
      }

      // 7. Create shared_resources entry
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      const { error: shareError } = await supabase.from('shared_resources').insert({
        id: shareId,
        resource_type: 'flow',
        resource_id: flowDbId,
        expires_at: expiresAt.toISOString(),
      });

      if (shareError) {
        return Result.fail(`Failed to create share: ${shareError.message}`);
      }

      // 8. Return shareable URL
      const shareUrl = `https://harpy.chat/flows/detail/${shareId}`;
      return Result.ok(shareUrl);
    } catch (error) {
      return formatFail('Failed to share flow', error);
    }
  }

  /**
   * Upload card with icon asset
   */
  static async shareCard(cardId: UniqueEntityID): Promise<Result<string>> {
    try {
      // 1. Export card as JSON
      const cardResult = await CardService.exportCard.execute({
        cardId,
        options: { format: 'json' }, // ✅ JSON mode
      });

      if (cardResult.isFailure) {
        return Result.fail(cardResult.getError());
      }

      const cardFile = cardResult.getValue();
      const cardData = JSON.parse(await cardFile.text());

      // 2. Upload icon asset (if exists)
      let iconAssetId: string | null = null;

      const cardEntity = await CardRepo.getCardById(cardId);
      if (cardEntity.isSuccess && cardEntity.getValue().iconAssetId) {
        const asset = await AssetRepo.getAssetById(
          cardEntity.getValue().iconAssetId,
        );

        if (asset.isSuccess) {
          const assetFile = await file(asset.getValue().filePath).getOriginFile();

          // Upload to backend API (can't upload to DO directly)
          const formData = new FormData();
          formData.append('file', assetFile);

          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/assets`,
            {
              method: 'POST',
              body: formData,
            },
          );

          const { assetId } = await response.json();
          iconAssetId = assetId;
        }
      }

      // 3. Generate UUIDs
      const shareId = crypto.randomUUID();
      const characterDbId = crypto.randomUUID();

      // 4. Write character to Supabase (direct insert)
      const { error: charError } = await supabase.from('characters').insert({
        id: characterDbId,
        title: cardData.data.extensions.title,
        name: cardData.data.name,
        description: cardData.data.description,
        example_dialogue: cardData.data.mes_example,
        lorebook: cardData.data.character_book,
        tags: cardData.data.tags,
        creator: cardData.data.creator,
        version: cardData.data.character_version,
        card_summary: cardData.data.creator_notes,
        conceptual_origin: cardData.data.extensions.conceptualOrigin,
        icon_asset_id: iconAssetId, // ✅ Asset ID (or null)
      });

      if (charError) {
        return Result.fail(`Failed to insert character: ${charError.message}`);
      }

      // 5. Create shared_resources entry
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const { error: shareError } = await supabase.from('shared_resources').insert({
        id: shareId,
        resource_type: 'card_character',
        resource_id: characterDbId,
        expires_at: expiresAt.toISOString(),
      });

      if (shareError) {
        return Result.fail(`Failed to create share: ${shareError.message}`);
      }

      // 6. Return shareable URL
      const shareUrl = `https://harpy.chat/cards/detail/${shareId}`;
      return Result.ok(shareUrl);
    } catch (error) {
      return formatFail('Failed to share card', error);
    }
  }

  /**
   * Upload session with multiple assets
   */
  static async shareSession(sessionId: UniqueEntityID): Promise<Result<string>> {
    try {
      // 1. Get session
      const sessionResult = await SessionRepo.getSessionById(sessionId);
      if (sessionResult.isFailure) {
        return Result.fail(sessionResult.getError());
      }

      const session = sessionResult.getValue();
      const sessionJson = SessionDrizzleMapper.toPersistence(session);

      // 2. Upload all assets to backend
      const assetIds: Record<string, string> = {}; // localAssetId → dbAssetId

      // Upload background
      if (session.backgroundId) {
        const bgAsset = await AssetRepo.getAssetById(session.backgroundId);
        if (bgAsset.isSuccess) {
          const bgFile = await file(bgAsset.getValue().filePath).getOriginFile();
          const formData = new FormData();
          formData.append('file', bgFile);

          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/assets`,
            { method: 'POST', body: formData },
          );

          const { assetId } = await response.json();
          assetIds[session.backgroundId.toString()] = assetId;
        }
      }

      // Upload cover (same process)
      if (session.coverId) {
        // ... (same as background)
      }

      // Upload all card icons
      for (const card of session.allCards) {
        if (card.iconAssetId) {
          // ... (same as background)
        }
      }

      // 3. Generate UUIDs
      const shareId = crypto.randomUUID();
      const sessionDbId = crypto.randomUUID();

      // 4. Write session to Supabase
      const { error: sessionError } = await supabase.from('sessions').insert({
        id: sessionDbId,
        title: sessionJson.title,
        all_cards: sessionJson.all_cards.map((card) => ({
          ...card,
          icon_asset_id: card.icon_asset_id
            ? assetIds[card.icon_asset_id]
            : null,
        })),
        user_character_card_id: sessionJson.user_character_card_id,
        turn_ids: sessionJson.turn_ids,
        background_id: sessionJson.background_id
          ? assetIds[sessionJson.background_id]
          : null,
        cover_id: sessionJson.cover_id ? assetIds[sessionJson.cover_id] : null,
        translation: sessionJson.translation,
        chat_styles: sessionJson.chat_styles,
        flow_id: sessionJson.flow_id, // ✅ Reference to flow
      });

      if (sessionError) {
        return Result.fail(`Failed to insert session: ${sessionError.message}`);
      }

      // 5. Create shared_resources entry
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      const { error: shareError } = await supabase.from('shared_resources').insert({
        id: shareId,
        resource_type: 'session',
        resource_id: sessionDbId,
        expires_at: expiresAt.toISOString(),
      });

      if (shareError) {
        return Result.fail(`Failed to create share: ${shareError.message}`);
      }

      // 6. Return shareable URL
      const shareUrl = `https://harpy.chat/sessions/detail/${shareId}`;
      return Result.ok(shareUrl);
    } catch (error) {
      return formatFail('Failed to share session', error);
    }
  }
}
```

### 3. Backend Serving (harpy.chat)

**Purpose**: Read from Supabase and reconstruct packages for harpy.chat frontend

```typescript
// apps/backend/src/modules/shared-resources/shared-resources.controller.ts

@Controller('api/shared')
export class SharedResourcesController {
  constructor(private readonly supabase: SupabaseClient) {}

  @Get(':id')
  async getSharedResource(@Param('id') shareId: string) {
    // 1. Get shared resource record
    const { data: sharedResource, error: shareError } = await this.supabase
      .from('shared_resources')
      .select('*')
      .eq('id', shareId)
      .single();

    if (shareError || !sharedResource) {
      throw new NotFoundException('Shared resource not found or expired');
    }

    // 2. Check expiration
    if (new Date(sharedResource.expires_at) < new Date()) {
      throw new NotFoundException('Shared resource has expired');
    }

    // 3. Reconstruct based on resource type
    switch (sharedResource.resource_type) {
      case 'flow':
        return this.reconstructFlow(sharedResource.resource_id);
      case 'card_character':
        return this.reconstructCharacter(sharedResource.resource_id);
      case 'session':
        return this.reconstructSession(sharedResource.resource_id);
      default:
        throw new BadRequestException('Unknown resource type');
    }
  }

  private async reconstructFlow(flowId: string) {
    // 1. Get flow
    const { data: flow } = await this.supabase
      .from('flows')
      .select('*')
      .eq('id', flowId)
      .single();

    // 2. Get related entities
    const { data: agents } = await this.supabase
      .from('agents')
      .select('*')
      .eq('flow_id', flowId);

    const { data: dataStoreNodes } = await this.supabase
      .from('data_store_nodes')
      .select('*')
      .eq('flow_id', flowId);

    const { data: ifNodes } = await this.supabase
      .from('if_nodes')
      .select('*')
      .eq('flow_id', flowId);

    // 3. Reconstruct enhanced format
    return {
      name: flow.name,
      description: flow.description,
      nodes: flow.nodes,
      edges: flow.edges,
      responseTemplate: flow.response_template,
      agents: agents.reduce(
        (acc, agent) => ({
          ...acc,
          [agent.id]: {
            name: agent.name,
            promptMessages: agent.prompt_messages,
            modelTier: agent.model_tier,
            temperature: agent.temperature,
            maxTokens: agent.max_tokens,
            topP: agent.top_p,
            frequencyPenalty: agent.frequency_penalty,
            presencePenalty: agent.presence_penalty,
            responseFormat: agent.response_format,
          },
        }),
        {},
      ),
      dataStoreNodes: dataStoreNodes.reduce(
        (acc, node) => ({
          ...acc,
          [node.id]: {
            name: node.name,
            color: node.color,
            dataStoreFields: node.data_store_fields,
          },
        }),
        {},
      ),
      ifNodes: ifNodes.reduce(
        (acc, node) => ({
          ...acc,
          [node.id]: {
            name: node.name,
            conditions: node.conditions,
          },
        }),
        {},
      ),
    };
  }

  private async reconstructCharacter(characterId: string) {
    // 1. Get character
    const { data: character } = await this.supabase
      .from('characters')
      .select('*, assets(*)')
      .eq('id', characterId)
      .single();

    // 2. Reconstruct Character Card V2 format
    return {
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: character.name,
        description: character.description,
        personality: '',
        scenario: '',
        first_mes: '',
        mes_example: character.example_dialogue,
        creator_notes: character.card_summary,
        system_prompt: '',
        post_history_instructions: '',
        alternate_greetings: [],
        character_book: character.lorebook,
        tags: character.tags,
        creator: character.creator,
        character_version: character.version,
        extensions: {
          title: character.title,
          icon_url: character.assets?.file_path, // ✅ Digital Ocean URL
          cardSummary: character.card_summary,
          version: character.version,
          conceptualOrigin: character.conceptual_origin,
          createdAt: character.created_at,
          updatedAt: character.updated_at,
        },
      },
    };
  }

  private async reconstructSession(sessionId: string) {
    // Similar to reconstructCharacter...
  }
}
```

---

## Summary

### Architecture Benefits

1. ✅ **Simpler upload**: Client writes directly to Supabase (no backend distribution logic)
2. ✅ **Backend is stateless**: Only reads and reconstructs (no write logic)
3. ✅ **Leverages Supabase**: RLS, automatic expiration, anonymous access
4. ✅ **Still secure**: Assets handled by backend (credentials not exposed)
5. ✅ **Scales easily**: Supabase handles concurrent writes

### What Backend Still Does

1. **Asset upload endpoint** (`POST /api/assets`): Upload to Digital Ocean
2. **Read endpoint** (`GET /api/shared/:id`): Reconstruct packages for harpy.chat
3. **Cleanup job** (optional): Delete orphaned assets from Digital Ocean

### What Client Does

1. **Export resources**: Using existing usecases (ExportFlowWithNodes, etc.)
2. **Upload assets**: Call backend API to upload to Digital Ocean
3. **Write to Supabase**: Direct insert with RLS policies
4. **Generate UUIDs**: Client-side for security

### Next Steps

1. Set up Supabase project with RLS policies
2. Implement asset upload endpoint in backend
3. Implement ShareService in PWA
4. Implement reconstruction endpoints in backend
5. Add harpy.chat frontend pages
