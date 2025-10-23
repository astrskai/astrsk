import { ValidationIssue, ValidationIssueCode } from "@/features/flow/flow-multi/validation/types/validation-types";
import { ValidatorFunction } from "@/features/flow/flow-multi/validation/types/functional-validation-types";
import { generateIssueId } from "@/features/flow/flow-multi/validation/utils/validator-utils";
import { generateValidationMessage } from "@/features/flow/flow-multi/validation/utils/message-generator";
import { traverseFlowCached } from "@/features/flow/flow-multi/utils/flow-traversal";

// Check if flow has valid path from start to end
// Helper function to check if a node can reach the end
// This properly handles cycles by doing a reverse traversal from end node
function canNodeReachEnd(nodeId: string, endNodeId: string, edges: any[]): boolean {
  if (nodeId === endNodeId) return true;
  
  // Build a set of all nodes that can reach the end using reverse traversal
  const nodesCanReachEnd = new Set<string>();
  const visited = new Set<string>();
  
  const reverseTraverse = (currentNodeId: string) => {
    if (visited.has(currentNodeId)) return;
    visited.add(currentNodeId);
    nodesCanReachEnd.add(currentNodeId);
    
    // Find all nodes that have edges pointing to this node
    const incomingEdges = edges.filter(e => e.target === currentNodeId);
    for (const edge of incomingEdges) {
      reverseTraverse(edge.source);
    }
  };
  
  // Start reverse traversal from end node
  reverseTraverse(endNodeId);
  
  // Check if the given node is in the set of nodes that can reach end
  return nodesCanReachEnd.has(nodeId);
}

