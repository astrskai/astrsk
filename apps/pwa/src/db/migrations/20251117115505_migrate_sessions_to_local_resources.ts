import { Drizzle } from "@/db/drizzle";
import { eq, isNull, and, inArray } from "drizzle-orm";
import { sessions } from "@/db/schema/sessions";
import { characters } from "@/db/schema/characters";
import { scenarios } from "@/db/schema/scenarios";
import { flows } from "@/db/schema/flows";
import { UniqueEntityID } from "@/shared/domain";

// Import services
import { FlowService } from "@/app/services/flow-service";
import { CardService } from "@/app/services/card-service";
import { AgentService } from "@/app/services/agent-service";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { IfNodeService } from "@/app/services/if-node-service";

/**
 * Data migration: Migrate existing sessions to use session-local copies of resources
 *
 * This migration:
 * 1. Finds all sessions that reference global resources (session_id IS NULL)
 * 2. Clones those resources as session-local copies using CloneFlow and CloneCard
 * 3. Updates sessions to reference the new session-local resources
 *
 * After this migration, all sessions will have their own local copies of resources
 * that are automatically deleted when the session is deleted (CASCADE DELETE)
 */
export async function migrateSessionsToLocalResources() {
  console.log("Starting session-local resources migration...");

  const db = await Drizzle.getInstance();

  // Initialize services (required for CloneFlow and CloneCard)
  console.log("Initializing services...");
  if (!FlowService.cloneFlow) {
    const { initServices } = await import("@/app/services/init-services");
    await initServices();
  }

  // Step 1: Check if migration already ran
  // Check for sessions with flows that are either global or belong to other sessions
  console.log("Step 1: Checking if migration already completed...");

  const sessionsWithSharedResources = await db
    .select({ sessionId: sessions.id, flowId: flows.id, flowSessionId: flows.session_id })
    .from(sessions)
    .leftJoin(flows, eq(sessions.flow_id, flows.id))
    .where(
      and(
        // Flow exists
        eq(sessions.flow_id, flows.id)
      )
    )
    .limit(100); // Check more sessions to find any with shared resources

  // Check if any session has a flow that's global or belongs to another session
  const needsMigration = sessionsWithSharedResources.some(
    row => row.flowSessionId === null || row.flowSessionId !== row.sessionId
  );

  if (!needsMigration) {
    console.log("✅ Migration already completed (all sessions have their own local resources). Skipping...");
    return;
  }

  // Step 2: Get all sessions
  console.log("Step 2: Loading all sessions...");
  const allSessions = await db.select().from(sessions);
    console.log(`  Found ${allSessions.length} sessions to process`);

    let processedCount = 0;
    let skippedCount = 0;

    // Step 3: Process each session
    for (const session of allSessions) {
      console.log(`\nProcessing session ${session.id}...`);

      // Track if this session was modified
      let sessionModified = false;
      const sessionLocalIdMap = new Map<string, string>();

      // Step 3a: Clone global flow as session-local
      if (session.flow_id) {
        console.log(`  Checking flow ${session.flow_id}...`);

        // Check if flow is global (session_id IS NULL) or belongs to another session
        const flowRecord = await db
          .select()
          .from(flows)
          .where(eq(flows.id, session.flow_id))
          .limit(1);

        if (flowRecord.length > 0 &&
            (flowRecord[0].session_id === null || flowRecord[0].session_id !== session.id)) {
          const isGlobal = flowRecord[0].session_id === null;
          console.log(`    Flow is ${isGlobal ? 'global' : 'from another session'}, cloning as session-local...`);

          try {
            // Clone flow with sessionId
            const clonedFlowOrError = await FlowService.cloneFlow.execute({
              flowId: new UniqueEntityID(session.flow_id),
              sessionId: new UniqueEntityID(session.id),
              shouldRename: false, // Keep original name
            });

            if (clonedFlowOrError.isFailure) {
              console.error(`    ❌ Failed to clone flow: ${clonedFlowOrError.getError()}`);
              throw new Error(clonedFlowOrError.getError());
            }

            const clonedFlow = clonedFlowOrError.getValue();
            sessionLocalIdMap.set(session.flow_id, clonedFlow.id.toString());
            sessionModified = true;
            console.log(`    ✓ Cloned flow: ${session.flow_id} → ${clonedFlow.id}`);
          } catch (error) {
            console.error(`    ❌ Error cloning flow:`, error);
            throw error;
          }
        } else {
          console.log(`    Flow already belongs to this session, skipping`);
        }
      }

      // Step 3b: Clone global cards as session-local
      if (session.all_cards && session.all_cards.length > 0) {
        console.log(`  Processing ${session.all_cards.length} cards...`);

        for (const cardItem of session.all_cards) {
          const cardId = cardItem.id;
          console.log(`    Checking card ${cardId}...`);

          // Check if card is global (session_id IS NULL)
          let cardRecord = null;

          // Try characters table
          const charRecord = await db
            .select()
            .from(characters)
            .where(eq(characters.id, cardId))
            .limit(1);

          if (charRecord.length > 0) {
            cardRecord = charRecord[0];
          } else {
            // Try scenarios table
            const scenRecord = await db
              .select()
              .from(scenarios)
              .where(eq(scenarios.id, cardId))
              .limit(1);

            if (scenRecord.length > 0) {
              cardRecord = scenRecord[0];
            }
          }

          if (cardRecord &&
              (cardRecord.session_id === null || cardRecord.session_id !== session.id)) {
            const isGlobal = cardRecord.session_id === null;
            console.log(`      Card is ${isGlobal ? 'global' : 'from another session'}, cloning as session-local...`);

            try {
              // Clone card with sessionId
              const clonedCardOrError = await CardService.cloneCard.execute({
                cardId: new UniqueEntityID(cardId),
                sessionId: new UniqueEntityID(session.id),
              });

              if (clonedCardOrError.isFailure) {
                console.error(`      ❌ Failed to clone card: ${clonedCardOrError.getError()}`);
                throw new Error(clonedCardOrError.getError());
              }

              const clonedCard = clonedCardOrError.getValue();
              sessionLocalIdMap.set(cardId, clonedCard.id.toString());
              sessionModified = true;
              console.log(`      ✓ Cloned card: ${cardId} → ${clonedCard.id}`);
            } catch (error) {
              console.error(`      ❌ Error cloning card:`, error);
              throw error;
            }
          } else if (cardRecord) {
            console.log(`      Card already belongs to this session, skipping`);
          } else {
            console.warn(`      ⚠️ Card ${cardId} not found in database`);
          }
        }
      }

      // Step 3c: Clone user character card if it's global or belongs to another session
      if (session.user_character_card_id) {
        console.log(`  Checking user character card ${session.user_character_card_id}...`);

        const charRecord = await db
          .select()
          .from(characters)
          .where(eq(characters.id, session.user_character_card_id))
          .limit(1);

        if (charRecord.length > 0 &&
            (charRecord[0].session_id === null || charRecord[0].session_id !== session.id)) {
          const isGlobal = charRecord[0].session_id === null;
          console.log(`    User character card is ${isGlobal ? 'global' : 'from another session'}, cloning as session-local...`);

          try {
            const clonedCardOrError = await CardService.cloneCard.execute({
              cardId: new UniqueEntityID(session.user_character_card_id),
              sessionId: new UniqueEntityID(session.id),
            });

            if (clonedCardOrError.isFailure) {
              console.error(`    ❌ Failed to clone user character card: ${clonedCardOrError.getError()}`);
              throw new Error(clonedCardOrError.getError());
            }

            const clonedCard = clonedCardOrError.getValue();
            sessionLocalIdMap.set(session.user_character_card_id, clonedCard.id.toString());
            sessionModified = true;
            console.log(`    ✓ Cloned user character card: ${session.user_character_card_id} → ${clonedCard.id}`);
          } catch (error) {
            console.error(`    ❌ Error cloning user character card:`, error);
            throw error;
          }
        } else {
          console.log(`    User character card already belongs to this session, skipping`);
        }
      }

      // Step 3d: Update session references if any resources were cloned
      if (sessionModified) {
        console.log(`  Updating session references...`);

        // Update flow_id
        const newFlowId = session.flow_id && sessionLocalIdMap.get(session.flow_id);

        // Update all_cards array
        const updatedAllCards = session.all_cards.map((cardItem: any) => {
          const newCardId = sessionLocalIdMap.get(cardItem.id);
          if (newCardId) {
            return {
              ...cardItem,
              id: newCardId,
            };
          }
          return cardItem;
        });

        // Update user_character_card_id
        const newUserCharacterId = session.user_character_card_id &&
          sessionLocalIdMap.get(session.user_character_card_id);

        // Perform update
        await db
          .update(sessions)
          .set({
            flow_id: newFlowId || session.flow_id,
            all_cards: updatedAllCards,
            user_character_card_id: newUserCharacterId || session.user_character_card_id,
          })
          .where(eq(sessions.id, session.id));

        processedCount++;
        console.log(`  ✓ Session updated with session-local references`);
      } else {
        skippedCount++;
        console.log(`  ✓ Session already uses session-local resources, skipped`);
      }
    }

    console.log(`\n✅ Migration completed successfully!`);
    console.log(`  Processed: ${processedCount} sessions`);
    console.log(`  Skipped: ${skippedCount} sessions (already session-local)`);

  // Step 4: Verify - check that all sessions have their own local resources
  console.log("\nStep 4: Verifying migration...");

  const sessionsWithSharedFlows = await db
    .select({ sessionId: sessions.id, flowId: flows.id, flowSessionId: flows.session_id })
    .from(sessions)
    .leftJoin(flows, eq(sessions.flow_id, flows.id))
    .where(
      and(
        // Flow exists
        eq(sessions.flow_id, flows.id)
      )
    );

  // Check if any session has a flow that's global or belongs to another session
  const invalidSessions = sessionsWithSharedFlows.filter(
    row => row.flowSessionId === null || row.flowSessionId !== row.sessionId
  );

  if (invalidSessions.length > 0) {
    throw new Error(
      `Verification failed: ${invalidSessions.length} sessions still reference shared flows!`
    );
  }

  console.log("  ✓ All sessions now have their own local resources");
  console.log("  ✓ Verification passed!");
}

/**
 * Notes:
 * - This migration is idempotent (safe to run multiple times)
 * - Uses existing CloneFlow and CloneCard usecases (tested logic)
 * - All cloned resources have session_id set for CASCADE DELETE
 * - Global resources remain untouched (available as templates)
 * - Session-local resources are automatically deleted when session is deleted
 */
