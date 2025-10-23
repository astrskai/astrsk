import { useSidebarLeft } from "@/components/layout/both-sidebar";
import { cn } from "@/shared/lib";
import { Button } from "@/components-v2/ui/button";

function FloatingActionButton({
  className,
  onClick,
  ref,
  position,
  icon,
  label,
  openned,
  onboarding,
  onboardingTooltip,
  tooltipSide,
  tooltipClassName,
  ...props
}: React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
  label?: string;
  position: "top-left" | "top-right";
  openned?: boolean;
  onboarding?: boolean;
  onboardingTooltip?: string;
  tooltipSide?: "left" | "right";
  tooltipClassName?: string;
}) {
  const { open } = useSidebarLeft();

  if (onboarding && onboardingTooltip) {
    return (
      <div className="group/fab-parent">
        {/* Onboarding Tooltip */}
        <div
          className={cn(
            "bg-background-surface-2 border-border-selected-primary absolute top-[16px] z-20 rounded-2xl border-1 px-4 py-3 whitespace-nowrap shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)]",
            "transition-all duration-300 ease-out",
            "group-hover/fab-parent:opacity-0",
            // Default tooltip positioning based on button position
            !tooltipSide && position === "top-left" && "left-[160px]",
            !tooltipSide && position === "top-left" && open && "left-[88px]",
            !tooltipSide && position === "top-right" && "right-[90px]",
            // Custom tooltip positioning when tooltipSide is specified
            tooltipSide === "right" &&
              position === "top-left" &&
              "left-[160px]",
            tooltipSide === "right" &&
              position === "top-left" &&
              open &&
              "left-[88px]",
            tooltipSide === "right" &&
              position === "top-right" &&
              "left-[90px]",
            tooltipSide === "left" &&
              position === "top-left" &&
              "right-[160px]",
            tooltipSide === "left" &&
              position === "top-left" &&
              open &&
              "right-[88px]",
            tooltipSide === "left" &&
              position === "top-right" &&
              "right-[90px]",
            // Allow custom positioning override
            tooltipClassName,
          )}
        >
          <div className="text-text-primary text-xs font-medium">
            {onboardingTooltip}
          </div>
        </div>

        <Button
          className={cn(
            "group/fab absolute top-[16px] z-10 cursor-pointer rounded-full",
            "bg-button-background-floating border-border-light text-text-primary border-[1px]",
            "hover:bg-background-card hover:text-text-primary",
            position === "top-left" ? "left-[96px]" : "right-[32px]",
            "!transition-all duration-300 ease-out",
            position === "top-left" && open && "left-[24px]",
            "h-[40px] min-w-[40px] p-0",
            onboarding &&
              "border-border-selected-primary border-1 shadow-[0px_0px_15px_-3px_rgba(152,215,249,1.00)] hover:shadow-[0px_0px_20px_-1px_rgba(152,215,249,1.00)]",
            className,
          )}
          onClick={(event) => {
            onClick?.(event);
          }}
          ref={ref}
          {...props}
        >
          <div
            className={cn(
              "flex h-full flex-row items-center",
              "transition-[margin-inline] duration-300 ease-out",
              "mx-[7px] group-hover/fab:mx-[16px]",
              openned && "mx-[16px]",
            )}
          >
            {icon}
            <div
              className={cn(
                "grid transition-[margin-left,grid-template-columns,opacity] duration-300 ease-out",
                "ml-0 grid-cols-[0fr] opacity-0",
                "group-hover/fab:ml-2 group-hover/fab:grid-cols-[1fr] group-hover/fab:opacity-100",
                openned && "ml-2 grid-cols-[1fr] opacity-100",
              )}
            >
              <span className="overflow-hidden text-[14px] leading-[20px] font-medium">
                {label}
              </span>
            </div>
            <span className="sr-only">{label}</span>
          </div>
        </Button>
      </div>
    );
  }

  return (
    <Button
      className={cn(
        "group/fab absolute top-[16px] z-10 cursor-pointer rounded-full",
        "bg-button-background-floating border-border-light text-text-primary border-[1px]",
        "hover:bg-background-card hover:text-text-primary",
        position === "top-left" ? "left-[96px]" : "right-[32px]",
        "!transition-all duration-300 ease-out",
        position === "top-left" && open && "left-[24px]",
        "h-[40px] min-w-[40px] p-0",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
      }}
      ref={ref}
      {...props}
    >
      <div
        className={cn(
          "flex h-full flex-row items-center",
          "transition-[margin-inline] duration-300 ease-out",
          "mx-[7px] group-hover/fab:mx-[16px]",
          openned && "mx-[16px]",
        )}
      >
        {icon}
        <div
          className={cn(
            "grid transition-[margin-left,grid-template-columns,opacity] duration-300 ease-out",
            "ml-0 grid-cols-[0fr] opacity-0",
            "group-hover/fab:ml-2 group-hover/fab:grid-cols-[1fr] group-hover/fab:opacity-100",
            openned && "ml-2 grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="overflow-hidden text-[14px] leading-[20px] font-medium">
            {label}
          </span>
        </div>
        <span className="sr-only">{label}</span>
      </div>
    </Button>
  );
}
FloatingActionButton.displayName = "FloatingActionButton";

export { FloatingActionButton };
