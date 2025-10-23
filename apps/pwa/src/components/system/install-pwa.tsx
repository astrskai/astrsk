import { cn } from "@/shared/lib";
import { SvgIcon } from "@/components/ui/svg-icon";
import { Button } from "@/shared/ui/button";
import { Share, SquarePlus } from "lucide-react";

export function InstallPwa({
  canInstall,
  install,
}: {
  canInstall?: boolean;
  install?: () => void;
}) {
  return (
    <div className="bg-background-surface-1 font-inter flex h-dvh flex-col justify-center gap-[32px] p-[24px]">
      <div
        className={cn(
          "w-full text-[48px] leading-[52.8px] font-[600]",
          "from-primary-normal to-text-primary bg-radial-[at_40%_90%] to-35% bg-clip-text text-transparent",
        )}
      >
        Add astrsk.ai
        <br />
        app to your
        <br />
        home screen
      </div>
      {canInstall ? (
        <Button size="lg" className="w-full" onClick={install}>
          <SvgIcon name="android_logo" size={18} />
          Download for Android
        </Button>
      ) : (
        <div className="flex flex-col gap-[24px]">
          <div className="flex flex-col gap-[8px]">
            <div className="text-text-input-subtitle text-[14px] leading-[20px] font-[500]">
              To install the app on iOS
            </div>
            <ol
              className={cn(
                "list-decimal space-y-[8px] pl-[18px]",
                "text-text-muted-title text-[14px] leading-[20px] font-[500]",
                "[&>strong]:text-text-primary [&>strong]:font-[600]",
              )}
            >
              <li>
                Tab
                <span className="bg-background-card mx-[8px] inline-block rounded-[8px] p-[4px] align-bottom">
                  <Share size={16} />
                </span>
                <strong>share</strong> in the address bar
              </li>
              <li>
                Swipe up and tap
                <span className="bg-background-card mx-[8px] inline-block rounded-[8px] p-[4px] align-bottom">
                  <SquarePlus size={16} />
                </span>
                <strong>Add to Home Screen</strong>
              </li>
              <li>
                Tab Add button, the PWA will now be added to your home screen as
                an app icon.
              </li>
            </ol>
          </div>
          <div className="flex flex-row gap-[16px]">
            <div className="basis-1/3">
              <img src="/img/install_pwa_ios_1.png" className="w-full" />
            </div>
            <div className="basis-1/3">
              <img src="/img/install_pwa_ios_2.png" className="w-full" />
            </div>
            <div className="basis-1/3">
              <img src="/img/install_pwa_ios_3.png" className="w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
