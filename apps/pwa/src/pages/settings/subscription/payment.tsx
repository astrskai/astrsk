import { Page, useAppStore } from "@/shared/stores/app-store";
import { cn } from "@/shared/lib";
import { Button, SvgIcon } from "@/shared/ui";
import { toastSuccess } from "@/shared/ui/toast";

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
            toastSuccess("Payment successful!", {
              description: "Welcome to astrsk+ - enjoy your premium features",
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
