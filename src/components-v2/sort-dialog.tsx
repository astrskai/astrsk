import { ArrowUpAZ } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./ui/dialog";
import { cn } from "./lib/utils";

export type SortOption = {
  value: string;
  label: string;
};

interface SortDialogProps {
  options: SortOption[];
  onSort: (value: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
}

export function SortDialog({
  options,
  onSort,
  triggerClassName,
  contentClassName,
}: SortDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost_white"
          size="icon"
          className={cn("h-[40px] w-[40px] p-[8px]", triggerClassName)}
        >
          <ArrowUpAZ className="min-h-6 min-w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "w-[248px] p-0 bg-background-surface-4 border-0 outline-none rounded-[14px]",
          contentClassName,
        )}
        hideClose
      >
        <div className="flex flex-col py-2">
          {options.map((option, index) => {
            const isLast = index === options.length - 1;

            return (
              <DialogClose key={option.value} asChild>
                <button
                  className={cn(
                    "w-full text-center px-6 py-4 hover:bg-background-card-hover transition-colors text-text-primary text-base",
                    !isLast && "border-b-[0.33px] border-border-light",
                  )}
                  onClick={() => onSort(option.value)}
                >
                  {option.label}
                </button>
              </DialogClose>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
