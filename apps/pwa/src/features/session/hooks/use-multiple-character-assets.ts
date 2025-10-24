import { useMemo } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/shared/hooks/use-card";
import { useAsset } from "@/shared/hooks/use-asset";
import { CharacterCard } from "@/entities/card/domain";
import { useQuery } from "@tanstack/react-query";
import { generatedImageQueries } from "@/app/queries/generated-image/query-factory";

interface CharacterAssetData {
  card: CharacterCard;
  assetUrl: string | undefined;
  isVideo: boolean;
  imageUrl: string | undefined; // Final image URL (thumbnail for videos, direct URL for images)
  characterName: string;
}

export const useMultipleCharacterAssets = (
  characterIds: UniqueEntityID[],
  maxCharacters: number = 8,
): CharacterAssetData[] => {
  // Limit to maxCharacters and pad with undefined to ensure consistent hook calls
  const paddedCharacterIds = useMemo(() => {
    const limited = characterIds.slice(0, maxCharacters);
    const padded = [...limited];
    // Pad with undefined to always have exactly maxCharacters entries
    while (padded.length < maxCharacters) {
      padded.push(undefined as any);
    }
    return padded;
  }, [characterIds, maxCharacters]);

  // Fetch all character cards (must call all hooks unconditionally)
  const [char1Card] = useCard<CharacterCard>(paddedCharacterIds[0]);
  const [char2Card] = useCard<CharacterCard>(paddedCharacterIds[1]);
  const [char3Card] = useCard<CharacterCard>(paddedCharacterIds[2]);
  const [char4Card] = useCard<CharacterCard>(paddedCharacterIds[3]);
  const [char5Card] = useCard<CharacterCard>(paddedCharacterIds[4]);
  const [char6Card] = useCard<CharacterCard>(paddedCharacterIds[5]);
  const [char7Card] = useCard<CharacterCard>(paddedCharacterIds[6]);
  const [char8Card] = useCard<CharacterCard>(paddedCharacterIds[7]);

  // Fetch all character assets
  const [char1AssetUrl, isChar1Video] = useAsset(char1Card?.props.iconAssetId);
  const [char2AssetUrl, isChar2Video] = useAsset(char2Card?.props.iconAssetId);
  const [char3AssetUrl, isChar3Video] = useAsset(char3Card?.props.iconAssetId);
  const [char4AssetUrl, isChar4Video] = useAsset(char4Card?.props.iconAssetId);
  const [char5AssetUrl, isChar5Video] = useAsset(char5Card?.props.iconAssetId);
  const [char6AssetUrl, isChar6Video] = useAsset(char6Card?.props.iconAssetId);
  const [char7AssetUrl, isChar7Video] = useAsset(char7Card?.props.iconAssetId);
  const [char8AssetUrl, isChar8Video] = useAsset(char8Card?.props.iconAssetId);

  // Collect all character data (convert null to undefined)
  const characterData = [
    {
      card: char1Card,
      assetUrl: char1AssetUrl || undefined,
      isVideo: isChar1Video,
    },
    {
      card: char2Card,
      assetUrl: char2AssetUrl || undefined,
      isVideo: isChar2Video,
    },
    {
      card: char3Card,
      assetUrl: char3AssetUrl || undefined,
      isVideo: isChar3Video,
    },
    {
      card: char4Card,
      assetUrl: char4AssetUrl || undefined,
      isVideo: isChar4Video,
    },
    {
      card: char5Card,
      assetUrl: char5AssetUrl || undefined,
      isVideo: isChar5Video,
    },
    {
      card: char6Card,
      assetUrl: char6AssetUrl || undefined,
      isVideo: isChar6Video,
    },
    {
      card: char7Card,
      assetUrl: char7AssetUrl || undefined,
      isVideo: isChar7Video,
    },
    {
      card: char8Card,
      assetUrl: char8AssetUrl || undefined,
      isVideo: isChar8Video,
    },
  ];

  // Get all generated images for finding video thumbnails
  const hasVideos = characterData.some((data) => data.isVideo && data.card);
  const { data: allGeneratedImages } = useQuery({
    ...generatedImageQueries.list(),
    enabled: hasVideos,
  });

  // Find thumbnails for video assets
  const thumbnailAssetIds = useMemo(() => {
    if (!allGeneratedImages) return [];

    return characterData.map(({ card, isVideo }) => {
      if (!isVideo || !card?.props.iconAssetId) return undefined;

      const genImage = allGeneratedImages.find(
        (img) =>
          img.props.assetId?.toString() === card.props.iconAssetId?.toString(),
      );

      return genImage?.props?.thumbnailAssetId;
    });
  }, [allGeneratedImages, characterData]);

  // Fetch thumbnail URLs for videos
  const [thumb1Url] = useAsset(thumbnailAssetIds[0]);
  const [thumb2Url] = useAsset(thumbnailAssetIds[1]);
  const [thumb3Url] = useAsset(thumbnailAssetIds[2]);
  const [thumb4Url] = useAsset(thumbnailAssetIds[3]);
  const [thumb5Url] = useAsset(thumbnailAssetIds[4]);
  const [thumb6Url] = useAsset(thumbnailAssetIds[5]);
  const [thumb7Url] = useAsset(thumbnailAssetIds[6]);
  const [thumb8Url] = useAsset(thumbnailAssetIds[7]);

  const thumbnailUrls = [
    thumb1Url || undefined,
    thumb2Url || undefined,
    thumb3Url || undefined,
    thumb4Url || undefined,
    thumb5Url || undefined,
    thumb6Url || undefined,
    thumb7Url || undefined,
    thumb8Url || undefined,
  ];

  // Build final character asset data
  const result = useMemo(() => {
    return characterData
      .map((data, index) => {
        if (!data.card) return null;

        // For videos, use thumbnail URL if available, otherwise skip
        // For images, use direct URL
        let imageUrl: string | undefined;

        if (data.isVideo) {
          // For videos, we need a thumbnail
          imageUrl = thumbnailUrls[index];
          // If no thumbnail found in generated images, we can't use this video for image generation
          // Log a warning to help debug
          if (!imageUrl && data.assetUrl) {
            console.warn(
              `[useMultipleCharacterAssets] Video asset for character "${data.card.props.name}" has no thumbnail. ` +
                `Video assets need to be generated through the app or have thumbnails extracted to be used in image generation.`,
            );
            return null; // Skip videos without thumbnails
          }
        } else {
          // For regular images, use the asset URL directly
          imageUrl = data.assetUrl;
        }

        return {
          card: data.card,
          assetUrl: data.assetUrl, // Already converted to undefined above
          isVideo: data.isVideo,
          imageUrl: imageUrl, // Already undefined if not available
          characterName: data.card.props.name || `Character ${index + 1}`,
        };
      })
      .filter((item): item is CharacterAssetData => item !== null);
  }, [characterData, thumbnailUrls]);

  return result;
};
