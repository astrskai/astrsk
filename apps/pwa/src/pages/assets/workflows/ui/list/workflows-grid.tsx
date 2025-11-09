import { Plus, Upload, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Flow } from "@/entities/flow/domain/flow";
import { CreateItemCard } from "@/shared/ui";
import { Button } from "@/shared/ui/forms";
import { ActionConfirm } from "@/shared/ui/dialogs";
import FlowPreview from "@/features/flow/ui/flow-preview";
import type { FlowAction } from "@/features/flow/ui/flow-preview";
import { useFlowActions } from "@/features/flow/model/use-flow-actions";
import { useNewItemAnimation } from "@/shared/hooks/use-new-item-animation";
import { FlowExportDialog } from "../dialog/flow-export-dialog";
import { cn } from "@/shared/lib";

interface FlowsGridProps {
  flows: Flow[];
  onCreateFlow: () => void;
  showNewFlowCard: boolean;
  newlyCreatedFlowId?: string | null;
}

/**
 * Flow Grid Item
 * Wrapper component for FlowPreview with actions
 */
interface FlowGridItemProps {
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

function FlowGridItem({
  flow,
  loading,
  className,
  onFlowClick,
  onExportClick,
  onCopy,
  onDeleteClick,
}: FlowGridItemProps) {
  const flowId = flow.id.toString();
  const nodeCount = flow.props.nodes.length;

  const actions: FlowAction[] = [
    {
      icon: Upload,
      label: `Export ${flow.props.name}`,
      onClick: onExportClick(flowId, flow.props.name),
      disabled: loading.exporting,
      loading: loading.exporting,
    },
    {
      icon: Copy,
      label: `Copy ${flow.props.name}`,
      onClick: onCopy(flowId, flow.props.name),
      disabled: loading.copying,
      loading: loading.copying,
    },
    {
      icon: Trash2,
      label: `Delete ${flow.props.name}`,
      onClick: onDeleteClick(flowId, flow.props.name),
      disabled: loading.deleting,
      loading: loading.deleting,
    },
  ];

  return (
    <FlowPreview
      title={flow.props.name || "Untitled Flow"}
      description={flow.props.description}
      nodeCount={nodeCount}
      onClick={() => onFlowClick(flowId)}
      actions={actions}
      isShowActions={true}
      className={className}
    />
  );
}

/**
 * Flows grid component
 * Displays flow cards in a responsive grid with optional New Flow Card
 *
 * Layout:
 * - Mobile: Button above grid + 1 column
 * - Desktop: New card inside grid + 2-3 columns
 */
export function FlowsGrid({
  flows,
  onCreateFlow,
  showNewFlowCard,
  newlyCreatedFlowId = null,
}: FlowsGridProps) {
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
      <div className="flex flex-col gap-4">
        {/* Mobile: Create Button (outside grid) */}
        {showNewFlowCard && (
          <Button
            onClick={onCreateFlow}
            icon={<Plus className="min-h-4 min-w-4" />}
            className="w-full md:hidden"
          >
            Create new flow
          </Button>
        )}

        {/* Flows Grid */}
        <div className="grid w-full grid-cols-1 justify-center gap-4 md:grid-cols-2">
          {/* Desktop: New Flow Card (inside grid) */}
          {showNewFlowCard && (
            <CreateItemCard
              title="New Workflow"
              description="Create a new workflow"
              onClick={onCreateFlow}
              className="hidden aspect-[2/1] md:flex lg:aspect-[3/1]"
            />
          )}

          {/* Existing Flows */}
          {flows.map((flow) => {
            const flowId = flow.id.toString();
            const loading = loadingStates[flowId] || {};
            const isNewlyCreated = animatingId === flowId;

            return (
              <FlowGridItem
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
      <ActionConfirm
        open={deleteDialogState.isOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Flow"
        description={
          deleteDialogState.usedSessions.length > 0
            ? `This flow is used in ${deleteDialogState.usedSessions.length} session(s). Deleting it may affect those sessions.`
            : "This flow will be permanently deleted and cannot be recovered."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
      />
    </>
  );
}
