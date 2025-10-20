import { useRef, ReactNode } from "react";
import { Import, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components-v2/ui/dialog";
import { Button } from "@/components-v2/ui/button";
import { TypoBase } from "@/components-v2/typo";
import { cn } from "@/components-v2/lib/utils";

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
  maxWidth?: string;
  className?: string;
  contentClassName?: string;
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
  maxWidth = "max-w-2xl",
  className,
  contentClassName,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("w-[624px] pt-14", file && "pt-[24px]", className)}
        hideClose={hideCloseWhenFile && !!file}
      >
        {/* Always use DialogTitle for accessibility */}
        {!file && !contentClassName && <DialogTitle>{title}</DialogTitle>}

        {!file ? (
          <div className={contentClassName}>
            {/* Title inside content wrapper when custom layout is used */}
            {contentClassName && (
              <div className="flex flex-col items-start justify-start gap-2 self-stretch">
                <DialogTitle className="text-text-primary h-9 justify-start self-stretch text-2xl leading-10 font-semibold">
                  {title}
                </DialogTitle>
                {description && (
                  <div className="text-text-subtle justify-start self-stretch text-base leading-relaxed font-normal">
                    {description.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < description.split("\n").length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Default description for non-custom layouts */}
            {!contentClassName && description && (
              <DialogDescription>{description}</DialogDescription>
            )}
            <div
              className={cn(
                "bg-background-surface-3 hover:bg-background-surface-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-dashed p-8",
                contentClassName && "self-stretch px-16 py-8",
              )}
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Import
                size={contentClassName ? 64 : 72}
                className="text-muted-foreground"
              />
              <div>
                <TypoBase className="text-muted-foreground">
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
          </div>
        ) : (
          <div className={contentClassName || "flex flex-col gap-[24px]"}>
            {/* Title for file selected state */}
            <DialogTitle
              className={cn(
                contentClassName &&
                  "text-text-primary h-9 justify-start self-stretch text-2xl leading-10 font-semibold",
              )}
            >
              {title}
            </DialogTitle>

            <div className="bg-background-surface-3 outline-border-light inline-flex items-center justify-between gap-2 self-stretch rounded px-4 py-3 outline outline-offset-[-1px]">
              <div className="flex items-center justify-start gap-2">
                {fileIcon}
                <div className="text-text-primary justify-start text-base leading-relaxed font-medium">
                  {file.name} {`(${humanizeBytes(file.size)})`}
                </div>
              </div>
              <div className="relative h-6 w-6 overflow-hidden rounded-sm opacity-70">
                <Button
                  variant="ghost_white"
                  onClick={handleRemoveFile}
                  className="h-6 w-6 p-0"
                >
                  <X className="min-h-4 min-w-4" />
                </Button>
              </div>
            </div>

            {children}

            <div className="self-stretch">
              <DialogFooter>
                <DialogClose asChild>
                  <Button size="lg" disabled={isImporting} variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  size="lg"
                  disabled={isImporting}
                  onClick={handleImportClick}
                >
                  {isImporting && <Loader2 className="animate-spin" />}
                  Import
                </Button>
              </DialogFooter>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
