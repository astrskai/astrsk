import { Result } from "@/shared/core";
import { IfNode } from "../domain";

export interface SaveIfNodeRepo {
  saveIfNode(ifNode: IfNode): Promise<Result<IfNode>>;
}