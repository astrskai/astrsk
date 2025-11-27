import { Drizzle } from "@/db/drizzle";
import { eq, isNull } from "drizzle-orm";
import { backgrounds } from "@/db/schema/backgrounds";
import { sessions } from "@/db/schema/sessions";

/**
 * Data migration: Migrate global backgrounds to session-specific backgrounds
 *
 * This migration:
 * 1. Finds all sessions that reference global backgrounds (background.session_id IS NULL)
 * 2. For each session using a global background, creates a session-local copy
 * 3. Updates the session to reference its new session-local background
 * 4. Deletes orphaned global backgrounds that are no longer referenced
 *
 * After this migration, all backgrounds will belong to a specific session
 * and will be automatically deleted when the session is deleted (CASCADE DELETE)
 */
export async function migrateBackgroundsToSessions() {
  console.log("Starting background migration to session-specific resources...");

  const db = await Drizzle.getInstance();

  // Step 1: Check if migration already ran
  console.log("Step 1: Checking if migration already completed...");

  const globalBackgrounds = await db
    .select()
    .from(backgrounds)
    .where(isNull(backgrounds.session_id))
    .limit(10); // Check first 10 to see if any exist

  if (globalBackgrounds.length === 0) {
    console.log("✅ Migration already completed (no global backgrounds found). Skipping...");
    return;
  }

  console.log(`  Found ${globalBackgrounds.length} global backgrounds to migrate`);

  // Step 2: Get all global backgrounds
  console.log("\nStep 2: Loading all global backgrounds...");
  const allGlobalBackgrounds = await db
    .select()
    .from(backgrounds)
    .where(isNull(backgrounds.session_id));

  console.log(`  Found ${allGlobalBackgrounds.length} global backgrounds total`);

  let processedCount = 0;
  let copiesCreated = 0;
  let deletedCount = 0;

  // Step 3: Process each global background
  for (const globalBg of allGlobalBackgrounds) {
    console.log(`\nProcessing background ${globalBg.id} - "${globalBg.name}"...`);

    // Find all sessions referencing this background
    const sessionsUsingBg = await db
      .select()
      .from(sessions)
      .where(eq(sessions.background_id, globalBg.id));

    console.log(`  Found ${sessionsUsingBg.length} sessions using this background`);

    if (sessionsUsingBg.length === 0) {
      // No sessions use this background, safe to delete
      await db.delete(backgrounds).where(eq(backgrounds.id, globalBg.id));
      deletedCount++;
      console.log(`  ✓ Deleted unused global background ${globalBg.id}`);
      continue;
    }

    // Step 3a: Create a copy for each session
    for (const session of sessionsUsingBg) {
      console.log(`    Creating copy for session ${session.id}...`);

      try {
        // Generate new ID for the background copy
        const newBackgroundId = crypto.randomUUID();

        // Insert new session-local background
        await db.insert(backgrounds).values({
          id: newBackgroundId,
          name: globalBg.name,
          asset_id: globalBg.asset_id,
          session_id: session.id,
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Update session to reference the new background
        await db
          .update(sessions)
          .set({ background_id: newBackgroundId })
          .where(eq(sessions.id, session.id));

        copiesCreated++;
        console.log(`      ✓ Created background copy ${newBackgroundId} for session ${session.id}`);
      } catch (error) {
        console.error(`      ❌ Error creating background copy:`, error);
        throw error;
      }
    }

    // Step 3b: Delete the global background (now that all sessions have copies)
    await db.delete(backgrounds).where(eq(backgrounds.id, globalBg.id));
    deletedCount++;
    console.log(`  ✓ Deleted global background ${globalBg.id}`);

    processedCount++;
  }

  console.log(`\n✅ Migration completed successfully!`);
  console.log(`  Processed: ${processedCount} global backgrounds`);
  console.log(`  Created: ${copiesCreated} session-local copies`);
  console.log(`  Deleted: ${deletedCount} global backgrounds`);

  // Step 4: Verify - check that no global backgrounds remain
  console.log("\nStep 4: Verifying migration...");

  const remainingGlobalBackgrounds = await db
    .select()
    .from(backgrounds)
    .where(isNull(backgrounds.session_id))
    .limit(1);

  if (remainingGlobalBackgrounds.length > 0) {
    throw new Error(
      `Verification failed: ${remainingGlobalBackgrounds.length} global backgrounds still exist!`
    );
  }

  console.log("  ✓ All backgrounds are now session-specific");
  console.log("  ✓ Verification passed!");
}

/**
 * Notes:
 * - This migration is idempotent (safe to run multiple times)
 * - Creates session-local copies for each session using a global background
 * - Deletes global backgrounds after copying
 * - All backgrounds now have session_id set for CASCADE DELETE
 * - Backgrounds are automatically deleted when their session is deleted
 */
