# Database Schema Simplification - Drizzle Migration Plan

**Goal**: Prepare schema for cloud database sync by fixing critical issues

**Approach**: Using Drizzle ORM with PGlite local database

**Last Updated**: 2025-11-17 (Drizzle format)

---

## Critical Issues Found

### 1. Card Schema (3 tables without relationships)
```
cards (id, title, type, tags, created_at, ...)
character_cards (id, name, description, created_at, ...)  -- ❌ No FK to cards
plot_cards (id, description, scenarios, created_at, ...)  -- ❌ No FK to cards
```

**Problems**:
- No foreign keys (can have orphaned data)
- Timestamps duplicated in 3 places
- Confusing naming ("plot" should be "scenario")

### 2. Session Schema (JSONB arrays)
```sql
sessions (
  id,
  all_cards JSONB,  -- ❌ Array of {id, type, enabled}
  turn_ids JSONB,   -- ❌ Array of turn UUIDs
  flow_id UUID      -- ❌ No FK
)
```

**Problems**:
- JSONB arrays instead of join tables
- No foreign keys
- Can't query "which sessions use this card?"

### 3. Flow Schema (Actually OK!)
```sql
flows (
  id,
  nodes JSONB,  -- ✅ OK (dynamic structure)
  edges JSONB,  -- ✅ OK (simple connections)
  panel_structure JSONB,  -- ✅ OK (dockview library)
  ...
)
```

**User Decision**: Keep flow schema as-is. JSONB is appropriate for dynamic data.

### 4. Local-First Architecture Decision

**Architecture**: PGLite (local) → Supabase (cloud sync later)

**User Decision**:
- ✅ Normalize sessions.all_cards (JSONB → session_cards table with triggers)
- ✅ Keep flow JSONB fields (appropriate for dynamic data)
- ✅ Keep other session JSONB fields (turn_ids, data_schema_order) as-is
- ✅ Focus on card schema separation + session normalization

---

## Orphan Prevention Strategy (DEFERRED TO PHASE 2)

⏸️ **Status**: This section is for future Phase 2 normalization (currently deferred)

**Original Decision**: Normalize JSONB arrays to proper tables with foreign keys, so database handles CASCADE DELETE automatically.

**Current Phase 1 Decision**: Keep sessions.all_cards as JSONB (no session_cards table)

### Database-Level Prevention (For Future Phase 2)

**Approach**: Convert `sessions.all_cards` JSONB array → `session_cards` join table with foreign keys

**New Schema**:
```sql
-- Join table for session-card relationships
CREATE TABLE session_cards (
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  card_id UUID NOT NULL,
  card_type VARCHAR NOT NULL CHECK (card_type IN ('character', 'scenario')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL,
  PRIMARY KEY (session_id, card_id, card_type)
);

-- Partial indexes for performance
CREATE INDEX idx_session_cards_character
  ON session_cards(card_id) WHERE card_type = 'character';
CREATE INDEX idx_session_cards_scenario
  ON session_cards(card_id) WHERE card_type = 'scenario';
CREATE INDEX idx_session_cards_display_order
  ON session_cards(session_id, display_order);
```

