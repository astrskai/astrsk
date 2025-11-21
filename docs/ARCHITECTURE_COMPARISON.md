# Architecture Comparison: V2 vs V3

## V2: Backend API for Everything (Previous Plan)

```
PWA Client
  ↓ 1. POST /api/shared-resources/:id
  ↓    (upload complete package)
Backend API
  ↓ 2. Parse package
  ↓ 3. Distribute to tables
  ↓ 4. Upload assets to Digital Ocean
Supabase Database
```

**Backend Responsibilities**:
- ✅ Receive packages from client
- ✅ Parse and validate
- ✅ **Distribute to normalized tables** (flows → agents, dataStoreNodes, etc.)
- ✅ Upload assets to Digital Ocean
- ✅ Create shared_resources entries
- ✅ Serve to harpy.chat

**Client Responsibilities**:
- Export packages (ExportFlowWithNodes, etc.)
- Upload via API

**Problems**:
- ❌ Backend has complex distribution logic
- ❌ Backend needs to understand all resource types
- ❌ Backend is in the critical path for uploads
- ❌ More code to maintain

---

## V3: Direct Supabase Writes (New Plan)

```
PWA Client
  ↓ 1. Upload assets to backend
Backend API (/api/assets)
  ↓ 2. Upload to Digital Ocean
  ↓ 3. Insert to Supabase assets table
  ↓ 4. Return asset IDs
PWA Client
  ↓ 5. Write metadata directly to Supabase
Supabase Database (direct insert via RLS)
```

**Backend Responsibilities**:
- ✅ Upload assets to Digital Ocean (only!)
- ✅ Serve reconstructed packages to harpy.chat
- ❌ ~~No distribution logic~~
- ❌ ~~No package parsing~~

**Client Responsibilities**:
- ✅ Export packages
- ✅ Upload assets to backend
- ✅ **Distribute to Supabase tables directly** (flows, agents, dataStoreNodes, etc.)
- ✅ Create shared_resources entries

**Benefits**:
- ✅ **Simpler backend** (50% less code)
- ✅ **Faster uploads** (no backend hop for metadata)
- ✅ **Leverages Supabase RLS** (built-in security)
- ✅ **Backend is stateless** (just reads and serves)

---

## Key Differences

| Aspect | V2 (Backend API) | V3 (Direct Supabase) |
|--------|-----------------|---------------------|
| **Upload path** | Client → Backend → Supabase | Client → Supabase (direct) |
| **Asset upload** | Backend handles | Backend handles (same) |
| **Package distribution** | Backend distributes | **Client distributes** |
| **Backend complexity** | High (parse + distribute) | **Low (upload assets only)** |
| **Security** | Backend validates | **Supabase RLS validates** |
| **Expiration** | Backend cron job | **Supabase cron job** |
| **Backend role** | Upload + Serve | **Serve only** |

---

## Why V3 is Better

### 1. Simpler Backend

**V2 Backend** (complex):
```typescript
@Post('shared-resources/:id')
async uploadResource(@Body() body: any) {
  // 1. Parse package
  const package = JSON.parse(body.resourceData);

  // 2. Insert flow
  const flow = await this.db.insert(flows).values({...});

  // 3. Distribute agents
  for (const [agentId, agentData] of Object.entries(package.agents)) {
    await this.db.insert(agents).values({
      id: agentId,
      flow_id: flow.id, // ✅ Restore relationship
      ...agentData
    });
  }

  // 4. Distribute dataStoreNodes
  // 5. Distribute ifNodes
  // 6. Create shared_resources entry
  // ...
}
```

**V3 Backend** (simple):
```typescript
@Post('assets')
async uploadAsset(@UploadedFile() file: File) {
  // 1. Upload to Digital Ocean
  const url = await this.doService.upload(file);

  // 2. Insert to Supabase
  const asset = await this.supabase.from('assets').insert({
    file_path: url,
    ...
  });

  return { assetId: asset.id };
}
```

### 2. Faster Uploads

**V2**: Client → Backend API → Supabase (2 hops)
**V3**: Client → Supabase (1 hop for metadata)

