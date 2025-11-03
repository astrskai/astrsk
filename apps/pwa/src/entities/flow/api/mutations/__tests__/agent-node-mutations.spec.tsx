/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useCreateAgentNode,
  useDeleteAgentNode,
  useCloneAgentNode,
} from "../composite-node-mutations";
import { AgentService } from "@/app/services/agent-service";
import { FlowService } from "@/app/services/flow-service";
import { Agent } from "@/entities/agent/domain/agent";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain/unique-entity-id";
import { flowKeys } from "@/entities/flow/api/query-factory";
import { NodeType } from "@/entities/flow/model/node-types";

// Mock services
vi.mock("@/app/services/agent-service", () => ({
  AgentService: {
    saveAgent: { execute: vi.fn() },
    deleteAgent: { execute: vi.fn() },
    getAgent: { execute: vi.fn() },
    cloneAgent: { execute: vi.fn() },
  },
}));

vi.mock("@/app/services/flow-service", () => ({
  FlowService: {
    updateNodesAndEdges: { execute: vi.fn() },
  },
}));

vi.mock("@/entities/agent/domain/agent", () => ({
  Agent: {
    create: vi.fn(),
  },
  ApiType: {
    Chat: "chat",
    Text: "text",
  },
  ModelTier: {
    Light: "light",
    Heavy: "heavy",
  },
}));

vi.mock("@/features/flow/utils/node-color-assignment", () => ({
  getNextAvailableColor: vi.fn(() => Promise.resolve("#FF0000")),
}));

