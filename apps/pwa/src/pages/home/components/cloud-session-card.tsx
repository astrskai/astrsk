import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SessionCard } from "@astrsk/design-system";
import { useImportSessionFromCloud } from "@/entities/session/api/mutations";
import { getStorageUrl } from "@/shared/lib/cloud-download-helpers";
import { toastSuccess, toastError } from "@/shared/ui/toast";
import type { HomepageBannerData } from "../api/homepage-queries";

const SESSION_PLACEHOLDER_IMAGE = "/img/placeholder/scenario-placeholder.png";

interface CloudSessionCardProps {
  banner: HomepageBannerData;
}

/**
 * Session card for cloud sessions from homepage banners
 * Clicking imports the session and navigates directly to play
 */
export function CloudSessionCard({ banner }: CloudSessionCardProps) {
  const navigate = useNavigate();
  const importMutation = useImportSessionFromCloud();
  const [isImporting, setIsImporting] = useState(false);

  const session = banner.session;

  if (!session) {
    return null;
  }

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

  return (
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
  );
}
