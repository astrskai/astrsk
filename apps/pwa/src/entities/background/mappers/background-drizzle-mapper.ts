import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib";

import { InsertBackground, SelectBackground } from "@/db/schema/backgrounds";
import { Background } from "@/entities/background/domain/background";

export class BackgroundDrizzleMapper {
  private constructor() {}

  public static toDomain(row: SelectBackground): Background {
    // Create background
    const backgroundOrError = Background.create(
      {
        name: row.name,
        assetId: new UniqueEntityID(row.asset_id),
        sessionId: new UniqueEntityID(row.session_id),
        updatedAt: new Date(row.updated_at),
      },
      new UniqueEntityID(row.id),
    );

    // Check error
    if (backgroundOrError.isFailure) {
      logger.error(backgroundOrError.getError());
      throw new Error(backgroundOrError.getError());
    }

    // Return background
    return backgroundOrError.getValue();
  }

  public static toPersistence(domain: Background): InsertBackground {
    return {
      id: domain.id.toString(),
      name: domain.name,
      asset_id: domain.assetId.toString(),
      session_id: domain.sessionId.toString(),
    };
  }

  public static toStorage(domain: Background): InsertBackground {
    const row = this.toPersistence(domain);
    return {
      ...row,
      updated_at: domain.updatedAt,
    };
  }
}