**Orphan Prevention with Triggers**:
```sql
-- Trigger to prevent orphaned character card references
CREATE OR REPLACE FUNCTION check_character_card_exists() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.card_type = 'character' THEN
    IF NOT EXISTS (SELECT 1 FROM character_cards WHERE id = NEW.card_id) THEN
      RAISE EXCEPTION 'Character card % does not exist', NEW.card_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_character_card_reference
  BEFORE INSERT OR UPDATE ON session_cards
  FOR EACH ROW EXECUTE FUNCTION check_character_card_exists();

-- Trigger to prevent orphaned scenario card references
CREATE OR REPLACE FUNCTION check_scenario_card_exists() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.card_type = 'scenario' THEN
    IF NOT EXISTS (SELECT 1 FROM scenario_cards WHERE id = NEW.card_id) THEN
      RAISE EXCEPTION 'Scenario card % does not exist', NEW.card_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_scenario_card_reference
  BEFORE INSERT OR UPDATE ON session_cards
  FOR EACH ROW EXECUTE FUNCTION check_scenario_card_exists();

-- Trigger to auto-cleanup when cards are deleted
CREATE OR REPLACE FUNCTION cleanup_session_cards_on_card_delete() RETURNS TRIGGER AS $$
BEGIN
  -- When a character card is deleted, remove from all sessions
  IF TG_TABLE_NAME = 'character_cards' THEN
    DELETE FROM session_cards
    WHERE card_id = OLD.id AND card_type = 'character';
  -- When a scenario card is deleted, remove from all sessions
  ELSIF TG_TABLE_NAME = 'scenario_cards' THEN
    DELETE FROM session_cards
    WHERE card_id = OLD.id AND card_type = 'scenario';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_character_card_sessions
  BEFORE DELETE ON character_cards
  FOR EACH ROW EXECUTE FUNCTION cleanup_session_cards_on_card_delete();

CREATE TRIGGER cleanup_scenario_card_sessions
  BEFORE DELETE ON scenario_cards
  FOR EACH ROW EXECUTE FUNCTION cleanup_session_cards_on_card_delete();
```

**Benefits**:
- ✅ **Database enforces integrity** - no orphans ever created
- ✅ **Automatic CASCADE DELETE** - delete card → delete session references automatically
- ✅ **No application cleanup code** - database handles everything
- ✅ **Cloud sync friendly** - proper relational structure
- ✅ **Can query relationships** - "which sessions use card X?"
- ✅ **Better performance** - indexed lookups instead of JSONB scans

**Trade-offs**:
- ⚠️ **More tables** - 1 additional table (session_cards)
- ⚠️ **Migration complexity** - need to convert JSONB → table
- ✅ **Worth it** - database integrity is more valuable than schema simplicity

---

## Phase 1: Separate Cards + Rename Plot to Scenario (1-2 weeks)

**Goal**:
1. Split cards into two independent tables (character_cards, scenario_cards)
2. Rename "plot" → "scenario" everywhere
3. ✅ **KEEP `sessions.all_cards` as JSONB** (no normalization in Phase 1)

### Target Schema:

```sql
-- Independent characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Common metadata (duplicated in both card tables)
  title VARCHAR NOT NULL,
  icon_asset_id UUID,
  tags TEXT[] DEFAULT '{}',
  creator VARCHAR,
  card_summary TEXT,
  version VARCHAR,
  conceptual_origin VARCHAR,
  vibe_session_id UUID,
  image_prompt TEXT,

  -- Character-specific fields
  name VARCHAR NOT NULL,
  description TEXT,
  example_dialogue TEXT,
  lorebook JSONB,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_characters_tags ON characters USING GIN(tags);
CREATE INDEX idx_characters_creator ON characters(creator);

-- Independent scenarios table
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Common metadata (duplicated in both card tables)
  title VARCHAR NOT NULL,
  icon_asset_id UUID,
  tags TEXT[] DEFAULT '{}',
  creator VARCHAR,
  card_summary TEXT,
  version VARCHAR,
  conceptual_origin VARCHAR,
  vibe_session_id UUID,
  image_prompt TEXT,

  -- Scenario-specific fields
  description TEXT,
  first_messages JSONB,  -- Array of {name, description} (renamed from scenarios)
  lorebook JSONB,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenarios_tags ON scenarios USING GIN(tags);
CREATE INDEX idx_scenarios_creator ON scenarios(creator);

-- Sessions table: KEEP all_cards as JSONB (unchanged)
-- Just update the JSONB data: 'plot' → 'scenario' in card type references
```

### Migration Steps (Drizzle):

#### Step 1: Update Drizzle Schema Files

**1.1. Create `apps/pwa/src/db/schema/characters.ts`** (rename from character-cards.ts, add common fields):

