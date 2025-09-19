import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";

const SubscribeBadge = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute top-0 right-0 -translate-y-1/2 w-[26px] h-[16px] grid place-content-center",
        "bg-background-surface-4 rounded-full border-[#B59EFF] border-[1px]",
        "text-[#B59EFF]",
        className,
      )}
    >
      <SvgIcon name="a_plus" width={14} height={6} />
    </div>
  );
};

export { SubscribeBadge };
