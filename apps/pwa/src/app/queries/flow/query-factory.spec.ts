import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { flowKeys, flowQueries } from "./query-factory";
import { FlowService } from "../../services/flow-service";
import { UniqueEntityID } from "../../../shared/domain";
import { Flow } from "../../../modules/flow/domain/flow";
import { Result } from "../../../shared/core";

// Mock FlowService
vi.mock("../../services/flow-service", () => ({
  FlowService: {
    searchFlow: {
      execute: vi.fn(),
    },
    getFlow: {
      execute: vi.fn(),
    },
    getFlowWithNodes: {
      execute: vi.fn(),
    },
    updateResponseTemplate: {
      execute: vi.fn(),
    },
    updatePanelLayout: {
      execute: vi.fn(),
    },
    updateIfNodeConditions: {
      execute: vi.fn(),
    },
    updateNodeDataStoreFields: {
      execute: vi.fn(),
    },
  },
}));

describe("Flow Query Factory", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe("Query Keys", () => {
    describe("flowKeys", () => {
      it("should generate correct key for all flows", () => {
        expect(flowKeys.all).toEqual(["flows"]);
      });

      it("should generate correct key for lists", () => {
        expect(flowKeys.lists()).toEqual(["flows", "list"]);
      });

      it("should generate correct key for list with filters", () => {
        const filters = {
          keyword: "test",
          limit: 10,
        };
        expect(flowKeys.list(filters)).toEqual(["flows", "list", filters]);
      });

      it("should generate correct key for list without filters", () => {
        expect(flowKeys.list()).toEqual(["flows", "list"]);
      });

      it("should generate correct key for details", () => {
        expect(flowKeys.details()).toEqual(["flows", "detail"]);
      });

      it("should generate correct key for detail with id", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.detail(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
        ]);
      });

      it("should generate correct key for metadata", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.metadata(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "metadata",
        ]);
      });

      it("should generate correct key for panel layout", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.panelLayout(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "panelLayout",
        ]);
      });

      it("should generate correct key for nodes", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.nodes(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "nodes",
        ]);
      });

      it("should generate correct key for specific node", () => {
        const flowId = "test-flow-id";
        const nodeId = "node-1";
        expect(flowKeys.node(flowId, nodeId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "nodes",
          nodeId,
        ]);
      });

      it("should generate correct key for edges", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.edges(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "edges",
        ]);
      });

      it("should generate correct key for specific edge", () => {
        const flowId = "test-flow-id";
        const edgeId = "edge-1";
        expect(flowKeys.edge(flowId, edgeId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "edges",
          edgeId,
        ]);
      });

      it("should generate correct key for agents", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.agents(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "agents",
        ]);
      });

      it("should generate correct key for specific agent", () => {
        const flowId = "test-flow-id";
        const agentId = "agent-1";
        expect(flowKeys.agent(flowId, agentId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "agents",
          agentId,
        ]);
      });

      it("should generate correct key for dataStore", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.dataStore(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "dataStore",
        ]);
      });

      it("should generate correct key for dataStore schema", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.dataStoreSchema(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "dataStore",
          "schema",
        ]);
      });

      it("should generate correct key for dataStore fields", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.dataStoreFields(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "dataStore",
          "schema",
          "fields",
        ]);
      });

      it("should generate correct key for validation", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.validation(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "validation",
        ]);
      });

      it("should generate correct key for validation issues", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.validationIssues(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "validation",
          "issues",
        ]);
      });

      it("should generate correct key for UI elements", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.ui(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "ui",
        ]);
      });

      it("should generate correct key for UI panels", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.uiPanels(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "ui",
          "panels",
        ]);
      });

      it("should generate correct key for UI viewport", () => {
        const flowId = "test-flow-id";
        expect(flowKeys.uiViewport(flowId)).toEqual([
          "flows",
          "detail",
          flowId,
          "enhanced-v1",
          "ui",
          "viewport",
        ]);
      });
    });

    describe("Hierarchical key structure", () => {
      it("should maintain proper hierarchy for invalidation", () => {
        const flowId = "test-id";

        // All flow-related keys should start with ["flows"]
        expect(flowKeys.all[0]).toBe("flows");
        expect(flowKeys.lists()[0]).toBe("flows");
        expect(flowKeys.detail(flowId)[0]).toBe("flows");
        expect(flowKeys.nodes(flowId)[0]).toBe("flows");
        expect(flowKeys.agents(flowId)[0]).toBe("flows");
        expect(flowKeys.dataStore(flowId)[0]).toBe("flows");

        // Detail-related keys should include "detail" and flowId
        expect(flowKeys.detail(flowId)).toContain("detail");
        expect(flowKeys.detail(flowId)).toContain(flowId);
        expect(flowKeys.nodes(flowId)).toContain("detail");
        expect(flowKeys.nodes(flowId)).toContain(flowId);
      });

      it("should support granular invalidation", () => {
        const flowId = "test-id";

        // Nodes and edges should be separate from main detail
        expect(flowKeys.nodes(flowId)).not.toEqual(flowKeys.edges(flowId));

        // Agent keys should be nested under flow detail
        expect(flowKeys.agent(flowId, "agent-1").slice(0, 4)).toEqual(
          flowKeys.detail(flowId),
        );

        // DataStore keys should be nested under flow detail
        expect(flowKeys.dataStore(flowId).slice(0, 4)).toEqual(
          flowKeys.detail(flowId),
        );
      });
    });
  });

  describe("Query Options", () => {
    describe("flowQueries.list", () => {
      it("should create query options for list without filters", () => {
        const options = flowQueries.list();
        expect(options.queryKey).toEqual(flowKeys.list());
        expect(options.queryFn).toBeDefined();
        expect(options.staleTime).toBe(1000 * 10); // 10 seconds
        expect(options.gcTime).toBe(1000 * 60); // 1 minute
      });

      it("should create query options for list with filters", () => {
        const filters = { keyword: "test", limit: 50 };
        const options = flowQueries.list(filters);
        expect(options.queryKey).toEqual(flowKeys.list(filters));
      });

      it("should handle successful search", async () => {
        const mockFlows = [
          {
            id: { toString: () => "flow-1" },
            props: {
              name: "Flow 1",
              description: "Test flow 1",
              nodes: [],
              edges: [],
              responseTemplate: {},
              dataStoreSchema: {},
              panelStructure: {},
              viewport: { x: 0, y: 0, zoom: 1 },
              readyState: "draft",
              validationIssues: [],
              createdAt: new Date(),
            },
          },
          {
            id: { toString: () => "flow-2" },
            props: {
              name: "Flow 2",
              description: "Test flow 2",
              nodes: [],
              edges: [],
              responseTemplate: {},
              dataStoreSchema: {},
              panelStructure: {},
              viewport: { x: 0, y: 0, zoom: 1 },
              readyState: "draft",
              validationIssues: [],
              createdAt: new Date(),
            },
          },
        ];
        vi.mocked(FlowService.searchFlow.execute).mockResolvedValue(
          Result.ok(mockFlows as any),
        );

        const options = flowQueries.list({ keyword: "test" });
        const result = await options.queryFn!({} as any);

        expect(FlowService.searchFlow.execute).toHaveBeenCalledWith({
          keyword: "test",
          limit: 100,
        });
        expect(result).toHaveLength(2);
      });

      it("should handle search failure", async () => {
        vi.mocked(FlowService.searchFlow.execute).mockResolvedValue(
          Result.fail("Search failed"),
        );

        const options = flowQueries.list();
        const result = await options.queryFn!({} as any);

        expect(result).toEqual([]);
      });
    });

    describe("flowQueries.detail", () => {
      it("should create query options for flow detail", () => {
        const flowId = "test-flow-id";
        const options = flowQueries.detail(flowId);

        expect(options.queryKey).toEqual(flowKeys.detail(flowId));
        expect(options.queryFn).toBeDefined();
        expect(options.gcTime).toBe(1000 * 60 * 5); // 5 minutes
        expect(options.staleTime).toBe(0); // Always stale
      });

      it("should handle successful flow fetch", async () => {
        const mockFlow = {
          id: new UniqueEntityID("test-flow-id"),
          props: {
            name: "Test Flow",
            nodes: [],
            edges: [],
          },
        };
        vi.mocked(FlowService.getFlowWithNodes.execute).mockResolvedValue(
          Result.ok(mockFlow as any),
        );

        const options = flowQueries.detail("test-flow-id");
        const result = await options.queryFn!({} as any);

        expect(FlowService.getFlowWithNodes.execute).toHaveBeenCalledWith(
          new UniqueEntityID("test-flow-id"),
        );
        expect(result).toBeDefined();
      });

      it("should handle flow fetch failure", async () => {
        vi.mocked(FlowService.getFlowWithNodes.execute).mockResolvedValue(
          Result.fail("Flow not found"),
        );

        const options = flowQueries.detail("test-flow-id");
        const result = await options.queryFn!({} as any);

        expect(result).toBeNull();
      });

      it("should handle empty flow id", async () => {
        const options = flowQueries.detail("");
        const result = await options.queryFn!({} as any);

        expect(result).toBeNull();
        expect(FlowService.getFlowWithNodes.execute).not.toHaveBeenCalled();
      });
    });
  });
});