export const validateFlowPath: ValidatorFunction = (context) => {
  const issues: ValidationIssue[] = [];
  
  // Use the existing flow traversal utility to check for valid flow
  const traversalResult = traverseFlowCached(context.flow);
  const nodes = context.flow.props.nodes;
  const edges = context.flow.props.edges;
  
  // Find start and end nodes
  const startNode = nodes.find(n => n.type === 'start');
  const endNode = nodes.find(n => n.type === 'end');
  const ifNodes = nodes.filter(n => n.type === 'if');
  
  // Check if there's a valid flow path
  if (!traversalResult.hasValidFlow) {
    // Determine the specific issue
    let specificIssue: ValidationIssue;
    
    if (!startNode) {
      specificIssue = {
        id: generateIssueId(ValidationIssueCode.INVALID_FLOW_STRUCTURE, 'no_start'),
        code: ValidationIssueCode.INVALID_FLOW_STRUCTURE,
        severity: 'error',
        title: 'Missing Start Node',
        description: 'Flow must have a start node',
        suggestion: 'Add a start node to your flow',
      };
    } else if (!endNode) {
      specificIssue = {
        id: generateIssueId(ValidationIssueCode.INVALID_FLOW_STRUCTURE, 'no_end'),
        code: ValidationIssueCode.INVALID_FLOW_STRUCTURE,
        severity: 'error',
        title: 'Missing End Node',
        description: 'Flow must have an end node',
        suggestion: 'Add an end node to your flow',
      };
    } else if (ifNodes.length > 0) {
      // Check if the issue is with if-node branches
      const incompleteIfNodes: string[] = [];
      
      for (const ifNode of ifNodes) {
        const outgoingEdges = edges.filter(e => e.source === ifNode.id);
        
        if (outgoingEdges.length !== 2) {
          incompleteIfNodes.push(ifNode.id);
        } else {
          // Check if both branches eventually reach the end
          // This is already validated in traverseFlow, so if hasValidFlow is false
          // and we have 2 edges, it means branches don't reach end
          const nodeData = ifNode.data as any;
          const nodeName = nodeData?.label || ifNode.id;
          incompleteIfNodes.push(nodeName);
        }
      }
      
      if (incompleteIfNodes.length > 0) {
        specificIssue = {
          id: generateIssueId(ValidationIssueCode.INVALID_FLOW_STRUCTURE, 'if_branches'),
          code: ValidationIssueCode.INVALID_FLOW_STRUCTURE,
          severity: 'error',
          title: 'Incomplete If-Node Branches',
          description: `All branches of if-nodes must connect to the end node. The following if-nodes have incomplete branches: ${incompleteIfNodes.join(', ')}`,
          suggestion: 'Connect both the true and false branches of each if-node to downstream nodes that eventually reach the end node',
        };
      } else {
        // Generic disconnected flow issue
        specificIssue = {
          id: generateIssueId(ValidationIssueCode.INVALID_FLOW_STRUCTURE, 'disconnected'),
          code: ValidationIssueCode.INVALID_FLOW_STRUCTURE,
          severity: 'error',
          title: 'Disconnected Flow',
          description: 'Not all nodes are connected from start to end',
          suggestion: 'Ensure all nodes form a complete path from start to end',
        };
      }
    } else {
      // No if-nodes, but still invalid - check for disconnected agents
      const disconnectedNodes = traversalResult.disconnectedProcessNodes;
      if (disconnectedNodes.length > 0) {
        const nodeNames = disconnectedNodes.map(id => {
          const node = nodes.find(n => n.id === id);
          const nodeData = node?.data as any;
          return nodeData?.label || nodeData?.name || id;
        });
        
        specificIssue = {
          id: generateIssueId(ValidationIssueCode.INVALID_FLOW_STRUCTURE, 'disconnected_nodes'),
          code: ValidationIssueCode.INVALID_FLOW_STRUCTURE,
          severity: 'error',
          title: 'Disconnected Nodes',
          description: `The following nodes are not connected to the flow: ${nodeNames.join(', ')}`,
          suggestion: 'Connect these nodes to the main flow path',
        };
      } else {
        // Default generic message
        const message = generateValidationMessage(ValidationIssueCode.INVALID_FLOW_STRUCTURE);
        specificIssue = {
          id: generateIssueId(ValidationIssueCode.INVALID_FLOW_STRUCTURE),
          code: ValidationIssueCode.INVALID_FLOW_STRUCTURE,
          severity: 'error',
          ...message,
        };
      }
    }
    
    issues.push(specificIssue);
  }
  
  // Additional validation: Check if-nodes have both branches connected and reach end
  // Only validate if-nodes that are connected from start
  for (const ifNode of ifNodes) {
    // Check if this if-node is connected from start
    const nodePosition = traversalResult.processNodePositions.get(ifNode.id);
    if (!nodePosition || !nodePosition.isConnectedToStart) {
      // Skip validation for disconnected if-nodes
      continue;
    }
    
    const outgoingEdges = edges.filter(e => e.source === ifNode.id);
    const nodeData = ifNode.data as any;
    const nodeName = nodeData?.label || ifNode.id;
    
    if (outgoingEdges.length === 0) {
      issues.push({
        id: generateIssueId(ValidationIssueCode.IF_NODE_MISSING_BRANCHES, `if_no_branches_${ifNode.id}`),
        code: ValidationIssueCode.IF_NODE_MISSING_BRANCHES,
        severity: 'error',
        title: 'If-Node Missing Branches',
        description: `If-node "${nodeName}" has no outgoing connections`,
        suggestion: 'Connect both true and false branches of the if-node',
      });
    } else if (outgoingEdges.length === 1) {
      const connectedHandle = outgoingEdges[0].sourceHandle;
      const missingBranch = connectedHandle === 'true' ? 'false' : 'true';
      
      issues.push({
        id: generateIssueId(ValidationIssueCode.IF_NODE_MISSING_BRANCHES, `if_missing_branch_${ifNode.id}`),
        code: ValidationIssueCode.IF_NODE_MISSING_BRANCHES,
        severity: 'error',
        title: 'If-Node Missing Branch',
        description: `If-node "${nodeName}" is missing the ${missingBranch} branch connection`,
        suggestion: `Connect the ${missingBranch} branch of the if-node to a downstream node`,
      });
    } else if (outgoingEdges.length === 2 && endNode) {
      // Check if each branch can reach the end
      const trueBranch = outgoingEdges.find(e => e.sourceHandle === 'true');
      const falseBranch = outgoingEdges.find(e => e.sourceHandle === 'false');
      
      if (trueBranch && !canNodeReachEnd(trueBranch.target, endNode.id, edges)) {
        issues.push({
          id: generateIssueId(ValidationIssueCode.IF_NODE_BRANCH_NOT_REACHING_END, `if_true_not_reaching_${ifNode.id}`),
          code: ValidationIssueCode.IF_NODE_BRANCH_NOT_REACHING_END,
          severity: 'error',
          title: 'If-Node True Branch Not Reaching End',
          description: `The true branch of if-node "${nodeName}" does not reach the end node`,
          suggestion: 'Ensure the true branch connects to nodes that eventually reach the end node',
        });
      }
      
      if (falseBranch && !canNodeReachEnd(falseBranch.target, endNode.id, edges)) {
        issues.push({
          id: generateIssueId(ValidationIssueCode.IF_NODE_BRANCH_NOT_REACHING_END, `if_false_not_reaching_${ifNode.id}`),
          code: ValidationIssueCode.IF_NODE_BRANCH_NOT_REACHING_END,
          severity: 'error',
          title: 'If-Node False Branch Not Reaching End',
          description: `The false branch of if-node "${nodeName}" does not reach the end node`,
          suggestion: 'Ensure the false branch connects to nodes that eventually reach the end node',
        });
      }
    }
  }
  
  return issues;
};