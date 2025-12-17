import { Drizzle } from "@/db/drizzle";
import { sql } from "drizzle-orm";

/**
 * Test Utility: Create Legacy Tables and Move Characters
 *
 * This utility is for TESTING ONLY. It simulates a failed migration by:
 * 1. Creating the old legacy tables (cards, character_cards, plot_cards)
 * 2. Copying current characters/scenarios to legacy tables
 * 3. Optionally deleting them from current tables
 *
 * Use this to test the character recovery feature.
 *
 * WARNING: This can delete your current data if you use deleteFromCurrent=true!
 *
 * Usage (browser console):
 * ```typescript
 * import { TestLegacySetup } from "@/app/recovery-services/test-legacy-setup";
 *
 * const setup = new TestLegacySetup();
 *
 * // Option 1: Copy to legacy tables (keeps current data)
 * await setup.createLegacyTablesAndCopy();
 *
 * // Option 2: Move to legacy tables (DELETES current data)
 * await setup.createLegacyTablesAndMove();
 *
 * // Clean up test (delete legacy tables)
 * await setup.cleanup();
 * ```
 */

export class TestLegacySetup {
  private logCallback?: (message: string) => void;

  setLogCallback(callback: (message: string) => void) {
    this.logCallback = callback;
  }

  private log(message: string) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  /**
   * Step 1: Create legacy table structure
   */
  async createLegacyTables(): Promise<void> {
    this.log("🔧 Creating legacy tables...");

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
   * Step 2: Copy current characters to legacy format
   */
  async copyCharactersToLegacy(): Promise<number> {
    this.log("📋 Copying characters to legacy tables...");

    const db = await Drizzle.getInstance();

    // Get all current characters
    const characters = await db.execute(sql`SELECT * FROM characters`);

    let copied = 0;

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

        copied++;
        this.log(`  ✅ Copied: ${char.name} (${char.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to copy ${char.name}:`, error);
      }
    }

