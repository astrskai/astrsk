import JSZip from "jszip";
import { pick } from "lodash-es";
import { file } from "opfs-tools";

import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { formatFail, sanitizeFileName } from "@/shared/lib";

import { defaultBackgrounds } from "@/shared/stores/background-store";
import { GetAsset } from "@/entities/asset/usecases/get-asset";
import { GetBackground } from "@/entities/background/usecases/get-background";
import { ExportCardToFile } from "@/entities/card/usecases";
import { ExportFlowWithNodes } from "@/entities/flow/usecases/export-flow-with-nodes";
import { ModelTier } from "@/entities/agent/domain/agent";
import { Session } from "@/entities/session/domain";
import { SessionDrizzleMapper } from "@/entities/session/mappers/session-drizzle-mapper";
import { LoadSessionRepo } from "@/entities/session/repos";
import { TurnDrizzleMapper } from "@/entities/turn/mappers/turn-drizzle-mapper";
import { GetTurn } from "@/entities/turn/usecases/get-turn";

interface Command {
  sessionId: UniqueEntityID;
  includeHistory?: boolean;
  modelTierSelections?: Map<string, ModelTier>;
}

export class ExportSessionToFile implements UseCase<Command, Result<File>> {
  constructor(
    private loadSessionRepo: LoadSessionRepo,
    private exportFlowWithNodes: ExportFlowWithNodes,
    private exportCardToFile: ExportCardToFile,
    private getBackground: GetBackground,
    private getAsset: GetAsset,
    private getTurn: GetTurn,
  ) {}

  private async exportSessionToZip(
    zip: JSZip,
    session: Session,
    includeHistory: boolean,
  ): Promise<void> {
    // Convert session to JSON object
    const sessionJson = SessionDrizzleMapper.toPersistence(session);

    // Extract export session data
    const paths = [
      "title",
      "all_cards",
      "user_character_card_id",
      "background_id",
      "cover_id",
      "translation",
      "chat_styles",
      "flow_id",
    ];
    if (includeHistory) {
      paths.push("turn_ids");
    }
    const exportedSession = pick(sessionJson, paths);

    // Add session to zip
    zip.file("session.json", JSON.stringify(exportedSession));
  }

  private async exportFlowToZip(
    zip: JSZip,
    flowId: UniqueEntityID,
    modelTierSelections?: Map<string, ModelTier>,
  ): Promise<void> {
    // Export flow to file with nodes
    const flowOrError = await this.exportFlowWithNodes.execute({
      flowId,
      modelTierSelections,
    });
    if (flowOrError.isFailure) {
      throw new Error(flowOrError.getError());
    }
    const flowFile = flowOrError.getValue();

    // Add flow to zip
    zip.file(`flows/${flowId.toString()}.astrsk.flow`, flowFile);
  }

  private async exportCardToZip(
    zip: JSZip,
    cardId: UniqueEntityID,
  ): Promise<void> {
    // Export card to file
    const cardOrError = await this.exportCardToFile.execute({
      cardId: cardId,
      options: {
        format: "png",
      },
    });
    if (cardOrError.isFailure) {
      throw new Error(cardOrError.getError());
    }
    const cardFile = cardOrError.getValue();

    // Add card to zip
    zip.file(`cards/${cardId.toString()}.astrsk.card`, cardFile);
  }

  private async exportBackgroundToZip(
    zip: JSZip,
    backgroundId: UniqueEntityID,
  ): Promise<void> {
    // Check if background is default background
    if (defaultBackgrounds.some((bg) => bg.id.equals(backgroundId))) {
      // Default backgrounds are not exported
      console.log(`[EXPORT] Skipping default background: ${backgroundId.toString()}`);
      return;
    }

    console.log(`[EXPORT] Exporting background: ${backgroundId.toString()}`);

    // Get background
    const backgroundOrError = await this.getBackground.execute(backgroundId);
    if (backgroundOrError.isFailure) {
      throw new Error(backgroundOrError.getError());
    }
    const background = backgroundOrError.getValue();

    // Get background asset
    const assetOrError = await this.getAsset.execute(background.assetId);
    if (assetOrError.isFailure) {
      throw new Error(assetOrError.getError());
    }
    const asset = assetOrError.getValue();

    // Get asset file
    const assetFile = await file(asset.filePath).getOriginFile();
    if (!assetFile) {
      throw new Error("Background image file not found");
    }

    // Add background to zip
    const filename = `backgrounds/${backgroundId.toString()}.astrsk.background`;
    console.log(`[EXPORT] Adding background to zip: ${filename}`);
    zip.file(filename, assetFile);
  }

