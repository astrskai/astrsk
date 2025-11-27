import { Result, UseCase } from "@/shared/core";
import { UniqueEntityID } from "@/shared/domain";
import { PNGMetadata } from "@/shared/lib/png-metadata";

import { Asset } from "@/entities/asset/domain/asset";
import { LoadAssetRepo } from "@/entities/asset/repos/load-asset-repo";
import { Card, CharacterCard, PlotCard, ScenarioCard } from "@/entities/card/domain";
import { LoadCardRepo } from "@/entities/card/repos";
import { LoadGeneratedImageRepo } from "@/entities/generated-image/repos/load-generated-image-repo";
//TODO: replace them with electron path
import {
  character_card_placeholder,
  plot_card_placeholder,
} from "@/shared/assets/placeholders";

export interface ExportOptions {
  format: "json" | "png";
}

export class ExportCardToFile
  implements
    UseCase<{ cardId: UniqueEntityID; options?: ExportOptions }, Result<File>>
{
  constructor(
    private loadCardRepo: LoadCardRepo,
    private loadAssetRepo: LoadAssetRepo,
    private generatedImageRepo: LoadGeneratedImageRepo,
  ) {}

  async execute({
    cardId,
    options = { format: "json" },
  }: {
    cardId: UniqueEntityID;
    options?: ExportOptions;
  }): Promise<Result<File>> {
    const cardResult = await this.loadCardRepo.getCardById(cardId);

    if (cardResult.isFailure) {
      return Result.fail<File>(cardResult.getError());
    }

    const card = cardResult.getValue();
    let fileContent: any;

    if (card instanceof CharacterCard) {
      fileContent = this.exportCharacterCard(card);
    } else if (card instanceof PlotCard || card instanceof ScenarioCard) {
      fileContent = this.exportScenarioCard(card);
    } else {
      return Result.fail<File>("Unsupported card type");
    }

    if (options.format === "png") {
      let iconAsset: Asset;
      if (card.props.iconAssetId) {
        // Get asset
        const assetOrError = await this.loadAssetRepo.getAssetById(
          card.props.iconAssetId,
        );
        if (assetOrError.isFailure) {
          return Result.fail<File>(assetOrError.getError());
        }
        iconAsset = assetOrError.getValue();

        // Check if the asset is a video
        const isVideo =
          iconAsset.props.mimeType.startsWith("video/") ||
          iconAsset.props.mimeType.includes("mp4") ||
          iconAsset.props.mimeType.includes("webm");

        if (isVideo) {
          console.log(
            "[ExportCard] Asset is a video, looking for thumbnail...",
          );

          // Check if generatedImageRepo is available
          if (!this.generatedImageRepo) {
            console.log(
              "[ExportCard] GeneratedImageRepo not initialized, extracting thumbnail from video",
            );
            // Try to extract thumbnail directly from video
            const extractedThumbnail =
              await this.extractVideoThumbnail(iconAsset);
            if (extractedThumbnail) {
              console.log(
                "[ExportCard] Successfully extracted thumbnail from video",
              );
              iconAsset = extractedThumbnail;
            } else {
              console.log(
                "[ExportCard] Failed to extract thumbnail, using placeholder",
              );
              iconAsset = await this.getPlaceholderAsset(card);
            }
          } else {
            // Find the GeneratedImage entry for this video asset
            const generatedImagesResult =
              await this.generatedImageRepo.listGeneratedImages();
            if (generatedImagesResult.isSuccess) {
              const generatedImages = generatedImagesResult.getValue();
              const videoGeneratedImage = generatedImages.find((img) =>
                img.props.assetId?.equals(card.props.iconAssetId),
              );

              if (
                videoGeneratedImage &&
                videoGeneratedImage.props.thumbnailAssetId
              ) {
                console.log(
                  "[ExportCard] Found video thumbnail, using it for export",
                );
                // Get the thumbnail asset instead
                const thumbnailAssetResult =
                  await this.loadAssetRepo.getAssetById(
                    videoGeneratedImage.props.thumbnailAssetId,
                  );

                if (thumbnailAssetResult.isSuccess) {
                  iconAsset = thumbnailAssetResult.getValue();
                  console.log(
                    "[ExportCard] Successfully loaded existing thumbnail asset",
                  );
                } else {
                  console.log(
                    "[ExportCard] Failed to load thumbnail asset, extracting from video",
                  );
                  // Try to extract thumbnail directly from video
                  const extractedThumbnail =
                    await this.extractVideoThumbnail(iconAsset);
                  if (extractedThumbnail) {
                    console.log(
                      "[ExportCard] Successfully extracted thumbnail from video",
                    );
                    iconAsset = extractedThumbnail;
                  } else {
                    console.log(
                      "[ExportCard] Failed to extract thumbnail, using placeholder",
                    );
                    iconAsset = await this.getPlaceholderAsset(card);
                  }
                }
              } else {
                console.log(
                  "[ExportCard] No thumbnail found in GeneratedImage table, extracting from video",
                );
                // Try to extract thumbnail directly from video
                const extractedThumbnail =
                  await this.extractVideoThumbnail(iconAsset);
                if (extractedThumbnail) {
                  console.log(
                    "[ExportCard] Successfully extracted thumbnail from video",
                  );
                  iconAsset = extractedThumbnail;
                } else {
                  console.log(
                    "[ExportCard] Failed to extract thumbnail, using placeholder",
                  );
                  iconAsset = await this.getPlaceholderAsset(card);
                }
              }
            } else {
              console.log(
                "[ExportCard] Failed to list generated images, extracting from video",
              );
              // Try to extract thumbnail directly from video
              const extractedThumbnail =
                await this.extractVideoThumbnail(iconAsset);
              if (extractedThumbnail) {
                console.log(
                  "[ExportCard] Successfully extracted thumbnail from video",
                );
                iconAsset = extractedThumbnail;
              } else {
                console.log(
                  "[ExportCard] Failed to extract thumbnail, using placeholder",
                );
                iconAsset = await this.getPlaceholderAsset(card);
              }
            }
          }
        }
      } else {
        iconAsset = await this.getPlaceholderAsset(card);
      }

      // Create PNG with metadata using either the card's icon or placeholder
      const pngData = await PNGMetadata.createPNGWithMetadata(
        iconAsset,
        fileContent,
      );
      const file = new File([pngData], `${card.props.title}.png`, {
        type: "image/png",
      });
      return Result.ok<File>(file);
    } else {
      const blob = new Blob([JSON.stringify(fileContent, null, 2)], {
        type: "application/json",
      });
      const file = new File([blob], `${card.props.title}.json`, {
        type: "application/json",
      });

      return Result.ok<File>(file);
    }
  }

  private exportCharacterCard(card: CharacterCard): any {
    return {
      spec: "chara_card_v2",
      spec_version: "2.0",
      data: {
        name: card.props.name,
        description: card.props.description,
        personality: "",
        scenario: "",
        first_mes: "",
        mes_example: card.props.exampleDialogue,
        creator_notes: card.props.cardSummary,
        system_prompt: "",
        post_history_instructions: "",
        alternate_greetings: [],
        character_book: this.exportLorebook(card.props.lorebook),
        tags: card.props.tags,
        creator: card.props.creator,
        character_version: card.props.version,
        extensions: {
          title: card.props.title,
          ...this.getCommonExtensions(card),
        },
      },
    };
  }

  private exportScenarioCard(card: PlotCard | ScenarioCard): any {
    // Get first messages based on card type
    // PlotCard uses 'scenarios', ScenarioCard uses 'firstMessages'
    const firstMessages =
      card instanceof PlotCard
        ? card.props.scenarios
        : card.props.firstMessages;

    return {
      spec: "scenario_card_v2",
      spec_version: "2.0",
      data: {
        title: card.props.title,
        description: card.props.description,
        first_messages: firstMessages,
        entries: this.exportLorebook(card.props.lorebook)?.entries,
        extensions: {
          ...this.getCommonExtensions(card),
        },
      },
    };
  }

  private getCommonExtensions(card: Card): any {
    return {
      tags: card.props.tags,
      creator: card.props.creator,
      cardSummary: card.props.cardSummary,
      version: card.props.version,
      conceptualOrigin: card.props.conceptualOrigin,
      createdAt: card.props.createdAt.toISOString(),
      updatedAt: card.props.updatedAt?.toISOString(),
    };
  }

  private exportLorebook(lorebook: any): any {
    if (!lorebook || !lorebook.entries) return undefined;
    return {
      entries: lorebook.entries.map((entry: any, index: number) => ({
        keys: entry.keys,
        content: entry.content,
        extensions: {
          id: entry.id.toString(),
          recallRange: entry.recallRange,
        },
        enabled: entry.enabled,
        insertion_order: index,
        case_sensitive: false,
        name: entry.name,
      })),
    };
  }

  private async getPlaceholderAsset(card: Card): Promise<Asset> {
    let svgContent;
    if (card instanceof CharacterCard) {
      svgContent = character_card_placeholder;
    } else if (card instanceof PlotCard || card instanceof ScenarioCard) {
      svgContent = plot_card_placeholder;
    }
    const placeholderBlob = new Blob([svgContent!], {
      type: "image/svg+xml",
    });

    // Create file with correct MIME type
    const placeholderFile = new File([placeholderBlob], "placeholder.svg", {
      type: "image/svg+xml",
    });

    // Set icon asset
    const iconAssetOrError = await Asset.createFromFile({
      file: placeholderFile,
    });

    if (iconAssetOrError.isFailure) {
      throw new Error(iconAssetOrError.getError());
    }
    return iconAssetOrError.getValue();
  }

  /**
   * Extract first frame from video as thumbnail
   */
  private async extractVideoThumbnail(
    videoAsset: Asset,
  ): Promise<Asset | null> {
    try {
      // First, we need to get the actual video file from the asset
      // Assets store the file path, we need to retrieve the actual blob
      const response = await fetch(videoAsset.props.filePath);
      const blob = await response.blob();
      const videoFile = new File([blob], videoAsset.props.name, {
        type: videoAsset.props.mimeType,
      });

      // Create a video element
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return null;

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          // Set canvas size to video dimensions (with max size limit for performance)
          const maxWidth = 800;
          const maxHeight = 800;
          let width = video.videoWidth;
          let height = video.videoHeight;

          // Scale down if needed while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Seek to first frame
          video.currentTime = 0.1; // Small offset to ensure we get a frame
        };

        video.onseeked = async () => {
          // Draw the current frame to canvas (scaled to fit)
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to blob
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const thumbnailFile = new File(
                  [blob],
                  `thumbnail-${videoAsset.props.name.replace(/\.[^/.]+$/, "")}.png`,
                  { type: "image/png" },
                );

                // Create an asset from the thumbnail
                const assetOrError = await Asset.createFromFile({
                  file: thumbnailFile,
                });

                if (assetOrError.isSuccess) {
                  resolve(assetOrError.getValue());
                } else {
                  resolve(null);
                }
              } else {
                resolve(null);
              }

              // Clean up
              URL.revokeObjectURL(video.src);
            },
            "image/png",
            1.0, // Max quality for export
          );
        };

        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve(null);
        };

        // Create object URL and load video
        video.src = URL.createObjectURL(videoFile);
        video.load();
      });
    } catch (error) {
      console.error("[ExportCard] Failed to extract video thumbnail:", error);
      return null;
    }
  }
}
