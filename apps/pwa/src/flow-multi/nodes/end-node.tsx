import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "sonner";

import { useFlowPanelContext } from "@/flow-multi/components/flow-panel-provider";
import { PANEL_TYPES } from "@/flow-multi/components/panel-types";
import { ButtonPill } from "@/components-v2/ui/button-pill";

export type EndNodeData = {
  label?: string;
  agentId: string;
};

export type EndNode = Node<EndNodeData>;

export default function EndNode({}: NodeProps<EndNode>) {
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
    <div className="relative group/node">
      <div className="w-56 px-4 py-3.5 bg-background-surface-2 rounded-lg shadow-[0px_1px_12px_0px_rgba(125,125,125,1.00)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-background-surface-2 inline-flex flex-col justify-center items-start gap-2">
        <div className="justify-start text-text-primary text-2xl font-medium leading-10">End</div>
        <div className="self-stretch p-2 bg-background-surface-3 rounded-lg flex flex-col justify-start items-start gap-4">
          <ButtonPill
            onClick={handleOpenResponseDesign}
            // onDoubleClick={handleCloseResponseDesign}
            active={isResponseDesignOpen}
            className="self-stretch justify-center"
            size="default"
          >
            Response design
          </ButtonPill>
          <div className="self-stretch justify-start text-text-placeholder text-xs font-normal">Design the exact format and structure of AI responses</div>
        </div>
      </div>
      {/* Target handle - simple white handle matching agent node style */}
      <Handle 
        position={Position.Left} 
        type="target" 
        className="!w-3 !h-3 !bg-white !border-2 !border-gray-300"
        title="Connect from previous node"
      />
    </div>
  );
}