import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { DataStoreNode, CreateDataStoreNodeProps } from "../domain";
import { SaveDataStoreNodeRepo } from "../repos";

export interface CreateDataStoreNodeRequest extends CreateDataStoreNodeProps {
  nodeId?: string; // Optional override for node ID
}

export class CreateDataStoreNodeUseCase implements UseCase<CreateDataStoreNodeRequest, Result<DataStoreNode>> {
  constructor(
    private saveDataStoreNodeRepo: SaveDataStoreNodeRepo,
  ) {}

  async execute(request: CreateDataStoreNodeRequest): Promise<Result<DataStoreNode>> {
    try {
      console.log('🔍 [CREATE-USE-CASE] Incoming request:', {
        nodeId: request.nodeId,
        flowId: request.flowId,
        name: request.name,
        color: request.color,
        dataStoreFieldsType: typeof request.dataStoreFields,
        dataStoreFieldsLength: request.dataStoreFields?.length,
        dataStoreFields: request.dataStoreFields
      });
      
      // Create node ID from request or generate new one
      const nodeId = request.nodeId ? new UniqueEntityID(request.nodeId) : new UniqueEntityID();

      // Create domain entity
      const dataStoreNodeOrError = DataStoreNode.create(
        {
          flowId: request.flowId,
          name: request.name,
          color: request.color || "#3b82f6",
          dataStoreFields: request.dataStoreFields || [],
        },
        nodeId
      );

      if (dataStoreNodeOrError.isFailure) {
        return Result.fail(dataStoreNodeOrError.getError());
      }

      const dataStoreNode = dataStoreNodeOrError.getValue();
      
      console.log('🔍 [CREATE-USE-CASE] Created domain entity:', {
        id: dataStoreNode.id.toString(),
        flowId: dataStoreNode.props.flowId,
        name: dataStoreNode.props.name,
        dataStoreFieldsLength: dataStoreNode.props.dataStoreFields?.length,
        dataStoreFields: dataStoreNode.props.dataStoreFields
      });

      // Save to repository
      const saveResult = await this.saveDataStoreNodeRepo.saveDataStoreNode(dataStoreNode);
      if (saveResult.isFailure) {
        return Result.fail(saveResult.getError());
      }

      return Result.ok(dataStoreNode);
    } catch (error) {
      console.error('🔥 [CREATE-USE-CASE] Error:', error);
      return Result.fail(`Failed to create data store node: ${(error as any)?.message || String(error)}`);
    }
  }
}