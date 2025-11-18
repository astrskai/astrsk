import { Result } from "@/shared/core";
import { Transaction } from "@/db/transaction";
import { IfNode } from "../domain";

export interface SaveIfNodeRepo {
  saveIfNode(ifNode: IfNode, tx?: Transaction): Promise<Result<IfNode>>;
}