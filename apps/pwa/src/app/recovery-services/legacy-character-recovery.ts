import { Drizzle } from "@/db/drizzle";
import { sql } from "drizzle-orm";

/**
 * Legacy Character Recovery Service
 *
 * This service helps users recover character data from old deprecated tables
 * (character_cards, plot_cards, cards) if migration failed.
 *
 * Use this for users who report missing characters after upgrade.
 *
 * Usage:
 * ```typescript
 * import { LegacyCharacterRecovery } from "@/app/recovery-services/legacy-character-recovery";
 *
 * // In browser console or recovery UI:
 * const recovery = new LegacyCharacterRecovery();
 * await recovery.checkLegacyData();
 * await recovery.recoverAll();
 * await recovery.exportBackup(); // Optional: download backup file
 * ```
 */

interface RecoveryReport {
  hasLegacyTables: boolean;
  legacyCharacterCount: number;
  currentCharacterCount: number;
  legacyScenarioCount: number;
  currentScenarioCount: number;
  missingCharacters: number;
  missingScenarios: number;
  canRecover: boolean;
}

interface LegacyCharacterData {
  id: string;
  title: string;
  icon_asset_id: string | null;
  tags: any;
  creator: string | null;
  card_summary: string | null;
  version: string | null;
  conceptual_origin: string | null;
  vibe_session_id: string | null;
  image_prompt: string | null;
  name: string;
  description: string | null;
  example_dialogue: string | null;
  lorebook: any | null;
  created_at: Date;
  updated_at: Date;
}

interface LegacyScenarioData {
  id: string;
  title: string;
  icon_asset_id: string | null;
  tags: any;
  creator: string | null;
  card_summary: string | null;
  version: string | null;
  conceptual_origin: string | null;
  vibe_session_id: string | null;
  image_prompt: string | null;
  description: string | null;
  first_messages: any | null;
  lorebook: any | null;
  created_at: Date;
  updated_at: Date;
}

export class LegacyCharacterRecovery {
  private logCallback?: (message: string) => void;

  /**
   * Set callback to capture logs for UI display
   */
  setLogCallback(callback: (message: string) => void) {
    this.logCallback = callback;
  }

