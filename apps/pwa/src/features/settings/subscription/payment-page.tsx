import { Page, useAppStore } from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components/ui/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { toastSuccess } from "@/components-v2/ui/toast-success";

const PaymentPage = () => {
  // Page navigation
  const setActivePage = useAppStore.use.setActivePage();

  return (
    <div className={cn("absolute inset-0 top-[var(--topbar-height)] z-40")}>
      {/* Close */}
      <button
        className="text-text-subtle absolute top-[34px] right-[40px] z-50"
        onClick={() => {
          setActivePage(Page.Subscribe);
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      {/* Main */}
      <div className="bg-background-surface-2 absolute inset-0 grid place-content-center">
        <div className="mb-10">TODO: integrate payment gateway</div>
        <Button
          size="lg"
          onClick={() => {
            toastSuccess({
              title: "Payment successful!",
              details: "Welcome to astrsk+ - enjoy your premium features",
            });
            setActivePage(Page.Init);
          }}
        >
          TEST: success payment
        </Button>
      </div>
    </div>
  );
};

export { PaymentPage };
