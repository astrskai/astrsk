import { useMemo } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { useAsset } from "@/shared/hooks/use-asset";
import { useQuery, useQueries } from "@tanstack/react-query";
import { sessionQueries } from "@/app/queries/session-queries";
import { turnQueries } from "@/app/queries/turn-queries";
import { Turn } from "@/entities/turn/domain/turn";
import { generatedImageQueries } from "@/app/queries/generated-image/query-factory";
import { flowQueries } from "@/app/queries/flow-queries";
import { useMultipleCharacterAssets } from "./use-multiple-character-assets";
import { CardType } from "@/entities/card/domain/card";
import { CardListItem } from "@/entities/session/domain/session";

interface UseEnhancedGenerationPromptParams {
  sessionId?: UniqueEntityID;
}

interface GenerationPromptResult {
  prompt: string;
  imageUrls: string[]; // Array of image URLs to use for generation
  characterIds: UniqueEntityID[]; // Character IDs involved in the prompt
  lastGeneratedImageUrl?: string; // The most recent generated image (for image generation)
  secondLastGeneratedImageUrl?: string; // The second-most recent generated image (for video generation)
}

export const useEnhancedGenerationPrompt = ({
  sessionId,
}: UseEnhancedGenerationPromptParams): GenerationPromptResult => {
  // Get session data
  const { data: session } = useQuery({
    ...sessionQueries.detail(sessionId || new UniqueEntityID()),
    enabled: !!sessionId,
  });

  // Get all turns in the session using useQueries
  const turnQueryConfigs = useMemo(() => {
    if (!session?.props.turnIds || session.props.turnIds.length === 0)
      return [];
    return session.props.turnIds.map((turnId: UniqueEntityID) => ({
      ...turnQueries.detail(turnId),
    }));
  }, [session?.props.turnIds]);

  const turnsResults = useQueries({
    queries: turnQueryConfigs,
  });

  // Process turns to extract relevant information
  const processedData = useMemo(() => {
    const turns = turnsResults
      .map((result) => result.data)
      .filter((turn): turn is Turn => turn !== null && turn !== undefined);

    if (turns.length === 0) {
      return {
        messageTurns: [],
        lastGeneratedAssetId: undefined,
        characterIds: new Set<string>(),
      };
    }

    // Separate different types of turns
    const messageTurns: Turn[] = [];
    let lastGeneratedAssetId: UniqueEntityID | undefined;
    let secondLastGeneratedAssetId: UniqueEntityID | undefined;
    let lastMessageTurn: Turn | undefined; // Will store the last actual message turn (not placeholder)

    // Process turns from newest to oldest
    for (let i = turns.length - 1; i >= 0; i--) {
      const turn = turns[i];
      const option = turn.options?.[turn.selectedOptionIndex || 0];

      // Check if this turn has generated media (image/video)
      if (option?.assetId) {
        if (!lastGeneratedAssetId) {
          lastGeneratedAssetId = new UniqueEntityID(option.assetId);
        } else if (!secondLastGeneratedAssetId) {
          secondLastGeneratedAssetId = new UniqueEntityID(option.assetId);
        }
      }

      // Check if this is a user or character message (not scenario, not placeholder)
      // A turn is a message if it has characterCardId OR characterName
      // Scenario turns typically have neither
      // Placeholder turns have content like "Generating..."
      const isMessage = !!(turn.characterCardId || turn.characterName);
      const isNotPlaceholder =
        option?.content && !option.content.includes("Generating");

      if (isMessage && isNotPlaceholder) {
        // Track the last message turn for session data
        if (!lastMessageTurn) {
          lastMessageTurn = turn;
          // Add only the last message turn
          messageTurns.push(turn);
        }
      }
    }

    return {
      messageTurns,
      lastGeneratedAssetId,
      secondLastGeneratedAssetId,
      lastMessageTurn,
    };
  }, [turnsResults]);

  // Get the last generated image/video asset URL
  const [lastGeneratedAssetUrl, isLastAssetVideo] = useAsset(
    processedData.lastGeneratedAssetId,
  );

  // If it's a video, we need to get the thumbnail from the generated image list
  const { data: allGeneratedImages } = useQuery({
    ...generatedImageQueries.list(),
    enabled: isLastAssetVideo && !!processedData.lastGeneratedAssetId,
  });

  // Find the generated image with matching assetId for video thumbnail
  const generatedImageData = useMemo(() => {
    if (
      !isLastAssetVideo ||
      !allGeneratedImages ||
      !processedData.lastGeneratedAssetId
    ) {
      return undefined;
    }

    const found = allGeneratedImages.find((img) => {
      return (
        img.props.assetId?.toString() ===
        processedData.lastGeneratedAssetId?.toString()
      );
    });

    return found;
  }, [
    isLastAssetVideo,
    allGeneratedImages,
    processedData.lastGeneratedAssetId,
  ]);

  // Get thumbnail URL if the last asset was a video
  const [thumbnailUrl] = useAsset(
    isLastAssetVideo && generatedImageData?.props?.thumbnailAssetId
      ? generatedImageData.props.thumbnailAssetId
      : undefined,
  );

  // Use thumbnail for video, original URL for images
  const lastGeneratedImageUrl = isLastAssetVideo
    ? thumbnailUrl
    : lastGeneratedAssetUrl;

  // Get the SECOND-LAST generated image (for video generation start frame)
  const [secondLastGeneratedAssetUrl, isSecondLastAssetVideo] = useAsset(
    processedData.secondLastGeneratedAssetId,
  );

  // Get thumbnail for second-last if it's a video
  const secondLastGeneratedImageData = useMemo(() => {
    if (
      !isSecondLastAssetVideo ||
      !allGeneratedImages ||
      !processedData.secondLastGeneratedAssetId
    ) {
      return undefined;
    }

    return allGeneratedImages.find((img) => {
      return (
        img.props.assetId?.toString() ===
        processedData.secondLastGeneratedAssetId?.toString()
      );
    });
  }, [
    isSecondLastAssetVideo,
    allGeneratedImages,
    processedData.secondLastGeneratedAssetId,
  ]);

  // Get thumbnail URL for second-last if it's a video
  const [secondLastThumbnailUrl] = useAsset(
    isSecondLastAssetVideo &&
      secondLastGeneratedImageData?.props?.thumbnailAssetId
      ? secondLastGeneratedImageData.props.thumbnailAssetId
      : undefined,
  );

  // Use thumbnail for video, original URL for images
  const secondLastGeneratedImageUrl = isSecondLastAssetVideo
    ? secondLastThumbnailUrl
    : secondLastGeneratedAssetUrl;

  // Get unique character cards from the session (not from turns)
  const characterCardIds = useMemo(() => {
    if (!session) return [];

    const ids: UniqueEntityID[] = [];

    // Get all character cards from the session's allCards
    // Filter for CHARACTER type cards that are enabled
    const characterCards: CardListItem[] =
      session.props.allCards?.filter(
        (card: CardListItem) =>
          card.type === CardType.Character && card.enabled,
      ) || [];

    // Add all character card IDs
    characterCards.forEach((card: CardListItem) => {
      ids.push(card.id);
    });

    // Limit to 8 characters for image generation
    return ids.slice(0, 8);
  }, [session]);

  // Use the custom hook to fetch all character assets cleanly (up to 8)
  const characterAssets = useMultipleCharacterAssets(characterCardIds, 8);

  // Build the enhanced prompt
  const { prompt, imageUrls } = useMemo(() => {
    let prompt = "";
    const imageUrls: string[] = [];

    // Add session context
    if (session) {
      prompt += "=== Session Context ===\n";

      // Session title/setting
      if (session.props.title) {
        prompt += `Title/Setting: ${session.props.title}\n`;
      }

      prompt += "\n";
    }

    // Add character context from ALL characters in the session
    if (characterAssets.length > 0) {
      prompt += "=== Characters in this Session ===\n";
      characterAssets.forEach((charData, index) => {
        const card = charData.card;
        if (card) {
          prompt += `Character ${index + 1}: ${card.props.name}\n`;

          // Add appearance/description
          if (card.props.description) {
            prompt += `Character description: ${card.props.description}\n`;
          }

          // Check if this is the user's character
          if (session?.props.userCharacterCardId?.equals(card.id)) {
            prompt += `Role: User's character (protagonist)\n`;
          } else {
            prompt += `Role: AI character\n`;
          }

          prompt += "\n";
        }
      });
    }

    // Add the last message content
    if (processedData.messageTurns.length > 0) {
      prompt += "=== Last Message ===\n";

      const lastTurn = processedData.messageTurns[0];
      const option = lastTurn.options?.[lastTurn.selectedOptionIndex || 0];
      if (option?.content) {
        // Determine speaker name
        let speaker = lastTurn.characterName || "Unknown";

        // Add speaker role indicator
        if (
          session?.props.userCharacterCardId &&
          lastTurn.characterCardId?.equals(session.props.userCharacterCardId)
        ) {
          speaker += " (User)";
        } else if (lastTurn.characterCardId) {
          speaker += " (AI)";
        }

        // Format the content - show full content for complete context
        const content = option.content;

        prompt += `${speaker}:\n"${content}"\n\n`;
      }
    }

    prompt += "In gener.\n";

    // Session data removed - focusing on video generation

    // Build image URLs array with CONSISTENT ordering
    // Order: 1. Previous generated image, 2-9. Character images (up to 8)

    const imageDescriptions: string[] = [];
    const addedCharacterIds = new Set<string>(); // Track character IDs to avoid duplicates

    // 1. Add the last generated image if available (ALWAYS FIRST)
    if (lastGeneratedImageUrl) {
      imageUrls.push(lastGeneratedImageUrl);
      imageDescriptions.push("Previous generated scene");
    }

    // 2. Add all character images (up to 8, filling remaining slots up to 10 total)
    for (const charData of characterAssets) {
      // Stop if we've reached 10 images total (1 generated + up to 8 characters = 9, leaving room for 1 more if needed)
      if (imageUrls.length >= 9) break;

      const { card, imageUrl, characterName } = charData;

      if (imageUrl && card) {
        const charId = card.id.toString();

        if (!addedCharacterIds.has(charId)) {
          // Check if the URL is actually an image (not a video URL)
          const isValidImageUrl =
            !imageUrl.includes(".mp4") &&
            !imageUrl.includes(".webm") &&
            !imageUrl.includes(".mov");

          if (isValidImageUrl) {
            imageUrls.push(imageUrl);
            addedCharacterIds.add(charId);
            imageDescriptions.push(`${characterName}`);
          } else {
            addedCharacterIds.add(charId); // Still mark as added to prevent duplication
          }
        }
      }
    }

    // Add clear descriptions of what each image is
    if (imageUrls.length > 0) {
      prompt += "\n=== Reference Images ===\n";
      imageDescriptions.forEach((desc, index) => {
        prompt += `Image ${index + 1}: ${desc}\n`;
      });
      prompt += "\n";

      // Add instructions based on what images we have
      if (lastGeneratedImageUrl) {
        prompt +=
          "IMPORTANT: The first image shows the previous scene. Use it ONLY for style consistency (art style, lighting, atmosphere, color palette).\n";
        prompt +=
          "DO NOT recreate the same scene or composition. Generate a COMPLETELY NEW scene based on the current conversation.\n";
        prompt += "Things that MUST change from the previous image:\n";
        prompt +=
          "- Location/setting (if the story has moved to a new place)\n";
        prompt +=
          "- Character actions and poses (based on what they're doing NOW in the conversation)\n";
        prompt += "- Scene composition and camera angle\n";
        prompt +=
          "- Facial expressions and emotions (matching the current dialogue)\n";
        prompt +=
          "The new image should depict what's happening in the CURRENT messages, not what happened before.\n\n";
      }

      const characterCount = imageUrls.length - (lastGeneratedImageUrl ? 1 : 0);
      if (characterCount > 0) {
        prompt += `\n=== CRITICAL: CHARACTER CONSISTENCY ===\n`;
        prompt += `CHARACTER CONSISTENCY IS ABSOLUTELY ESSENTIAL. The character reference images provided MUST be followed exactly for:\n`;
        prompt += `- Facial features and structure (EXACT same face, eye shape, nose, mouth)\n`;
        prompt += `- Hair color, style, and length (EXACTLY as shown in reference)\n`;
        prompt += `- Skin tone and complexion\n`;
        prompt += `- Body type and proportions\n`;
        prompt += `- Clothing style and colors (unless the scene explicitly requires different clothing)\n`;
        prompt += `- Any unique identifying features (scars, tattoos, accessories)\n`;
        prompt += `\n`;
        prompt += `IMPORTANT: While poses, expressions, and actions should be NEW based on the current conversation, the characters themselves MUST look EXACTLY the same as in the reference images.\n`;
        prompt += `Any deviation from the character's appearance will break the visual narrative continuity.\n\n`;
      }
    }

    // Add critical instruction about focusing on the last message
    prompt += "\n=== CRITICAL GENERATION INSTRUCTIONS ===\n";
    prompt +=
      "When generating the image or video, you MUST pay close attention to the current scene and actions based on the LAST SPEAKER'S MESSAGE above.\n";
    prompt += "- Focus ENTIRELY on what is happening in the last message\n";
    prompt +=
      "- For IMAGE generation: Capture the KEY ACTION or FINAL MOMENT described in the last message\n";
    prompt +=
      "- For VIDEO generation: Show the PROGRESSION/EXECUTION of the last action itself (the image will capture the final moment)\n";
    prompt +=
      "- The generated content should visually represent EXACTLY what the last speaker is saying or doing\n";
    prompt +=
      "- If an action is described (walking, running, picking up, etc.), that action MUST be visible\n";
    prompt +=
      "- The scene setting, character positions, and emotions should match the last message precisely\n\n";

    // Session data logging removed

    return { prompt, imageUrls };
  }, [
    session,
    processedData.messageTurns,
    characterAssets,
    lastGeneratedImageUrl,
  ]);

  return {
    prompt,
    imageUrls,
    characterIds: characterCardIds,
    // Expose both for video generation to use the right one
    lastGeneratedImageUrl: lastGeneratedImageUrl || undefined,
    secondLastGeneratedImageUrl: secondLastGeneratedImageUrl || undefined,
  };
};
