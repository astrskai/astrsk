import { SvgIcon } from "@/components-v2/svg-icon";
import { cn } from "@/shared/utils";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";

const InitialPage = ({ className }: { className?: string }) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-36 w-full h-full",
        isMobile ? "bg-background-surface-2" : "bg-[#1B1B1B]",
        className,
      )}
    >
      <div className="flex flex-col gap-[58px] grow items-center justify-center w-full text-[#757575]">
        <SvgIcon name="astrsk_symbol_fit" width={88} height={93} />
        <SvgIcon name="astrsk_logo_full" width={170} height={40} />
      </div>
      <div className="flex gap-2 items-center text-[#BFBFBF]">
        <SvgIcon name="lock_solid" size={20} />
        <div className="text-[16px] select-none">
          <span>Your sessions are stored locally — </span>
          <span className="font-semibold">only on your device</span>
        </div>
      </div>
    </div>
  );
};

export { InitialPage };
