import { useMemo } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/app/hooks/use-card";
import { useAsset } from "@/app/hooks/use-asset";
import { CharacterCard } from "@/modules/card/domain";
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

  // Collect all character data
  const characterData = [
    { card: char1Card, assetUrl: char1AssetUrl, isVideo: isChar1Video },
    { card: char2Card, assetUrl: char2AssetUrl, isVideo: isChar2Video },
    { card: char3Card, assetUrl: char3AssetUrl, isVideo: isChar3Video },
    { card: char4Card, assetUrl: char4AssetUrl, isVideo: isChar4Video },
    { card: char5Card, assetUrl: char5AssetUrl, isVideo: isChar5Video },
    { card: char6Card, assetUrl: char6AssetUrl, isVideo: isChar6Video },
    { card: char7Card, assetUrl: char7AssetUrl, isVideo: isChar7Video },
    { card: char8Card, assetUrl: char8AssetUrl, isVideo: isChar8Video },
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
    thumb1Url,
    thumb2Url,
    thumb3Url,
    thumb4Url,
    thumb5Url,
    thumb6Url,
    thumb7Url,
    thumb8Url,
  ];

  // Build final character asset data
  const result = useMemo(() => {
    return characterData
      .map((data, index) => {
        if (!data.card) return null;

        // For videos, use thumbnail URL; for images, use direct URL
        const imageUrl = data.isVideo ? thumbnailUrls[index] : data.assetUrl;

        // Skip if it's a video but we don't have a thumbnail
        if (data.isVideo && !imageUrl) return null;

        return {
          card: data.card,
          assetUrl: data.assetUrl || undefined, // Convert null to undefined
          isVideo: data.isVideo,
          imageUrl: imageUrl || undefined, // Convert null to undefined
          characterName: data.card.props.name || `Character ${index + 1}`,
        };
      })
      .filter((item): item is CharacterAssetData => item !== null);
  }, [characterData, thumbnailUrls]);

  return result;
};
