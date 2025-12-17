import { Drizzle } from "@/db/drizzle";
import { sql } from "drizzle-orm";

/**
 * Test Utility: Intentionally Break System to Simulate Migration Failure
 *
 * This utility simulates a REAL migration failure by:
 * 1. Creating legacy tables (cards, character_cards, plot_cards)
 * 2. Moving characters to legacy tables
 * 3. Deleting characters from new tables
 * 4. Keeping sessions pointing to old character IDs (broken references)
 * 5. Making allCards reference the old character_cards
 *
 * This creates the exact scenario users experience after a failed migration:
 * - Sessions exist but characters are missing
 * - Character references are broken
 * - Data is in old tables but not accessible
 *
 * WARNING: This WILL break your system! Only use for testing recovery!
 *
 * Usage (browser console):
 * ```typescript
 * import { TestBreakSystem } from "@/app/recovery-services/test-break-system";
 *
 * const breaker = new TestBreakSystem();
 *
 * // Check what will happen
 * await breaker.checkCurrentState();
 *
 * // DANGER: Break the system (simulates migration failure)
 * await breaker.breakSystem();
 *
 * // After testing recovery, restore system
 * await breaker.restoreSystem();
 * ```
 */

export class TestBreakSystem {
  private logCallback?: (message: string) => void;
  private logs: string[] = [];

  setLogCallback(callback: (message: string) => void) {
    this.logCallback = callback;
  }

