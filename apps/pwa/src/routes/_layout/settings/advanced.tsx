import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FloatingActionButton } from "@/shared/ui/floating-action-button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import { TypoBase, TypoXLarge } from "@/components/ui/typo";
import { Switch } from "@/shared/ui/switch";

export const Route = createFileRoute("/_layout/settings/advanced")({
  component: AdvancedPage,
});

function AdvancedPage() {
  const navigate = useNavigate();
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
    <div className="relative h-full">
      <FloatingActionButton
        icon={<ArrowLeft className="min-h-[24px] min-w-[24px]" />}
        label="Settings"
        position="top-left"
        onClick={() => {
          navigate({ to: "/settings" });
        }}
      />
      <ScrollArea className="h-full">
        <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
          <div className="text-text-primary mb-12 flex flex-col gap-8">
            <TypoXLarge className="text-text-primary font-semibold">
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
                    Allowing HTTP connection lowers the security level of the
                    app.
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
        <ScrollBar orientation="vertical" className="w-1.5" />
      </ScrollArea>
    </div>
  );
}
