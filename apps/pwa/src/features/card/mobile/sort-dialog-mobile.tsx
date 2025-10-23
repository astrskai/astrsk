import { ArrowUpAZ } from "lucide-react";
import { Button } from "@/components-v2/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components-v2/ui/dialog";
import { cn } from "@/shared/lib";

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

export function SortDialogMobile({
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
          "bg-background-surface-4 w-[248px] rounded-[14px] border-0 p-0 outline-none",
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
                    "hover:bg-background-card-hover text-text-primary w-full px-6 py-4 text-center text-base transition-colors",
                    !isLast && "border-border-light border-b-[0.33px]",
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