  private async exportCoverToZip(
    zip: JSZip,
    coverId: UniqueEntityID,
  ): Promise<void> {
    console.log(`[EXPORT] Exporting cover image: ${coverId.toString()}`);

    // Get cover asset directly (coverId is already an asset ID)
    const assetOrError = await this.getAsset.execute(coverId);
    if (assetOrError.isFailure) {
      throw new Error(assetOrError.getError());
    }
    const asset = assetOrError.getValue();

    // Get asset file
    const assetFile = await file(asset.filePath).getOriginFile();
    if (!assetFile) {
      throw new Error("Cover image file not found");
    }

    // Add cover to zip
    const filename = `covers/${coverId.toString()}.astrsk.cover`;
    console.log(`[EXPORT] Adding cover to zip: ${filename}`);
    zip.file(filename, assetFile);
  }

  private async exportTurnToZip(
    zip: JSZip,
    turnId: UniqueEntityID,
  ): Promise<void> {
    // Get turn
    const turnOrError = await this.getTurn.execute(turnId);
    if (turnOrError.isFailure) {
      throw new Error(turnOrError.getError());
    }
    const turn = turnOrError.getValue();

    // Convert to JSON object
    const turnJson = {
      ...TurnDrizzleMapper.toPersistence(turn),
      updated_at: turn.updatedAt.toJSON(),
      created_at: turn.createdAt.toJSON(),
    };

    // Add turn to zip
    zip.file(
      `turns/${turnId.toString()}.astrsk.turn`,
      JSON.stringify(turnJson),
    );
  }

  private async makeZipFile(zip: JSZip, name: string): Promise<File> {
    // Make file name
    const sanitizedName = sanitizeFileName(name);
    const fileName = `${sanitizedName}.astrsk.session`;

    // Make zip file
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
    });
    const zipFile = new File([zipBlob], fileName, {
      type: "application/octet-stream",
    });

    return zipFile;
  }

  async execute({
    sessionId,
    includeHistory = false,
    modelTierSelections,
  }: Command): Promise<Result<File>> {
    try {
      // Get session
      const sessionOrError =
        await this.loadSessionRepo.getSessionById(sessionId);
      if (sessionOrError.isFailure) {
        throw new Error(sessionOrError.getError());
      }
      const session = sessionOrError.getValue();

      // Create zip object
      const zip = new JSZip();

      // Export session to zip
      await this.exportSessionToZip(zip, session, includeHistory);

      // Export flow to zip
      if (session.flowId) {
        await this.exportFlowToZip(zip, session.flowId, modelTierSelections);
      }

      // Export card to zip
      if (session.allCards && session.allCards.length > 0) {
        for (const card of session.allCards) {
          await this.exportCardToZip(zip, card.id);
        }
      }

      // Export background to zip
      if (session.backgroundId) {
        await this.exportBackgroundToZip(zip, session.backgroundId);
      }

      // Export cover to zip
      if (session.coverId) {
        await this.exportCoverToZip(zip, session.coverId);
      }

      // Export history to zip
      if (includeHistory && session.turnIds && session.turnIds.length > 0) {
        for (const turnId of session.turnIds) {
          await this.exportTurnToZip(zip, turnId);
        }
      }

      // Make zip file
      const zipFile = await this.makeZipFile(zip, session.title);

      // Return zip file
      return Result.ok(zipFile);
    } catch (error) {
      return formatFail("Failed to export session to file", error);
    }
  }
}
