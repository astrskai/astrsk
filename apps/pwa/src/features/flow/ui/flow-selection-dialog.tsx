import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, SearchInput } from "@/shared/ui/forms";
import WorkflowCard from "@/features/flow/ui/workflow-card";
import { flowQueries } from "@/entities/flow/api/flow-queries";
import { Flow } from "@/entities/flow/domain/flow";
import { cn } from "@/shared/lib";
import DialogBase from "@/shared/ui/dialogs/base";

interface FlowSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFlow: Flow | null;
  onConfirm: (flow: Flow | null) => void;
  title?: string;
  description?: string;
  confirmButtonText?: string;
}

/**
 * Flow Selection Dialog
 * Reusable dialog for selecting flow
 * Supports single selection only (no multiple selection)
 */
export function FlowSelectionDialog({
  open,
  onOpenChange,
  selectedFlow,
  onConfirm,
  title = "Select Workflow",
  description = "Choose a workflow to use for this session",
  confirmButtonText = "Add",
}: FlowSelectionDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  // Temporary state for dialog selection (only committed on Confirm)
  const [tempSelectedId, setTempSelectedId] = useState<string | null>(
    selectedFlow?.id.toString() || null,
  );

  const { data: flows } = useQuery({
    ...flowQueries.list(),
    enabled: open, // Only fetch when dialog is open
  });

  // Initialize state when dialog opens
  useEffect(() => {
    if (open) {
      setTempSelectedId(selectedFlow?.id.toString() || null);
      setSearchKeyword("");
    }
  }, [open, selectedFlow]);

  // Filter flows by search keyword
  const filteredFlows = useMemo(() => {
    if (!flows) return [];
    if (!searchKeyword.trim()) return flows;

    const keyword = searchKeyword.toLowerCase();
    return flows.filter((flow: Flow) =>
      flow.props.name?.toLowerCase().includes(keyword),
    );
  }, [flows, searchKeyword]);

  const handleFlowClick = useCallback((flowId: string) => {
    // Single selection mode: toggle selection
    setTempSelectedId((prev) => (prev === flowId ? null : flowId));
  }, []);

  const handleClose = useCallback(() => {
    // Just close the dialog - useEffect will handle reset
    onOpenChange(false);
  }, [onOpenChange]);

  const handleConfirm = useCallback(() => {
    // Commit temp selection to actual state
    if (flows) {
      const selected = tempSelectedId
        ? (flows.find((flow: Flow) => flow.id.toString() === tempSelectedId) as
            | Flow
            | undefined)
        : null;
      onConfirm(selected || null);
      handleClose();
    }
  }, [tempSelectedId, flows, onConfirm, handleClose]);

  const handleCancel = useCallback(() => {
    handleClose();
  }, [handleClose]);

  // Just pass through to parent - useEffect handles initialization
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      onOpenChange(newOpen);
    },
    [onOpenChange],
  );

  return (
    <DialogBase
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      isShowCloseButton={false}
      size="2xl"
      content={
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* Search Input */}
          <SearchInput
            name="flow-search"
            placeholder="Search workflows..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full max-w-md flex-shrink-0"
          />

          {/* Flow Cards Grid */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredFlows.map((flow: Flow) => {
                const flowId = flow.id.toString();
                const isSelected = tempSelectedId === flowId;

                return (
                  <WorkflowCard
                    key={flowId}
                    title={flow.props.name || "Untitled Flow"}
                    description={flow.props.description}
                    nodeCount={flow.props.nodes.length}
                    // TODO: Add tags when FlowProps supports it
                    // tags={flow.props.tags || []}
                    onClick={() => handleFlowClick(flowId)}
                    className={cn(
                      isSelected
                        ? "border-brand-500 hover:border-brand-400 border-2 shadow-lg"
                        : "border-2 border-transparent",
                    )}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {filteredFlows.length === 0 && (
              <div className="text-fg-muted flex flex-col items-center justify-center py-12 text-center">
                {searchKeyword ? (
                  <>
                    <p className="mb-2 text-lg">No workflows found</p>
                    <p className="text-sm">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-lg">No workflows available</p>
                    <p className="text-sm">
                      Create a workflow first to continue
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 border-t border-border-muted pt-4">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {confirmButtonText}
            {tempSelectedId ? " (1)" : ""}
          </Button>
        </div>
      }
    />
  );
}
