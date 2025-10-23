import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { Flow, FlowViewport, PanelStructure } from "@/entities/flow/domain/flow";

export interface SaveFlowRepo {
  saveFlow(flow: Flow): Promise<Result<Flow>>;
  updateFlowName?(flowId: UniqueEntityID, name: string): Promise<Result<void>>;
  updateFlowViewport?(flowId: UniqueEntityID, viewport: FlowViewport): Promise<Result<void>>;
  updatePanelLayout?(flowId: UniqueEntityID, panelStructure: PanelStructure): Promise<Result<void>>;
  updateNodePosition?(flowId: UniqueEntityID, nodeId: string, position: { x: number; y: number }): Promise<Result<void>>;
  updateNodesPositions?(flowId: UniqueEntityID, positions: Array<{ nodeId: string; position: { x: number; y: number } }>): Promise<Result<void>>;
}
