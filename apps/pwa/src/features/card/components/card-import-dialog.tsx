import { useState } from "react";
import { ImportDialog } from "@/shared/ui/import-dialog";
import { SvgIcon } from "@/shared/ui/svg-icon";

interface CardImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportFile: (file: File) => void;
  accept?: string;
  title?: string;
  description?: string;
}

export function CardImportDialog({
  open,
  onOpenChange,
  onImportFile,
  accept = ".json,.png",
  title = "Import card",
  description = "Supports both V2 and V3 character cards.",
}: CardImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    if (accept && file) {
      const acceptedTypes = accept.split(",").map((ext) => {
        if (ext.startsWith(".")) {
          // Convert extension to mime type
          if (ext === ".json") return "application/json";
          if (ext === ".png") return "image/png";
          return ext;
        }
        return ext;
      });

      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const isAccepted =
        accept.split(",").includes(fileExtension) ||
        acceptedTypes.includes(file.type);

      if (!isAccepted) {
        console.warn(`File type not accepted: ${file.type} (${fileExtension})`);
        return;
      }
    }

    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (selectedFile) {
      onImportFile(selectedFile);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setSelectedFile(null);
    }
  };

  return (
    <ImportDialog
      open={open}
      onOpenChange={handleOpenChange}
      onImport={handleImport}
      title={title}
      description={
        description === "Supports both V2 and V3 character cards."
          ? "No matter where your card was created — it's good to go.\nOur platform supports all V2 and V3 cards, across tools."
          : description
      }
      accept={accept}
      fileIcon={<SvgIcon name="cards_solid" size={24} />}
      className="p-2 pt-8"
      contentClassName="px-4 pb-4 flex flex-col justify-start items-center gap-6"
      hideCloseWhenFile={false}
      file={selectedFile}
      onFileSelect={handleFileSelect}
      onFileRemove={() => setSelectedFile(null)}
    />
  );
}
