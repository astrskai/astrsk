import { Drizzle } from "@/db/drizzle";
import { sql } from "drizzle-orm";

/**
 * Data migration: Populate flow_id for existing agents
 *
 * This migration:
 * 1. Finds which flow contains each agent (by looking in the flow's nodes array)
 * 2. Sets the agent's flow_id to that flow
 * 3. Deletes orphaned agents that don't belong to any flow
 *
 * Prerequisites:
 * - Schema migration must have already added the flow_id column to agents table
 */
export async function populateAgentFlowId() {
  console.log("Starting agent flow_id population migration...");

  const db = await Drizzle.getInstance();

  await db.transaction(async (tx) => {
    // Step 1: Check if migration already ran
    console.log("Step 1: Checking if migration already completed...");

    const agentsWithoutFlowId = await tx.execute(sql`
      SELECT COUNT(*) as count
      FROM agents
      WHERE flow_id IS NULL;
    `);

    const count = Number(agentsWithoutFlowId.rows[0].count);

    if (count === 0) {
      console.log("✅ Migration already completed (all agents have flow_id). Skipping...");
      return;
    }

    console.log(`  Found ${count} agents without flow_id`);

    // Step 2: Temporarily allow NULL for flow_id (in case previous migration failed)
    console.log("Step 2: Allowing NULL for flow_id temporarily...");
    await tx.execute(sql`
      ALTER TABLE agents ALTER COLUMN flow_id DROP NOT NULL;
    `);
    console.log("  ✓ flow_id can now be NULL");

    // Step 3: Populate flow_id for existing agents by looking up which flow contains them
    console.log("Step 3: Populating flow_id for existing agents...");
    await tx.execute(sql`
      UPDATE agents a
      SET flow_id = (
        SELECT f.id
        FROM flows f
        WHERE f.nodes::jsonb @> jsonb_build_array(
          jsonb_build_object('id', a.id::text, 'type', 'agent')
        )
        LIMIT 1
      )
      WHERE flow_id IS NULL;
    `);

    // Check how many were updated
    const updatedAgents = await tx.execute(sql`
      SELECT COUNT(*) as count
      FROM agents
      WHERE flow_id IS NOT NULL;
    `);

    console.log(`  ✓ Populated flow_id for ${updatedAgents.rows[0].count} agents`);

    // Step 4: Find orphaned agents (those still without flow_id)
    const orphanedAgents = await tx.execute(sql`
      SELECT COUNT(*) as count
      FROM agents
      WHERE flow_id IS NULL;
    `);

    const orphanCount = Number(orphanedAgents.rows[0].count);

    if (orphanCount > 0) {
      console.log(`Step 4: Found ${orphanCount} orphaned agents (not in any flow)`);

      // Get IDs of orphaned agents for logging
      const orphanIds = await tx.execute(sql`
        SELECT id, name
        FROM agents
        WHERE flow_id IS NULL
        LIMIT 10;
      `);

      console.log("  Sample orphaned agents:");
      orphanIds.rows.forEach((row: any) => {
        console.log(`    - ${row.id}: ${row.name}`);
      });

      if (orphanCount > 10) {
        console.log(`    ... and ${orphanCount - 10} more`);
      }

      // Delete orphaned agents
      console.log("  Deleting orphaned agents...");
      await tx.execute(sql`
        DELETE FROM agents WHERE flow_id IS NULL;
      `);

      console.log(`  ✓ Deleted ${orphanCount} orphaned agents`);
    } else {
      console.log("Step 4: No orphaned agents found");
    }

    // Step 5: Make flow_id required again
    console.log("Step 5: Making flow_id required...");
    await tx.execute(sql`
      ALTER TABLE agents ALTER COLUMN flow_id SET NOT NULL;
    `);
    console.log("  ✓ flow_id is now required");

    // Step 6: Verify data integrity
    console.log("Step 6: Verifying data integrity...");

    const verification = await tx.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM agents) as total_agents,
        (SELECT COUNT(*) FROM agents WHERE flow_id IS NULL) as agents_without_flow,
        (SELECT COUNT(DISTINCT flow_id) FROM agents) as unique_flows
    `);

    const stats = verification.rows[0];
    console.log(`  Total agents: ${stats.total_agents}`);
    console.log(`  Agents without flow_id: ${stats.agents_without_flow}`);
    console.log(`  Unique flows referenced: ${stats.unique_flows}`);

    if (Number(stats.agents_without_flow) !== 0) {
      throw new Error(`Verification failed: ${stats.agents_without_flow} agents still have NULL flow_id!`);
    }

    console.log("  ✓ All agents have flow_id");
    console.log("  ✓ Verification passed!");

    console.log("\n✅ Migration completed successfully!");
  });
}

/**
 * Notes:
 * - This migration is idempotent (safe to run multiple times)
 * - Orphaned agents (not in any flow's nodes array) are deleted
 * - After this migration, all agents MUST belong to a flow
 * - When a flow is deleted, its agents are automatically deleted (CASCADE DELETE)
 */
