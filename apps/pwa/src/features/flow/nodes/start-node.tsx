import { type Node, type NodeProps } from "@xyflow/react";
import { CustomHandle } from "@/features/flow/ui/custom-handle";

export type StartNodeData = {
  label?: string;
};

export type StartNode = Node<StartNodeData>;

export default function StartNode({ data, id }: NodeProps<StartNode>) {
  return (
    <div className="group/node relative inline-block">
      <div className="px-8 py-3.5 bg-surface-raised rounded-lg shadow-[0px_1px_12px_0px_rgba(125,125,125,1.00)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-surface-raised inline-flex justify-center items-center gap-2">
        <div className="justify-start text-fg-default text-2xl font-medium leading-10">Start</div>
      </div>
      
      {/* React Flow Handle */}
      <CustomHandle variant="output" nodeId={id} />
    </div>
  );
}