```typescript
import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { LorebookJSON } from "@/entities/card/domain/lorebook";

export const characters = pgTable(TableName.Characters, {
  id: uuid().primaryKey().defaultRandom(),

  // Common metadata (previously from cards table)
  title: varchar().notNull(),
  icon_asset_id: uuid(),
  tags: jsonb().$type<string[]>().default([]).notNull(),
  creator: varchar(),
  card_summary: text(),
  version: varchar(),
  conceptual_origin: varchar(),
  vibe_session_id: uuid(),
  image_prompt: text(),

  // Character-specific fields
  name: varchar().notNull(),
  description: text(),
  example_dialogue: text(),
  lorebook: jsonb().$type<LorebookJSON>(),

  ...timestamps,
});

export type SelectCharacter = typeof characters.$inferSelect;
export type InsertCharacter = typeof characters.$inferInsert;
```

**1.2. Create `apps/pwa/src/db/schema/scenarios.ts`** (rename from plot-cards.ts, add common fields):

```typescript
import { jsonb, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { TableName } from "@/db/schema/table-name";
import { timestamps } from "@/db/types/timestamps";
import { LorebookJSON } from "@/entities/card/domain/lorebook";

export const scenarios = pgTable(TableName.Scenarios, {
  id: uuid().primaryKey().defaultRandom(),

  // Common metadata (previously from cards table)
  title: varchar().notNull(),
  icon_asset_id: uuid(),
  tags: jsonb().$type<string[]>().default([]).notNull(),
  creator: varchar(),
  card_summary: text(),
  version: varchar(),
  conceptual_origin: varchar(),
  vibe_session_id: uuid(),
  image_prompt: text(),

  // Scenario-specific fields
  description: text(),
  first_messages: jsonb().$type<{ name: string; description: string }[]>(),
  lorebook: jsonb().$type<LorebookJSON>(),

  ...timestamps,
});

export type SelectScenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;
```

**1.3. Update `apps/pwa/src/db/schema/table-name.ts`**:

```typescript
export const TableName = {
  // ... other tables

  // Card
  Characters: "characters",
  Scenarios: "scenarios",  // Changed from PlotCards

  // ... other tables
} as const;
```

**1.4. Delete `apps/pwa/src/db/schema/cards.ts`** entirely

#### Step 2: Generate Drizzle Migration

Run Drizzle Kit to generate migration SQL:

```bash
cd apps/pwa
pnpm drizzle-kit generate
```

This creates a migration file in `src/db/migrations/` with the schema changes.

#### Step 3: Create Custom Data Migration Script

Create `apps/pwa/src/db/migrations/migrate-cards-data.ts`:

