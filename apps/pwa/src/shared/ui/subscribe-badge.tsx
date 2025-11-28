import { cn } from "@/shared/lib";
import { SvgIcon } from "@/shared/ui";

const SubscribeBadge = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "absolute top-0 right-0 grid h-[16px] w-[26px] -translate-y-1/2 place-content-center",
        "bg-hover rounded-full border-[1px] border-[#B59EFF]",
        "text-[#B59EFF]",
        className,
      )}
    >
      <SvgIcon name="a_plus" width={14} height={6} />
    </div>
  );
};

export { SubscribeBadge };
