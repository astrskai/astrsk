import { Ellipsis } from "lucide-react";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components-v2/ui/dialog";
import { cn } from "@/shared/lib/cn";

export type ListEditAction = "copy" | "export" | "import" | "delete";

interface ListEditDialogProps {
  actions?: ListEditAction[];
  onAction: (action: ListEditAction) => void;
  disabled?: {
    copy?: boolean;
    export?: boolean;
    import?: boolean;
    delete?: boolean;
  };
  triggerClassName?: string;
  contentClassName?: string;
}

export function ListEditDialogMobile({
  actions = ["copy", "export", "import", "delete"],
  onAction,
  disabled = {},
  triggerClassName,
  contentClassName,
}: ListEditDialogProps) {
  const actionConfig = {
    copy: {
      label: "Copy",
      className: "border-b-[0.33px] border-border-light",
    },
    export: {
      label: "Export",
      className: "border-b-[0.33px] border-border-light",
    },
    import: {
      label: "Import",
      className: "border-b-[0.33px] border-border-light",
    },
    delete: {
      label: "Delete",
      className: "",
    },
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost_white"
          size="icon"
          className={cn("h-[40px] w-[40px] p-[8px]", triggerClassName)}
        >
          <Ellipsis className="min-h-6 min-w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "bg-background-surface-4 w-60 overflow-hidden rounded-2xl border-0 p-0 shadow-none backdrop-blur-xl outline-none",
          contentClassName,
        )}
        hideClose
      >
        <div className="flex flex-col">
          {actions.map((action) => {
            const config = actionConfig[action];
            const isDisabled = disabled[action];

            return (
              <DialogClose key={action} asChild>
                <button
                  className={cn(
                    "hover:bg-background-card-hover text-text-primary flex h-14 w-full items-center justify-center text-base leading-snug font-normal transition-colors",
                    config.className,
                    isDisabled && "text-text-placeholder",
                  )}
                  onClick={() => onAction(action)}
                  disabled={isDisabled}
                >
                  {config.label}
                </button>
              </DialogClose>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
