import { type Node, type NodeProps } from "@xyflow/react";
import { CustomHandle } from "@/features/flow/flow-multi/components/custom-handle";
import {
  StartNodeType,
  getStartNodeTheme,
  getStartNodeLabel
} from "@/entities/flow/model/start-node-types";

export type StartNodeData = {
  label?: string;
  startType?: StartNodeType;
};

export type StartNode = Node<StartNodeData>;

export default function StartNode({ data, id }: NodeProps<StartNode>) {
  // Default to CHARACTER if no startType specified (backward compatibility)
  const startType = data.startType || StartNodeType.CHARACTER;
  const theme = getStartNodeTheme(startType);
  const label = getStartNodeLabel(startType);

  return (
    <div className="group/node relative inline-block">
      <div
        className="px-8 py-3.5 rounded-lg shadow-lg outline-2 outline-offset-[-2px] inline-flex justify-center items-center gap-2"
        style={{
          backgroundColor: theme.background,
          outlineColor: theme.border,
          outlineStyle: 'solid'
        }}
      >
        <span className="text-2xl leading-10">{theme.icon}</span>
        <div className="justify-start text-2xl font-medium leading-10" style={{ color: theme.border }}>
          {label}
        </div>
      </div>

      {/* React Flow Handle */}
      <CustomHandle variant="output" nodeId={id} />
    </div>
  );
}