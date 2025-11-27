import { Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Flow } from "@/entities/flow/domain/flow";
import { DialogConfirm } from "@/shared/ui/dialogs";
import WorkflowCard from "@/features/flow/ui/workflow-card";
import type { CardAction } from "@/features/common/ui";
import { useFlowActions } from "@/features/flow/model/use-flow-actions";
import { useNewItemAnimation } from "@/shared/hooks/use-new-item-animation";
import { FlowExportDialog } from "@/features/flow/ui/flow-export-dialog";
import { cn } from "@/shared/lib";

interface WorkflowsGridProps {
  flows: Flow[];
  newlyCreatedFlowId?: string | null;
}

/**
 * Workflow Grid Item
 * Wrapper component for WorkflowCard with actions
 */
interface WorkflowGridItemProps {
  flow: Flow;
  loading: { exporting?: boolean; copying?: boolean; deleting?: boolean };
  className?: string;
  onFlowClick: (flowId: string) => void;
  onExportClick: (
    flowId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
  onCopy: (flowId: string, title: string) => (e: React.MouseEvent) => void;
  onDeleteClick: (
    flowId: string,
    title: string,
  ) => (e: React.MouseEvent) => void;
}

function WorkflowGridItem({
  flow,
  loading,
  className,
  onFlowClick,
  onExportClick,
  onCopy,
  onDeleteClick,
}: WorkflowGridItemProps) {
  const flowId = flow.id.toString();
  const nodeCount = flow.props.nodes.length;

  const actions: CardAction[] = [
    {
      icon: Upload,
      label: "Export",
      onClick: onExportClick(flowId, flow.props.name),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: "Copy",
      onClick: onCopy(flowId, flow.props.name),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: "Delete",
      onClick: onDeleteClick(flowId, flow.props.name),
      disabled: loading.deleting,
      loading: loading.deleting,
      className: "text-red-400 hover:text-red-300",
    },
  ];

  return (
    <WorkflowCard
      title={flow.props.name || "Untitled Workflow"}
      description={flow.props.description}
      nodeCount={nodeCount}
      isValid={true}
      onClick={() => onFlowClick(flowId)}
      actions={actions}
      className={className}
    />
  );
}

/**
 * Workflows grid component v2
 * Displays workflow cards in a responsive grid
 *
 * Layout: Uses auto-fill with minmax to ensure stable card sizes
 */
export function WorkflowsGrid({
  flows,
  newlyCreatedFlowId = null,
}: WorkflowsGridProps) {
  const navigate = useNavigate();
  const { animatingId, triggerAnimation } = useNewItemAnimation();

  const {
    loadingStates,
    deleteDialogState,
    exportDialogState,
    handleExportClick,
    handleExportConfirm,
    handleCopy,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
    closeExportDialog,
  } = useFlowActions({
    onCopySuccess: (flowId) => triggerAnimation(flowId),
  });

  // Track newly created flow from parent
  useEffect(() => {
    if (newlyCreatedFlowId) {
      triggerAnimation(newlyCreatedFlowId);
    }
  }, [newlyCreatedFlowId, triggerAnimation]);

  const handleFlowClick = (flowId: string) => {
    navigate({
      to: "/assets/workflows/$workflowId",
      params: { workflowId: flowId },
    });
  };

  return (
    <>
      {/* Workflows Grid - Uses auto-fill with minmax to ensure stable card sizes */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {flows.map((flow) => {
          const flowId = flow.id.toString();
          const loading = loadingStates[flowId] || {};
          const isNewlyCreated = animatingId === flowId;

          return (
            <WorkflowGridItem
              key={flowId}
              flow={flow}
              loading={loading}
              className={cn(
                isNewlyCreated && [
                  "!border-green-500",
                  "shadow-[0_0_20px_rgba(34,197,94,0.5)]",
                  "animate-pulse",
                ],
              )}
              onFlowClick={handleFlowClick}
              onExportClick={handleExportClick}
              onCopy={handleCopy}
              onDeleteClick={handleDeleteClick}
            />
          );
        })}
      </div>

      {/* Export Dialog */}
      <FlowExportDialog
        open={exportDialogState.isOpen}
        onOpenChange={closeExportDialog}
        agents={exportDialogState.agents}
        onExport={async (modelTierSelections) => {
          const { flowId, title } = exportDialogState;
          if (flowId) {
            await handleExportConfirm(flowId, title, modelTierSelections);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DialogConfirm
        open={deleteDialogState.isOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Workflow"
        description={
          deleteDialogState.usedSessions.length > 0
            ? `This workflow is used in ${deleteDialogState.usedSessions.length} session(s). Deleting it may affect those sessions.`
            : "This workflow will be permanently deleted and cannot be recovered."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
}
