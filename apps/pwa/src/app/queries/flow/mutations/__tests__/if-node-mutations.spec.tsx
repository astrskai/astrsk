/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useCreateIfNode,
  useDeleteIfNode,
  useCloneIfNode,
} from "../composite-node-mutations";
import { IfNodeService } from "@/app/services/if-node-service";
import { FlowService } from "@/app/services/flow-service";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { NodeType } from "@/entities/flow/model/node-types";

// Mock services
vi.mock("@/app/services/if-node-service", () => ({
  IfNodeService: {
    createIfNode: { execute: vi.fn() },
    deleteIfNode: { execute: vi.fn() },
    cloneIfNode: { execute: vi.fn() },
  },
}));

vi.mock("@/app/services/flow-service", () => ({
  FlowService: {
    updateNodesAndEdges: { execute: vi.fn() },
  },
}));

vi.mock("@/features/flow/flow-multi/utils/node-color-assignment", () => ({
  getNextAvailableColor: vi.fn(() => Promise.resolve("#FF0000")),
}));

vi.mock("@/features/flow/ui/toast/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("If Node Mutations", () => {
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

  describe("useCreateIfNode", () => {
    it("should create if node and add to flow", async () => {
      // Set up initial flow data
      queryClient.setQueryData(flowKeys.detail(flowId), {
        id: flowId,
        nodes: [],
        edges: [],
      });

      vi.mocked(IfNodeService.createIfNode.execute).mockResolvedValue(
        Result.ok({ id: new UniqueEntityID("test-node-id") } as any),
      );

      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useCreateIfNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          nodeId: "test-node-id",
          position: { x: 200, y: 150 },
          nodeName: "Test If Node",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify if node was created
      expect(IfNodeService.createIfNode.execute).toHaveBeenCalledWith({
        flowId,
        nodeId: "test-node-id",
        name: "Test If Node",
        color: "#A5B4FC",
        conditions: [],
        logicOperator: "AND",
      });

      // Verify flow was updated
      expect(FlowService.updateNodesAndEdges.execute).toHaveBeenCalledWith({
        flowId,
        nodes: expect.arrayContaining([
          expect.objectContaining({
            type: NodeType.IF,
            position: { x: 200, y: 150 },
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

      vi.mocked(IfNodeService.createIfNode.execute).mockResolvedValue(
        Result.fail("Creation failed") as any,
      );

      const { result } = renderHook(() => useCreateIfNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          nodeId: "test-node-id",
          position: { x: 100, y: 200 },
          nodeName: "Test If Node",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe("Creation failed");
      });
    });
  });

  describe("useDeleteIfNode", () => {
    it("should delete if node and remove from flow", async () => {
      const nodeId = "if-to-delete";

      // Set up flow with if node
      const mockFlow = {
        id: flowId,
        nodes: [
          {
            id: nodeId,
            type: NodeType.IF,
            position: { x: 100, y: 100 },
            data: { name: "Test If", logicOperator: "AND" },
          },
        ],
        edges: [
          { id: "edge1", source: "start", target: nodeId },
          {
            id: "edge2",
            source: nodeId,
            target: "end",
            sourceHandle: "true",
          },
          {
            id: "edge3",
            source: nodeId,
            target: "alt",
            sourceHandle: "false",
          },
        ],
      };
      queryClient.setQueryData(flowKeys.detail(flowId), mockFlow);

      vi.mocked(IfNodeService.deleteIfNode.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useDeleteIfNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ nodeId });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify if node was deleted
      expect(IfNodeService.deleteIfNode.execute).toHaveBeenCalledWith({
        nodeId,
      });

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
        nodes: [],
        edges: [],
      });

      vi.mocked(IfNodeService.deleteIfNode.execute).mockResolvedValue(
        Result.fail("Deletion failed") as any,
      );

      const { result } = renderHook(() => useDeleteIfNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ nodeId: "test-node" });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe("Deletion failed");
      });
    });
  });

  describe("useCloneIfNode", () => {
    it("should clone if node", async () => {
      const originalNodeId = "original-if";

      // Set up flow with original node
      const mockFlow = {
        id: flowId,
        nodes: [
          {
            id: originalNodeId,
            type: NodeType.IF,
            position: { x: 100, y: 100 },
            data: {
              name: "Original If",
              logicOperator: "OR",
              conditions: [
                {
                  id: "cond1",
                  fieldKey: "status",
                  operator: "equals",
                  value: "active",
                },
              ],
            },
          },
        ],
        edges: [],
      };
      queryClient.setQueryData(flowKeys.detail(flowId), mockFlow);

      vi.mocked(IfNodeService.cloneIfNode.execute).mockResolvedValue(
        Result.ok({ id: new UniqueEntityID("new-node-id") } as any),
      );

      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useCloneIfNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          copyNodeId: originalNodeId,
          nodeId: "new-node-id",
          position: { x: 200, y: 300 },
          nodeName: "Cloned If Node",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify if node was cloned
      expect(IfNodeService.cloneIfNode.execute).toHaveBeenCalledWith({
        originalNodeId: originalNodeId,
        originalFlowId: flowId,
        newNodeId: "new-node-id",
        newFlowId: flowId,
        name: "Cloned If Node",
        color: "#A5B4FC",
      });

      // Verify flow was updated with cloned node
      expect(FlowService.updateNodesAndEdges.execute).toHaveBeenCalledWith({
        flowId,
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: originalNodeId }),
          expect.objectContaining({
            type: NodeType.IF,
            position: { x: 200, y: 300 },
          }),
        ]),
        edges: [],
      });
    });

    it("should handle node not found", async () => {
      // Empty flow
      queryClient.setQueryData(flowKeys.detail(flowId), {
        id: flowId,
        nodes: [],
        edges: [],
      });

      // Mock the service to return null
      vi.mocked(IfNodeService.cloneIfNode.execute).mockResolvedValue(
        Result.ok(null as any),
      );

      const { result } = renderHook(() => useCloneIfNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          copyNodeId: "non-existent",
          nodeId: "new-node-id",
          position: { x: 100, y: 200 },
          nodeName: "Cloned If Node",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe(
          "IfNode non-existent not found",
        );
      });
    });
  });
});
