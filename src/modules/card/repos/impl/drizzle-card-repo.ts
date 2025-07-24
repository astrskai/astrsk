import { and, asc, desc, eq, gt, ilike, inArray, or, SQL } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/utils";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { cards, SelectCard } from "@/db/schema/cards";
import { characterCards } from "@/db/schema/character-cards";
import { plotCards } from "@/db/schema/plot-cards";
import { TableName } from "@/db/schema/table-name";
import { Transaction } from "@/db/transaction";
import { Card, CardType } from "@/modules/card/domain";
import { CardDrizzleMapper } from "@/modules/card/mappers/card-drizzle-mapper";
import { DeleteCardRepo } from "@/modules/card/repos/delete-card-repo";
import {
  LoadCardRepo,
  SearchCardsQuery,
  SearchCardsSort,
} from "@/modules/card/repos/load-card-repo";
import { SaveCardRepo } from "@/modules/card/repos/save-card-repo";
// import { UpdateLocalSyncMetadata } from "@/modules/sync/usecases/update-local-sync-metadata";

export class DrizzleCardRepo
  implements SaveCardRepo, LoadCardRepo, DeleteCardRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async saveCard(card: Card, tx?: Transaction): Promise<Result<Card>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = CardDrizzleMapper.toPersistence(card);

      // Insert or update card
      const savedRow: SelectCard = {
        common: await db
          .insert(cards)
          .values(row.common)
          .onConflictDoUpdate({
            target: cards.id,
            set: row.common,
          })
          .returning()
          .then(getOneOrThrow),
      };

      // Insert or update each type
      if (row.character) {
        // Character card
        const savedCharacterRow = await db
          .insert(characterCards)
          .values(row.character)
          .onConflictDoUpdate({
            target: characterCards.id,
            set: row.character,
          })
          .returning()
          .then(getOneOrThrow);
        savedRow.character = savedCharacterRow;
      } else if (row.plot) {
        // Plot card
        const savedPlotRow = await db
          .insert(plotCards)
          .values(row.plot)
          .onConflictDoUpdate({
            target: plotCards.id,
            set: row.plot,
          })
          .returning()
          .then(getOneOrThrow);
        savedRow.plot = savedPlotRow;
      } else {
        // Unknown card type
        throw new Error("Invalid card type");
      }

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Cards,
      //   entityId: savedRow.common.id,
      //   updatedAt: savedRow.common.updated_at,
      // });

      // Return saved card
      return Result.ok(CardDrizzleMapper.toDomain(savedRow));
    } catch (error) {
      return formatFail("Failed to save card", error);
    }
  }

  async listCards(
    { cursor, pageSize = 100 }: { cursor?: UniqueEntityID; pageSize?: number },
    tx?: Transaction,
  ): Promise<Result<Card[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select cards
      const rows = await db
        .select()
        .from(cards)
        .leftJoin(characterCards, eq(characterCards.id, cards.id))
        .leftJoin(plotCards, eq(plotCards.id, cards.id))
        .where(cursor ? gt(cards.id, cursor.toString()) : undefined)
        .limit(pageSize)
        .orderBy(asc(cards.id));

      // Convert rows to entities
      const entities = rows.map((row) =>
        CardDrizzleMapper.toDomain({
          common: row.cards,
          character: row.character_cards ?? undefined,
          plot: row.plot_cards ?? undefined,
        }),
      );

      // Return cards
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to list cards", error);
    }
  }

  async getCardById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Card>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Select card by id
      const commonRow = await db
        .select()
        .from(cards)
        .where(eq(cards.id, id.toString()))
        .then(getOneOrThrow);

      // Select each type
      if (commonRow.type === CardType.Character) {
        // Character card
        const characterRow = await db
          .select()
          .from(characterCards)
          .where(eq(characterCards.id, id.toString()))
          .then(getOneOrThrow);

        // Return card
        return Result.ok(
          CardDrizzleMapper.toDomain({
            common: commonRow,
            character: characterRow,
          }),
        );
      } else if (commonRow.type === CardType.Plot) {
        // Plot card
        const plotRow = await db
          .select()
          .from(plotCards)
          .where(eq(plotCards.id, id.toString()))
          .then(getOneOrThrow);

        // Return card
        return Result.ok(
          CardDrizzleMapper.toDomain({ common: commonRow, plot: plotRow }),
        );
      }

      throw new Error("Invalid card type");
    } catch (error) {
      return formatFail("Failed to get card by id", error);
    }
  }

  async searchCards(
    query: SearchCardsQuery,
    tx?: Transaction,
  ): Promise<Result<Card[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Make filters
      const filters = [];
      if (query.keyword) {
        const keywordFilter = or(
          ilike(cards.title, `%${query.keyword}%`),
          ilike(cards.creator, `%${query.keyword}%`),
          ilike(cards.card_summary, `%${query.keyword}%`),
          ilike(cards.version, `%${query.keyword}%`),
          ilike(cards.conceptual_origin, `%${query.keyword}%`),
          ilike(characterCards.name, `%${query.keyword}%`),
          ilike(characterCards.description, `%${query.keyword}%`),
          ilike(characterCards.example_dialogue, `%${query.keyword}%`),
          ilike(plotCards.description, `%${query.keyword}%`),
        );
        // @ts-ignore
        keywordFilter && filters.push(keywordFilter);
      }
      if (query.type && query.type.length > 0) {
        // @ts-ignore
        filters.push(inArray(cards.type, query.type));
      }

      // Make order by
      let orderBy: PgColumn | SQL;
      switch (query.sort) {
        case SearchCardsSort.Latest:
          orderBy = desc(cards.created_at);
          break;
        case SearchCardsSort.Oldest:
          orderBy = cards.created_at;
          break;
        case SearchCardsSort.TitleAtoZ:
          orderBy = cards.title;
          break;
        case SearchCardsSort.TitleZtoA:
          orderBy = desc(cards.title);
          break;
        default:
          orderBy = cards.id;
          break;
      }

      // Select cards
      const rows = await db
        .select()
        .from(cards)
        .leftJoin(characterCards, eq(characterCards.id, cards.id))
        .leftJoin(plotCards, eq(plotCards.id, cards.id))
        .where(and(...filters))
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(orderBy);

      // Convert rows to entities
      const entities = rows.map((row) =>
        CardDrizzleMapper.toDomain({
          common: row.cards,
          character: row.character_cards ?? undefined,
          plot: row.plot_cards ?? undefined,
        }),
      );

      // Return cards
      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to search cards", error);
    }
  }

  async deleteCardById(
    id: UniqueEntityID,
    tx?: Transaction,
  ): Promise<Result<Card>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Delete card by id
      const deletedCommonRow = await db
        .delete(cards)
        .where(eq(cards.id, id.toString()))
        .returning()
        .then(getOneOrThrow);
      const deletedRow: SelectCard = {
        common: deletedCommonRow,
      };

      // Delete each type
      if (deletedCommonRow.type === CardType.Character) {
        const deletedCharacterRow = await db
          .delete(characterCards)
          .where(eq(characterCards.id, id.toString()))
          .returning()
          .then(getOneOrThrow);
        deletedRow.character = deletedCharacterRow;
      } else if (deletedCommonRow.type === CardType.Plot) {
        const deletedPlotRow = await db
          .delete(plotCards)
          .where(eq(plotCards.id, id.toString()))
          .returning()
          .then(getOneOrThrow);
        deletedRow.plot = deletedPlotRow;
      }

      // Update local sync metadata
      // await this.updateLocalSyncMetadata.execute({
      //   tableName: TableName.Cards,
      //   entityId: deletedRow.common.id,
      //   updatedAt: null,
      // });

      // Return result
      return Result.ok(CardDrizzleMapper.toDomain(deletedRow));
    } catch (error) {
      return formatFail("Failed to delete card by id", error);
    }
  }
}
