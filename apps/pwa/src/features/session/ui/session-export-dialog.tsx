import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Loading,
  Button,
} from "@/shared/ui";
import { ExportType } from "@/shared/lib/cloud-upload-helpers";
import { ExternalLink } from "lucide-react";

export interface SessionExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => Promise<string | void>;
  /** Export type - "file" for local download, "cloud" for Harpy upload */
  exportType?: ExportType;
}

export function SessionExportDialog({
  open,
  onOpenChange,
  onExport,
  exportType = "file",
}: SessionExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const isCloudExport = exportType === "cloud";

  // Auto-export when dialog opens
  useEffect(() => {
    if (open && !isExporting && !shareUrl) {
      const doExport = async () => {
        setIsExporting(true);
        try {
          const url = await onExport();
          if (url && isCloudExport) {
            // Cloud export - show success with URL
            setShareUrl(url);
          } else {
            // File export - close immediately
            onOpenChange(false);
          }
        } catch {
          // Error handled by onExport, just close
          onOpenChange(false);
        } finally {
          setIsExporting(false);
        }
      };
      doExport();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setShareUrl(null);
      setIsExporting(false);
    }
  }, [open]);

  const handleGoToHarpy = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={isExporting ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm">
        {isExporting ? (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loading />
            <p className="text-fg-muted text-base">
              {isCloudExport ? "Uploading to HarpyChat..." : "Exporting..."}
            </p>
          </div>
        ) : shareUrl ? (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Upload Successful</DialogTitle>
              <DialogDescription>
                Your resource has been uploaded to HarpyChat. Click the button below to claim it.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleGoToHarpy}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Go to Harpy
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
