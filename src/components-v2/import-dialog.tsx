import { useState, useRef, useEffect, ReactNode } from "react";
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
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
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
        className={cn("pt-14 w-[624px]", file && "pt-[24px]", className)}
        hideClose={hideCloseWhenFile && !!file}
      >
        {/* Title outside of content wrapper for default layout */}
        {!contentClassName && <DialogTitle>{title}</DialogTitle>}

        {!file ? (
          <div className={contentClassName}>
            {/* Title inside content wrapper when custom layout is used */}
            {contentClassName && (
              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                <div className="self-stretch h-9 justify-start text-text-primary text-2xl font-semibold leading-10">
                  {title}
                </div>
                {description && (
                  <div className="self-stretch justify-start text-text-subtle text-base font-normal leading-relaxed">
                    {description.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < description.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Default description for non-custom layouts */}
            {!contentClassName && description && <DialogDescription>{description}</DialogDescription>}
            <div
              className={cn(
                "border-dashed bg-background-surface-3 hover:bg-background-surface-4 rounded-2xl flex flex-col justify-center items-center p-8 cursor-pointer",
                contentClassName && "self-stretch px-16 py-8"
              )}
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Import size={contentClassName ? 64 : 72} className="text-muted-foreground" />
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
            {contentClassName && (
              <div className="self-stretch h-9 justify-start text-text-primary text-2xl font-semibold leading-10">
                {title}
              </div>
            )}
            {!contentClassName && <DialogTitle>{title}</DialogTitle>}
            
            <div className="self-stretch px-4 py-3 bg-background-surface-3 rounded outline outline-1 outline-offset-[-1px] outline-border-light inline-flex justify-between items-center gap-2">
              <div className="flex justify-start items-center gap-2">
                {fileIcon}
                <div className="justify-start text-text-primary text-base font-medium leading-relaxed">
                  {file.name} {`(${humanizeBytes(file.size)})`}
                </div>
              </div>
              <div className="w-6 h-6 relative opacity-70 rounded-sm overflow-hidden">
                <Button
                  variant="ghost_white"
                  onClick={handleRemoveFile}
                  className="w-6 h-6 p-0"
                >
                  <X className="min-w-4 min-h-4" />
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
                <Button size="lg" disabled={isImporting} onClick={handleImportClick}>
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