  private log(message: string) {
    console.log(message);
    this.logs.push(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  getLogs(): string[] {
    return this.logs;
  }

  /**
   * Step 1: Check current state before breaking
   */
  async checkCurrentState(): Promise<{
    characters: number;
    scenarios: number;
    sessions: number;
    sessionsWithCharacters: number;
  }> {
    this.log("📊 Checking current state...");

    const db = await Drizzle.getInstance();

    // Count current data
    const chars = await db.execute(sql`SELECT COUNT(*) as count FROM characters`);
    const scens = await db.execute(sql`SELECT COUNT(*) as count FROM scenarios`);
    const sess = await db.execute(sql`SELECT COUNT(*) as count FROM sessions`);

    // Count sessions with character references
    const sessWithChars = await db.execute(sql`
      SELECT COUNT(DISTINCT s.id) as count
      FROM sessions s
      WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(s.all_cards) as card
        WHERE (card->>'type')::text = 'character'
      )
    `);

    const characterCount = Number(chars.rows[0].count);
    const scenarioCount = Number(scens.rows[0].count);
    const sessionCount = Number(sess.rows[0].count);
    const sessionWithCharCount = Number(sessWithChars.rows[0].count);

    this.log(`\n📊 Current state:`);
    this.log(`  Characters: ${characterCount}`);
    this.log(`  Scenarios: ${scenarioCount}`);
    this.log(`  Sessions: ${sessionCount}`);
    this.log(`  Sessions with character references: ${sessionWithCharCount}`);

    return {
      characters: characterCount,
      scenarios: scenarioCount,
      sessions: sessionCount,
      sessionsWithCharacters: sessionWithCharCount,
    };
  }

  /**
   * Step 2: Create legacy tables
   */
  async createLegacyTables(): Promise<void> {
    this.log("\n🔧 Creating legacy tables...");

    const db = await Drizzle.getInstance();

    // Create cards table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        icon_asset_id TEXT,
        tags JSONB DEFAULT '[]'::jsonb,
        creator TEXT,
        card_summary TEXT,
        version TEXT,
        conceptual_origin TEXT,
        vibe_session_id TEXT,
        image_prompt TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create character_cards table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS character_cards (
        id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        example_dialogue TEXT,
        lorebook JSONB
      )
    `);

    // Create plot_cards table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS plot_cards (
        id TEXT PRIMARY KEY REFERENCES cards(id) ON DELETE CASCADE,
        description TEXT,
        scenarios JSONB,
        lorebook JSONB
      )
    `);

    this.log("  ✅ Legacy tables created");
  }

  /**
   * Step 3: Move characters to legacy tables
   */
  async moveCharactersToLegacy(): Promise<number> {
    this.log("\n📋 Moving characters to legacy tables...");

    const db = await Drizzle.getInstance();

    // Get all current characters
    const characters = await db.execute(sql`SELECT * FROM characters`);

    let moved = 0;

    for (const char of characters.rows) {
      try {
        // Insert into cards table
        await db.execute(sql`
          INSERT INTO cards (
            id, title, type, icon_asset_id, tags, creator, card_summary,
            version, conceptual_origin, vibe_session_id, image_prompt,
            created_at, updated_at
          ) VALUES (
            ${char.id},
            ${char.title},
            'character',
            ${char.icon_asset_id},
            ${char.tags ? JSON.stringify(char.tags) : '[]'}::jsonb,
            ${char.creator},
            ${char.card_summary},
            ${char.version},
            ${char.conceptual_origin},
            ${char.vibe_session_id},
            ${char.image_prompt},
            ${char.created_at},
            ${char.updated_at}
          )
          ON CONFLICT (id) DO NOTHING
        `);

        // Insert into character_cards table
        await db.execute(sql`
          INSERT INTO character_cards (
            id, name, description, example_dialogue, lorebook
          ) VALUES (
            ${char.id},
            ${char.name},
            ${char.description},
            ${char.example_dialogue},
            ${char.lorebook}
          )
          ON CONFLICT (id) DO NOTHING
        `);

        moved++;
        this.log(`  ✅ Moved: ${char.name} (${char.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to move ${char.name}:`, error);
      }
    }

    this.log(`\n📊 Moved ${moved} characters to legacy tables`);
    return moved;
  }

  /**
   * Step 4: Move scenarios to legacy tables
   */
  async moveScenariosToLegacy(): Promise<number> {
    this.log("\n📋 Moving scenarios to legacy tables...");

    const db = await Drizzle.getInstance();

    // Get all current scenarios
    const scenarios = await db.execute(sql`SELECT * FROM scenarios`);

    this.log(`  Found ${scenarios.rows.length} scenarios to move`);
    if (scenarios.rows.length === 0) {
      this.log("  ⚠️  No scenarios found to move!");
      return 0;
    }

    let moved = 0;

    for (const scen of scenarios.rows) {
      try {
        // Insert into cards table
        await db.execute(sql`
          INSERT INTO cards (
            id, title, type, icon_asset_id, tags, creator, card_summary,
            version, conceptual_origin, vibe_session_id, image_prompt,
            created_at, updated_at
          ) VALUES (
            ${scen.id},
            ${scen.title},
            'plot',
            ${scen.icon_asset_id},
            ${scen.tags ? JSON.stringify(scen.tags) : '[]'}::jsonb,
            ${scen.creator},
            ${scen.card_summary},
            ${scen.version},
            ${scen.conceptual_origin},
            ${scen.vibe_session_id},
            ${scen.image_prompt},
            ${scen.created_at},
            ${scen.updated_at}
          )
          ON CONFLICT (id) DO NOTHING
        `);

        // Insert into plot_cards table
        await db.execute(sql`
          INSERT INTO plot_cards (
            id, description, scenarios, lorebook
          ) VALUES (
            ${scen.id},
            ${scen.description},
            ${scen.first_messages ? JSON.stringify(scen.first_messages) : null}::jsonb,
            ${scen.lorebook}
          )
          ON CONFLICT (id) DO NOTHING
        `);

        moved++;
        this.log(`  ✅ Moved: ${scen.title} (${scen.id})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.log(`  ❌ Failed to move ${scen.title}: ${errorMsg}`);
        console.error(`  ❌ Failed to move ${scen.title}:`, error);
      }
    }

    this.log(`\n📊 Moved ${moved} scenarios to legacy tables`);
    return moved;
  }

  /**
   * Step 5: Delete characters from new tables (breaking references)
   */
  async deleteNewCharacters(): Promise<number> {
    this.log("\n⚠️  BREAKING SYSTEM: Deleting characters from new tables...");

    const db = await Drizzle.getInstance();
    const result = await db.execute(sql`DELETE FROM characters RETURNING id`);

    this.log(`  ❌ Deleted ${result.rows.length} characters`);
    this.log("  ⚠️  Sessions now have broken character references!");

    return result.rows.length;
  }

  /**
   * Step 6: Delete scenarios from new tables
   */
  async deleteNewScenarios(): Promise<number> {
    this.log("\n⚠️  BREAKING SYSTEM: Deleting scenarios from new tables...");

    const db = await Drizzle.getInstance();
    const result = await db.execute(sql`DELETE FROM scenarios RETURNING id`);

    this.log(`  ❌ Deleted ${result.rows.length} scenarios`);
    this.log("  ⚠️  Sessions now have broken scenario references!");

    return result.rows.length;
  }

  /**
   * MAIN: Break the entire system (simulate migration failure)
   */
  async breakSystem(): Promise<{
    charactersMoved: number;
    scenariosMoved: number;
    charactersDeleted: number;
    scenariosDeleted: number;
  }> {
    this.log("💥 BREAKING SYSTEM - Simulating migration failure...\n");
    this.log("⚠️  WARNING: This will make your sessions broken!");
    this.log("⚠️  Characters will disappear from UI but sessions will remain!");
    this.log("⚠️  This is exactly what users experience after a failed migration.\n");

    const stateBefore = await this.checkCurrentState();

    // Create legacy tables
    await this.createLegacyTables();

    // Move data to legacy tables
    const charsMoved = await this.moveCharactersToLegacy();
    const scensMoved = await this.moveScenariosToLegacy();

    // Delete from new tables (BREAKING REFERENCES)
    const charsDeleted = await this.deleteNewCharacters();
    const scensDeleted = await this.deleteNewScenarios();

    const stateAfter = await this.checkCurrentState();

    this.log("\n💥 SYSTEM BROKEN!");
    this.log("\n📊 Before:");
    this.log(`  Characters: ${stateBefore.characters}`);
    this.log(`  Sessions with characters: ${stateBefore.sessionsWithCharacters}`);
    this.log("\n📊 After:");
    this.log(`  Characters: ${stateAfter.characters} (${stateBefore.characters - stateAfter.characters} MISSING)`);
    this.log(`  Sessions: ${stateAfter.sessions} (still exist, but references are broken!)`);
    this.log(`  Legacy characters: ${charsMoved} (in old tables)`);
    this.log("\n💡 Now test the Character Recovery tool to fix this!");
    this.log("💡 Go to: Settings > Advanced > Recovery > Character & Scenario Recovery");

    return {
      charactersMoved: charsMoved,
      scenariosMoved: scensMoved,
      charactersDeleted: charsDeleted,
      scenariosDeleted: scensDeleted,
    };
  }

  /**
   * RESTORE: Fix the broken system using recovery
   */
  async restoreSystem(): Promise<void> {
    this.log("🔧 Restoring system using recovery...\n");

    const db = await Drizzle.getInstance();

    // Check if legacy tables exist
    const tableCheck = await db.execute(sql`
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cards') as has_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_cards') as has_character_cards
    `);

    if (!tableCheck.rows[0].has_cards) {
      this.log("❌ No legacy tables found. System may already be restored.");
      return;
    }

    // Recover characters from legacy tables
    this.log("🔧 Recovering characters from legacy tables...");

    const legacyChars = await db.execute(sql`
      SELECT
        c.id, c.title, c.icon_asset_id, c.tags, c.creator, c.card_summary,
        c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
        cc.name, cc.description, cc.example_dialogue, cc.lorebook,
        c.created_at, c.updated_at
      FROM cards c
      INNER JOIN character_cards cc ON c.id = cc.id
      WHERE c.type = 'character'
    `);

    let recovered = 0;

    for (const char of legacyChars.rows) {
      try {
        let tagsArray: string[] = [];
        if (char.tags) {
          if (typeof char.tags === 'string') {
            tagsArray = JSON.parse(char.tags);
          } else if (Array.isArray(char.tags)) {
            tagsArray = char.tags;
          }
        }

        await db.execute(sql`
          INSERT INTO characters (
            id, title, icon_asset_id, tags, creator, card_summary, version,
            conceptual_origin, vibe_session_id, image_prompt,
            name, description, example_dialogue, lorebook,
            session_id, created_at, updated_at
          ) VALUES (
            ${char.id},
            ${char.title},
            ${char.icon_asset_id},
            ${tagsArray}::text[],
            ${char.creator},
            ${char.card_summary},
            ${char.version},
            ${char.conceptual_origin},
            ${char.vibe_session_id},
            ${char.image_prompt},
            ${char.name},
            ${char.description},
            ${char.example_dialogue},
            ${char.lorebook ? JSON.stringify(char.lorebook) : null}::jsonb,
            NULL,
            ${char.created_at},
            ${char.updated_at}
          )
          ON CONFLICT (id) DO NOTHING
        `);

        recovered++;
        this.log(`  ✅ Recovered: ${char.name}`);
      } catch (error) {
        console.error(`  ❌ Failed to recover ${char.name}:`, error);
      }
    }

    this.log(`\n✅ Restored ${recovered} characters`);
    this.log("💡 Refresh the page to see your characters!");
  }

  /**
   * CLEANUP: Remove legacy tables
   */
  async cleanup(): Promise<void> {
    this.log("🧹 Cleaning up legacy tables...");

    const db = await Drizzle.getInstance();

    await db.execute(sql`DROP TABLE IF EXISTS character_cards CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS plot_cards CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS cards CASCADE`);

    this.log("  ✅ Legacy tables removed");
  }

  /**
   * Check if system is broken
   */
  async isBroken(): Promise<{
    broken: boolean;
    hasLegacyTables: boolean;
    missingCharacters: number;
  }> {
    const db = await Drizzle.getInstance();

    // Check if legacy tables exist
    const tableCheck = await db.execute(sql`
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cards') as has_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_cards') as has_character_cards
    `);

    const row = tableCheck.rows[0] as any;
    const hasLegacyTables = Boolean(row.has_cards) && Boolean(row.has_character_cards);

    // Count characters
    const currentChars = await db.execute(sql`SELECT COUNT(*) as count FROM characters`);
    const currentCount = Number(currentChars.rows[0].count);

    let legacyCount = 0;
    if (hasLegacyTables) {
      const legacyChars = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM cards c
        INNER JOIN character_cards cc ON c.id = cc.id
        WHERE c.type = 'character'
      `);
      legacyCount = Number(legacyChars.rows[0].count);
    }

    const missingCharacters = Math.max(0, legacyCount - currentCount);
    const broken = hasLegacyTables && missingCharacters > 0;

    return {
      broken,
      hasLegacyTables,
      missingCharacters,
    };
  }

