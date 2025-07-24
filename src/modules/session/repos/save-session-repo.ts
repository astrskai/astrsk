import { Result } from "@/shared/core";

import { Transaction } from "@/db/transaction";
import { Session } from "@/modules/session/domain/session";

export interface SaveSessionRepo {
  saveSession(session: Session, tx?: Transaction): Promise<Result<Session>>;
}
