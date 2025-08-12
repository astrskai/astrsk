/**
 * Utility to clean up orphaned agents that are not referenced by any flow
 * This file can be removed after cleanup is done
 */

import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { UniqueEntityID } from "@/shared/domain";

export async function cleanupOrphanedAgents() {
  console.log("[CLEANUP] Starting orphaned agents cleanup...");
  
  try {
    // Get all flows
    const flowsResult = await FlowService.searchFlow.execute({ 
      keyword: "", 
      limit: 1000 
    });
    
    if (flowsResult.isFailure) {
      console.error("[CLEANUP] Failed to fetch flows:", flowsResult.getError());
      return;
    }
    
    const flows = flowsResult.getValue();
    console.log(`[CLEANUP] Found ${flows.length} flows`);
    
    // Collect all agent IDs that are referenced in flows
    const referencedAgentIds = new Set<string>();
    
    for (const flow of flows) {
      // Get agent IDs from flow nodes
      const agentNodes = flow.props.nodes.filter((n: any) => n.type === 'agent');
      for (const node of agentNodes) {
        // Handle both new format (data.agentId) and old format (node.id)
        if (node.type === 'agent') {
          const agentId = node.id;
          if (agentId) {
            referencedAgentIds.add(agentId);
          }
        }
      }
    }
    
    console.log(`[CLEANUP] Found ${referencedAgentIds.size} agents referenced in flows`);
    
    // Get all agents from database
    const allAgentsResult = await AgentService.searchAgent.execute({ 
      limit: 1000 
    });
    
    if (allAgentsResult.isFailure) {
      console.error("[CLEANUP] Failed to fetch agents:", allAgentsResult.getError());
      return;
    }
    
    const allAgents = allAgentsResult.getValue();
    console.log(`[CLEANUP] Found ${allAgents.length} total agents in database`);
    
    // Find orphaned agents
    const orphanedAgents = allAgents.filter(agent => 
      !referencedAgentIds.has(agent.id.toString())
    );
    
    if (orphanedAgents.length === 0) {
      console.log("[CLEANUP] No orphaned agents found");
      return;
    }
    
    console.log(`[CLEANUP] Found ${orphanedAgents.length} orphaned agents to delete:`);
    orphanedAgents.forEach(agent => {
      console.log(`  - ${agent.id.toString()}: "${agent.props.name}"`);
    });
    
    // Delete orphaned agents
    console.log("[CLEANUP] Deleting orphaned agents...");
    let deletedCount = 0;
    let failedCount = 0;
    
    for (const agent of orphanedAgents) {
      const deleteResult = await AgentService.deleteAgent.execute(agent.id);
      if (deleteResult.isSuccess) {
        deletedCount++;
        console.log(`[CLEANUP] Deleted agent ${agent.id.toString()}: "${agent.props.name}"`);
      } else {
        failedCount++;
        console.error(`[CLEANUP] Failed to delete agent ${agent.id.toString()}: ${deleteResult.getError()}`);
      }
    }
    
    console.log(`[CLEANUP] Cleanup complete. Deleted ${deletedCount} agents, ${failedCount} failed`);
    
    // Show final state
    const remainingAgentsResult = await AgentService.searchAgent.execute({ limit: 1000 });
    if (remainingAgentsResult.isSuccess) {
      const remainingAgents = remainingAgentsResult.getValue();
      console.log(`[CLEANUP] ${remainingAgents.length} agents remain in database`);
      
      // Verify all remaining agents are referenced
      const unreferencedRemaining = remainingAgents.filter(agent => 
        !referencedAgentIds.has(agent.id.toString())
      );
      
      if (unreferencedRemaining.length > 0) {
        console.warn(`[CLEANUP] Warning: ${unreferencedRemaining.length} agents still unreferenced after cleanup`);
      } else {
        console.log("[CLEANUP] ✓ All remaining agents are properly referenced");
      }
    }
    
  } catch (error) {
    console.error("[CLEANUP] Unexpected error during cleanup:", error);
  }
}

// Optional: Run cleanup on a delay to ensure services are initialized
export function scheduleOrphanedAgentCleanup(delayMs: number = 5000) {
  setTimeout(() => {
    cleanupOrphanedAgents();
  }, delayMs);
  console.log(`[CLEANUP] Scheduled orphaned agent cleanup in ${delayMs}ms`);
}