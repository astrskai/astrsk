import { cn } from "@/shared/lib";
import { Button, ScrollArea } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/shared/ui";
import { CircleAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const CustomError = ({
  toastId,
  title,
  details,
}: {
  toastId: string | number;
  title: string;
  details: string;
}) => {
  const [isOpenDetails, setIsOpenDetails] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  return (
    <>
      <div
        className={cn(
          "w-[431px] px-[16px] py-[12px] bg-status-destructive",
          "border-[1px] border-status-destructive-light rounded-[8px]",
          "flex flex-col gap-[4px] transition-opacity opacity-100",
          (isOpenDetails || isDismissed) && "opacity-0",
        )}
      >
        <div className="flex flex-row gap-[12px] items-center">
          <CircleAlert size={16} />
          <div className="w-full font-[500] text-[14px] leading-[20px] text-text-primary truncate">
            {title}
          </div>
        </div>
        <div className="ml-[28px] font-[400] text-[14px] leading-[20px] text-text-primary opacity-70 line-clamp-2">
          {details}
        </div>
        <div className="place-self-end flex flex-row gap-[4px]">
          <Button
            size="lg"
            variant="ghost_white"
            onClick={() => {
              setIsDismissed(true);
              toast.dismiss(toastId);
            }}
          >
            Dismiss
          </Button>
          <Button
            size="lg"
            variant="destructive"
            className="bg-status-destructive-dark" // TODO: hover bg color
            onClick={() => {
              setIsOpenDetails(true);
            }}
          >
            View details
          </Button>
        </div>
      </div>
      <Dialog open={isOpenDetails}>
        <DialogContent hideClose>
          <DialogTitle className="truncate">{title}</DialogTitle>
          <DialogDescription className="rounded-[12px] bg-background-surface-3">
            <ScrollArea className="h-full max-h-[624px] p-[8px] overflow-x-hidden">
              <pre className="font-mono text-[12px] leading-[18px] whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {details}
              </pre>
            </ScrollArea>
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(details);
              }}
            >
              Copy details
            </Button>
            <Button
              onClick={() => {
                setIsDismissed(true);
                setIsOpenDetails(false);
                toast.dismiss(toastId);
              }}
            >
              Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const toastError = ({ title, details }: { title: string; details: string }) => {
  toast.custom(
    (toastId) => (
      <CustomError toastId={toastId} title={title} details={details} />
    ),
    {
      duration: Infinity, // Prevent auto close
    },
  );
};

export { toastError };
