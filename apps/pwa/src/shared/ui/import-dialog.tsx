import { useRef, ReactNode } from "react";
import { Import, X, Loader2 } from "lucide-react";
import { DialogBase } from "@/shared/ui/dialogs/base";
import { Button, TypoBase } from "@/shared/ui";
import { cn } from "@/shared/lib";

// Helper function to humanize bytes
export const humanizeBytes = (bytes: number): string => {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

export interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => Promise<void>;
  title: string;
  description?: string;
  accept?: string;
  fileIcon?: ReactNode;
  className?: string;
  hideCloseWhenFile?: boolean;
  // File handling
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  // Custom content to show after file selection
  children?: ReactNode;
  // Loading state
  isImporting?: boolean;
}

export function ImportDialog({
  open,
  onOpenChange,
  onImport,
  title,
  description = "",
  accept = ".json",
  fileIcon,
  className,
  hideCloseWhenFile = true,
  file,
  onFileSelect,
  onFileRemove,
  children,
  isImporting = false,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
      e.target.value = "";
    }
  };

  const handleRemoveFile = () => {
    if (onFileRemove) {
      onFileRemove();
    } else {
      // Default behavior: just clear the file
      onFileSelect(null as any);
    }
  };

  const handleImportClick = async () => {
    await onImport();
  };

  const renderContent = () => {
    if (!file) {
      // File selection state
      return (
        <div
          className={cn(
            "bg-surface-overlay hover:bg-surface-raised flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border-default p-8",
          )}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Import size={64} className="text-fg-subtle" />
          <div>
            <TypoBase className="text-fg-subtle">
              Choose a file or drag it here
            </TypoBase>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>
      );
    }

    // File selected state
    return (
      <div className="flex flex-col gap-4">
        {/* Selected file info */}
        <div className="bg-surface-overlay outline-border-default inline-flex items-center justify-between gap-2 self-stretch rounded px-4 py-3 outline outline-offset-[-1px]">
          <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
            <div className="flex-shrink-0">{fileIcon}</div>
            <div className="text-fg-default min-w-0 flex-1 truncate text-base leading-relaxed font-medium">
              {file.name} {`(${humanizeBytes(file.size)})`}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button
              variant="ghost_white"
              onClick={handleRemoveFile}
              className="h-6 w-6 p-0"
            >
              <X className="min-h-4 min-w-4" />
            </Button>
          </div>
        </div>

        {/* Custom content (agent models, checkboxes, etc.) */}
        {children}
      </div>
    );
  };

  const renderFooter = () => {
    if (!file) return undefined;

    return (
      <div className="flex justify-end gap-2">
        <Button
          size="lg"
          disabled={isImporting}
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button size="lg" disabled={isImporting} onClick={handleImportClick}>
          {isImporting && <Loader2 className="animate-spin" />}
          Import
        </Button>
      </div>
    );
  };

  return (
    <DialogBase
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      content={renderContent()}
      footer={renderFooter()}
      isShowCloseButton={!(hideCloseWhenFile && !!file)}
      size="lg"
      className={className}
    />
  );
}
