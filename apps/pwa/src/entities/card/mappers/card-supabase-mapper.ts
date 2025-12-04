import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import {
  CharacterCloudData,
  ScenarioCloudData,
} from "@/shared/lib/cloud-upload-helpers";

import {
  CardType,
  CharacterCard,
  ScenarioCard,
  PlotCard,
} from "@/entities/card/domain";
import { Lorebook } from "@/entities/card/domain/lorebook";
import { CardDrizzleMapper } from "./card-drizzle-mapper";

/**
 * Mapper for converting between Card domain entities and Supabase cloud data format.
 *
 * Naming conventions:
 * - Cloud/Supabase: snake_case (e.g., icon_asset_id, card_summary)
 * - Domain: camelCase (e.g., iconAssetId, cardSummary)
 *
 * Note: IDs are always remapped during import (new UUIDs generated).
 * The original cloud ID is only used to fetch related resources.
 */
export class CardSupabaseMapper {
  private constructor() {}

  // ============================================
  // Character: Cloud → Domain
  // ============================================

  /**
   * Convert character cloud data to domain entity props.
   * Note: Always generates a new ID for imports to avoid conflicts.
   *
   * @param data Cloud data from Supabase
   * @param iconAssetId Optional local asset ID (if icon was imported separately)
   * @param sessionId Optional session ID to associate the card with
   */
  public static characterFromCloud(
    data: CharacterCloudData,
    iconAssetId?: UniqueEntityID,
    sessionId?: UniqueEntityID,
  ): Result<CharacterCard> {
    // Parse lorebook if present
    let lorebook: Lorebook | undefined;
    if (data.lorebook) {
      const lorebookResult = Lorebook.fromJSON(data.lorebook);
      if (lorebookResult.isSuccess) {
        lorebook = lorebookResult.getValue();
      }
    }

    return CharacterCard.create(
      {
        iconAssetId,
        title: data.title,
        name: data.name,
        type: CardType.Character,
        tags: data.tags ?? [],
        creator: data.creator ?? undefined,
        cardSummary: data.card_summary ?? undefined,
        version: data.version ?? undefined,
        conceptualOrigin: data.conceptual_origin ?? undefined,
        vibeSessionId: data.vibe_session_id ?? undefined,
        imagePrompt: data.image_prompt ?? undefined,
        description: data.description ?? undefined,
        exampleDialogue: data.example_dialogue ?? undefined,
        lorebook,
        sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined, // Always generate new ID for imports
    );
  }

  // ============================================
  // Character: Domain → Cloud
  // ============================================

  /**
   * Convert character domain entity to cloud data format.
   *
   * @param card Character card to convert
   * @param sessionId Optional session ID for session-bound exports
   */
  public static characterToCloud(
    card: CharacterCard,
    sessionId?: UniqueEntityID | null,
  ): CharacterCloudData {
    // Use type-safe drizzle mapper to get persistence format
    const persistenceData = CardDrizzleMapper.characterToPersistence(card);

    return {
      id: persistenceData.id,
      title: persistenceData.title,
      icon_asset_id: persistenceData.icon_asset_id ?? null,
      tags: persistenceData.tags ?? [],
      creator: persistenceData.creator ?? null,
      card_summary: persistenceData.card_summary ?? null,
      version: persistenceData.version ?? null,
      conceptual_origin: persistenceData.conceptual_origin ?? null,
      vibe_session_id: persistenceData.vibe_session_id ?? null,
      image_prompt: persistenceData.image_prompt ?? null,
      name: persistenceData.name,
      description: persistenceData.description ?? null,
      example_dialogue: persistenceData.example_dialogue ?? null,
      lorebook: persistenceData.lorebook ?? null,
      token_count: card.props.tokenCount || 0,
      session_id: sessionId?.toString() ?? null,
      is_public: true,
      owner_id: null,
      created_at: card.props.createdAt.toISOString(),
      updated_at: card.props.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  // ============================================
  // Scenario: Cloud → Domain
  // ============================================

  /**
   * Convert scenario cloud data to domain entity props.
   * Note: Always generates a new ID for imports to avoid conflicts.
   *
   * @param data Cloud data from Supabase
   * @param iconAssetId Optional local asset ID (if icon was imported separately)
   * @param sessionId Optional session ID to associate the card with
   */
  public static scenarioFromCloud(
    data: ScenarioCloudData,
    iconAssetId?: UniqueEntityID,
    sessionId?: UniqueEntityID,
  ): Result<ScenarioCard> {
    // Parse lorebook if present
    let lorebook: Lorebook | undefined;
    if (data.lorebook) {
      const lorebookResult = Lorebook.fromJSON(data.lorebook);
      if (lorebookResult.isSuccess) {
        lorebook = lorebookResult.getValue();
      }
    }

    return ScenarioCard.create(
      {
        iconAssetId,
        title: data.title,
        name: data.name,
        type: CardType.Scenario,
        tags: data.tags ?? [],
        creator: data.creator ?? undefined,
        cardSummary: data.card_summary ?? undefined,
        version: data.version ?? undefined,
        conceptualOrigin: data.conceptual_origin ?? undefined,
        vibeSessionId: data.vibe_session_id ?? undefined,
        imagePrompt: data.image_prompt ?? undefined,
        description: data.description ?? undefined,
        firstMessages: data.first_messages ?? [],
        lorebook,
        sessionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined, // Always generate new ID for imports
    );
  }

  // ============================================
  // Scenario: Domain → Cloud
  // ============================================

  /**
   * Convert scenario domain entity to cloud data format.
   * Also handles PlotCard → ScenarioCard migration during export.
   *
   * @param card Scenario or Plot card to convert
   * @param sessionId Optional session ID for session-bound exports
   */
  public static scenarioToCloud(
    card: ScenarioCard | PlotCard,
    sessionId?: UniqueEntityID | null,
  ): ScenarioCloudData {
    // Handle PlotCard → ScenarioCard migration
    // PlotCard has 'scenarios' field, ScenarioCard has 'firstMessages' field
    let first_messages: { name: string; description: string }[] | null;
    let name: string;

    if (card instanceof PlotCard) {
      // Migrate: PlotCard.scenarios → ScenarioCard.first_messages
      // PlotCard doesn't have 'name' field, use title as fallback
      first_messages = card.props.scenarios ?? [];
      name = card.props.title;
    } else {
      // ScenarioCard: use firstMessages directly
      const persistenceData = CardDrizzleMapper.scenarioToPersistence(card);
      first_messages = persistenceData.first_messages ?? [];
      name = persistenceData.name;
    }

    return {
      id: card.id.toString(),
      title: card.props.title,
      icon_asset_id: card.props.iconAssetId?.toString() ?? null,
      tags: card.props.tags ?? [],
      creator: card.props.creator ?? null,
      card_summary: card.props.cardSummary ?? null,
      version: card.props.version ?? null,
      conceptual_origin: card.props.conceptualOrigin ?? null,
      vibe_session_id: card.props.vibeSessionId ?? null,
      image_prompt: card.props.imagePrompt ?? null,
      name,
      description: card.props.description ?? null,
      first_messages,
      lorebook: card.props.lorebook?.toJSON() ?? null,
      token_count: card.props.tokenCount || 0,
      session_id: sessionId?.toString() ?? null,
      is_public: true,
      owner_id: null,
      created_at: card.props.createdAt.toISOString(),
      updated_at: card.props.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }
}