  /**
   * Log message to both console and callback
   */
  private log(message: string) {
    console.log(message);
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  /**
   * Step 1: Check if legacy tables exist and compare counts
   */
  async checkLegacyData(): Promise<RecoveryReport> {
    this.log("🔍 Checking for legacy character data...");

    const db = await Drizzle.getInstance();

    // Check if old tables exist
    const tableCheck = await db.execute(sql`
      SELECT
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'character_cards') as has_character_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'plot_cards') as has_plot_cards,
        EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cards') as has_cards
    `);

    const hasCharacterCards = tableCheck.rows[0].has_character_cards;
    const hasPlotCards = tableCheck.rows[0].has_plot_cards;
    const hasCards = tableCheck.rows[0].has_cards;

    this.log("📊 Legacy tables status:");
    this.log(`  character_cards: ${hasCharacterCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  plot_cards: ${hasPlotCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    this.log(`  cards: ${hasCards ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    if (!hasCharacterCards && !hasPlotCards && !hasCards) {
      this.log("\n✅ No legacy tables found. Your data has been migrated.");

      // Still check current tables to show what exists
      this.log("\n🔍 Checking current tables:");

      const hasCharactersTable = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'characters'
        ) as exists
      `);
      const hasChars = Boolean(hasCharactersTable.rows[0].exists);
      this.log(`  characters table: ${hasChars ? '✅ EXISTS' : '❌ NOT FOUND'}`);

      let currentCharCount = 0;
      if (hasChars) {
        const charCount = await db.execute(sql`SELECT COUNT(*) as count FROM characters`);
        currentCharCount = Number(charCount.rows[0].count);
        this.log(`  Found ${currentCharCount} characters in characters table`);

        // Sample characters
        const sampleChars = await db.execute(sql`SELECT id, name FROM characters LIMIT 5`);
        if (sampleChars.rows.length > 0) {
          this.log(`  Sample characters:`);
          sampleChars.rows.forEach((char: any, i: number) => {
            this.log(`    ${i + 1}. ${char.name} (${char.id})`);
          });
        }
      }

      const hasScenariosTable = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'scenarios'
        ) as exists
      `);
      const hasScens = Boolean(hasScenariosTable.rows[0].exists);
      this.log(`  scenarios table: ${hasScens ? '✅ EXISTS' : '❌ NOT FOUND'}`);

      let currentScenCount = 0;
      if (hasScens) {
        const scenCount = await db.execute(sql`SELECT COUNT(*) as count FROM scenarios`);
        currentScenCount = Number(scenCount.rows[0].count);
        this.log(`  Found ${currentScenCount} scenarios in scenarios table`);
      }

      return {
        hasLegacyTables: false,
        legacyCharacterCount: 0,
        currentCharacterCount: currentCharCount,
        legacyScenarioCount: 0,
        currentScenarioCount: currentScenCount,
        missingCharacters: 0,
        missingScenarios: 0,
        canRecover: false,
      };
    }

    // Count data in old vs new tables
    let oldCharacterCount = 0;
    let newCharacterCount = 0;
    let oldPlotCount = 0;
    let newScenarioCount = 0;

    if (hasCards && hasCharacterCards) {
      const oldCount = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM cards c
        INNER JOIN character_cards cc ON c.id = cc.id
        WHERE c.type = 'character'
      `);
      oldCharacterCount = Number(oldCount.rows[0].count);
    }

    // Check if characters table exists before querying
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'characters'
      ) as exists
    `);
    const hasCharactersTable = Boolean(tableExists.rows[0].exists);
    this.log(`\n🔍 Checking current tables:`);
    this.log(`  characters table: ${hasCharactersTable ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    if (hasCharactersTable) {
      const newCount = await db.execute(sql`SELECT COUNT(*) as count FROM characters`);
      newCharacterCount = Number(newCount.rows[0].count);
      this.log(`  Found ${newCharacterCount} characters in characters table`);

      // Also check what characters exist (for debugging)
      const sampleChars = await db.execute(sql`SELECT id, name FROM characters LIMIT 5`);
      if (sampleChars.rows.length > 0) {
        this.log(`  Sample characters:`);
        sampleChars.rows.forEach((char: any, i: number) => {
          this.log(`    ${i + 1}. ${char.name} (${char.id})`);
        });
      }
    } else {
      this.log(`  ⚠️ Characters table does not exist!`);
    }

    if (hasCards && hasPlotCards) {
      const oldPlot = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM cards c
        INNER JOIN plot_cards pc ON c.id = pc.id
        WHERE c.type = 'plot'
      `);
      oldPlotCount = Number(oldPlot.rows[0].count);
    }

    const scenTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'scenarios'
      ) as exists
    `);
    const hasScenariosTable = Boolean(scenTableExists.rows[0].exists);
    this.log(`  scenarios table: ${hasScenariosTable ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    if (hasScenariosTable) {
      const newScen = await db.execute(sql`SELECT COUNT(*) as count FROM scenarios`);
      newScenarioCount = Number(newScen.rows[0].count);
      this.log(`  Found ${newScenarioCount} scenarios in scenarios table`);
    } else {
      this.log(`  ⚠️ Scenarios table does not exist!`);
    }

    const missingChars = Math.max(0, oldCharacterCount - newCharacterCount);
    const missingScens = Math.max(0, oldPlotCount - newScenarioCount);

    this.log("\n📊 Data comparison:");
    this.log(`  Legacy characters (in character_cards): ${oldCharacterCount}`);
    this.log(`  Current characters: ${newCharacterCount}`);
    this.log(`  Missing characters: ${missingChars} ${missingChars > 0 ? '⚠️' : '✅'}`);
    this.log(`  Legacy plot cards (in plot_cards): ${oldPlotCount}`);
    this.log(`  Current scenarios: ${newScenarioCount}`);
    this.log(`  Missing scenarios: ${missingScens} ${missingScens > 0 ? '⚠️' : '✅'}`);

    const canRecover = missingChars > 0 || missingScens > 0;

    if (canRecover) {
      this.log("\n⚠️  DATA LOSS DETECTED! You can recover your missing characters.");
    } else {
      this.log("\n✅ All data migrated successfully. No recovery needed.");
    }

    return {
      hasLegacyTables: true,
      legacyCharacterCount: oldCharacterCount,
      currentCharacterCount: newCharacterCount,
      legacyScenarioCount: oldPlotCount,
      currentScenarioCount: newScenarioCount,
      missingCharacters: missingChars,
      missingScenarios: missingScens,
      canRecover,
    };
  }