```typescript
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function migrateCardsData() {
  console.log("Starting card data migration...");

  await db.transaction(async (tx) => {
    // Step 1: Create temp tables
    await tx.execute(sql`
      CREATE TABLE character_cards_new (
        id UUID PRIMARY KEY, title VARCHAR NOT NULL, icon_asset_id UUID,
        tags JSONB DEFAULT '[]'::jsonb NOT NULL, creator VARCHAR,
        card_summary TEXT, version VARCHAR, conceptual_origin VARCHAR,
        vibe_session_id UUID, image_prompt TEXT, name VARCHAR NOT NULL,
        description TEXT, example_dialogue TEXT, lorebook JSONB,
        created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL
      );

      CREATE TABLE scenario_cards_new (
        id UUID PRIMARY KEY, title VARCHAR NOT NULL, icon_asset_id UUID,
        tags JSONB DEFAULT '[]'::jsonb NOT NULL, creator VARCHAR,
        card_summary TEXT, version VARCHAR, conceptual_origin VARCHAR,
        vibe_session_id UUID, image_prompt TEXT, description TEXT,
        scenarios JSONB, lorebook JSONB,
        created_at TIMESTAMP NOT NULL, updated_at TIMESTAMP NOT NULL
      );
    `);

    // Step 2: Migrate character cards
    await tx.execute(sql`
      INSERT INTO character_cards_new
      SELECT c.id, c.title, c.icon_asset_id, c.tags, c.creator, c.card_summary,
             c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
             cc.name, cc.description, cc.example_dialogue, cc.lorebook,
             c.created_at, c.updated_at
      FROM cards c INNER JOIN character_cards cc ON c.id = cc.id
      WHERE c.type = 'character';
    `);

    // Step 3: Migrate scenario cards
    await tx.execute(sql`
      INSERT INTO scenario_cards_new
      SELECT c.id, c.title, c.icon_asset_id, c.tags, c.creator, c.card_summary,
             c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
             pc.description, pc.scenarios, pc.lorebook,
             c.created_at, c.updated_at
      FROM cards c INNER JOIN plot_cards pc ON c.id = pc.id
      WHERE c.type = 'plot';
    `);

    // Step 4: Update sessions JSONB (plot → scenario)
    await tx.execute(sql`
      UPDATE sessions
      SET all_cards = (
        SELECT jsonb_agg(
          CASE
            WHEN card_item->>'type' = 'plot'
            THEN jsonb_set(card_item, '{type}', '"scenario"')
            ELSE card_item
          END
        )
        FROM jsonb_array_elements(all_cards) AS card_item
      )
      WHERE all_cards::text LIKE '%"type":"plot"%';
    `);

    // Step 5: Verify counts
    const verify = await tx.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM cards WHERE type = 'character') as char_old,
        (SELECT COUNT(*) FROM character_cards_new) as char_new,
        (SELECT COUNT(*) FROM cards WHERE type = 'plot') as plot_old,
        (SELECT COUNT(*) FROM scenario_cards_new) as scenario_new,
        (SELECT COUNT(*) FROM sessions WHERE all_cards::text LIKE '%"type":"plot"%') as plot_in_sessions;
    `);

    const counts = verify.rows[0];
    if (counts.char_old !== counts.char_new) throw new Error("Character card count mismatch!");
    if (counts.plot_old !== counts.scenario_new) throw new Error("Scenario card count mismatch!");
    if (counts.plot_in_sessions !== 0) throw new Error("'plot' type still in sessions!");

    // Step 6: Atomic swap
    await tx.execute(sql`
      DROP TABLE character_cards;
      DROP TABLE plot_cards;
      DROP TABLE cards;
      ALTER TABLE character_cards_new RENAME TO character_cards;
      ALTER TABLE scenario_cards_new RENAME TO scenario_cards;
    `);

    // Step 7: Create indexes
    await tx.execute(sql`
      CREATE INDEX idx_character_cards_tags ON character_cards USING GIN(tags);
      CREATE INDEX idx_character_cards_creator ON character_cards(creator);
      CREATE INDEX idx_scenario_cards_tags ON scenario_cards USING GIN(tags);
      CREATE INDEX idx_scenario_cards_creator ON scenario_cards(creator);
    `);

    console.log("✅ Migration completed!");
  });
}
```

#### Step 4: Run Data Migration

Create a migration runner script `apps/pwa/src/db/migrations/run-migration.ts`:

```typescript
import { migrateCardsData } from "./migrate-cards-data";