  /**
   * Diagnostic: Check exact database state
   */
  async checkDatabaseState(): Promise<{
    characters: { current: number; legacy: number };
    scenarios: { current: number; legacy: number };
    tables: {
      hasCharacters: boolean;
      hasScenarios: boolean;
      hasCards: boolean;
      hasCharacterCards: boolean;
      hasPlotCards: boolean;
    };
  }> {
    this.log("🔍 Checking exact database state...\n");

    const db = await Drizzle.getInstance();

    // Check which tables exist
    const tableCheck = await db.execute(sql`
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'characters') as has_characters,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'scenarios') as has_scenarios,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cards') as has_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_cards') as has_character_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plot_cards') as has_plot_cards
    `);

    const row = tableCheck.rows[0] as any;
    const tables = {
      hasCharacters: Boolean(row.has_characters),
      hasScenarios: Boolean(row.has_scenarios),
      hasCards: Boolean(row.has_cards),
      hasCharacterCards: Boolean(row.has_character_cards),
      hasPlotCards: Boolean(row.has_plot_cards),
    };

    this.log("📊 Tables:");
    this.log(`  characters: ${tables.hasCharacters ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  scenarios: ${tables.hasScenarios ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  cards (legacy): ${tables.hasCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  character_cards (legacy): ${tables.hasCharacterCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  plot_cards (legacy): ${tables.hasPlotCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    // Count current data
    let currentCharCount = 0;
    let currentScenCount = 0;

    if (tables.hasCharacters) {
      const chars = await db.execute(sql`SELECT COUNT(*) as count FROM characters`);
      currentCharCount = Number(chars.rows[0].count);
    }

    if (tables.hasScenarios) {
      const scens = await db.execute(sql`SELECT COUNT(*) as count FROM scenarios`);
      currentScenCount = Number(scens.rows[0].count);
    }

    // Count legacy data
    let legacyCharCount = 0;
    let legacyScenCount = 0;

    if (tables.hasCards && tables.hasCharacterCards) {
      const chars = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM cards c
        INNER JOIN character_cards cc ON c.id = cc.id
        WHERE c.type = 'character'
      `);
      legacyCharCount = Number(chars.rows[0].count);
    }