  /**
   * Step 2: Get list of missing characters
   */
  async getMissingCharacters(): Promise<LegacyCharacterData[]> {
    this.log("🔍 Finding missing characters...");

    try {
      this.log("  Getting database instance...");
      const db = await Drizzle.getInstance();

      this.log("  Executing query...");

      // First, let's try a simpler query to see if it works
      this.log("  Step 1: Getting all cards...");
      const allCards = await db.execute(sql`SELECT id, type FROM cards`);
      this.log(`  Found ${allCards.rows.length} cards`);

      this.log("  Step 2: Getting all character_cards...");
      const allCharCards = await db.execute(sql`SELECT id FROM character_cards`);
      this.log(`  Found ${allCharCards.rows.length} character_cards`);

      this.log("  Step 3: Getting current characters...");
      const currentChars = await db.execute(sql`SELECT id FROM characters`);
      this.log(`  Found ${currentChars.rows.length} current characters`);

      this.log("  Step 4: Executing full query...");

      // Get all legacy characters (from cards + character_cards)
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

      this.log(`  Found ${legacyChars.rows.length} legacy characters`);

      // Filter out ones that already exist in characters table
      const currentCharIds = new Set(currentChars.rows.map((r: any) => r.id));
      const missingCharsData = legacyChars.rows.filter((char: any) => !currentCharIds.has(char.id));

      this.log(`  Filtered to ${missingCharsData.length} missing characters`);

      const missingChars = { rows: missingCharsData };

      this.log("  Query completed, processing results...");
      const characters = missingChars.rows as any as LegacyCharacterData[];

      this.log(`  Found ${characters.length} missing characters`);
      characters.forEach((char, i) => {
        this.log(`    ${i + 1}. ${char.name} (${char.id})`);
      });

      return characters;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.log(`  ❌ Error finding missing characters: ${errorMessage}`);
      console.error("Error in getMissingCharacters:", error);
      console.error("Error details:", { message: errorMessage, stack: errorStack });

      // Try to get more details about what went wrong
      if (errorMessage.includes('Failed query')) {
        this.log("  💡 Query failed - checking if tables exist...");
        try {
          const db = await Drizzle.getInstance();
          const tableCheck = await db.execute(sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('cards', 'character_cards', 'characters')
          `);
          this.log(`  Tables found: ${tableCheck.rows.map((r: any) => r.table_name).join(', ')}`);
        } catch (checkError) {
          this.log(`  Failed to check tables: ${checkError}`);
        }
      }

      throw error;
    }
  }

  /**
   * Step 3: Get list of missing scenarios
   */
  async getMissingScenarios(): Promise<LegacyScenarioData[]> {
    this.log("🔍 Finding missing scenarios...");

    try {
      const db = await Drizzle.getInstance();

      // Get current scenarios
      const currentScens = await db.execute(sql`SELECT id FROM scenarios`);
      this.log(`  Found ${currentScens.rows.length} current scenarios`);

      // Get all legacy scenarios (from cards + plot_cards)
      const legacyScens = await db.execute(sql`
        SELECT
          c.id, c.title, c.icon_asset_id, c.tags, c.creator, c.card_summary,
          c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
          pc.description, pc.scenarios as first_messages, pc.lorebook,
          c.created_at, c.updated_at
        FROM cards c
        INNER JOIN plot_cards pc ON c.id = pc.id
        WHERE c.type = 'plot'
      `);

      this.log(`  Found ${legacyScens.rows.length} legacy scenarios`);

      // Filter out ones that already exist in scenarios table
      const currentScenIds = new Set(currentScens.rows.map((r: any) => r.id));
      const missingScenariosData = legacyScens.rows.filter((scen: any) => !currentScenIds.has(scen.id));

      this.log(`  Filtered to ${missingScenariosData.length} missing scenarios`);

      const scenarios = missingScenariosData as any as LegacyScenarioData[];

      this.log(`  Found ${scenarios.length} missing scenarios`);
      scenarios.forEach((scen, i) => {
        this.log(`    ${i + 1}. ${scen.title} (${scen.id})`);
      });

      return scenarios;
    } catch (error) {
      this.log(`  ❌ Error finding missing scenarios: ${error}`);
      console.error("Error in getMissingScenarios:", error);
      throw error;
    }
  }

  /**
   * Helper: Check if a column exists in a table
   */
  private async columnExists(tableName: string, columnName: string): Promise<boolean> {
    const db = await Drizzle.getInstance();
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `);
    return Boolean(result.rows[0].exists);
  }

  /**
   * Step 4: Recover missing characters WITH session-aware logic
   *
   * This method:
   * 1. Creates a global copy (session_id = NULL) - the template
   * 2. Finds all sessions that reference this character
   * 3. Creates session-local copies for each session
   * 4. Updates session references (all_cards, user_character_card_id)
   */
  async recoverCharacters(): Promise<{ recovered: number; failed: number; sessionCopiesCreated: number }> {
    this.log("🔧 Starting session-aware character recovery...");

    const missingChars = await this.getMissingCharacters();

    if (missingChars.length === 0) {
      this.log("  ✅ No missing characters to recover");
      return { recovered: 0, failed: 0, sessionCopiesCreated: 0 };
    }

    const db = await Drizzle.getInstance();

    // Check which fields exist in current schema
    const hasScenarioField = await this.columnExists('characters', 'scenario');
    const hasFirstMessagesField = await this.columnExists('characters', 'first_messages');
    const hasConfigField = await this.columnExists('characters', 'config');

    this.log(`  Schema detection:`);
    this.log(`    - scenario field: ${hasScenarioField ? '✅' : '❌'}`);
    this.log(`    - first_messages field: ${hasFirstMessagesField ? '✅' : '❌'}`);
    this.log(`    - config field: ${hasConfigField ? '✅' : '❌'}`);

    let recovered = 0;
    let failed = 0;
    let sessionCopiesCreated = 0;

    for (const char of missingChars) {
      try {
        this.log(`\n  Processing character: ${char.name} (${char.id})`);

        // Step 1: Create global copy (session_id = NULL)
        this.log(`    Creating global template...`);
        await this.insertCharacter(char, null, hasScenarioField, hasFirstMessagesField, hasConfigField);
        this.log(`    ✅ Global copy created`);

        // Step 2: Find all sessions that reference this character
        const sessionsReferencingChar = await db.execute(sql`
          SELECT id, all_cards, user_character_card_id
          FROM sessions
          WHERE
            user_character_card_id = ${char.id}
            OR all_cards::text LIKE ${'%' + char.id + '%'}
        `);

        if (sessionsReferencingChar.rows.length === 0) {
          this.log(`    No sessions reference this character`);
          recovered++;
          continue;
        }

        this.log(`    Found ${sessionsReferencingChar.rows.length} sessions referencing this character`);

        // Step 3: For each session, create a session-local copy and update references
        for (const session of sessionsReferencingChar.rows) {
          const sessionId = (session as any).id;
          const allCards = (session as any).all_cards;
          const userCharacterId = (session as any).user_character_card_id;

          this.log(`      Processing session ${sessionId}...`);

          // Generate new ID for session-local copy (using Web Crypto API)
          const sessionLocalId = crypto.randomUUID();

          // Create session-local copy
          await this.insertCharacter(char, sessionId, hasScenarioField, hasFirstMessagesField, hasConfigField, sessionLocalId);
          this.log(`        ✅ Session-local copy created: ${sessionLocalId}`);
          sessionCopiesCreated++;

          // Update all_cards if it references this character
          const updatedAllCards = allCards.map((cardItem: any) => {
            if (cardItem.id === char.id) {
              return { ...cardItem, id: sessionLocalId };
            }
            return cardItem;
          });

          // Update user_character_card_id if it references this character
          const updatedUserCharacterId = userCharacterId === char.id ? sessionLocalId : userCharacterId;

          // Update session
          await db.execute(sql`
            UPDATE sessions
            SET
              all_cards = ${JSON.stringify(updatedAllCards)}::jsonb,
              user_character_card_id = ${updatedUserCharacterId}
            WHERE id = ${sessionId}
          `);

          this.log(`        ✅ Session references updated`);
        }

        recovered++;
        this.log(`  ✅ Recovered: ${char.name} (${char.id}) with ${sessionsReferencingChar.rows.length} session copies`);
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.log(`  ❌ Failed to recover ${char.name} (${char.id}): ${errorMsg}`);
        console.error(`  ❌ Failed to recover ${char.name} (${char.id}):`, error);
      }
    }

    this.log(`\n📊 Recovery complete:`);
    this.log(`  ${recovered} characters recovered`);
    this.log(`  ${sessionCopiesCreated} session-local copies created`);
    this.log(`  ${failed} failed`);

    return { recovered, failed, sessionCopiesCreated };
  }

  /**
   * Helper: Insert a character (global or session-local)
   */
  private async insertCharacter(
    char: LegacyCharacterData,
    sessionId: string | null,
    hasScenarioField: boolean,
    hasFirstMessagesField: boolean,
    hasConfigField: boolean,
    customId?: string
  ): Promise<void> {
    const db = await Drizzle.getInstance();

    // Convert tags from JSONB to array
    let tagsArray: string[] = [];
    if (char.tags) {
      if (typeof char.tags === 'string') {
        tagsArray = JSON.parse(char.tags);
      } else if (Array.isArray(char.tags)) {
        tagsArray = char.tags;
      }
    }

    // Convert tags array to PostgreSQL array literal
    const tagsLiteral = `{${tagsArray.map(tag => `"${tag.replace(/"/g, '\\"')}"`).join(',')}}`;

    // Build INSERT query dynamically based on schema version
    const columns = ['id', 'title', 'icon_asset_id', 'tags', 'creator', 'card_summary', 'version',
                     'conceptual_origin', 'vibe_session_id', 'image_prompt',
                     'name', 'description', 'example_dialogue', 'lorebook'];

    const charId = customId || char.id;
    const values: string[] = [
      `'${charId}'`,
      char.title ? `'${char.title.replace(/'/g, "''")}'` : 'NULL',
      char.icon_asset_id ? `'${char.icon_asset_id}'` : 'NULL',
      `'${tagsLiteral}'::text[]`,
      char.creator ? `'${char.creator.replace(/'/g, "''")}'` : 'NULL',
      char.card_summary ? `'${char.card_summary.replace(/'/g, "''")}'` : 'NULL',
      char.version ? `'${char.version.replace(/'/g, "''")}'` : 'NULL',
      char.conceptual_origin ? `'${char.conceptual_origin.replace(/'/g, "''")}'` : 'NULL',
      char.vibe_session_id ? `'${char.vibe_session_id}'` : 'NULL',
      char.image_prompt ? `'${char.image_prompt.replace(/'/g, "''")}'` : 'NULL',
      `'${char.name.replace(/'/g, "''")}'`,
      char.description ? `'${char.description.replace(/'/g, "''")}'` : 'NULL',
      char.example_dialogue ? `'${char.example_dialogue.replace(/'/g, "''")}'` : 'NULL',
      char.lorebook ? `'${JSON.stringify(char.lorebook).replace(/'/g, "''")}'::jsonb` : 'NULL',
    ];

    // Add new fields only if they exist in current schema
    if (hasScenarioField) {
      columns.push('scenario');
      values.push('NULL');
    }
    if (hasFirstMessagesField) {
      columns.push('first_messages');
      values.push('NULL');
    }
    if (hasConfigField) {
      columns.push('config');
      values.push(`'{}'::jsonb`);
    }

    // Always add these at the end
    columns.push('session_id', 'created_at', 'updated_at');
    values.push(
      sessionId ? `'${sessionId}'` : 'NULL',
      `'${new Date(char.created_at).toISOString()}'`,
      `'${new Date(char.updated_at).toISOString()}'`
    );

    await db.execute(sql.raw(`
      INSERT INTO characters (${columns.join(', ')})
      VALUES (${values.join(', ')})
      ON CONFLICT (id) DO NOTHING
    `));
  }

  /**
   * Step 5: Recover missing scenarios (with session-aware logic)
   */
  async recoverScenarios(): Promise<{ recovered: number; failed: number; sessionCopiesCreated: number }> {
    this.log("🔧 Starting session-aware scenario recovery...");

    const missingScens = await this.getMissingScenarios();

    if (missingScens.length === 0) {
      this.log("  ✅ No missing scenarios to recover");
      return { recovered: 0, failed: 0, sessionCopiesCreated: 0 };
    }

    const db = await Drizzle.getInstance();

    // Check if config field exists in current schema
    const hasConfigField = await this.columnExists('scenarios', 'config');

    this.log(`  Schema detection:`);
    this.log(`    - config field: ${hasConfigField ? '✅' : '❌'}`);

    let recovered = 0;
    let failed = 0;
    let sessionCopiesCreated = 0;

    for (const scen of missingScens) {
      try {
        this.log(`\n  Processing scenario: ${scen.title} (${scen.id})`);

        // Step 1: Create global template (session_id = NULL)
        this.log(`    Creating global template...`);
        await this.insertScenario(scen, null, hasConfigField);
        this.log(`    ✅ Global copy created`);

        // Step 2: Find all sessions that reference this scenario
        const sessionsReferencingScen = await db.execute(sql`
          SELECT id, all_cards
          FROM sessions
          WHERE all_cards::text LIKE ${'%' + scen.id + '%'}
        `);

        this.log(`    Found ${sessionsReferencingScen.rows.length} sessions referencing this scenario`);

        // Step 3: For each session, create session-local copy and update references
        for (const session of sessionsReferencingScen.rows) {
          const sessionId = (session as any).id;
          const allCards = (session as any).all_cards;

          this.log(`      Processing session ${sessionId}...`);

          // Generate new ID for session-local copy (using Web Crypto API)
          const sessionLocalId = crypto.randomUUID();

          // Create session-local copy
          await this.insertScenario(scen, sessionId, hasConfigField, sessionLocalId);
          this.log(`        ✅ Session-local copy created: ${sessionLocalId}`);
          sessionCopiesCreated++;

          // Step 4: Update session references in all_cards
          const updatedAllCards = allCards.map((cardItem: any) => {
            if (cardItem.id === scen.id && (cardItem.type === 'scenario' || cardItem.type === 'plot')) {
              return {
                ...cardItem,
                id: sessionLocalId,
                type: 'scenario', // Normalize type to 'scenario'
              };
            }
            return cardItem;
          });

          await db.execute(sql`
            UPDATE sessions
            SET all_cards = ${JSON.stringify(updatedAllCards)}::jsonb
            WHERE id = ${sessionId}
          `);
          this.log(`        ✅ Session references updated`);
        }

        recovered++;
        this.log(`  ✅ Recovered: ${scen.title} (${scen.id}) with ${sessionsReferencingScen.rows.length} session copies`);
      } catch (error) {
        failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.log(`  ❌ Failed to recover ${scen.title} (${scen.id}): ${errorMsg}`);
        console.error(`  ❌ Failed to recover ${scen.title} (${scen.id}):`, error);
      }
    }

    this.log(`\n📊 Recovery complete:`);
    this.log(`  ${recovered} scenarios recovered`);
    this.log(`  ${sessionCopiesCreated} session-local copies created`);
    this.log(`  ${failed} failed`);

    return { recovered, failed, sessionCopiesCreated };
  }

  /**
   * Helper method to insert a scenario (used by recoverScenarios)
   */
  private async insertScenario(
    scen: LegacyScenarioData,
    sessionId: string | null,
    hasConfigField: boolean,
    customId?: string
  ): Promise<void> {
    const db = await Drizzle.getInstance();

    let tagsArray: string[] = [];
    if (scen.tags) {
      if (typeof scen.tags === 'string') {
        tagsArray = JSON.parse(scen.tags);
      } else if (Array.isArray(scen.tags)) {
        tagsArray = scen.tags;
      }
    }

    // Convert tags array to PostgreSQL array literal
    const tagsLiteral = `{${tagsArray.map(tag => `"${tag.replace(/'/g, "''").replace(/"/g, '\\"')}"`).join(',')}}`;

