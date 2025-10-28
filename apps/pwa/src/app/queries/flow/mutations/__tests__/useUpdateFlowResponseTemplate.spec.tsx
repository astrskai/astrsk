/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { ReactNode } from "react";
import { useUpdateResponseTemplate } from "../../mutations";
import { FlowService } from "@/app/services/flow-service";
import { Result } from "@/shared/core";
import { flowKeys } from "../../query-factory";

// Mock FlowService
vi.mock("@/app/services/flow-service", () => ({
  FlowService: {
    updateResponseTemplate: {
      execute: vi.fn(),
    },
  },
}));

describe("useUpdateFlowResponseTemplate", () => {
  let queryClient: QueryClient;
  const flowId = "test-flow-id";

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Set up initial state
    queryClient.setQueryData(flowKeys.detail(flowId), {
      id: flowId,
      name: "Test Flow",
      responseTemplate: { old: "template" },
      updatedAt: new Date("2024-01-01"),
    });

    queryClient.setQueryData(flowKeys.response(flowId), {
      template: { old: "template" },
      updatedAt: new Date("2024-01-01"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should update flow response template successfully", async () => {
    vi.mocked(FlowService.updateResponseTemplate.execute).mockResolvedValue(
      Result.ok(undefined),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateResponseTemplate(flowId), {
      wrapper,
    });

    const newResponseTemplate = "new template";

    await act(async () => {
      await result.current.mutateAsync(newResponseTemplate);
    });

    expect(FlowService.updateResponseTemplate.execute).toHaveBeenCalledWith({
      flowId,
      responseTemplate: newResponseTemplate,
    });
  });

  it.skip("should handle optimistic updates", async () => {
    // Use real timers for this test to avoid interference with async operations
    vi.useRealTimers();

    // Mock the service to never resolve, simulating a pending request
    vi.mocked(FlowService.updateResponseTemplate.execute).mockImplementation(
      () => new Promise(() => {}), // Never resolves
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateResponseTemplate(flowId), {
      wrapper,
    });

    const newResponseTemplate = "optimistic template";

    // Check initial state
    const initialData = queryClient.getQueryData(
      flowKeys.detail(flowId),
    ) as any;
    expect(initialData).toBeDefined();
    expect(initialData.responseTemplate).toEqual({ old: "template" });

    // Start the mutation
    act(() => {
      result.current.mutate(newResponseTemplate);
    });

    // Wait a moment for React to process the update
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve(); // Double resolve to ensure all microtasks are processed
    });

    // Check mutation state
    expect(result.current.isPending).toBe(true);

    // Check that optimistic update was applied to detail cache
    const detailData = queryClient.getQueryData(flowKeys.detail(flowId)) as any;
    expect(detailData?.responseTemplate).toEqual(newResponseTemplate);

    // Check that optimistic update was applied to response cache
    const responseData = queryClient.getQueryData(
      flowKeys.response(flowId),
    ) as any;
    expect(responseData?.template).toEqual(newResponseTemplate);
  });

  it("should rollback on error", async () => {
    const originalTemplate = { old: "template" };
    vi.mocked(FlowService.updateResponseTemplate.execute).mockRejectedValue(
      new Error("Update failed"),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateResponseTemplate(flowId), {
      wrapper,
    });

    try {
      await act(async () => {
        await result.current.mutateAsync("failed template");
      });
    } catch {
      // Expected to fail
    }

    // Check that data was rolled back
    const detailData = queryClient.getQueryData(flowKeys.detail(flowId)) as any;
    expect(detailData.responseTemplate).toEqual(originalTemplate);
  });

  it("should track edit mode", async () => {
    vi.mocked(FlowService.updateResponseTemplate.execute).mockResolvedValue(
      Result.ok(undefined),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateResponseTemplate(flowId), {
      wrapper,
    });

    // Initially not editing
    expect(result.current.isEditing).toBe(false);

    // Start mutation and wait for it to complete
    await act(async () => {
      await result.current.mutateAsync("template");
    });

    // After mutation completes, should still be editing (before timeout)
    expect(result.current.isEditing).toBe(true);

    // Advance timers to trigger the edit end timeout
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // After timeout, should no longer be editing
    expect(result.current.isEditing).toBe(false);
  }, 10000);
});
