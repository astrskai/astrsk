import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { TypoBase, TypoXLarge } from "@/components-v2/typo";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";

export const Route = createFileRoute("/_layout/settings/legal/")({
  component: LegalPage,
});

function LegalPage() {
  const navigate = useNavigate();

  return (
    <div className="relative h-full">
      <ScrollArea className="h-full">
        <div className="mx-auto my-6 w-full max-w-[587px] pt-[80px]">
          <div className="text-text-body mb-12 flex flex-col gap-8">
            <TypoXLarge className="text-text-primary font-semibold">
              Legal
            </TypoXLarge>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                navigate({ to: "/settings/legal/privacy-policy" });
              }}
            >
              <TypoBase className="text-text-body font-semibold">
                Privacy Policy
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                navigate({ to: "/settings/legal/terms-of-service" });
              }}
            >
              <TypoBase className="text-text-body font-semibold">
                Term of Use
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                navigate({ to: "/settings/legal/content-policy" });
              }}
            >
              <TypoBase className="text-text-body font-semibold">
                Content Policy
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                navigate({ to: "/settings/legal/refund-policy" });
              }}
            >
              <TypoBase className="text-text-body font-semibold">
                Refund Policy
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => {
                navigate({ to: "/settings/legal/oss-notice" });
              }}
            >
              <TypoBase className="text-text-body font-semibold">
                Open-source Software Notice
              </TypoBase>
              <ChevronRight className="text-text-secondary h-5 w-5" />
            </div>
          </div>
        </div>
        <ScrollBar orientation="vertical" className="w-1.5" />
      </ScrollArea>
    </div>
  );
}