async function main() {
  try {
    await migrateCardsData();
    console.log("✅ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
```

Run the migration:

```bash
cd apps/pwa
pnpm tsx src/db/migrations/run-migration.ts
```

**Note**: The migration script includes automatic verification and runs in a transaction for safety.

#### Step 5: Update TypeScript Domain & Mappers

**5.1. Update Domain Enums** - `apps/pwa/src/entities/card/domain/card.ts`:

```typescript
export enum CardType {
  Character = "character",
  Scenario = "scenario",  // Changed from Plot
}
```

**5.2. Rename Domain File**:
- Rename `apps/pwa/src/entities/card/domain/plot-card.ts` → `scenario-card.ts`
- Update all imports from `plot-card` → `scenario-card`

**5.3. Update Card Mappers** - `apps/pwa/src/entities/card/mappers/card-drizzle-mapper.ts`:

```typescript
// OLD: 3-table JOIN approach
export async function findCardById(id: string) {
  const result = await db
    .select()
    .from(cards)
    .leftJoin(characterCards, eq(cards.id, characterCards.id))
    .leftJoin(plotCards, eq(cards.id, plotCards.id))
    .where(eq(cards.id, id));
  // ...
}

// NEW: Direct table queries (no JOIN needed)
export async function findCardById(id: string, type: CardType) {
  if (type === CardType.Character) {
    return await db.select().from(characterCards).where(eq(characterCards.id, id));
  } else if (type === CardType.Scenario) {
    return await db.select().from(scenarioCards).where(eq(scenarioCards.id, id));
  }
}

// Or query both tables and check which exists
export async function findCardById(id: string) {
  const charCard = await db.select().from(characterCards).where(eq(characterCards.id, id));
  if (charCard.length > 0) return { type: CardType.Character, card: charCard[0] };

  const scenCard = await db.select().from(scenarioCards).where(eq(scenarioCards.id, id));
  if (scenCard.length > 0) return { type: CardType.Scenario, card: scenCard[0] };

  return null;
}
```

**5.4. Update All References**:

Run global find & replace:
```bash
# Find all CardType.Plot references
grep -r "CardType.Plot" apps/pwa/src/

# Find all 'plot' string literals in card-related code
grep -r "'plot'" apps/pwa/src/entities/card/
grep -r '"plot"' apps/pwa/src/entities/card/
```

Update to use `CardType.Scenario` / `'scenario'`

---

## Phase 2: Session Normalization (DEFERRED)

**Status**: ⏸️ Deferred to future iteration

**Original Goal**: Replace JSONB arrays with proper tables (sessions.all_cards → session_cards table)

**Decision**: Keep sessions.all_cards as JSONB for now
- Simpler migration (fewer moving parts)
- Faster implementation (1-2 weeks vs 3-4 weeks)
- Can normalize later if cloud sync requires it
- JSONB is acceptable for local-first architecture

**Future Consideration**: If cloud sync performance requires it, convert to:
```sql
CREATE TABLE session_cards (
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  card_id UUID NOT NULL,
  card_type VARCHAR NOT NULL CHECK (card_type IN ('character', 'scenario')),
  enabled BOOLEAN NOT NULL,
  display_order INTEGER NOT NULL,
  PRIMARY KEY (session_id, card_id, card_type)
);
```

---

## Phase 3: Foreign Keys (Optional)

**Goal**: Add foreign keys where appropriate

### What We're Sure About:

```sql
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_flow
    FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE RESTRICT;
```

### What We're NOT Sure About Yet:

- Should `session_cards` have FKs to both character and scenario tables?
- Can PostgreSQL handle that? (two optional FKs)
- What cascade behavior do we want?

**Action**: Research and decide later

---

## Immediate Next Steps (Drizzle Migration)

**Decision Made**: Keep sessions.all_cards as JSONB (no normalization)
**Scope**: Phase 1 only - Card table split + Plot→Scenario rename

### Execution Checklist:

#### Phase A: Schema Updates (Drizzle)

1. **Update Drizzle Schema Files**:
   - [x] Update `table-name.ts` (add Characters and Scenarios)
   - [x] Create `characters.ts` (rename from character-cards.ts, add common fields)
   - [x] Create `scenarios.ts` (rename from plot-cards.ts, add common fields, scenarios → first_messages)
   - [ ] Delete old schema files: `cards.ts`, `character-cards.ts`, `plot-cards.ts`
   - [ ] Run `pnpm drizzle-kit generate` to create migration

2. **Create Data Migration Script**:
   - [ ] Create `migrate-cards-data.ts` (see Step 3 above)
   - [ ] Create `run-migration.ts` runner script
   - [ ] Test migration script on backup database

#### Phase B: Execute Migration

3. **Backup & Migrate**:
   - [ ] Backup production database (PGlite → copy pglite/ folder)
   - [ ] Run `pnpm tsx src/db/migrations/run-migration.ts`
   - [ ] Verify console output shows:
     - Character card count matches
     - Scenario card count matches
     - No 'plot' types in sessions
     - ✅ Migration completed!

#### Phase C: TypeScript Updates

4. **Update Domain Layer**:
   - [ ] Update `card.ts` enum: `CardType.Plot` → `CardType.Scenario`
   - [ ] Rename `plot-card.ts` → `scenario-card.ts`
   - [ ] Update all imports of plot-card → scenario-card
   - [ ] Global find & replace: `CardType.Plot` → `CardType.Scenario`
   - [ ] Global find & replace: `'plot'` → `'scenario'` (in card code only)

5. **Update Mappers & Queries**:
   - [ ] Update `card-drizzle-mapper.ts` (no more 3-table JOIN)
   - [ ] Update card queries to use direct table access
   - [ ] Update query factory patterns

#### Phase D: Testing & Validation

6. **Testing**:
   - [ ] Run `pnpm test` (all tests must pass)
   - [ ] Run `pnpm build:pwa` (build must succeed)
   - [ ] Manual testing:
     - [ ] Create new character card
     - [ ] Create new scenario card
     - [ ] Load existing session with cards
     - [ ] Edit existing cards
     - [ ] Delete cards

7. **Deploy**:
   - [ ] Document rollback procedure (restore backup pglite/ folder)
   - [ ] Commit schema changes
   - [ ] Deploy to production

---

## Questions to Answer

### Phase 1 Questions:
- [ ] How to handle `session.all_cards` references during migration?
- [ ] Do we update sessions table during Phase 1, or wait for Phase 2?
- [ ] Rollback: Keep old tables for 1 week before deleting?

### General Questions:
- [ ] Which cloud database are you targeting? (Supabase, Neon, PlanetScale?)
- [ ] Do you need real-time sync or periodic sync?
- [ ] What's the acceptable downtime window for migration?

---

## Files That Will Change (Phase 1)

### Database Schema:
- `apps/pwa/src/db/schema/cards.ts` → **DELETE**
- `apps/pwa/src/db/schema/character-cards.ts` → **DELETE & REPLACE** with `characters.ts`
- `apps/pwa/src/db/schema/plot-cards.ts` → **DELETE & REPLACE** with `scenarios.ts`
- `apps/pwa/src/db/schema/characters.ts` → **CREATE** (new file, table name: `characters`)
- `apps/pwa/src/db/schema/scenarios.ts` → **CREATE** (new file, table name: `scenarios`, field: `first_messages`)

### Domain Models:
- `apps/pwa/src/entities/card/domain/plot-card.ts` → **RENAME** to `scenario-card.ts`
- `apps/pwa/src/entities/card/domain/card.ts` → **UPDATE** (`CardType.Plot` → `CardType.Scenario`)

### Mappers:
- `apps/pwa/src/entities/card/mappers/card-drizzle-mapper.ts` → **UPDATE** (no more 3-table JOIN, separate queries)

### Queries:
- `apps/pwa/src/entities/card/api/query-factory.ts` → **UPDATE** (separate queries per card type)

### All Files Using CardType.Plot:
- Find and replace all `CardType.Plot` → `CardType.Scenario`
- Find and replace all `'plot'` string literals → `'scenario'` where applicable

---

## Success Criteria

### Phase 1 (Simplified):
- [ ] `cards` table deleted
- [ ] `plot_cards` table deleted and replaced with `scenarios` table
- [ ] `character_cards` table deleted and replaced with `characters` table
- [ ] `characters` and `scenarios` are independent (all common fields copied)
- [ ] `scenarios` table uses `first_messages` field (not `scenarios`)
- [ ] All existing cards migrated with correct data (row counts match)
- [ ] Sessions JSONB updated: all 'plot' → 'scenario' type references
- [ ] No orphaned data
- [ ] All tests pass
- [ ] TypeScript build succeeds
- [ ] Application runs without errors

### Overall:
- [ ] Schema cleaner (3 tables → 2 tables for cards)
- [ ] No data loss
- [ ] Existing functionality preserved
- [ ] Ready for future cloud sync (Phase 2 normalization can be done later if needed)

---

## Notes

- **Flow schema**: Keep as-is (JSONB is appropriate)
- **Timeline**: Start with Phase 1, reassess after completion
- **Rollback**: Always have a backup before migration
