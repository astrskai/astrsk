import { Handle, Position } from "@xyflow/react";
import { type Node, type NodeProps } from "@xyflow/react";
import { Plus } from "lucide-react";

export type StartNodeData = {
  label?: string;
};

export type StartNode = Node<StartNodeData>;

export default function StartNode({ data }: NodeProps<StartNode>) {
  return (
    <div className="group/node relative inline-block">
      <div className="px-8 py-3.5 bg-background-surface-2 rounded-lg shadow-[0px_1px_12px_0px_rgba(125,125,125,1.00)] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] outline outline-1 outline-offset-[-1px] outline-background-surface-2 inline-flex justify-center items-center gap-2">
        <div className="justify-start text-text-primary text-2xl font-medium leading-10">Start</div>
      </div>
      
      <Handle 
          position={Position.Right} 
          type="source" 
          className="!w-3 !h-3 !border-0 !bg-transparent group-hover/node:!w-6 group-hover/node:!h-6 transition-all duration-200"
          style={{ 
            zIndex: 10
          }}
          title="Drag to connect to next node"
        />
      {/* Source handle with plus icon on node hover - matching agent node styling */}
      <div className="absolute right-1 top-[40%] -translate-y-1/2 translate-x-1/2 group/handle">
        {/* Default small handle */}
        <div className="absolute inset-0 w-3 h-3 p-[1.5px] bg-text-primary rounded-xl outline-1 outline-offset-[-1px] outline-background-surface-2 flex justify-center items-center group-hover/node:hidden pointer-events-none">
          <div className="w-2 h-2 relative overflow-hidden">
            <div className="w-1.5 h-1.5 left-[1px] top-[1px] absolute outline-[0.67px] outline-offset-[-0.33px] outline-text-primary"></div>
          </div>
        </div>
        {/* Large handle on node hover with plus icon */}
        <div className="absolute inset-[-5px] w-6 h-6 p-[5px] bg-background-surface-3 rounded-xl outline-1 outline-offset-[-1px] outline-background-surface-2 hidden group-hover/node:flex justify-center items-center pointer-events-none">
          <Plus className="w-4 h-4 text-text-primary" />
        </div>
      </div>
    </div>
  );
}