import { and, asc, eq, gt, ilike, isNull, or } from "drizzle-orm";

import { Result } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail } from "@/shared/lib";

import { Drizzle } from "@/db/drizzle";
import { getOneOrThrow } from "@/db/helpers/get-one-or-throw";
import { characters, SelectCharacter } from "@/db/schema/characters";
import { scenarios, SelectScenario } from "@/db/schema/scenarios";
import { Transaction } from "@/db/transaction";
import { Card, CardType, CharacterCard, PlotCard, normalizeCardType } from "@/entities/card/domain";
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

export class DrizzleCardRepo
  implements SaveCardRepo, LoadCardRepo, DeleteCardRepo
{
  async updateCardTitle(cardId: UniqueEntityID, title: string): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // Update in both tables (try both, one will succeed)
      await Promise.all([
        db
          .update(characters)
          .set({ title, updated_at: new Date() })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({ title, updated_at: new Date() })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

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
      await Promise.all([
        db
          .update(characters)
          .set({ card_summary: summary, updated_at: new Date() })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({ card_summary: summary, updated_at: new Date() })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

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
      await Promise.all([
        db
          .update(characters)
          .set({ version, updated_at: new Date() })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({ version, updated_at: new Date() })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

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
      await Promise.all([
        db
          .update(characters)
          .set({ conceptual_origin: conceptualOrigin, updated_at: new Date() })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({ conceptual_origin: conceptualOrigin, updated_at: new Date() })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

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
      await Promise.all([
        db
          .update(characters)
          .set({ creator, updated_at: new Date() })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({ creator, updated_at: new Date() })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

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
      await Promise.all([
        db
          .update(characters)
          .set({ tags, updated_at: new Date() })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({ tags, updated_at: new Date() })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

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
      // Try updating both tables (one will succeed)
      await Promise.all([
        db
          .update(characters)
          .set({ lorebook, updated_at: new Date() })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({ lorebook, updated_at: new Date() })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card lorebook: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardScenarios(cardId: UniqueEntityID, firstMessages: any[]): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      // Scenarios only exist on scenario cards (first_messages field)
      await db
        .update(scenarios)
        .set({ first_messages: firstMessages, updated_at: new Date() })
        .where(eq(scenarios.id, cardId.toString()));

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update card first messages: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async updateCardIconAssetId(cardId: UniqueEntityID, iconAssetId: UniqueEntityID | null): Promise<Result<void>> {
    const db = await Drizzle.getInstance();
    try {
      await Promise.all([
        db
          .update(characters)
          .set({
            icon_asset_id: iconAssetId ? iconAssetId.toString() : null,
            updated_at: new Date()
          })
          .where(eq(characters.id, cardId.toString())),
        db
          .update(scenarios)
          .set({
            icon_asset_id: iconAssetId ? iconAssetId.toString() : null,
            updated_at: new Date()
          })
          .where(eq(scenarios.id, cardId.toString())),
      ]);

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
        .update(characters)
        .set({ name, updated_at: new Date() })
        .where(eq(characters.id, cardId.toString()));

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
        .update(characters)
        .set({ description, updated_at: new Date() })
        .where(eq(characters.id, cardId.toString()));

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
        .update(characters)
        .set({ example_dialogue: exampleDialogue, updated_at: new Date() })
        .where(eq(characters.id, cardId.toString()));

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
        .update(scenarios)
        .set({ description, updated_at: new Date() })
        .where(eq(scenarios.id, cardId.toString()));

      return Result.ok();
    } catch (error) {
      return Result.fail(
        `Failed to update scenario description: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async saveCard(card: Card, tx?: Transaction): Promise<Result<Card>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Convert to row using mapper
      const row = CardDrizzleMapper.toPersistence(card);

      // Determine which table to insert into
      const cardType = normalizeCardType(card.props.type);

      if (cardType === CardType.Character) {
        // Insert/update character
        const { created_at, ...rowWithoutCreatedAt } = row;
        const savedRow = await db
          .insert(characters)
          .values(row)
          .onConflictDoUpdate({
            target: characters.id,
            set: {
              ...rowWithoutCreatedAt,
              updated_at: new Date(),
            },
          })
          .returning()
          .then(getOneOrThrow);

        return Result.ok(CardDrizzleMapper.toDomain(savedRow));
      } else if (cardType === CardType.Scenario) {
        // Insert/update scenario
        const { created_at, ...rowWithoutCreatedAt } = row;
        const savedRow = await db
          .insert(scenarios)
          .values(row)
          .onConflictDoUpdate({
            target: scenarios.id,
            set: {
              ...rowWithoutCreatedAt,
              updated_at: new Date(),
            },
          })
          .returning()
          .then(getOneOrThrow);

        return Result.ok(CardDrizzleMapper.toDomain(savedRow));
      } else {
        throw new Error(`Unknown card type: ${cardType}`);
      }
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
      // Query both tables separately - only global cards (session_id IS NULL)
      const [characterRows, scenarioRows] = await Promise.all([
        db
          .select()
          .from(characters)
          .where(
            and(
              isNull(characters.session_id), // Only show global resources
              cursor ? gt(characters.id, cursor.toString()) : undefined
            )
          )
          .limit(pageSize)
          .orderBy(asc(characters.id)),
        db
          .select()
          .from(scenarios)
          .where(
            and(
              isNull(scenarios.session_id), // Only show global resources
              cursor ? gt(scenarios.id, cursor.toString()) : undefined
            )
          )
          .limit(pageSize)
          .orderBy(asc(scenarios.id)),
      ]);

      // Combine and sort by ID
      const allRows = [...characterRows, ...scenarioRows].sort((a, b) =>
        a.id.localeCompare(b.id)
      );

      // Take only pageSize items
      const limitedRows = allRows.slice(0, pageSize);

      // Convert to domain entities
      const entities = limitedRows.map((row) => CardDrizzleMapper.toDomain(row));

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
      // Try characters table first
      const characterRows = await db
        .select()
        .from(characters)
        .where(eq(characters.id, id.toString()));

      if (characterRows.length > 0) {
        return Result.ok(CardDrizzleMapper.toDomain(characterRows[0]));
      }

      // Try scenarios table
      const scenarioRows = await db
        .select()
        .from(scenarios)
        .where(eq(scenarios.id, id.toString()));

      if (scenarioRows.length > 0) {
        return Result.ok(CardDrizzleMapper.toDomain(scenarioRows[0]));
      }

      return Result.fail(`Card not found with id: ${id.toString()}`);
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
      // Build filters for characters
      const characterFilters = [];
      // Only show global resources (session_id IS NULL)
      characterFilters.push(isNull(characters.session_id));

      if (query.keyword) {
        const keywordFilter = or(
          ilike(characters.title, `%${query.keyword}%`),
          ilike(characters.creator, `%${query.keyword}%`),
          ilike(characters.card_summary, `%${query.keyword}%`),
          ilike(characters.version, `%${query.keyword}%`),
          ilike(characters.conceptual_origin, `%${query.keyword}%`),
          ilike(characters.name, `%${query.keyword}%`),
          ilike(characters.description, `%${query.keyword}%`),
          ilike(characters.example_dialogue, `%${query.keyword}%`),
        );
        keywordFilter && characterFilters.push(keywordFilter);
      }

      // Build filters for scenarios
      const scenarioFilters = [];
      // Only show global resources (session_id IS NULL)
      scenarioFilters.push(isNull(scenarios.session_id));

      if (query.keyword) {
        const keywordFilter = or(
          ilike(scenarios.title, `%${query.keyword}%`),
          ilike(scenarios.creator, `%${query.keyword}%`),
          ilike(scenarios.card_summary, `%${query.keyword}%`),
          ilike(scenarios.version, `%${query.keyword}%`),
          ilike(scenarios.conceptual_origin, `%${query.keyword}%`),
          ilike(scenarios.name, `%${query.keyword}%`),
          ilike(scenarios.description, `%${query.keyword}%`),
        );
        keywordFilter && scenarioFilters.push(keywordFilter);
      }

      // Determine which tables to query based on type filter
      const shouldQueryCharacters =
        !query.type ||
        query.type.length === 0 ||
        query.type.includes(CardType.Character);
      const shouldQueryScenarios =
        !query.type ||
        query.type.length === 0 ||
        query.type.includes(CardType.Scenario) ||
        query.type.includes(CardType.Plot); // Backward compatibility

      // Query tables in parallel
      const queries = [];
      if (shouldQueryCharacters) {
        queries.push(
          db
            .select()
            .from(characters)
            .where(characterFilters.length > 0 ? and(...characterFilters) : undefined)
            .limit(query.limit ?? 100)
            .offset(query.offset ?? 0)
        );
      }
      if (shouldQueryScenarios) {
        queries.push(
          db
            .select()
            .from(scenarios)
            .where(scenarioFilters.length > 0 ? and(...scenarioFilters) : undefined)
            .limit(query.limit ?? 100)
            .offset(query.offset ?? 0)
        );
      }

      const results = await Promise.all(queries);
      let allRows: (SelectCharacter | SelectScenario)[] = results.flat();

      // Sort combined results
      switch (query.sort) {
        case SearchCardsSort.Latest:
          allRows.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
          break;
        case SearchCardsSort.Oldest:
          allRows.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
          break;
        case SearchCardsSort.TitleAtoZ:
          allRows.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case SearchCardsSort.TitleZtoA:
          allRows.sort((a, b) => b.title.localeCompare(a.title));
          break;
        default:
          allRows.sort((a, b) => a.id.localeCompare(b.id));
          break;
      }

      // Apply limit and offset to combined results
      const limitedRows = allRows.slice(
        query.offset ?? 0,
        (query.offset ?? 0) + (query.limit ?? 100)
      );

      // Convert to domain entities
      const entities = limitedRows.map((row: SelectCharacter | SelectScenario) =>
        CardDrizzleMapper.toDomain(row)
      );

      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to search cards", error);
    }
  }

  /**
   * Optimized character search - searches characters table only
   */
  async searchCharacters(
    query: SearchCharactersQuery,
    tx?: Transaction,
  ): Promise<Result<CharacterCard[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Build filters - only global resources (session_id IS NULL)
      const filters = [isNull(characters.session_id)];

      if (query.keyword) {
        const keywordFilter = or(
          ilike(characters.title, `%${query.keyword}%`),
          ilike(characters.creator, `%${query.keyword}%`),
          ilike(characters.card_summary, `%${query.keyword}%`),
          ilike(characters.name, `%${query.keyword}%`),
          ilike(characters.description, `%${query.keyword}%`),
          ilike(characters.example_dialogue, `%${query.keyword}%`),
        );
        if (keywordFilter) filters.push(keywordFilter);
      }

      // Build order by
      let orderByClause;
      switch (query.sort) {
        case SearchCardsSort.Latest:
          orderByClause = [characters.created_at];
          break;
        case SearchCardsSort.Oldest:
          orderByClause = [asc(characters.created_at)];
          break;
        case SearchCardsSort.TitleAtoZ:
          orderByClause = [asc(characters.title)];
          break;
        case SearchCardsSort.TitleZtoA:
          orderByClause = [characters.title];
          break;
        default:
          orderByClause = [characters.created_at];
          break;
      }

      const rows = await db
        .select()
        .from(characters)
        .where(and(...filters))
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(...orderByClause);

      // Convert to domain entities
      const entities = rows.map((row) => CardDrizzleMapper.toDomain(row) as CharacterCard);

      return Result.ok(entities);
    } catch (error) {
      return formatFail("Failed to search characters", error);
    }
  }

  /**
   * Optimized scenario search - searches scenarios table only
   */
  async searchScenarios(
    query: SearchScenariosQuery,
    tx?: Transaction,
  ): Promise<Result<PlotCard[]>> {
    const db = tx ?? (await Drizzle.getInstance());
    try {
      // Build filters - only global resources (session_id IS NULL)
      const filters = [isNull(scenarios.session_id)];

      if (query.keyword) {
        const keywordFilter = or(
          ilike(scenarios.title, `%${query.keyword}%`),
          ilike(scenarios.creator, `%${query.keyword}%`),
          ilike(scenarios.card_summary, `%${query.keyword}%`),
          ilike(scenarios.description, `%${query.keyword}%`),
        );
        if (keywordFilter) filters.push(keywordFilter);
      }

      // Build order by
      let orderByClause;
      switch (query.sort) {
        case SearchCardsSort.Latest:
          orderByClause = [scenarios.created_at];
          break;
        case SearchCardsSort.Oldest:
          orderByClause = [asc(scenarios.created_at)];
          break;
        case SearchCardsSort.TitleAtoZ:
          orderByClause = [asc(scenarios.title)];
          break;
        case SearchCardsSort.TitleZtoA:
          orderByClause = [scenarios.title];
          break;
        default:
          orderByClause = [scenarios.created_at];
          break;
      }

      const rows = await db
        .select()
        .from(scenarios)
        .where(and(...filters))
        .limit(query.limit ?? 100)
        .offset(query.offset ?? 0)
        .orderBy(...orderByClause);

      // Convert to domain entities
      const entities = rows.map((row) => CardDrizzleMapper.toDomain(row) as PlotCard);

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
      // Try deleting from characters table first
      const deletedCharacterRows = await db
        .delete(characters)
        .where(eq(characters.id, id.toString()))
        .returning();

      if (deletedCharacterRows.length > 0) {
        return Result.ok(CardDrizzleMapper.toDomain(deletedCharacterRows[0]));
      }

      // Try deleting from scenarios table
      const deletedScenarioRows = await db
        .delete(scenarios)
        .where(eq(scenarios.id, id.toString()))
        .returning();

      if (deletedScenarioRows.length > 0) {
        return Result.ok(CardDrizzleMapper.toDomain(deletedScenarioRows[0]));
      }

      return Result.fail(`Card not found with id: ${id.toString()}`);
    } catch (error) {
      return formatFail("Failed to delete card by id", error);
    }
  }
}
