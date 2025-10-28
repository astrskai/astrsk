import { DrizzleIfNodeRepo } from "@/entities/if-node/repos/impl/drizzle-if-node-repo";
import { CreateIfNodeUseCase } from "@/entities/if-node/usecases/create-if-node";
import { GetIfNodeUseCase } from "@/entities/if-node/usecases/get-if-node";
import { GetAllIfNodesByFlowUseCase } from "@/entities/if-node/usecases/get-all-if-nodes-by-flow";
import { UpdateIfNodeNameUseCase } from "@/entities/if-node/usecases/update-if-node-name";
import { UpdateIfNodeConditionsUseCase } from "@/entities/if-node/usecases/update-if-node-conditions";
import { UpdateIfNodeLogicOperatorUseCase } from "@/entities/if-node/usecases/update-if-node-logic-operator";
import { UpdateIfNodeColorUseCase } from "@/entities/if-node/usecases/update-if-node-color";
import { DeleteIfNodeUseCase } from "@/entities/if-node/usecases/delete-if-node";
import { DeleteAllIfNodesByFlowUseCase } from "@/entities/if-node/usecases/delete-all-if-nodes-by-flow";
import { RestoreIfNodeFromSnapshot } from "@/entities/if-node/usecases/restore-if-node-from-snapshot";
import { CloneIfNodeUseCase } from "@/entities/if-node/usecases/clone-if-node";

export class IfNodeService {
  public static ifNodeRepo: DrizzleIfNodeRepo;

  public static createIfNode: CreateIfNodeUseCase;
  public static getIfNode: GetIfNodeUseCase;
  public static getAllIfNodesByFlow: GetAllIfNodesByFlowUseCase;
  public static updateIfNodeName: UpdateIfNodeNameUseCase;
  public static updateIfNodeConditions: UpdateIfNodeConditionsUseCase;
  public static updateIfNodeLogicOperator: UpdateIfNodeLogicOperatorUseCase;
  public static updateIfNodeColor: UpdateIfNodeColorUseCase;
  public static deleteIfNode: DeleteIfNodeUseCase;
  public static deleteAllIfNodesByFlow: DeleteAllIfNodesByFlowUseCase;
  public static restoreIfNodeFromSnapshot: RestoreIfNodeFromSnapshot;
  public static cloneIfNode: CloneIfNodeUseCase;

  private constructor() {}

  public static init() {
    this.ifNodeRepo = new DrizzleIfNodeRepo();

    this.createIfNode = new CreateIfNodeUseCase(this.ifNodeRepo);
    this.getIfNode = new GetIfNodeUseCase(this.ifNodeRepo);
    this.getAllIfNodesByFlow = new GetAllIfNodesByFlowUseCase(this.ifNodeRepo);
    this.updateIfNodeName = new UpdateIfNodeNameUseCase(
      this.ifNodeRepo,
      this.ifNodeRepo,
    );
    this.updateIfNodeConditions = new UpdateIfNodeConditionsUseCase(
      this.ifNodeRepo,
      this.ifNodeRepo,
    );
    this.updateIfNodeLogicOperator = new UpdateIfNodeLogicOperatorUseCase(
      this.ifNodeRepo,
      this.ifNodeRepo,
    );
    this.updateIfNodeColor = new UpdateIfNodeColorUseCase(
      this.ifNodeRepo,
      this.ifNodeRepo,
    );
    this.deleteIfNode = new DeleteIfNodeUseCase(this.ifNodeRepo);
    this.deleteAllIfNodesByFlow = new DeleteAllIfNodesByFlowUseCase(
      this.ifNodeRepo,
    );
    this.restoreIfNodeFromSnapshot = new RestoreIfNodeFromSnapshot(
      this.ifNodeRepo,
    );
    this.cloneIfNode = new CloneIfNodeUseCase(this.ifNodeRepo, this.ifNodeRepo);
  }
}
