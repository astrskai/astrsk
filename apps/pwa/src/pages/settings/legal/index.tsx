import { useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { TypoBase, TypoXLarge } from "@/shared/ui";
import { LEGAL_ROUTES } from "@/shared/config/settings-routes";

export default function LegalPage() {
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[587px] px-4 py-4 md:py-20">
          {/* Desktop title - hidden on mobile */}
          <TypoXLarge className="text-text-primary mb-8 hidden font-semibold md:block">
            Legal
          </TypoXLarge>

          <div className="flex flex-col gap-4">
            {LEGAL_ROUTES.map((item) => (
              <div
                key={item.title}
                className="hover:bg-background-hover flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors"
                onClick={() => {
                  navigate({ to: item.path });
                }}
              >
                <TypoBase className="text-text-body font-semibold">
                  {item.title}
                </TypoBase>
                <ChevronRight className="text-text-secondary h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
