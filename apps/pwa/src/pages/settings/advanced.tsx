import { useEffect, useState } from "react";
import { Switch, TypoBase, TypoXLarge } from "@/shared/ui";

export default function AdvancedPage() {
  const [allowInsecureContent, setAllowInsecureContent] = useState(false);

  useEffect(() => {
    const getConfigs = async () => {
      if (!window.api?.config) {
        return;
      }
      setAllowInsecureContent(
        await window.api.config.getConfig("allowInsecureContent"),
      );
    };
    getConfigs();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Content */}
      <div className="bg-background-surface-2 md:bg-background-surface-1 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
          {/* Desktop title - hidden on mobile */}
          <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
            Advanced Preferences
          </TypoXLarge>

          <div className="flex justify-between">
            <div className="flex flex-col gap-[8px]">
              <TypoBase className="text-text-body font-semibold">
                Allow HTTP connection
              </TypoBase>
              <div className="text-text-info text-[12px] leading-[15px] font-[400]">
                Enable this option if you want to connect providers serving on
                non-local devices via HTTP.
                <br />
                This option will take effect after the app restarts.
                <br />
                <span className="text-status-destructive-light">
                  Allowing HTTP connection lowers the security level of the app.
                </span>
              </div>
            </div>
            <Switch
              checked={allowInsecureContent}
              onCheckedChange={(checked) => {
                setAllowInsecureContent(checked);
                if (!window.api?.config) {
                  return;
                }
                window.api.config.setConfig("allowInsecureContent", checked);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
