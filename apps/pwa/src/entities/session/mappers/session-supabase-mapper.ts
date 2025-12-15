import { Result } from "@/shared/core/result";
import { UniqueEntityID } from "@/shared/domain";
import { SessionCloudData } from "@/shared/lib/cloud-upload-helpers";
import { AutoReply } from "@/shared/stores/session-store";

import { CardType } from "@/entities/card/domain";
import { Session } from "@/entities/session/domain";
import { TranslationConfig } from "@/entities/session/domain/translation-config";
import { SessionDrizzleMapper } from "./session-drizzle-mapper";

/**
 * Mapper for converting between Session domain entities and Supabase cloud data format.
 *
 * Naming conventions:
 * - Cloud/Supabase: snake_case (e.g., all_cards, user_character_card_id)
 * - Domain: camelCase (e.g., allCards, userCharacterCardId)
 *
 * Note: During import, IDs are remapped using the provided cardIdMap and flowId.
 * The original cloud IDs are only used to fetch related resources.
 */
export class SessionSupabaseMapper {
  private constructor() {}

  // ============================================
  // Session: Cloud → Domain
  // ============================================

  /**
   * Convert session cloud data to domain entity.
   * Note: Always generates a new ID for imports to avoid conflicts.
   *
   * @param data Cloud data from Supabase
   * @param cardIdMap Map of original card IDs to new local card IDs
   * @param backgroundId Optional local background entity ID
   * @param coverId Optional local cover asset ID
   * @param flowId Optional local flow ID
   */
  public static fromCloud(
    data: SessionCloudData,
    cardIdMap: Map<string, UniqueEntityID>,
    backgroundId?: UniqueEntityID,
    coverId?: UniqueEntityID,
    flowId?: UniqueEntityID,
  ): Result<Session> {
    // Parse all_cards with remapped IDs
    const allCards = (data.all_cards ?? []).map((cardJson: any) => ({
      id: cardIdMap.get(cardJson.id) ?? new UniqueEntityID(cardJson.id),
      type: cardJson.type as CardType,
      enabled: cardJson.enabled,
    }));

    // Remap user character card ID
    const userCharacterCardId = data.user_character_card_id
      ? cardIdMap.get(data.user_character_card_id)
      : undefined;

    // Parse translation config if present
    let translation: TranslationConfig | undefined;
    if (data.translation) {
      const translationResult = TranslationConfig.fromJSON(data.translation);
      if (translationResult.isSuccess) {
        translation = translationResult.getValue();
      }
    }

    return Session.create(
      {
        title: data.title,
        name: data.name ?? undefined,
        tags: data.tags ?? [],
        summary: data.summary ?? undefined,
        allCards,
        userCharacterCardId,
        turnIds: [], // Turns are not imported - start fresh
        backgroundId,
        coverId,
        translation,
        chatStyles: data.chat_styles ?? undefined,
        flowId,
        autoReply: (data.auto_reply as AutoReply) ?? AutoReply.Off,
        dataSchemaOrder: data.data_schema_order ?? [],
        widgetLayout: data.widget_layout ?? undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      undefined, // Always generate new ID for imports
    );
  }

  // ============================================
  // Session: Domain → Cloud
  // ============================================

  /**
   * Convert session domain entity to cloud data format.
   *
   * @param session Session to convert
   * @param backgroundAssetId Optional background asset ID (resolved from Background entity)
   */
  public static toCloud(
    session: Session,
    backgroundAssetId?: string | null,
  ): SessionCloudData {
    // Use drizzle mapper to get persistence format
    const persistenceData = SessionDrizzleMapper.toPersistence(session);

    // Extract fields from persistence data
    const {
      id,
      title,
      name,
      all_cards,
      user_character_card_id,
      turn_ids,
      translation,
      chat_styles,
      flow_id,
      auto_reply,
      data_schema_order,
      widget_layout,
      tags,
      summary,
    } = persistenceData as any;

    return {
      id,
      title,
      name,
      all_cards,
      user_character_card_id,
      turn_ids,
      background_id: backgroundAssetId ?? null, // Use resolved asset ID
      cover_id: session.props.coverId?.toString() || null, // Cover is already an asset ID
      translation,
      chat_styles,
      flow_id,
      auto_reply,
      data_schema_order,
      widget_layout,
      tags,
      summary,
      is_public: true,
      owner_id: null,
      created_at: session.props.createdAt.toISOString(),
      updated_at: session.props.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}
