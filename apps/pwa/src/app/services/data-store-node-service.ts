import { DrizzleDataStoreNodeRepo } from "@/modules/data-store-node/repos/impl/drizzle-data-store-node-repo";
import { CreateDataStoreNodeUseCase } from "@/modules/data-store-node/usecases/create-data-store-node";
import { GetDataStoreNodeUseCase } from "@/modules/data-store-node/usecases/get-data-store-node";
import { GetAllDataStoreNodesByFlowUseCase } from "@/modules/data-store-node/usecases/get-all-data-store-nodes-by-flow";
import { UpdateDataStoreNodeNameUseCase } from "@/modules/data-store-node/usecases/update-data-store-node-name";
import { UpdateDataStoreNodeFieldsUseCase } from "@/modules/data-store-node/usecases/update-data-store-node-fields";
import { UpdateDataStoreNodeColorUseCase } from "@/modules/data-store-node/usecases/update-data-store-node-color";
import { DeleteDataStoreNodeUseCase } from "@/modules/data-store-node/usecases/delete-data-store-node";
import { DeleteAllDataStoreNodesByFlowUseCase } from "@/modules/data-store-node/usecases/delete-all-data-store-nodes-by-flow";

export class DataStoreNodeService {
  public static dataStoreNodeRepo: DrizzleDataStoreNodeRepo;
  
  public static createDataStoreNode: CreateDataStoreNodeUseCase;
  public static getDataStoreNode: GetDataStoreNodeUseCase;
  public static getAllDataStoreNodesByFlow: GetAllDataStoreNodesByFlowUseCase;
  public static updateDataStoreNodeName: UpdateDataStoreNodeNameUseCase;
  public static updateDataStoreNodeFields: UpdateDataStoreNodeFieldsUseCase;
  public static updateDataStoreNodeColor: UpdateDataStoreNodeColorUseCase;
  public static deleteDataStoreNode: DeleteDataStoreNodeUseCase;
  public static deleteAllDataStoreNodesByFlow: DeleteAllDataStoreNodesByFlowUseCase;

  private constructor() {}

  public static init() {
    this.dataStoreNodeRepo = new DrizzleDataStoreNodeRepo();
    
    this.createDataStoreNode = new CreateDataStoreNodeUseCase(this.dataStoreNodeRepo);
    this.getDataStoreNode = new GetDataStoreNodeUseCase(this.dataStoreNodeRepo);
    this.getAllDataStoreNodesByFlow = new GetAllDataStoreNodesByFlowUseCase(this.dataStoreNodeRepo);
    this.updateDataStoreNodeName = new UpdateDataStoreNodeNameUseCase(this.dataStoreNodeRepo, this.dataStoreNodeRepo);
    this.updateDataStoreNodeFields = new UpdateDataStoreNodeFieldsUseCase(this.dataStoreNodeRepo, this.dataStoreNodeRepo);
    this.updateDataStoreNodeColor = new UpdateDataStoreNodeColorUseCase(this.dataStoreNodeRepo, this.dataStoreNodeRepo);
    this.deleteDataStoreNode = new DeleteDataStoreNodeUseCase(this.dataStoreNodeRepo);
    this.deleteAllDataStoreNodesByFlow = new DeleteAllDataStoreNodesByFlowUseCase(this.dataStoreNodeRepo);
  }
}