import { useDropzone } from "react-dropzone";
import { Import, FileX } from "lucide-react";
import { cn } from "@/shared/lib";

interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileDropZone({
  onDrop,
  accept,
  maxFiles = 1,
  disabled = false,
  className,
  children,
}: FileDropZoneProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxFiles,
      disabled,
    });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed bg-surface-raised px-8 py-16 text-center transition-colors",
        isDragReject && isDragActive
          ? "border-status-error bg-status-error/10"
          : isDragActive
            ? "border-neutral-100 bg-neutral-100/10"
            : "border-default hover:border-subtle",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="flex flex-col items-center gap-2 text-fg-muted">
          {isDragReject && isDragActive ? (
            <FileX className="h-8 w-8 text-status-error/80" />
          ) : (
            <Import
              className={cn(
                "h-8 w-8",
                isDragActive && "animate-pulse text-fg-default",
              )}
            />
          )}
          <p className="text-base">
            {isDragReject && isDragActive ? (
              <span className="text-status-error/80">
                {maxFiles > 1
                  ? "Contains unsupported file type"
                  : "Unsupported file type"}
              </span>
            ) : isDragActive ? (
              <span className="text-fg-default">
                Drop file{maxFiles > 1 ? "s" : ""} here
              </span>
            ) : (
              `Drag and drop file${maxFiles > 1 ? "s" : ""} here, or click to select`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
