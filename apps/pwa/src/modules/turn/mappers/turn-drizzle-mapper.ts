import { UniqueEntityID } from "@/shared/domain";
import { logger } from "@/shared/lib/logger";

import { InsertTurn, SelectTurn } from "@/db/schema/turns";
import { Turn } from "@/modules/turn/domain/turn";
import { Option } from "@/modules/turn/domain/option";

export class TurnDrizzleMapper {
  private constructor() {}

  public static toDomain(row: SelectTurn): Turn {
    // Create turn
    const turnOrError = Turn.create(
      {
        sessionId: new UniqueEntityID(row.session_id),
        characterCardId: row.character_card_id
          ? new UniqueEntityID(row.character_card_id)
          : undefined,
        characterName: row.character_name ?? undefined,
        options: Array.isArray(row.options)
          ? row.options.map((option) =>
              Option.fromJSON(option).throwOnFailure().getValue(),
            )
          : [],
        selectedOptionIndex: row.selected_option_index,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      },
      new UniqueEntityID(row.id),
    );

    // Check error
    if (turnOrError.isFailure) {
      logger.error(turnOrError.getError());
      throw new Error(turnOrError.getError());
    }

    // Return turn
    return turnOrError.getValue();
  }

  public static toPersistence(domain: Turn): InsertTurn {
    return {
      id: domain.id.toString(),
      session_id: domain.props.sessionId.toString(),
      character_card_id: domain.props.characterCardId?.toString(),
      character_name: domain.props.characterName,
      options: Array.isArray(domain.props.options)
        ? domain.props.options.map((option) => option.toJSON())
        : [],
      selected_option_index: domain.props.selectedOptionIndex,
      created_at: domain.props.createdAt,
      updated_at: domain.props.updatedAt,
    };
  }

  public static toStorage(domain: Turn): InsertTurn {
    const row = this.toPersistence(domain);
    return {
      ...row,
      created_at: domain.props.createdAt,
      updated_at: domain.props.updatedAt,
    };
  }
}
