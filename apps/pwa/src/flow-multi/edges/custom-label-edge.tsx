import React, { type FC } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

type CustomLabelEdgeData = {
  label?: string;
};

export type CustomLabelEdge = Edge<CustomLabelEdgeData>;

const CustomLabelEdge: FC<EdgeProps<CustomLabelEdge>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  label,
  markerEnd,
  style,
  ...rest
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Check both data.label and label prop
  const edgeLabel = label || data?.label;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {edgeLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="px-[5px] py-[3px] bg-background-surface-1 inline-flex justify-center items-center gap-2 rounded">
              <div className="text-center justify-start text-text-primary text-[10px] font-normal">
                {edgeLabel}
              </div>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomLabelEdge;