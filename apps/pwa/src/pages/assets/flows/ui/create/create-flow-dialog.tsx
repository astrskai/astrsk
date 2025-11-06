import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui";
import { Button, Input } from "@/shared/ui/forms";
import { Flow } from "@/entities/flow/domain/flow";

interface CreateFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (props: Partial<Flow["props"]>) => Promise<void>;
}

/**
 * Create Flow Dialog
 * Simple dialog for creating a new flow with a name input
 */
export function CreateFlowDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateFlowDialogProps) {
  const [name, setName] = useState("New Flow");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await onCreate({ name });
      // Close dialog on success
      onOpenChange(false);
      // Reset name for next time
      setName("New Flow");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    // Reset name
    setName("New Flow");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="gap-2">
        <DialogTitle>Create workflow</DialogTitle>
        <DialogDescription>
          Name your workflow to organize your agent structure
        </DialogDescription>
        <div className="mt-4 flex flex-col gap-4">
          <Input
            label="Workflow name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isCreating}
            placeholder="Enter workflow name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
