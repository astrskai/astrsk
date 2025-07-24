import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { Share, SquarePlus } from "lucide-react";

export function InstallPwa({
  canInstall,
  install,
}: {
  canInstall?: boolean;
  install?: () => void;
}) {
  return (
    <div className="h-dvh bg-background-surface-1 flex flex-col justify-center p-[24px] gap-[32px] font-inter">
      <div
        className={cn(
          "w-full font-[600] text-[48px] leading-[52.8px]",
          "bg-radial-[at_40%_90%] from-primary-normal to-text-primary to-35% bg-clip-text text-transparent",
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
            <div className="font-[500] text-[14px] leading-[20px] text-text-input-subtitle">
              To install the app on iOS
            </div>
            <ol
              className={cn(
                "list-decimal pl-[18px] space-y-[8px]",
                "font-[500] text-[14px] leading-[20px] text-text-muted-title",
                "[&>strong]:font-[600] [&>strong]:text-text-primary",
              )}
            >
              <li>
                Tab
                <span className="inline-block align-bottom p-[4px] mx-[8px] bg-background-card rounded-[8px]">
                  <Share size={16} />
                </span>
                <strong>share</strong> in the address bar
              </li>
              <li>
                Swipe up and tap
                <span className="inline-block align-bottom p-[4px] mx-[8px] bg-background-card rounded-[8px]">
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
