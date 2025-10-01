/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useCreateDataStoreNode,
  useDeleteDataStoreNode,
  useCloneDataStoreNode,
} from "../composite-node-mutations";
import { DataStoreNodeService } from "@/app/services/data-store-node-service";
import { FlowService } from "@/app/services/flow-service";
import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { flowKeys } from "@/app/queries/flow/query-factory";
import { NodeType } from "@/flow-multi/types/node-types";

// Mock services
vi.mock("@/app/services/data-store-node-service", () => ({
  DataStoreNodeService: {
    createDataStoreNode: { execute: vi.fn() },
    deleteDataStoreNode: { execute: vi.fn() },
    cloneDataStoreNode: { execute: vi.fn() },
  },
}));

vi.mock("@/app/services/flow-service", () => ({
  FlowService: {
    updateNodesAndEdges: { execute: vi.fn() },
  },
}));

vi.mock("@/flow-multi/utils/node-color-assignment", () => ({
  getNextAvailableColor: vi.fn(() => Promise.resolve("#FF0000")),
}));

vi.mock("@/flow-multi/components/toast/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("DataStore Node Mutations", () => {
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

  describe("useCreateDataStoreNode", () => {
    it("should create data store node and add to flow", async () => {
      // Set up initial flow data
      queryClient.setQueryData(flowKeys.detail(flowId), {
        id: flowId,
        nodes: [],
        edges: [],
      });

      vi.mocked(
        DataStoreNodeService.createDataStoreNode.execute,
      ).mockResolvedValue(
        Result.ok({ id: new UniqueEntityID("new-node-id") } as any),
      );

      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useCreateDataStoreNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          nodeId: "test-node-id",
          position: { x: 150, y: 250 },
          nodeName: "Test Data Store",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data store was created
      expect(
        DataStoreNodeService.createDataStoreNode.execute,
      ).toHaveBeenCalledWith({
        flowId,
        nodeId: "test-node-id",
        name: "Test Data Store",
        color: "#A5B4FC",
        dataStoreFields: [],
      });

      // Verify flow was updated
      expect(FlowService.updateNodesAndEdges.execute).toHaveBeenCalledWith({
        flowId,
        nodes: expect.arrayContaining([
          expect.objectContaining({
            type: NodeType.DATA_STORE,
            position: { x: 150, y: 250 },
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

      vi.mocked(
        DataStoreNodeService.createDataStoreNode.execute,
      ).mockResolvedValue(Result.fail("Creation failed") as any);

      const { result } = renderHook(() => useCreateDataStoreNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          nodeId: "test-node-id",
          position: { x: 100, y: 200 },
          nodeName: "Test Data Store",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe("Creation failed");
      });
    });
  });

  describe("useDeleteDataStoreNode", () => {
    it("should delete data store node and remove from flow", async () => {
      const nodeId = "datastore-to-delete";

      // Set up flow with data store node
      const mockFlow = {
        id: flowId,
        nodes: [
          {
            id: nodeId,
            type: NodeType.DATA_STORE,
            position: { x: 100, y: 100 },
            data: { name: "Test Store" },
          },
        ],
        edges: [
          { id: "edge1", source: "start", target: nodeId },
          { id: "edge2", source: nodeId, target: "end" },
        ],
      };
      queryClient.setQueryData(flowKeys.detail(flowId), mockFlow);

      vi.mocked(
        DataStoreNodeService.deleteDataStoreNode.execute,
      ).mockResolvedValue(Result.ok({} as any));

      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useDeleteDataStoreNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({ nodeId });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data store was deleted
      expect(
        DataStoreNodeService.deleteDataStoreNode.execute,
      ).toHaveBeenCalledWith({
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

      vi.mocked(
        DataStoreNodeService.deleteDataStoreNode.execute,
      ).mockResolvedValue(Result.fail("Deletion failed") as any);

      const { result } = renderHook(() => useDeleteDataStoreNode(flowId), {
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

  describe("useCloneDataStoreNode", () => {
    it("should clone data store node", async () => {
      const originalNodeId = "original-datastore";

      // Set up flow with original node
      const mockFlow = {
        id: flowId,
        nodes: [
          {
            id: originalNodeId,
            type: NodeType.DATA_STORE,
            position: { x: 100, y: 100 },
            data: {
              name: "Original Store",
              dataStoreFields: [{ key: "field1", value: "value1" }],
            },
          },
        ],
        edges: [],
      };
      queryClient.setQueryData(flowKeys.detail(flowId), mockFlow);

      vi.mocked(
        DataStoreNodeService.cloneDataStoreNode.execute,
      ).mockResolvedValue(
        Result.ok({ id: new UniqueEntityID("new-node-id") } as any),
      );

      vi.mocked(FlowService.updateNodesAndEdges.execute).mockResolvedValue(
        Result.ok({} as any),
      );

      const { result } = renderHook(() => useCloneDataStoreNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          copyNodeId: originalNodeId,
          nodeId: "new-node-id",
          position: { x: 200, y: 300 },
          nodeName: "Cloned Data Store",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data store was cloned
      expect(
        DataStoreNodeService.cloneDataStoreNode.execute,
      ).toHaveBeenCalledWith({
        originalNodeId: originalNodeId,
        originalFlowId: flowId,
        newNodeId: "new-node-id",
        newFlowId: flowId,
        name: "Cloned Data Store",
        color: "#A5B4FC",
      });

      // Verify flow was updated with cloned node
      expect(FlowService.updateNodesAndEdges.execute).toHaveBeenCalledWith({
        flowId,
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: originalNodeId }),
          expect.objectContaining({
            type: NodeType.DATA_STORE,
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
      vi.mocked(
        DataStoreNodeService.cloneDataStoreNode.execute,
      ).mockResolvedValue(Result.ok(null as any));

      const { result } = renderHook(() => useCloneDataStoreNode(flowId), {
        wrapper,
      });

      act(() => {
        result.current.mutate({
          copyNodeId: "non-existent",
          nodeId: "new-node-id",
          position: { x: 100, y: 200 },
          nodeName: "Cloned Data Store",
          nodeColor: "#A5B4FC",
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error?.message).toBe(
          "DataStore node non-existent not found",
        );
      });
    });
  });
});
