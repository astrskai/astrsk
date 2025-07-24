import { Result } from "@/shared/core/result";

import { Transaction } from "@/db/transaction";
import { Asset } from "@/modules/asset/domain/asset";

export interface SaveAssetRepo {
  saveAsset(asset: Asset, tx?: Transaction): Promise<Result<Asset>>;
}
