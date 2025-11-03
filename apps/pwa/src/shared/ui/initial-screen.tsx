import { SvgIcon } from "@/shared/ui";
import { cn } from "@/shared/lib";

const InitialScreen = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-6 px-4 py-20",
        "bg-background-surface-2 md:bg-[#1B1B1B]",
        className,
      )}
    >
      <div className="flex w-full grow flex-col items-center justify-center gap-[58px] text-[#757575]">
        <SvgIcon name="astrsk_symbol_fit" width={88} height={93} />
        <SvgIcon name="astrsk_logo_full" width={170} height={40} />
      </div>
      <div className="flex items-center gap-2 px-4 text-[#BFBFBF]">
        <SvgIcon name="lock_solid" size={20} className="flex-shrink-0" />
        <div className="text-[14px] md:text-[16px] select-none">
          <span>Your sessions are stored locally — </span>
          <span className="font-semibold">only on your device</span>
        </div>
      </div>
      <div className="text-text-info px-4 text-center text-[11px] md:text-[12px] leading-[15px] font-[400]">
        Company Name: harpy chat(jejoon yoo) / Address: 7, Samseong-ro 58-gil,
        Gangnam-gu, Seoul, Republic of Korea, 06282
        <br />
        Contact: +82-10-7490-1918 or cyoo@astrsk.ai / BRN: 299-88-02625
      </div>
    </div>
  );
};

export { InitialScreen };
