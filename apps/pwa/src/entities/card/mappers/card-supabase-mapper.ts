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
  Card,
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
    // Use drizzle mapper to get persistence format, then convert to cloud format
    const persistenceData = CardDrizzleMapper.toPersistence(card);

    // Extract fields from persistence data
    const {
      id,
      title,
      tags,
      creator,
      card_summary,
      version,
      conceptual_origin,
      vibe_session_id,
      image_prompt,
      name,
      description,
      lorebook,
    } = persistenceData as any;

    const { example_dialogue } = persistenceData as any;

    return {
      id,
      title,
      icon_asset_id: card.props.iconAssetId?.toString() || null,
      tags,
      creator,
      card_summary,
      version,
      conceptual_origin,
      vibe_session_id,
      image_prompt,
      name,
      description,
      example_dialogue,
      lorebook,
      token_count: card.props.tokenCount || 0,
      session_id: sessionId?.toString() || null,
      is_public: false,
      owner_id: null,
      created_at: card.props.createdAt.toISOString(),
      updated_at: card.props.updatedAt?.toISOString() || new Date().toISOString(),
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
    // Use drizzle mapper to get persistence format
    const persistenceData = CardDrizzleMapper.toPersistence(card);

    // Extract fields from persistence data
    const {
      id,
      title,
      tags,
      creator,
      card_summary,
      version,
      conceptual_origin,
      vibe_session_id,
      image_prompt,
      name,
      description,
      lorebook,
    } = persistenceData as any;

    // Handle PlotCard → ScenarioCard migration
    // PlotCard has 'scenarios' field, ScenarioCard has 'first_messages' field
    let first_messages;
    if (card instanceof PlotCard) {
      // Migrate: PlotCard.scenarios → ScenarioCard.first_messages
      first_messages = (persistenceData as any).scenarios ?? [];
    } else {
      // ScenarioCard: use first_messages directly
      first_messages = (persistenceData as any).first_messages ?? [];
    }

    return {
      id,
      title,
      icon_asset_id: card.props.iconAssetId?.toString() || null,
      tags,
      creator,
      card_summary,
      version,
      conceptual_origin,
      vibe_session_id,
      image_prompt,
      name,
      description,
      first_messages,
      lorebook,
      token_count: card.props.tokenCount || 0,
      session_id: sessionId?.toString() || null,
      is_public: false,
      owner_id: null,
      created_at: card.props.createdAt.toISOString(),
      updated_at: card.props.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
