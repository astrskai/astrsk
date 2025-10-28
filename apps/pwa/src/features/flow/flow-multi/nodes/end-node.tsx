import { type Node, type NodeProps } from "@xyflow/react";
import { CustomHandle } from "@/features/flow/flow-multi/components/custom-handle";
import { useCallback } from "react";
import { toast } from "sonner";

import { useFlowPanelContext } from "@/features/flow/flow-multi/components/flow-panel-provider";
import { PANEL_TYPES } from "@/features/flow/flow-multi/components/panel-types";
import { ButtonPill } from "@/shared/ui";

export type EndNodeData = {
  label?: string;
  agentId: string;
};

export type EndNode = Node<EndNodeData>;

export default function EndNode({ id }: NodeProps<EndNode>) {
  const { openPanel, closePanel, isPanelOpen } = useFlowPanelContext();

  const handleOpenResponseDesign = useCallback(() => {
    openPanel(PANEL_TYPES.RESPONSE_DESIGN);
  }, [openPanel]);

  const handleCloseResponseDesign = useCallback(() => {
    const panelId = `${PANEL_TYPES.RESPONSE_DESIGN}-standalone`;
    closePanel(panelId);
  }, [closePanel]);

  // Check if response design panel is currently open
  const isResponseDesignOpen = isPanelOpen(PANEL_TYPES.RESPONSE_DESIGN);

  return (
    <div className="group/node relative">
      <div className="bg-background-surface-2 outline-background-surface-2 inline-flex w-56 flex-col items-start justify-center gap-2 rounded-lg px-4 py-3.5 shadow-[0px_1px_12px_0px_rgba(125,125,125,1.00)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px]">
        <div className="text-text-primary justify-start text-2xl leading-10 font-medium">
          End
        </div>
        <div className="bg-background-surface-3 flex flex-col items-start justify-start gap-4 self-stretch rounded-lg p-2">
          <ButtonPill
            onClick={handleOpenResponseDesign}
            // onDoubleClick={handleCloseResponseDesign}
            active={isResponseDesignOpen}
            className="justify-center self-stretch"
            size="default"
          >
            Response design
          </ButtonPill>
          <div className="text-text-placeholder justify-start self-stretch text-xs font-normal">
            Design the exact format and structure of AI responses
          </div>
        </div>
      </div>
      {/* React Flow Handle */}
      <CustomHandle variant="input" nodeId={id} />
    </div>
  );
}
