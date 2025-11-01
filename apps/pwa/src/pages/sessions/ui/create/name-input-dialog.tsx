import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/shared/ui";
import { SearchInput } from "@/shared/ui/forms";
import { cn } from "@/shared/lib";

interface NameInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for entering session name and uploading optional background image
 * before navigating to create session page
 */
export function NameInputDialog({ open, onOpenChange }: NameInputDialogProps) {
  const navigate = useNavigate();
  const [sessionName, setSessionName] = useState("New Session");
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundImage(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleNext = () => {
    // Navigate to create session page with session name
    navigate({
      to: "/sessions/new",
      search: { sessionName },
    });
    onOpenChange(false);

    // Reset form
    setSessionName("New Session");
    setBackgroundImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);

    // Reset form
    setSessionName("New Session");
    setBackgroundImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Session</DialogTitle>
          <DialogDescription>
            Name your session and optionally upload a background image
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Session Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-text-primary text-sm font-medium">
              Session Name <span className="text-red-500">*</span>
            </label>
            <SearchInput
              name="session-name"
              placeholder="Enter session name"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Background Image Upload (Optional) */}
          <div className="flex flex-col gap-2">
            {/* <label className="text-text-primary text-sm font-medium">
              Background Image <span className="text-text-secondary text-xs">(Optional)</span>
            </label> */}

            {/* Preview or Upload Area */}
            {/* <div
              className={cn(
                "border-border hover:border-primary relative flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                previewUrl && "border-solid",
              )}
              onClick={() => document.getElementById("background-upload")?.click()}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Background preview"
                    className="h-full w-full rounded-lg object-cover"
                  />
                  <div className="bg-background-surface-1/80 absolute inset-0 flex items-center justify-center rounded-lg opacity-0 transition-opacity hover:opacity-100">
                    <span className="text-text-primary text-sm">Click to change</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-text-secondary" />
                  <span className="text-text-secondary text-sm">
                    Click to upload image
                  </span>
                </div>
              )}
            </div> */}

            <input
              id="background-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        <DialogFooter>
          <Button size="lg" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="lg" onClick={handleNext} disabled={!sessionName.trim()}>
            Next
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
