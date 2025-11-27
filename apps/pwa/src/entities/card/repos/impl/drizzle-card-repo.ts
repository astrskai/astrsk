import { and, asc, desc, eq, gt, ilike, inArray, or, SQL } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { cards, SelectCard } from "@/db/schema/cards";
import { characterCards } from "@/db/schema/character-cards";
import { plotCards } from "@/db/schema/plot-cards";
import { TableName } from "@/db/schema/table-name";
import { Transaction } from "@/db/transaction";
import { Card, CardType, CharacterCard, PlotCard } from "@/entities/card/domain";
import { LorebookJSON } from "@/entities/card/domain/lorebook";
import { CardDrizzleMapper } from "@/entities/card/mappers/card-drizzle-mapper";
import { DeleteCardRepo } from "@/entities/card/repos/delete-card-repo";
import {
  LoadCardRepo,
  SearchCardsQuery,
  SearchCardsSort,
  SearchCharactersQuery,
  SearchScenariosQuery,
} from "@/entities/card/repos/load-card-repo";
import { SaveCardRepo } from "@/entities/card/repos/save-card-repo";
// import { UpdateLocalSyncMetadata } from "@/entities/sync/usecases/update-local-sync-metadata";

export class DrizzleCardRepo
  implements SaveCardRepo, LoadCardRepo, DeleteCardRepo
{
  // constructor(private updateLocalSyncMetadata: UpdateLocalSyncMetadata) {}

  async updateCardTitle(cardId: UniqueEntityID, title: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(cards)
        .set({ title, updated_at: new Date() })
        .where(eq(cards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card title: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardSummary(cardId: UniqueEntityID, summary: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(cards)
        .set({ card_summary: summary, updated_at: new Date() })
        .where(eq(cards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card summary: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardVersion(cardId: UniqueEntityID, version: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(cards)
        .set({ version, updated_at: new Date() })
        .where(eq(cards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card version: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardConceptualOrigin(cardId: UniqueEntityID, conceptualOrigin: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(cards)
        .set({ conceptual_origin: conceptualOrigin, updated_at: new Date() })
        .where(eq(cards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card conceptual origin: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardCreator(cardId: UniqueEntityID, creator: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(cards)
        .set({ creator, updated_at: new Date() })
        .where(eq(cards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card creator: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardTags(cardId: UniqueEntityID, tags: string[]): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(cards)
        .set({ tags, updated_at: new Date() })
        .where(eq(cards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card tags: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardLorebook(cardId: UniqueEntityID, lorebook: LorebookJSON): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // First check if it's a character card or plot card
      const cardRow = await db
        .select({ type: cards.type })
        .from(cards)
        .where(eq(cards.id, cardId.toString()))
        .then(getOneOrThrow);

      if (cardRow.type === "character") {
        await db
          .update(characterCards)
          .set({ lorebook, updated_at: new Date() })
          .where(eq(characterCards.id, cardId.toString()));
      } else if (cardRow.type === "plot") {
        await db
          .update(plotCards)
          .set({ lorebook, updated_at: new Date() })
          .where(eq(plotCards.id, cardId.toString()));
      } else {
        return Result.fail(`Card type ${cardRow.type} does not support lorebook`);
      }
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card lorebook: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardScenarios(cardId: UniqueEntityID, scenarios: any[]): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // Scenarios only exist on plot cards
      await db
        .update(plotCards)
        .set({ scenarios, updated_at: new Date() })
        .where(eq(plotCards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card scenarios: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardIconAssetId(cardId: UniqueEntityID, iconAssetId: UniqueEntityID | null): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(cards)
        .set({ 
          icon_asset_id: iconAssetId ? iconAssetId.toString() : null, 
          updated_at: new Date() 
        })
        .where(eq(cards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card icon asset: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCharacterName(cardId: UniqueEntityID, name: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(characterCards)
        .set({ name, updated_at: new Date() })
        .where(eq(characterCards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update character name: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCharacterDescription(cardId: UniqueEntityID, description: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(characterCards)
        .set({ description, updated_at: new Date() })
        .where(eq(characterCards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update character description: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCharacterExampleDialogue(cardId: UniqueEntityID, exampleDialogue: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(characterCards)
        .set({ example_dialogue: exampleDialogue, updated_at: new Date() })
        .where(eq(characterCards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update character example dialogue: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updatePlotDescription(cardId: UniqueEntityID, description: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await db
        .update(plotCards)
        .set({ description, updated_at: new Date() })
        .where(eq(plotCards.id, cardId.toString()));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update plot description: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async saveCard(card: Card, tx?: Transaction): Promise<Result<Card>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row
      const row = CardDrizzleMapper.toPersistence(card);

      // Insert or update card
      const { created_at, ...commonWithoutCreatedAt } = row.common;
      const savedRow: SelectCard = {
        common: await db
          .insert(cards)
          .values(row.common)
          .onConflictDoUpdate({
            target: cards.id,
            set: {
              ...commonWithoutCreatedAt,
              updated_at: new Date(), // Update timestamp on conflict
            },
          })
          .returning()
          .then(getOneOrThrow),
      };

      // Insert or update each type
      if (row.character) {
        // Character card
        const { created_at: _c, ...characterWithoutCreatedAt } = row.character;
        const savedCharacterRow = await db
          .insert(characterCards)
          .values(row.character)
          .onConflictDoUpdate({
            target: characterCards.id,
            set: {
              ...characterWithoutCreatedAt,
              updated_at: new Date(), // Update timestamp on conflict
            },
          })
          .returning()
          .then(getOneOrThrow);
        savedRow.character = savedCharacterRow;
      } else if (row.plot) {
        // Plot card
        const { created_at: _p, ...plotWithoutCreatedAt } = row.plot;
        const savedPlotRow = await db
          .insert(plotCards)
          .values(row.plot)
          .onConflictDoUpdate({
            target: plotCards.id,
            set: {
              ...plotWithoutCreatedAt,
              updated_at: new Date(), // Update timestamp on conflict
            },
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

  /**
   * Optimized character search - only JOINs characterCards table
   * and searches only character-specific fields
   */
  async searchCharacters(
    query: SearchCharactersQuery,
    tx?: Transaction,
  ): Promise<Result<CharacterCard[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Build filters
      const filters: SQL[] = [eq(cards.type, CardType.Character)];

      if (query.keyword) {
        const keywordFilter = or(
          // Common card fields
          ilike(cards.title, `%${query.keyword}%`),
          ilike(cards.creator, `%${query.keyword}%`),
          ilike(cards.card_summary, `%${query.keyword}%`),
          // Character-specific fields only
          ilike(characterCards.name, `%${query.keyword}%`),
          ilike(characterCards.description, `%${query.keyword}%`),
          ilike(characterCards.example_dialogue, `%${query.keyword}%`),
        );
        if (keywordFilter) filters.push(keywordFilter);
      }

      // Build order by
      let orderBy: PgColumn | SQL;
      switch (query.sort) {
        case SearchCardsSort.Latest:
          orderBy = desc(cards.created_at);
          break;
        case SearchCardsSort.Oldest:
          orderBy = asc(cards.created_at);
          break;
        case SearchCardsSort.TitleAtoZ:
          orderBy = asc(cards.title);
          break;
        case SearchCardsSort.TitleZtoA:
          orderBy = desc(cards.title);
          break;
        default:
          orderBy = desc(cards.created_at);
          break;
      }

      // Single JOIN - characterCards only
      const rows = await db
        .select()
        .from(cards)
        .innerJoin(characterCards, eq(characterCards.id, cards.id))
        .where(and(...filters))
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(orderBy);

      // Convert to domain entities
      const entities = rows.map((row) => {
        const card = CardDrizzleMapper.toDomain({
          common: row.cards,
          character: row.character_cards,
        });
        return card as CharacterCard;
      });

      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to search characters", error);
    }
  }

  /**
   * Optimized scenario search - only JOINs plotCards table
   * and searches only scenario-specific fields
   */
  async searchScenarios(
    query: SearchScenariosQuery,
    tx?: Transaction,
  ): Promise<Result<PlotCard[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Build filters
      const filters: SQL[] = [eq(cards.type, CardType.Plot)];

      if (query.keyword) {
        const keywordFilter = or(
          // Common card fields
          ilike(cards.title, `%${query.keyword}%`),
          ilike(cards.creator, `%${query.keyword}%`),
          ilike(cards.card_summary, `%${query.keyword}%`),
          // Scenario-specific fields only
          ilike(plotCards.description, `%${query.keyword}%`),
        );
        if (keywordFilter) filters.push(keywordFilter);
      }

      // Build order by
      let orderBy: PgColumn | SQL;
      switch (query.sort) {
        case SearchCardsSort.Latest:
          orderBy = desc(cards.created_at);
          break;
        case SearchCardsSort.Oldest:
          orderBy = asc(cards.created_at);
          break;
        case SearchCardsSort.TitleAtoZ:
          orderBy = asc(cards.title);
          break;
        case SearchCardsSort.TitleZtoA:
          orderBy = desc(cards.title);
          break;
        default:
          orderBy = desc(cards.created_at);
          break;
      }

      // Single JOIN - plotCards only (scenarios use plotCards table)
      const rows = await db
        .select()
        .from(cards)
        .innerJoin(plotCards, eq(plotCards.id, cards.id))
        .where(and(...filters))
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(orderBy);

      // Convert to domain entities
      const entities = rows.map((row) => {
        const card = CardDrizzleMapper.toDomain({
          common: row.cards,
          plot: row.plot_cards,
        });
        return card as PlotCard;
      });

      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to search scenarios", error);
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
