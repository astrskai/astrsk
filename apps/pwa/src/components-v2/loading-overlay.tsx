import { useAppStore } from "@/app/stores/app-store";
import { useIsMobile } from "@/components-v2/hooks/use-mobile";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { useEffect } from "react";

export const LoadingOverlay = () => {
  const isLoading = useAppStore.use.isLoading();
  const isMobile = useIsMobile();

  useEffect(() => {
    console.log("isLoading!!!!!!", isLoading);
  }, [isLoading]);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[120]",
        "bg-screen/50 backdrop-blur-sm",
        "transition-opacity duration-200",
        "flex items-center justify-center",
      )}
    >
      <div className="flex flex-col items-center justify-center gap-8 px-4">
        <div
          className="animate-spin-slow"
          style={{
            width: isMobile ? "90px" : "120px",
            height: isMobile ? "90px" : "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SvgIcon name="astrsk_symbol" size={isMobile ? 90 : 120} />
        </div>
      </div>
    </div>
  );
};