vi.mock("@/features/flow/ui/toast/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Agent Node Mutations", () => {
  let queryClient: QueryClient;
  const flowId = "test-flow-id";

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    // Don't use fake timers - they interfere with async mutations
    // vi.useFakeTimers();
  });

  afterEach(() => {
    // vi.useRealTimers();
  });

  describe("useCreateAgentNode", () => {
    it("should create agent and add node to flow", async () => {
      // Set up initial flow data
      queryClient.setQueryData(flowKeys.detail(flowId), {
        id: flowId,
        nodes: [],
        edges: [],
      });

      // Mock agent creation - should use the nodeId we provide
      const mockAgent = {
        id: new UniqueEntityID("test-node-id"),
        props: {
          name: "Test Agent",
          description: "",
          targetApiType: "chat",
          color: "#A5B4FC",
        },
      };

      vi.mocked(Agent.create).mockReturnValue(Result.ok(mockAgent) as any);
      vi.mocked(AgentService.saveAgent.execute).mockResolvedValue(
        Result.ok(mockAgent) as any,
      );
      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({}) as any,
      );

      const { result } = renderHook(() => useCreateAgentNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          nodeId: "test-node-id",
          position: { x: 100, y: 200 },
          nodeName: "Test Agent",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify agent was created with the provided nodeId
      expect(Agent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Agent",
          color: "#A5B4FC",
        }),
        new UniqueEntityID("test-node-id"),
      );

      expect(AgentService.saveAgent.execute).toHaveBeenCalledWith(mockAgent);
      expect(FlowService.updateNodesAndEdges.execute).toHaveBeenCalledWith({
        flowId,
        nodes: expect.arrayContaining([
          expect.objectContaining({
            id: "test-node-id",
            type: NodeType.AGENT,
            position: { x: 100, y: 200 },
          }),
        ]),
        edges: [],
      });
    });

    it("should handle creation failure", async () => {
      queryClient.setQueryData(flowKeys.detail(flowId), {
        id: flowId,
        nodes: [],
        edges: [],
      });

      vi.mocked(Agent.create as any).mockReturnValue(
        Result.fail("Creation failed") as any,
      );

      const { result } = renderHook(() => useCreateAgentNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          nodeId: "test-node-id",
          position: { x: 100, y: 200 },
          nodeName: "Test Agent",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe("Creation failed");
      });
    });
  });

  describe("useDeleteAgentNode", () => {
    it("should delete agent and remove node from flow", async () => {
      const agentId = "agent-to-delete";

      // Set up flow with agent node
      const mockFlow = {
        id: flowId,
        props: {
          nodes: [
            {
              id: agentId,
              type: NodeType.AGENT,
              position: { x: 100, y: 100 },
              data: { agentId },
            },
          ],
          edges: [
            { id: "edge1", source: "start", target: agentId },
            { id: "edge2", source: agentId, target: "end" },
          ],
        },
      };
      queryClient.setQueryData(flowKeys.detail(flowId), mockFlow);

      vi.mocked(AgentService.deleteAgent.execute).mockResolvedValue(
        Result.ok({} as any),
      );
      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useDeleteAgentNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ nodeId: agentId });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify agent was deleted
      expect(AgentService.deleteAgent.execute).toHaveBeenCalledWith(
        new UniqueEntityID(agentId),
      );

      // Verify flow was updated without the node and edges
      expect(FlowService.updateNodesAndEdges.execute).toHaveBeenCalledWith({
        flowId,
        nodes: [],
        edges: [],
      });
    });

    it("should handle deletion failure", async () => {
      queryClient.setQueryData(flowKeys.detail(flowId), {
        id: flowId,
        props: { nodes: [], edges: [] },
      });

      vi.mocked(AgentService.deleteAgent.execute).mockResolvedValue(
        Result.fail("Deletion failed") as any,
      );

      const { result } = renderHook(() => useDeleteAgentNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ nodeId: "test-agent" });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe("Deletion failed");
      });
    });
  });

  describe("useCloneAgentNode", () => {
    it("should clone agent and add new node", async () => {
      const originalAgentId = "original-agent";
      const clonedAgentId = "cloned-agent";

      // Set up flow with original agent node
      const mockFlow = {
        id: flowId,
        nodes: [
          {
            id: originalAgentId,
            type: NodeType.AGENT,
            position: { x: 100, y: 100 },
            data: {},
          },
        ],
        edges: [],
      };
      queryClient.setQueryData(flowKeys.detail(flowId), mockFlow);

      const mockOriginalAgent = {
        id: new UniqueEntityID(originalAgentId),
        props: { name: "Original Agent", color: "#0000FF" },
      };

      const mockClonedAgent = {
        id: new UniqueEntityID("new-agent-id"),
        props: {
          name: "Original Agent (Copy)",
          description: "",
          color: "#FF0000",
          targetApiType: "chat",
        },
        update: vi.fn().mockReturnValue(
          Result.ok({
            id: new UniqueEntityID("new-agent-id"),
            props: {
              name: "Cloned Agent", // Will be updated to this name
              description: "",
              color: "#A5B4FC", // Will be updated to this color
              targetApiType: "chat",
            },
          }),
        ),
      };

      vi.mocked(AgentService.getAgent.execute).mockResolvedValue(
        Result.ok(mockOriginalAgent) as any,
      );
      vi.mocked(AgentService.cloneAgent.execute).mockResolvedValue(
        Result.ok(mockClonedAgent) as any,
      );
      vi.mocked(AgentService.saveAgent.execute).mockResolvedValue(
        Result.ok({
          id: new UniqueEntityID("new-agent-id"),
          props: {
            name: "Cloned Agent",
            description: "",
            color: "#A5B4FC",
            targetApiType: "chat",
          },
        }) as any,
      );
      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useCloneAgentNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          copyNodeId: originalAgentId,
          nodeId: "new-agent-id",
          position: { x: 200, y: 300 },
          nodeName: "Cloned Agent",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify agent was cloned with both source and target IDs
      expect(AgentService.cloneAgent.execute).toHaveBeenCalledWith({
        sourceAgentId: new UniqueEntityID(originalAgentId),
        targetAgentId: new UniqueEntityID("new-agent-id"),
      });
      expect(mockClonedAgent.update).toHaveBeenCalledWith({
        name: "Cloned Agent",
        color: "#A5B4FC",
      });
      expect(AgentService.saveAgent.execute).toHaveBeenCalled();

      // Verify flow was updated with cloned node
      expect(FlowService.updateNodesAndEdges.execute).toHaveBeenCalledWith({
        flowId,
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: originalAgentId }),
          expect.objectContaining({
            id: "new-agent-id", // The nodeId parameter passed to mutate
            type: NodeType.AGENT,
            position: { x: 200, y: 300 },
          }),
        ]),
        edges: [],
      });
    });

    it("should handle agent not found", async () => {
      queryClient.setQueryData(flowKeys.detail(flowId), {
        id: flowId,
        nodes: [],
        edges: [],
      });

      vi.mocked(AgentService.cloneAgent.execute).mockResolvedValue(
        Result.fail("Agent not found") as any,
      );

      const { result } = renderHook(() => useCloneAgentNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          copyNodeId: "non-existent",
          nodeId: "new-agent-id",
          position: { x: 100, y: 200 },
          nodeName: "Cloned Agent",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe("Agent not found");
      });
    });
  });
});
