"use client";

import { CircleAlert } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/lib";

import { Button } from "@/shared/ui/button";

interface BannerProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const Banner = ({
  title,
  description,
  actionLabel = "Action",
  onAction,
  onDismiss,
  className,
}: BannerProps) => {
  return (
    <div
      className={cn(
        "px-4 py-3",
        "bg-destructive border border-destructive rounded-[8px]",
        "flex flex-row gap-1 items-center",
        className,
      )}
    >
      <div className="grow flex flex-row gap-3">
        <CircleAlert className="shrink-0 size-4 my-[2px]" />
        <div className="flex flex-col gap-1">
          {title && (
            <div className="font-[500] text-[14px] leading-[20px]">{title}</div>
          )}
          {description && (
            <div className="font-[400] text-[14px] leading-[20px] whitespace-nowrap">
              {description}
            </div>
          )}
        </div>
      </div>
      {onDismiss && (
        <Button size="lg" variant="destructive" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
      {onAction && (
        <Button
          size="lg"
          variant="destructive"
          className="bg-[#450A0A]"
          onClick={() => {
            onAction();
            onDismiss?.();
          }}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

type ShowBannerProps = Omit<BannerProps, "onDismiss">;

function showBanner(props: ShowBannerProps) {
  const toastId = toast.custom(
    (t) => (
      <Banner
        {...props}
        onDismiss={() => {
          toast.dismiss(t);
        }}
      />
    ),
    {
      duration: Infinity,
      dismissible: false,
    },
  );
  return toastId;
}

export { showBanner };
