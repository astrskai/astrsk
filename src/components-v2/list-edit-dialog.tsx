import { Ellipsis } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./ui/dialog";
import { cn } from "./lib/utils";

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

export function ListEditDialog({
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
          "w-60 p-0 bg-background-surface-4 backdrop-blur-xl rounded-2xl border-0 outline-none shadow-none overflow-hidden",
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
                    "w-full h-14 flex items-center justify-center hover:bg-background-card-hover transition-colors text-text-primary text-base font-normal leading-snug",
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