    // Build INSERT query dynamically based on schema version
    const columns = ['id', 'title', 'icon_asset_id', 'tags', 'creator', 'card_summary', 'version',
                     'conceptual_origin', 'vibe_session_id', 'image_prompt',
                     'name', 'description', 'first_messages', 'lorebook'];

    const scenId = customId || scen.id;
    const values: string[] = [
      `'${scenId}'`,
      scen.title ? `'${scen.title.replace(/'/g, "''")}'` : 'NULL',
      scen.icon_asset_id ? `'${scen.icon_asset_id}'` : 'NULL',
      `'${tagsLiteral}'::text[]`,
      scen.creator ? `'${scen.creator.replace(/'/g, "''")}'` : 'NULL',
      scen.card_summary ? `'${scen.card_summary.replace(/'/g, "''")}'` : 'NULL',
      scen.version ? `'${scen.version.replace(/'/g, "''")}'` : 'NULL',
      scen.conceptual_origin ? `'${scen.conceptual_origin.replace(/'/g, "''")}'` : 'NULL',
      scen.vibe_session_id ? `'${scen.vibe_session_id}'` : 'NULL',
      scen.image_prompt ? `'${scen.image_prompt.replace(/'/g, "''")}'` : 'NULL',
      `'${scen.title.replace(/'/g, "''")}'`,
      scen.description ? `'${scen.description.replace(/'/g, "''")}'` : 'NULL',
      scen.first_messages ? `'${JSON.stringify(scen.first_messages).replace(/'/g, "''")}'::jsonb` : 'NULL',
      scen.lorebook ? `'${JSON.stringify(scen.lorebook).replace(/'/g, "''")}'::jsonb` : 'NULL',
    ];

