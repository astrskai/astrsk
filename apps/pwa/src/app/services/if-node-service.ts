import { DrizzleIfNodeRepo } from "@/modules/if-node/repos/impl/drizzle-if-node-repo";
import { CreateIfNodeUseCase } from "@/modules/if-node/usecases/create-if-node";
import { GetIfNodeUseCase } from "@/modules/if-node/usecases/get-if-node";
import { GetAllIfNodesByFlowUseCase } from "@/modules/if-node/usecases/get-all-if-nodes-by-flow";
import { UpdateIfNodeNameUseCase } from "@/modules/if-node/usecases/update-if-node-name";
import { UpdateIfNodeConditionsUseCase } from "@/modules/if-node/usecases/update-if-node-conditions";
import { UpdateIfNodeLogicOperatorUseCase } from "@/modules/if-node/usecases/update-if-node-logic-operator";
import { UpdateIfNodeColorUseCase } from "@/modules/if-node/usecases/update-if-node-color";
import { DeleteAllIfNodesByFlowUseCase } from "@/modules/if-node/usecases/delete-all-if-nodes-by-flow";

export class IfNodeService {
  public static ifNodeRepo: DrizzleIfNodeRepo;
  
  public static createIfNode: CreateIfNodeUseCase;
  public static getIfNode: GetIfNodeUseCase;
  public static getAllIfNodesByFlow: GetAllIfNodesByFlowUseCase;
  public static updateIfNodeName: UpdateIfNodeNameUseCase;
  public static updateIfNodeConditions: UpdateIfNodeConditionsUseCase;
  public static updateIfNodeLogicOperator: UpdateIfNodeLogicOperatorUseCase;
  public static updateIfNodeColor: UpdateIfNodeColorUseCase;
  public static deleteAllIfNodesByFlow: DeleteAllIfNodesByFlowUseCase;

  private constructor() {}

  public static init() {
    this.ifNodeRepo = new DrizzleIfNodeRepo();
    
    this.createIfNode = new CreateIfNodeUseCase(this.ifNodeRepo);
    this.getIfNode = new GetIfNodeUseCase(this.ifNodeRepo);
    this.getAllIfNodesByFlow = new GetAllIfNodesByFlowUseCase(this.ifNodeRepo);
    this.updateIfNodeName = new UpdateIfNodeNameUseCase(this.ifNodeRepo, this.ifNodeRepo);
    this.updateIfNodeConditions = new UpdateIfNodeConditionsUseCase(this.ifNodeRepo, this.ifNodeRepo);
    this.updateIfNodeLogicOperator = new UpdateIfNodeLogicOperatorUseCase(this.ifNodeRepo, this.ifNodeRepo);
    this.updateIfNodeColor = new UpdateIfNodeColorUseCase(this.ifNodeRepo, this.ifNodeRepo);
    this.deleteAllIfNodesByFlow = new DeleteAllIfNodesByFlowUseCase(this.ifNodeRepo);
  }
}