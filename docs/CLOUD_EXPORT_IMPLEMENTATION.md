# Cloud Export Implementation Summary

## ✅ Implemented

### 1. **Supabase Client Configuration**
- **File**: `apps/pwa/src/shared/lib/supabase-client.ts`
- **Features**:
  - Anonymous Supabase client (INSERT-only permissions via RLS)
  - Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Default expiration: 7 days
  - Assets bucket name: `astrsk-assets`

### 2. **Asset Upload Helper**
- **File**: `apps/pwa/src/shared/lib/supabase-asset-uploader.ts`
- **Features**:
  - Upload asset file to Supabase Storage
  - Insert metadata into `astrsk_assets` table
  - Handle duplicate uploads gracefully
  - Return public URL for assets

### 3. **Character Export to Cloud**
- **File**: `apps/pwa/src/entities/card/usecases/export-character-to-cloud.ts`
- **Flow**:
  1. Load character card from PGlite
  2. Upload icon asset (if exists)
  3. Insert into `astrsk_characters` table
  4. Create entry in `astrsk_shared_resources`
  5. Return share link: `harpy.chat/character/{uuid}`

### 4. **Scenario Export to Cloud**
- **File**: `apps/pwa/src/entities/card/usecases/export-scenario-to-cloud.ts`
- **Flow**: Same as character export
- **Share link**: `harpy.chat/scenario/{uuid}`

### 5. **Flow Export to Cloud**
- **File**: `apps/pwa/src/entities/flow/usecases/export-flow-to-cloud.ts`
- **Flow**:
  1. Load flow from PGlite
  2. Insert into `astrsk_flows` table
  3. Upload all agents → `astrsk_agents`
  4. Upload all data store nodes → `astrsk_data_store_nodes`
  5. Upload all if nodes → `astrsk_if_nodes`
  6. Create entry in `astrsk_shared_resources`
  7. Return share link: `harpy.chat/flow/{uuid}`

## 🔜 Next Steps

### 6. **Session Export to Cloud** (Most Complex)
- **File**: `apps/pwa/src/entities/session/usecases/export-session-to-cloud.ts`
- **Flow**:
  1. Load session from PGlite
  2. Upload background asset (if exists)
  3. Upload cover asset (if exists)
  4. Upload all characters in session
  5. Upload all scenarios in session
  6. Upload flow (if exists) with all child nodes
  7. Insert into `astrsk_sessions` table
  8. Create entry in `astrsk_shared_resources`
  9. Return share link: `harpy.chat/session/{uuid}`

### 7. **Package Dependencies**
Add to `apps/pwa/package.json`:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0"
  }
}
```

### 8. **Environment Variables**
Create `apps/pwa/.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 9. **UI Integration**
Add "Share to Cloud" buttons to:
- Character detail page
- Scenario detail page
- Flow detail page
- Session detail page

Example usage:
```typescript
const exportCharacterToCloud = new ExportCharacterToCloud(
  loadCardRepo,
  loadAssetRepo
);

const result = await exportCharacterToCloud.execute({
  cardId: characterId,
  expirationDays: 7
});

if (result.isSuccess) {
  const { shareUrl, expiresAt } = result.getValue();
  // Show share dialog with URL and expiration
}
```

### 10. **Testing Checklist**
- [ ] Supabase client connects successfully
- [ ] Assets upload to Storage bucket
- [ ] Character export creates valid share link
- [ ] Scenario export creates valid share link
- [ ] Flow export includes all child nodes
- [ ] Session export includes all child resources
- [ ] Share links are accessible anonymously
- [ ] Expired links are cleaned up (via cron job)
- [ ] Claimed resources show owner on harpy.chat

## 🎯 Architecture Overview

```
PGlite (Client) → Supabase (Cloud)
    ↓                   ↓
 Local DB         astrsk_* tables
    ↓                   ↓
 OPFS Files      Supabase Storage
    ↓                   ↓
Export UseCase   Anonymous INSERT
    ↓                   ↓
Share Link      harpy.chat/{type}/{uuid}
```

## 🔒 Security

- **Anonymous upload**: Only INSERT allowed (via RLS)
- **Public read**: Only if resource is in `astrsk_shared_resources` and not expired
- **Claiming**: Authenticated users can claim via `claim_resource()` function
- **Ownership**: After claiming, only owner can UPDATE/DELETE
- **Expiration**: Auto-cleanup via cron job

## 📝 Notes

- All resources default to `is_public = false` (private)
- All resources start with `owner_id = NULL` (unclaimed)
- Session-local resources (`session_id IS NOT NULL`) cannot be updated/deleted individually
- Assets are CASCADE deleted with parent resources (1-to-1 relationship)