    // Add config field only if it exists in current schema
    if (hasConfigField) {
      columns.push('config');
      values.push(`'{}'::jsonb`);
    }

    // Always add these at the end
    columns.push('session_id', 'created_at', 'updated_at');
    values.push(
      sessionId ? `'${sessionId}'` : 'NULL',
      `'${new Date(scen.created_at).toISOString()}'`,
      `'${new Date(scen.updated_at).toISOString()}'`
    );

    await db.execute(sql.raw(`
      INSERT INTO scenarios (${columns.join(', ')})
      VALUES (${values.join(', ')})
      ON CONFLICT (id) DO NOTHING
    `));
  }

  /**
   * Step 6: Recover everything (characters + scenarios)
   */
  async recoverAll(): Promise<{
    characters: { recovered: number; failed: number; sessionCopiesCreated: number };
    scenarios: { recovered: number; failed: number; sessionCopiesCreated: number };
  }> {
    this.log("🚀 Starting full recovery...\n");

    const report = await this.checkLegacyData();

    if (!report.canRecover) {
      this.log("✅ Nothing to recover!");
      return {
        characters: { recovered: 0, failed: 0, sessionCopiesCreated: 0 },
        scenarios: { recovered: 0, failed: 0, sessionCopiesCreated: 0 },
      };
    }

    const charResult = await this.recoverCharacters();
    const scenResult = await this.recoverScenarios();

    this.log("\n✅ RECOVERY COMPLETE!");
    this.log(`  Characters: ${charResult.recovered} recovered, ${charResult.sessionCopiesCreated} session copies, ${charResult.failed} failed`);
    this.log(`  Scenarios: ${scenResult.recovered} recovered, ${scenResult.sessionCopiesCreated} session copies, ${scenResult.failed} failed`);

    return {
      characters: charResult,
      scenarios: scenResult,
    };
  }

  /**
   * Step 7: Export backup of all legacy data (for manual import)
   */
  async exportBackup(): Promise<Blob> {
    this.log("📦 Creating backup file...");

    const db = await Drizzle.getInstance();

    // Get all legacy data
    const allLegacyChars = await db.execute(sql`
      SELECT
        c.id, c.title, c.icon_asset_id, c.tags, c.creator, c.card_summary,
        c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
        cc.name, cc.description, cc.example_dialogue, cc.lorebook,
        c.created_at, c.updated_at, c.type
      FROM cards c
      INNER JOIN character_cards cc ON c.id = cc.id
      WHERE c.type = 'character'
    `);

    const allLegacyPlots = await db.execute(sql`
      SELECT
        c.id, c.title, c.icon_asset_id, c.tags, c.creator, c.card_summary,
        c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
        pc.description, pc.scenarios as first_messages, pc.lorebook,
        c.created_at, c.updated_at, c.type
      FROM cards c
      INNER JOIN plot_cards pc ON c.id = pc.id
      WHERE c.type = 'plot'
    `);

    const backupData = {
      exportedAt: new Date().toISOString(),
      version: "1.0.0",
      characters: allLegacyChars.rows,
      scenarios: allLegacyPlots.rows,
      summary: {
        totalCharacters: allLegacyChars.rows.length,
        totalScenarios: allLegacyPlots.rows.length,
      },
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    this.log(`  ✅ Backup created: ${backupData.summary.totalCharacters} characters, ${backupData.summary.totalScenarios} scenarios`);

    return blob;
  }

  /**
   * Helper: Download backup file
   */
  async downloadBackup(): Promise<void> {
    const blob = await this.exportBackup();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astrsk-legacy-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log("✅ Backup file downloaded!");
  }
}

/**
 * Quick usage examples for browser console:
 *
 * // Check if you have missing data:
 * const recovery = new LegacyCharacterRecovery();
 * await recovery.checkLegacyData();
 *
 * // Recover everything:
 * await recovery.recoverAll();
 *
 * // Download backup file:
 * await recovery.downloadBackup();
 */
