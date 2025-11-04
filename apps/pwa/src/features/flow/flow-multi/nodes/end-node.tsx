import { type Node, type NodeProps } from "@xyflow/react";
import { CustomHandle } from "@/features/flow/flow-multi/components/custom-handle";
import { useCallback } from "react";

import { useFlowPanelContext } from "@/features/flow/flow-multi/components/flow-panel-provider";
import { PANEL_TYPES } from "@/features/flow/flow-multi/components/panel-types";
import { ButtonPill } from "@/shared/ui";
import {
  EndNodeType,
  getEndNodeTheme,
  getEndNodeLabel
} from "@/entities/flow/model/end-node-types";

export type EndNodeData = {
  label?: string;
  agentId: string;
  endType?: EndNodeType;
};

export type EndNode = Node<EndNodeData>;

export default function EndNode({ data, id }: NodeProps<EndNode>) {
  const { openPanel, isPanelOpen } = useFlowPanelContext();

  // Default to CHARACTER if no endType (backward compatibility with old flows)
  const endType = data.endType || EndNodeType.CHARACTER;
  const theme = getEndNodeTheme(endType);
  const label = getEndNodeLabel(endType);

  // Normalize endType for panel system:
  // - "character_end" → "character"
  // - "user_end" → "user"
  // - "plot_end" → "plot"
  const normalizedEndType = endType.replace(/_end$/, '');

  const handleOpenResponseDesign = useCallback(() => {
    openPanel(PANEL_TYPES.RESPONSE_DESIGN, normalizedEndType);
  }, [openPanel, normalizedEndType]);

  // Check if response design panel is currently open for this specific endType
  const isResponseDesignOpen = isPanelOpen(PANEL_TYPES.RESPONSE_DESIGN, normalizedEndType);

  // Get button label based on endType
  const buttonLabel = endType === EndNodeType.CHARACTER
    ? "Character response"
    : endType === EndNodeType.USER
    ? "User response"
    : "Plot response";

  return (
    <div className="group/node relative">
      <div
        className="inline-flex w-56 flex-col items-start justify-center gap-2 rounded-lg px-4 py-3.5 shadow-lg outline-2 outline-offset-[-2px]"
        style={{
          backgroundColor: theme.background,
          outlineColor: theme.border,
          outlineStyle: 'solid'
        }}
      >
        <div className="justify-start inline-flex items-center gap-2">
          <span className="text-2xl leading-10">{theme.icon}</span>
          <div className="text-2xl leading-10 font-medium" style={{ color: theme.border }}>
            {label}
          </div>
        </div>
        <div className="bg-background-surface-3 flex flex-col items-start justify-start gap-4 self-stretch rounded-lg p-2">
          <ButtonPill
            onClick={handleOpenResponseDesign}
            // onDoubleClick={handleCloseResponseDesign}
            active={isResponseDesignOpen}
            className="justify-center self-stretch"
            size="default"
          >
            {buttonLabel}
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