    this.log(`\n📊 Copied ${copied} characters to legacy tables`);
    return copied;
  }

  /**
   * Step 3: Copy current scenarios to legacy format
   */
  async copyScenariosToLegacy(): Promise<number> {
    this.log("📋 Copying scenarios to legacy tables...");

    const db = await Drizzle.getInstance();

    // Get all current scenarios
    const scenarios = await db.execute(sql`SELECT * FROM scenarios`);

    let copied = 0;

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
            ${scen.first_messages},
            ${scen.lorebook}
          )
          ON CONFLICT (id) DO NOTHING
        `);

        copied++;
        this.log(`  ✅ Copied: ${scen.title} (${scen.id})`);
      } catch (error) {
        console.error(`  ❌ Failed to copy ${scen.title}:`, error);
      }
    }

    this.log(`\n📊 Copied ${copied} scenarios to legacy tables`);
    return copied;
  }

  /**
   * Step 4: Delete current characters (simulate data loss)
   */
  async deleteCurrentCharacters(): Promise<number> {
    this.log("⚠️  WARNING: Deleting current characters...");

    const db = await Drizzle.getInstance();
    const result = await db.execute(sql`DELETE FROM characters RETURNING id`);

    this.log(`  ❌ Deleted ${result.rows.length} characters from current table`);
    return result.rows.length;
  }

  /**
   * Step 5: Delete current scenarios (simulate data loss)
   */
  async deleteCurrentScenarios(): Promise<number> {
    this.log("⚠️  WARNING: Deleting current scenarios...");

    const db = await Drizzle.getInstance();
    const result = await db.execute(sql`DELETE FROM scenarios RETURNING id`);

    this.log(`  ❌ Deleted ${result.rows.length} scenarios from current table`);
    return result.rows.length;
  }

  /**
   * Full setup: Create legacy tables + copy data (safe, keeps current data)
   */
  async createLegacyTablesAndCopy(): Promise<{
    characters: number;
    scenarios: number;
  }> {
    this.log("🚀 Setting up test environment (SAFE MODE - keeps current data)...\n");

    await this.createLegacyTables();
    const charCount = await this.copyCharactersToLegacy();
    const scenCount = await this.copyScenariosToLegacy();

    this.log("\n✅ Test setup complete!");
    this.log("  Current characters: KEPT");
    this.log("  Current scenarios: KEPT");
    this.log(`  Legacy characters: ${charCount} copied`);
    this.log(`  Legacy scenarios: ${scenCount} copied`);
    this.log("\n💡 You can now test the recovery feature.");
    this.log("💡 Run cleanup() when done to remove legacy tables.");

    return { characters: charCount, scenarios: scenCount };
  }

  /**
   * Full setup: Create legacy tables + MOVE data (DANGEROUS - deletes current data)
   */
  async createLegacyTablesAndMove(): Promise<{
    characters: number;
    scenarios: number;
  }> {
    this.log("🚀 Setting up test environment (DANGER MODE - deletes current data)...\n");

    await this.createLegacyTables();
    const charCount = await this.copyCharactersToLegacy();
    const scenCount = await this.copyScenariosToLegacy();

    // Delete from current tables
    await this.deleteCurrentCharacters();
    await this.deleteCurrentScenarios();

    this.log("\n✅ Test setup complete!");
    this.log("  ⚠️  Current characters: DELETED");
    this.log("  ⚠️  Current scenarios: DELETED");
    this.log(`  Legacy characters: ${charCount} copied`);
    this.log(`  Legacy scenarios: ${scenCount} copied`);
    this.log("\n💡 You can now test the recovery feature to restore them.");
    this.log("💡 Run cleanup() to remove legacy tables (characters will be lost!).");

    return { characters: charCount, scenarios: scenCount };
  }

  /**
   * Cleanup: Remove legacy tables
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
   * Check current state
   */
  async checkState(): Promise<void> {
    this.log("📊 Current state:");

    const db = await Drizzle.getInstance();

    // Check if legacy tables exist
    const tableCheck = await db.execute(sql`
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cards') as has_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_cards') as has_character_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plot_cards') as has_plot_cards
    `);

    const hasCards = tableCheck.rows[0].has_cards;
    const hasCharacterCards = tableCheck.rows[0].has_character_cards;
    const hasPlotCards = tableCheck.rows[0].has_plot_cards;

    // Count current data
    const currentChars = await db.execute(sql`SELECT COUNT(*) as count FROM characters`);
    const currentScens = await db.execute(sql`SELECT COUNT(*) as count FROM scenarios`);

    // Count legacy data if exists
    let legacyChars = 0;
    let legacyPlots = 0;

    if (hasCards && hasCharacterCards) {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM cards c
        INNER JOIN character_cards cc ON c.id = cc.id
        WHERE c.type = 'character'
      `);
      legacyChars = Number(result.rows[0].count);
    }

    if (hasCards && hasPlotCards) {
      const result = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM cards c
        INNER JOIN plot_cards pc ON c.id = pc.id
        WHERE c.type = 'plot'
      `);
      legacyPlots = Number(result.rows[0].count);
    }

    this.log("\n📊 Legacy tables:");
    this.log(`  cards: ${hasCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  character_cards: ${hasCharacterCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  plot_cards: ${hasPlotCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    this.log("\n📊 Data counts:");
    this.log(`  Current characters: ${currentChars.rows[0].count}`);
    this.log(`  Current scenarios: ${currentScens.rows[0].count}`);
    this.log(`  Legacy characters: ${legacyChars}`);
    this.log(`  Legacy scenarios: ${legacyPlots}`);
  }
}

/**
 * Browser console quick commands:
 *
 * // Import the utility
 * const { TestLegacySetup } = await import('/src/app/recovery-services/test-legacy-setup');
 * const setup = new TestLegacySetup();
 *
 * // Check current state
 * await setup.checkState();
 *
 * // SAFE: Create legacy tables + copy (keeps current data)
 * await setup.createLegacyTablesAndCopy();
 *
 * // DANGER: Create legacy tables + move (deletes current data)
 * await setup.createLegacyTablesAndMove();
 *
 * // Test recovery
 * const { LegacyCharacterRecovery } = await import('/src/app/recovery-services/legacy-character-recovery');
 * const recovery = new LegacyCharacterRecovery();
 * await recovery.checkLegacyData();
 * await recovery.recoverAll();
 *
 * // Clean up
 * await setup.cleanup();
 */