    if (tables.hasCards && tables.hasPlotCards) {
      const scens = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM cards c
        INNER JOIN plot_cards pc ON c.id = pc.id
        WHERE c.type = 'plot'
      `);
      legacyScenCount = Number(scens.rows[0].count);
    }

    this.log("\n📊 Data counts:");
    this.log(`  Current characters: ${currentCharCount}`);
    this.log(`  Current scenarios: ${currentScenCount}`);
    this.log(`  Legacy characters (in character_cards): ${legacyCharCount}`);
    this.log(`  Legacy plot cards (in plot_cards): ${legacyScenCount}`);

    const missingChars = Math.max(0, legacyCharCount - currentCharCount);
    const missingScens = Math.max(0, legacyScenCount - currentScenCount);

    if (missingChars > 0 || missingScens > 0) {
      this.log("\n⚠️  MISSING DATA DETECTED:");
      if (missingChars > 0) {
        this.log(`  Missing characters: ${missingChars}`);
      }
      if (missingScens > 0) {
        this.log(`  Missing scenarios: ${missingScens}`);
      }
    } else {
      this.log("\n✅ No missing data detected");
    }

    return {
      characters: { current: currentCharCount, legacy: legacyCharCount },
      scenarios: { current: currentScenCount, legacy: legacyScenCount },
      tables,
    };
  }
}

/**
 * Browser console quick commands:
 *
 * // Import the utility
 * const { TestBreakSystem } = await import('/src/app/recovery-services/test-break-system');
 * const breaker = new TestBreakSystem();
 *
 * // Check current state
 * await breaker.checkCurrentState();
 *
 * // DANGER: Break the system
 * await breaker.breakSystem();
 *
 * // Test if broken
 * await breaker.isBroken();
 *
 * // Restore using recovery service
 * await breaker.restoreSystem();
 *
 * // Clean up legacy tables
 * await breaker.cleanup();
 */