### 3. Leverage Supabase Features

**V2**: Implement manually
- Rate limiting → Express middleware
- Expiration → NestJS cron job
- Anonymous access → Custom auth logic

**V3**: Built-in
- Rate limiting → Supabase RLS + policies
- Expiration → Supabase cron extension
- Anonymous access → `TO anon` policy

### 4. Client Controls Distribution

**This is actually an advantage!** The client already knows the structure:

```typescript
// Client distributes (V3)
await supabase.from('flows').insert({ ... });

for (const [agentId, agentData] of Object.entries(flowData.agents)) {
  await supabase.from('agents').insert({
    id: agentId,
    flow_id: flowDbId, // ✅ Client knows the relationship!
    ...agentData
  });
}
```

**Why this works**:
- Client has all the data (from export usecases)
- Client knows the relationships (agent → flow, node → flow, etc.)
- No need to send to backend for parsing

---

## What Stays the Same

1. **Export usecases** (ExportFlowWithNodes, etc.) - unchanged
2. **Import usecases** (ImportFlowWithNodes, etc.) - unchanged
3. **Asset storage** (Digital Ocean) - unchanged
4. **Schema** (flows, agents, dataStoreNodes, etc.) - unchanged
5. **harpy.chat serving** - backend still reconstructs packages

---

## Migration Path

If you already implemented V2, here's how to migrate to V3:

### 1. Remove Backend Distribution Logic

**Delete**:
- `apps/backend/src/modules/shared-resources/services/flow-distribution.service.ts`
- `apps/backend/src/modules/shared-resources/services/card-distribution.service.ts`
- `apps/backend/src/modules/shared-resources/services/session-distribution.service.ts`

**Keep**:
- `apps/backend/src/modules/assets/assets.controller.ts` (upload endpoint)
- `apps/backend/src/modules/shared-resources/shared-resources.controller.ts` (read endpoint)

### 2. Add Supabase Client to PWA

```bash
cd apps/pwa
pnpm add @supabase/supabase-js
```

### 3. Move Distribution Logic to Client

**From**:
```typescript
// Backend (V2)
POST /api/shared-resources/:id
```

**To**:
```typescript
// Client (V3)
ShareService.shareFlow(flowId) // ✅ Writes directly to Supabase
```

### 4. Update Environment Variables

```bash
# .env.local (PWA)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... # ✅ Public anon key (safe to expose)
VITE_BACKEND_URL=https://api.harpy.chat # ✅ For asset uploads only
```

---

## Security Comparison

### V2: Backend Validates

```typescript
// Backend checks everything
if (!isValidFlow(flowData)) {
  throw new BadRequestException();
}

if (flowData.agents.length > 100) {
  throw new BadRequestException('Too many agents');
}
```

### V3: Supabase RLS Validates

```sql
-- Supabase policies enforce rules
CREATE POLICY "Limit expiration to 1 hour"
ON shared_resources
FOR INSERT
TO anon
WITH CHECK (
  expires_at <= NOW() + INTERVAL '1 hour' -- ✅ Enforced at DB level
);

CREATE POLICY "Limit agents per flow"
ON agents
FOR INSERT
TO anon
WITH CHECK (
  (SELECT COUNT(*) FROM agents WHERE flow_id = NEW.flow_id) < 100
);
```

**V3 is actually MORE secure** because:
- ✅ Rules enforced at database level (can't bypass)
- ✅ Supabase handles rate limiting
- ✅ RLS policies are declarative and auditable

---

## Recommendation

**Use V3 (Direct Supabase Writes)** because:

1. ✅ **50% less backend code** (no distribution logic)
2. ✅ **Faster uploads** (client → Supabase direct)
3. ✅ **Simpler architecture** (backend only handles assets)
4. ✅ **More secure** (database-level validation)
5. ✅ **Easier to maintain** (less code = fewer bugs)
6. ✅ **Scales better** (Supabase handles load)

**Backend only needs to**:
- Upload assets to Digital Ocean
- Serve reconstructed packages to harpy.chat

That's it!
