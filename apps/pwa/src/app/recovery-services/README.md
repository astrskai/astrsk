# Recovery Services

Tools for recovering lost user data when migrations fail.

## Legacy Character Recovery

Recovers character data from old deprecated tables (`character_cards`, `plot_cards`, `cards`) when the migration to new tables (`characters`, `scenarios`) failed.

### Problem

Users upgrading from old versions may experience:
- Missing characters in library
- Missing characters in sessions
- Data lost during migration due to schema mismatches

### Solution

The `LegacyCharacterRecovery` service checks if old tables still exist and recovers any missing data.

---

## Usage for End Users (Browser Console)

### Step 1: Open Browser Console

1. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. Go to the **Console** tab

### Step 2: Import Recovery Service

```javascript
// Import the recovery service
const { LegacyCharacterRecovery } = await import('/src/app/recovery-services/index.ts');
const recovery = new LegacyCharacterRecovery();
```

### Step 3: Check for Missing Data

```javascript
// Check if you have missing characters
const report = await recovery.checkLegacyData();
console.log(report);

// Output example:
// {
//   hasLegacyTables: true,
//   legacyCharacterCount: 25,
//   currentCharacterCount: 10,
//   missingCharacters: 15,  // ⚠️ 15 characters are missing!
//   canRecover: true
// }
```

### Step 4: Recover All Data

```javascript
// Recover everything automatically
const result = await recovery.recoverAll();

// Output example:
// ✅ RECOVERY COMPLETE!
//   Characters: 15 recovered, 0 failed
//   Scenarios: 3 recovered, 0 failed
```

### Step 5 (Optional): Download Backup

```javascript
// Create a downloadable backup file
await recovery.downloadBackup();

// Downloads: astrsk-legacy-backup-1234567890.json
```

---

## Usage for Developers (Code)

### Import and Use

```typescript
import { LegacyCharacterRecovery } from "@/app/recovery-services";

const recovery = new LegacyCharacterRecovery();

// Check status
const report = await recovery.checkLegacyData();

if (report.canRecover) {
  // Recover all
  await recovery.recoverAll();
}
```

### Advanced Usage

```typescript
// Get list of missing characters
const missingChars = await recovery.getMissingCharacters();
console.log(missingChars); // Array of LegacyCharacterData

// Recover only characters
const charResult = await recovery.recoverCharacters();
console.log(`Recovered ${charResult.recovered} characters`);

// Recover only scenarios
const scenResult = await recovery.recoverScenarios();
console.log(`Recovered ${scenResult.recovered} scenarios`);

// Export backup programmatically
const backupBlob = await recovery.exportBackup();
// Use blob for upload to cloud, etc.
```

---

## How It Works

### 1. Detection

Checks if old tables exist:
- `character_cards` (old character data)
- `plot_cards` (old scenario data)
- `cards` (old common metadata)

### 2. Comparison

Counts records in old vs new tables:
```sql
-- Old characters
SELECT COUNT(*) FROM cards c
INNER JOIN character_cards cc ON c.id = cc.id
WHERE c.type = 'character';

-- New characters
SELECT COUNT(*) FROM characters;
```

### 3. Recovery

For each missing character:
1. Read from old tables (`cards` + `character_cards`)
2. Transform data to new schema
3. Insert into new table (`characters`)
4. Handle duplicates with `ON CONFLICT DO NOTHING`

### 4. Verification

After recovery:
- Counts total characters in new table
- Verifies all data was recovered
- Reports success/failures

---

## Safety Features

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Non-destructive**: Never deletes old tables
- ✅ **Conflict handling**: Uses `ON CONFLICT DO NOTHING` to avoid duplicates
- ✅ **Detailed logging**: Shows progress for each character
- ✅ **Backup export**: Can save all data before recovery

---

## When to Use

### Use this recovery tool if:
- User reports "all my characters are gone"
- Characters missing from library after upgrade
- Characters missing from sessions after upgrade
- Migration logs show errors about `character_cards` table

### DO NOT use if:
- User simply can't find characters (check search/filters first)
- Migration completed successfully (check migration logs)
- Old tables don't exist (means migration succeeded and dropped them)

---

## Future Enhancements

- [ ] Add UI page in Settings > Advanced > Recovery
- [ ] Auto-run recovery check on first app load after upgrade
- [ ] Recover character images (assets) along with data
- [ ] Import backup files (currently only exports)
- [ ] Batch processing for large datasets
- [ ] Progress indicators for UI

---

## Technical Notes

### Schema Differences

**Old Schema:**
```
cards (common metadata)
  ├─ character_cards (character-specific data)
  └─ plot_cards (scenario-specific data)
```

**New Schema:**
```
characters (all-in-one character table)
scenarios (all-in-one scenario table)
```

### Migration That Should Have Run

File: `apps/pwa/src/db/migrations/20251117050000_migrate_cards_data.ts`

This migration:
1. Copies data from old tables → new tables
2. Verifies counts match
3. Drops old tables

If Step 2 fails, transaction rolls back and old tables remain.

### Why Recovery Works

When migration fails:
- ❌ New tables are empty (or have partial data)
- ✅ Old tables still exist (transaction rollback)
- ✅ We can re-read old tables and copy again

---

## Support

If recovery fails, check:
1. Browser console for error messages
2. Old tables exist: `information_schema.tables`
3. Database permissions
4. Schema compatibility

For additional help, contact development team.
