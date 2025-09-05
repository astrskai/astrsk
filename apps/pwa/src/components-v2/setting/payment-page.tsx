import {
  Page,
  useAppStore
} from "@/app/stores/app-store";
import { cn } from "@/components-v2/lib/utils";
import { SvgIcon } from "@/components-v2/svg-icon";
import { Button } from "@/components-v2/ui/button";
import { toastSuccess } from "@/components-v2/ui/toast-success";

const PaymentPage = () => {
  // Page navigation
  const setActivePage = useAppStore.use.setActivePage();

  return (
    <div className={cn("z-40 absolute inset-0 top-[38px]")}>
      {/* Close */}
      <button
        className="z-50 absolute top-[34px] right-[40px] text-text-subtle"
        onClick={() => {
          setActivePage(Page.Subscribe);
        }}
      >
        <SvgIcon name="window_close" size={40} />
      </button>

      {/* Main */}
      <div className="absolute inset-0 bg-background-surface-2 grid place-content-center">
        <div className="mb-10">TODO: integrate payment gateway</div>
        <Button size="lg" onClick={() => {
          toastSuccess({
            title: "Payment successful!",
            details: "Welcome to astrsk+ - enjoy your premium features",
          });
          setActivePage(Page.Init);
        }}>
          TEST: success payment
        </Button>
      </div>
    </div>
  );
};

export { PaymentPage };
