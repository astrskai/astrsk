import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CharacterCard } from "@astrsk/design-system";
import { useImportCharacterFromCloud } from "@/entities/card/api/mutations";
import { getStorageUrl } from "@/shared/lib/cloud-download-helpers";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { LoadingDialog } from "@/shared/ui";
import type { FeaturedCharacterData } from "../api/homepage-queries";

interface CloudCharacterCardProps {
  character: FeaturedCharacterData;
}

/**
 * Character card for cloud characters from homepage sections
 * Displays character with click-to-import functionality
 */
export function CloudCharacterCard({ character }: CloudCharacterCardProps) {
  const navigate = useNavigate();
  const importMutation = useImportCharacterFromCloud();
  const [isImporting, setIsImporting] = useState(false);

  const imageUrl = character.icon_asset?.file_path
    ? getStorageUrl(character.icon_asset.file_path)
    : undefined;

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await importMutation.mutateAsync({
        characterId: character.id,
      });

      toastSuccess("Session created!", {
        description: `Started a chat with ${character.name}`,
      });

      // Navigate to the created session (character import creates a play session)
      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: result.sessionId },
      });
    } catch (error) {
      console.error("Failed to import character:", error);
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      toastError("Failed to import character", { description: message });
      setIsImporting(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // User closed dialog - stop showing loading, import continues in background
      setIsImporting(false);
    }
  };

  return (
    <>
      <CharacterCard
        name={character.name}
        imageUrl={imageUrl}
        summary={character.description || undefined}
        tags={character.tags || []}
        onClick={handleImport}
        isDisabled={isImporting}
        loading="lazy"
      />
      <LoadingDialog
        open={isImporting}
        message="Creating session..."
        subtitle={character.name}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}
