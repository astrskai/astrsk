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
          "bg-status-destructive w-[calc(100dvw-2rem)] px-[8px] py-[6px] md:w-[431px] md:px-[16px] md:py-[12px]",
          "border-status-destructive-light rounded-[8px] border-[1px]",
          "flex flex-col gap-[4px] opacity-100 transition-opacity",
          (isOpenDetails || isDismissed) && "opacity-0",
        )}
      >
        <div className="flex flex-row items-center gap-[12px]">
          <CircleAlert size={16} />
          <div className="text-text-primary w-full truncate text-[14px] leading-[20px] font-[500]">
            {title}
          </div>
        </div>
        <div className="text-text-primary ml-[28px] line-clamp-2 text-[14px] leading-[20px] font-[400] opacity-70">
          {details}
        </div>
        <div className="flex flex-row gap-[4px] place-self-end">
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
            className="bg-status-destructive" // TODO: hover bg color
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
          <div className="bg-background-surface-3 rounded-[12px]">
            <ScrollArea className="h-full max-h-[624px] overflow-x-hidden p-[8px]">
              <pre
                className="max-w-full font-mono text-[12px] leading-[18px] break-all whitespace-pre-wrap"
                style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
              >
                {details}
              </pre>
            </ScrollArea>
          </div>
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
