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
        "cursor-pointer rounded-lg border-2 border-dashed bg-gray-900 px-8 py-16 text-center transition-colors",
        isDragReject && isDragActive
          ? "border-status-destructive-light bg-status-destructive/10"
          : isDragActive
            ? "border-gray-100 bg-gray-100/10"
            : "border-gray-700 hover:border-gray-500",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input {...getInputProps()} />
      {children || (
        <div className="flex flex-col items-center gap-2 text-gray-300">
          {isDragReject && isDragActive ? (
            <FileX className="text-status-destructive-light/80 h-8 w-8" />
          ) : (
            <Import
              className={cn(
                "h-8 w-8",
                isDragActive && "animate-pulse text-gray-100",
              )}
            />
          )}
          <p className="text-base">
            {isDragReject && isDragActive ? (
              <span className="text-status-destructive-light/80">
                {maxFiles > 1
                  ? "Contains unsupported file type"
                  : "Unsupported file type"}
              </span>
            ) : isDragActive ? (
              <span className="text-gray-100">
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
