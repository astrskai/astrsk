import { Drizzle } from "@/db/drizzle";
import { sql } from "drizzle-orm";

/**
 * Data migration: Copy from old card tables → new card tables
 *
 * Prerequisites:
 * - Run drizzle-kit migration first to create `characters` and `scenarios` tables
 * - This script copies data and optionally drops old tables
 */
export async function migrateCardsData() {
  console.log("Starting card data migration...");

  const db = await Drizzle.getInstance();
  await db.transaction(async (tx) => {
    // Step 1: Check if migration already ran
    console.log("Step 1: Checking if migration already completed...");
    const hasData = await tx.execute(sql`
      SELECT COUNT(*) as count FROM characters;
    `);

    if (Number(hasData.rows[0].count) > 0) {
      console.log("✅ Migration already completed (characters table has data). Skipping...");
      return;
    }

    // Step 2: Copy character cards data
    console.log("Step 2: Copying character cards data...");
    await tx.execute(sql`
      INSERT INTO characters (
        id, title, icon_asset_id, tags, creator, card_summary, version,
        conceptual_origin, vibe_session_id, image_prompt,
        name, description, example_dialogue, lorebook,
        created_at, updated_at
      )
      SELECT
        c.id, c.title, c.icon_asset_id,
        ARRAY(SELECT jsonb_array_elements_text(c.tags))::text[] as tags,
        c.creator, c.card_summary,
        c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
        cc.name, cc.description, cc.example_dialogue, cc.lorebook,
        c.created_at, c.updated_at
      FROM cards c
      INNER JOIN character_cards cc ON c.id = cc.id
      WHERE c.type = 'character';
    `);

    const charCount = await tx.execute(sql`SELECT COUNT(*) as count FROM characters`);
    console.log(`  ✓ Copied ${charCount.rows[0].count} character cards`);

    // Step 3: Copy scenario cards data (plot_cards.scenarios → scenarios.first_messages, title → name)
    console.log("Step 3: Copying scenario cards data...");
    await tx.execute(sql`
      INSERT INTO scenarios (
        id, title, icon_asset_id, tags, creator, card_summary, version,
        conceptual_origin, vibe_session_id, image_prompt,
        name, description, first_messages, lorebook,
        created_at, updated_at
      )
      SELECT
        c.id, c.title, c.icon_asset_id,
        ARRAY(SELECT jsonb_array_elements_text(c.tags))::text[] as tags,
        c.creator, c.card_summary,
        c.version, c.conceptual_origin, c.vibe_session_id, c.image_prompt,
        c.title, pc.description, pc.scenarios, pc.lorebook,
        c.created_at, c.updated_at
      FROM cards c
      INNER JOIN plot_cards pc ON c.id = pc.id
      WHERE c.type = 'plot';
    `);

    const scenarioCount = await tx.execute(sql`SELECT COUNT(*) as count FROM scenarios`);
    console.log(`  ✓ Copied ${scenarioCount.rows[0].count} scenario cards (scenarios → first_messages)`);

    // Step 4: Update sessions JSONB ('plot' → 'scenario')
    console.log("Step 4: Updating sessions JSONB (plot → scenario)...");

    // Use raw SQL to avoid schema mismatch (e.g., 'name' column may not exist yet)
    const sessionsWithPlot = await tx.execute(sql`
      SELECT id, all_cards FROM sessions
      WHERE all_cards::text LIKE '%"type":"plot"%'
    `);

    console.log(`  Found ${sessionsWithPlot.rows.length} sessions with 'plot' cards`);

    for (const session of sessionsWithPlot.rows) {
      const allCards = session.all_cards as any[];
      const updatedCards = allCards.map((card: any) => {
        if (card.type === 'plot') {
          return { ...card, type: 'scenario' };
        }
        return card;
      });

      await tx.execute(sql`
        UPDATE sessions
        SET all_cards = ${JSON.stringify(updatedCards)}::jsonb
        WHERE id = ${session.id}::uuid
      `);
    }

    console.log(`  ✓ Updated ${sessionsWithPlot.rows.length} sessions`);

    // Step 5: Verify data integrity
    console.log("Step 5: Verifying data integrity...");

    const verification = await tx.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM cards WHERE type = 'character') as char_old,
        (SELECT COUNT(*) FROM characters) as char_new,
        (SELECT COUNT(*) FROM cards WHERE type = 'plot') as plot_old,
        (SELECT COUNT(*) FROM scenarios) as scenario_new,
        (SELECT COUNT(*) FROM sessions WHERE all_cards::text LIKE '%"type":"plot"%') as plot_in_sessions
    `);

    const counts = verification.rows[0];
    console.log(`  Character cards: ${counts.char_old} old → ${counts.char_new} new`);
    console.log(`  Scenario cards: ${counts.plot_old} old → ${counts.scenario_new} new`);
    console.log(`  Sessions with 'plot': ${counts.plot_in_sessions}`);

    if (Number(counts.char_old) !== Number(counts.char_new)) {
      throw new Error(`Character card count mismatch! ${counts.char_old} → ${counts.char_new}`);
    }
    if (Number(counts.plot_old) !== Number(counts.scenario_new)) {
      throw new Error(`Scenario card count mismatch! ${counts.plot_old} → ${counts.scenario_new}`);
    }
    if (Number(counts.plot_in_sessions) !== 0) {
      throw new Error(`'plot' type still exists in ${counts.plot_in_sessions} sessions!`);
    }

    console.log("  ✓ All counts match!");

    // Step 6: Drop old tables (OPTIONAL - comment out to keep as backup)
    console.log("Step 6: Dropping old tables...");
    // PGlite requires separate execute calls for each statement
    await tx.execute(sql`DROP TABLE IF EXISTS character_cards`);
    await tx.execute(sql`DROP TABLE IF EXISTS plot_cards`);
    await tx.execute(sql`DROP TABLE IF EXISTS cards`);
    console.log("  ✓ Old tables dropped");

    console.log("✅ Migration completed successfully!");
  });
}

/**
 * Notes:
 * - This migration is idempotent (safe to run multiple times)
 * - Tables must be created by drizzle-kit migration first
 * - Field mapping: plot_cards.scenarios → scenarios.first_messages
 * - Sessions JSONB updated: 'plot' → 'scenario' type
 * - Old tables are dropped at the end (comment out Step 6 to keep as backup)
 */
