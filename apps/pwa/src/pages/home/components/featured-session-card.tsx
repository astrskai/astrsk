import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SessionCard } from "@astrsk/design-system";
import { useImportSessionFromCloud } from "@/entities/session/api/mutations";
import { getStorageUrl } from "@/shared/lib/cloud-download-helpers";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import { LoadingDialog } from "@/shared/ui";
import type { FeaturedSessionData } from "../api/homepage-queries";

const SESSION_PLACEHOLDER_IMAGE = "/img/placeholder/scenario-placeholder.png";

interface FeaturedSessionCardProps {
  session: FeaturedSessionData;
}

/**
 * Session card for featured sessions from homepage_sections
 * Clicking imports the session and navigates directly to play
 */
export function FeaturedSessionCard({ session }: FeaturedSessionCardProps) {
  const navigate = useNavigate();
  const importMutation = useImportSessionFromCloud();
  const [isImporting, setIsImporting] = useState(false);

  const coverImageUrl = session.cover_asset?.file_path
    ? getStorageUrl(session.cover_asset.file_path)
    : undefined;

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await importMutation.mutateAsync({
        sessionId: session.id,
        isPlaySession: true, // Create as play session
      });

      toastSuccess("Session imported!", {
        description: `Ready to play: ${result.name}`,
      });

      // Navigate to the imported session
      navigate({
        to: "/sessions/$sessionId",
        params: { sessionId: result.id.toString() },
      });
    } catch (error) {
      console.error("Failed to import session:", error);
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      toastError("Failed to import session", { description: message });
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
      <SessionCard
        title={session.title || session.name || "Untitled Session"}
        imageUrl={coverImageUrl}
        placeholderImageUrl={SESSION_PLACEHOLDER_IMAGE}
        summary={session.summary || undefined}
        tags={session.tags || undefined}
        onClick={handleImport}
        isDisabled={isImporting}
        loading="lazy"
      />
      <LoadingDialog
        open={isImporting}
        message="Importing session..."
        subtitle={session.title || session.name || "Untitled Session"}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}
