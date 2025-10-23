import { useEffect, useState } from "react";

import {
  Button, Dialog, DialogContent, DialogTitle,
  FloatingLabelInput,
} from "@/shared/ui";
import { Flow, FlowProps } from "@/modules/flow/domain";

export type FlowDialogMode = "create" | "edit";

interface FlowDialogProps {
  open: boolean;
  mode: FlowDialogMode;
  initialFlow?: Flow | null;
  onCreate?: (props: Partial<FlowProps>) => Promise<void>;
  onEdit?: (props: Partial<FlowProps>) => Promise<void>;
  onClose: () => void;
}

export function FlowDialog({
  open,
  mode,
  initialFlow,
  onCreate,
  onEdit,
  onClose,
}: FlowDialogProps) {
  const [name, setName] = useState(initialFlow?.props.name ?? "New flow");
  const [loading, setLoading] = useState(false);

  // Reset name when dialog opens/closes or initialFlow changes
  useEffect(() => {
    setName(initialFlow?.props.name ?? "New flow");
  }, [open, initialFlow]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (mode === "create" && onCreate) {
        await onCreate({ name });
      } else if (mode === "edit" && onEdit) {
        await onEdit({ name });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent hideClose>
        <DialogTitle>
          {mode === "create" ? "Create Flow" : "Edit Flow"}
        </DialogTitle>
        <div className="flex flex-col gap-4 mt-4">
          <FloatingLabelInput
            label="Flow name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="lg" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button size="lg" onClick={handleSave} disabled={loading}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
