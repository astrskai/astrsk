import { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  Loading,
} from "@/shared/ui";
import { ExportType } from "@/shared/lib/cloud-upload-helpers";

export interface SessionExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => Promise<void>;
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

  const isCloudExport = exportType === "cloud";

  // Auto-export when dialog opens
  useEffect(() => {
    if (open && !isExporting) {
      const doExport = async () => {
        setIsExporting(true);
        try {
          await onExport();
          onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={isExporting ? undefined : onOpenChange}>
      <DialogContent className="max-w-sm">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <Loading />
          <p className="text-fg-muted text-base">
            {isCloudExport ? "Uploading to cloud..." : "Exporting..."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
