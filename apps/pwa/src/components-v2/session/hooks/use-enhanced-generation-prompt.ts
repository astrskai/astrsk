import { useMemo } from "react";
import { UniqueEntityID } from "@/shared/domain";
import { useCard } from "@/app/hooks/use-card";
import { useAsset } from "@/app/hooks/use-asset";
import { CharacterCard } from "@/modules/card/domain";
import { useQuery, useQueries } from "@tanstack/react-query";
import { sessionQueries } from "@/app/queries/session-queries";
import { turnQueries } from "@/app/queries/turn-queries";
import { Turn } from "@/modules/turn/domain/turn";
import { generatedImageQueries } from "@/app/queries/generated-image/query-factory";
import { flowQueries } from "@/app/queries/flow-queries";
import { Session } from "@/modules/session/domain/session";
import { Flow } from "@/modules/flow/domain/flow";
import { GeneratedImage } from "@/modules/generated-image/domain/generated-image";

interface UseEnhancedGenerationPromptParams {
  sessionId?: UniqueEntityID;
}

interface GenerationPromptResult {
  prompt: string;
  imageUrls: string[]; // Array of image URLs to use for generation
  characterIds: UniqueEntityID[]; // Character IDs involved in the prompt
}

export const useEnhancedGenerationPrompt = ({
  sessionId,
}: UseEnhancedGenerationPromptParams): GenerationPromptResult => {
  // Get session data
  const { data: session } = useQuery({
    ...sessionQueries.detail(sessionId || new UniqueEntityID()),
    enabled: !!sessionId,
  });

  // Get flow data for session data store schema
  const { data: flow } = useQuery({
    ...flowQueries.detail(session?.props.flowId || new UniqueEntityID()),
    enabled: !!session?.props.flowId,
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
    const characterIds = new Set<string>();
    let lastMessageTurn: Turn | undefined; // Will store the last actual message turn (not placeholder)

    // Process turns from newest to oldest
    for (let i = turns.length - 1; i >= 0; i--) {
      const turn = turns[i];
      const option = turn.options?.[turn.selectedOptionIndex || 0];

      // Check if this turn has generated media (image/video)
      if (option?.assetId && !lastGeneratedAssetId) {
        lastGeneratedAssetId = new UniqueEntityID(option.assetId);
      }

      // Check if this is a user or character message (not scenario, not placeholder)
      // A turn is a message if it has characterCardId OR characterName
      // Scenario turns typically have neither
      // Placeholder turns have content like "Generating..."
      const isMessage = !!(turn.characterCardId || turn.characterName);
      const isNotPlaceholder =
        option?.content && !option.content.includes("Generating");

      const turnType = !isMessage
        ? "scenario"
        : !isNotPlaceholder
          ? "placeholder"
          : "message";

      if (isMessage && isNotPlaceholder) {
        // Track the last message turn for session data
        if (!lastMessageTurn) {
          lastMessageTurn = turn;
        }

        // Add to message turns (we want last 2)
        if (messageTurns.length < 2) {
          messageTurns.unshift(turn); // Add to beginning to maintain chronological order

          // Track character IDs ONLY from these last 2 messages
          if (turn.characterCardId) {
            characterIds.add(turn.characterCardId.toString());
          }
        }
      }
    }

    return {
      messageTurns,
      lastGeneratedAssetId,
      characterIds,
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

  // Get unique character cards and their images
  const characterCardIds = useMemo(() => {
    const ids = Array.from(processedData.characterIds).map(
      (id) => new UniqueEntityID(id),
    );

    return ids;
  }, [processedData.characterIds]);

  // For now, get the first character's image if no generated image exists
  // This is a simplified approach due to hook limitations
  const [firstCharacterCard] = useCard<CharacterCard>(
    characterCardIds[0] || undefined,
  );
  const [firstCharacterAssetUrl, isFirstCharacterAssetVideo] = useAsset(
    firstCharacterCard?.props.iconAssetId,
  );

  // If there are 2 different characters, get the second one too
  const [secondCharacterCard] = useCard<CharacterCard>(
    characterCardIds[1] || undefined,
  );
  const [secondCharacterAssetUrl, isSecondCharacterAssetVideo] = useAsset(
    secondCharacterCard?.props.iconAssetId,
  );

  // Get thumbnails for video assets from character cards
  const { data: firstCharGenImage } = useQuery({
    ...generatedImageQueries.list(),
    enabled:
      isFirstCharacterAssetVideo && !!firstCharacterCard?.props.iconAssetId,
  });

  const { data: secondCharGenImage } = useQuery({
    ...generatedImageQueries.list(),
    enabled:
      isSecondCharacterAssetVideo && !!secondCharacterCard?.props.iconAssetId,
  });

  // Find thumbnail for first character if it's a video
  const firstCharThumbnail = useMemo(() => {
    if (
      !isFirstCharacterAssetVideo ||
      !firstCharGenImage ||
      !firstCharacterCard?.props.iconAssetId
    ) {
      return undefined;
    }
    return firstCharGenImage.find(
      (img) =>
        img.props.assetId?.toString() ===
        firstCharacterCard.props.iconAssetId?.toString(),
    );
  }, [isFirstCharacterAssetVideo, firstCharGenImage, firstCharacterCard]);

  // Find thumbnail for second character if it's a video
  const secondCharThumbnail = useMemo(() => {
    if (
      !isSecondCharacterAssetVideo ||
      !secondCharGenImage ||
      !secondCharacterCard?.props.iconAssetId
    ) {
      return undefined;
    }
    return secondCharGenImage.find(
      (img) =>
        img.props.assetId?.toString() ===
        secondCharacterCard.props.iconAssetId?.toString(),
    );
  }, [isSecondCharacterAssetVideo, secondCharGenImage, secondCharacterCard]);

  // Get actual thumbnail URLs
  const [firstCharThumbnailUrl] = useAsset(
    firstCharThumbnail?.props?.thumbnailAssetId,
  );

  const [secondCharThumbnailUrl] = useAsset(
    secondCharThumbnail?.props?.thumbnailAssetId,
  );

  // Determine the actual image URLs to use
  // For video assets, only use the URL if we have a thumbnail
  const firstCharacterImageUrl = isFirstCharacterAssetVideo
    ? firstCharThumbnailUrl // This will be undefined if thumbnail not found, preventing video URL usage
    : firstCharacterAssetUrl;

  const secondCharacterImageUrl = isSecondCharacterAssetVideo
    ? secondCharThumbnailUrl // This will be undefined if thumbnail not found, preventing video URL usage
    : secondCharacterAssetUrl;

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

      // Story progression
      const turnCount = session.props.turnIds?.length || 0;
      if (turnCount > 0) {
        prompt += `Story Progress: Turn ${turnCount} of the conversation\n`;

        // Indicate story phase
        if (turnCount < 5) {
          prompt += `Story Phase: Beginning - establishing scene and characters\n`;
        } else if (turnCount < 15) {
          prompt += `Story Phase: Development - building relationships and tension\n`;
        } else {
          prompt += `Story Phase: Advanced - deep into the narrative\n`;
        }
      }

      // Plot card context if available
      const plotCard = session.props.plotCard;
      if (plotCard) {
        prompt += `Plot Context: Active plot scenario\n`;
      }

      // Number of active characters
      const activeCharacters =
        session.props.allCards?.filter((c: any) => c.enabled).length || 0;
      if (activeCharacters > 0) {
        prompt += `Active Characters: ${activeCharacters} character${activeCharacters > 1 ? "s" : ""} in the scene\n`;
      }

      // User's character if specified
      if (session.props.userCharacterCardId) {
        const userChar = session.props.allCards?.find((c: any) =>
          c.id.equals(session.props.userCharacterCardId),
        );
        if (userChar) {
          prompt += `POV Character: Story from perspective of user's character\n`;
        }
      }

      // Chat style if specified
      if (session.props.chatStyles) {
        const styles = [];
        if (session.props.chatStyles.narratorToggle)
          styles.push("narrator voice");
        if (session.props.chatStyles.innerThoughtsToggle)
          styles.push("inner thoughts");
        if (session.props.chatStyles.actionToggle) styles.push("actions");
        if (styles.length > 0) {
          prompt += `Narrative Style: Including ${styles.join(", ")}\n`;
        }
      }

      // Translation config for cultural context
      if (session.props.translation?.targetLanguage) {
        prompt += `Cultural Context: ${session.props.translation.targetLanguage} setting\n`;
      }

      prompt += "\n";
    }

    // Add character context from involved characters
    const characters = [firstCharacterCard, secondCharacterCard].filter(
      Boolean,
    );
    if (characters.length > 0) {
      prompt += "=== Characters in Scene ===\n";
      characters.forEach((card, index) => {
        if (card) {
          prompt += `Character ${index + 1}: ${card.props.name}\n`;

          // Add appearance/description
          if (card.props.description) {
            const desc =
              card.props.description.length > 150
                ? card.props.description.slice(0, 150) + "..."
                : card.props.description;
            prompt += `Appearance/Traits: ${desc}\n`;
          }

          // Add personality if available
          if (card.props.personality) {
            const personality =
              card.props.personality.length > 100
                ? card.props.personality.slice(0, 100) + "..."
                : card.props.personality;
            prompt += `Personality: ${personality}\n`;
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

    // Add the last 2 message contents
    if (processedData.messageTurns.length > 0) {
      prompt += "=== Recent Conversation ===\n";
      prompt += `(Showing last ${processedData.messageTurns.length} message${processedData.messageTurns.length > 1 ? "s" : ""} for context)\n\n`;

      processedData.messageTurns.forEach((turn, index) => {
        const option = turn.options?.[turn.selectedOptionIndex || 0];
        if (option?.content) {
          // Determine speaker name
          let speaker = turn.characterName || "Unknown";

          // Add speaker role indicator
          if (
            session?.props.userCharacterCardId &&
            turn.characterCardId?.equals(session.props.userCharacterCardId)
          ) {
            speaker += " (User)";
          } else if (turn.characterCardId) {
            speaker += " (AI)";
          }

          // Format the content - preserve more for image generation context
          const content =
            option.content.length > 300
              ? option.content.slice(0, 300) + "..."
              : option.content;

          // Add turn number for clarity
          prompt += `[Message ${index + 1}] ${speaker}:\n"${content}"\n\n`;
        }
      });
    }

    // Session data removed - focusing on video generation

    // Build image URLs array with CONSISTENT ordering
    // Order: 1. Previous generated image, 2. Character 1, 3. Character 2

    const imageDescriptions: string[] = [];
    const addedCharacterIds = new Set<string>(); // Track character IDs to avoid duplicates

    // 1. Add the last generated image if available (ALWAYS FIRST)
    if (lastGeneratedImageUrl) {
      imageUrls.push(lastGeneratedImageUrl);
      imageDescriptions.push("Previous generated scene");
    }

    // 2. Add first character image
    if (firstCharacterImageUrl && firstCharacterCard) {
      const firstCharId = firstCharacterCard.id.toString();
      if (!addedCharacterIds.has(firstCharId)) {
        // Check if the URL is actually an image (not a video URL)
        const isValidImageUrl =
          !firstCharacterImageUrl.includes(".mp4") &&
          !firstCharacterImageUrl.includes(".webm") &&
          !firstCharacterImageUrl.includes(".mov");

        if (isValidImageUrl) {
          imageUrls.push(firstCharacterImageUrl);
          addedCharacterIds.add(firstCharId);
          const charName = firstCharacterCard.props.name || "Character 1";
          imageDescriptions.push(`${charName} (character reference)`);
        } else {
          addedCharacterIds.add(firstCharId); // Still mark as added to prevent duplication
        }
      }
    }

    // 3. Add second character image (only if different from first)
    if (secondCharacterImageUrl && secondCharacterCard) {
      const secondCharId = secondCharacterCard.id.toString();
      if (!addedCharacterIds.has(secondCharId)) {
        // Check if the URL is actually an image (not a video URL)
        const isValidImageUrl =
          !secondCharacterImageUrl.includes(".mp4") &&
          !secondCharacterImageUrl.includes(".webm") &&
          !secondCharacterImageUrl.includes(".mov");

        if (isValidImageUrl) {
          imageUrls.push(secondCharacterImageUrl);
          addedCharacterIds.add(secondCharId);
          const charName = secondCharacterCard.props.name || "Character 2";
          imageDescriptions.push(`${charName} (character reference)`);
        } else {
          addedCharacterIds.add(secondCharId); // Still mark as added to prevent duplication
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

    // Add style direction with emphasis on consistency
    prompt +=
      "Style: cinematic, detailed, high quality. MAINTAIN ABSOLUTE CHARACTER CONSISTENCY - characters must be instantly recognizable as the same individuals from the reference images";

    // If we have reference images, reinforce consistency
    if (imageUrls.length > 0) {
      prompt += ". Visual consistency with reference images is MANDATORY";
      prompt += ".";
    }

    // Session data logging removed

    return { prompt, imageUrls };
  }, [
    session,
    flow,
    processedData.messageTurns,
    processedData.lastMessageTurn,
    firstCharacterCard,
    secondCharacterCard,
    lastGeneratedImageUrl,
    isLastAssetVideo,
    firstCharacterImageUrl,
    secondCharacterImageUrl,
  ]);

  return {
    prompt,
    imageUrls,
    characterIds: characterCardIds,
  };
};
