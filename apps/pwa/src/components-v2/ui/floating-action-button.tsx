import { useSidebarLeft } from "@/components-v2/both-sidebar";
import { cn } from "@/components-v2/lib/utils";
import { Button } from "@/components-v2/ui/button";

function FloatingActionButton({
  className,
  onClick,
  ref,
  position,
  icon,
  label,
  openned,
  ...props
}: React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
  label?: string;
  position: "top-left" | "top-right";
  openned?: boolean;
}) {
  const { open } = useSidebarLeft();

  return (
    <Button
      className={cn(
        "group/fab z-10 absolute top-[16px] rounded-full cursor-pointer",
        "bg-button-background-floating border-[1px] border-border-light text-text-primary",
        "hover:bg-background-card hover:text-text-primary",
        position === "top-left" ? "left-[96px]" : "right-[32px]",
        "!transition-all ease-out duration-300",
        position === "top-left" && open && "left-[24px]",
        "min-w-[40px] h-[40px] p-0",
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
          "h-full flex flex-row items-center",
          "transition-[margin-inline] ease-out duration-300",
          "mx-[7px] group-hover/fab:mx-[16px]",
          openned && "mx-[16px]",
        )}
      >
        {icon}
        <div
          className={cn(
            "grid transition-[margin-left,grid-template-columns,opacity] ease-out duration-300",
            "ml-0 grid-cols-[0fr] opacity-0",
            "group-hover/fab:ml-2 group-hover/fab:grid-cols-[1fr] group-hover/fab:opacity-100",
            openned && "ml-2 grid-cols-[1fr] opacity-100",
          )}
        >
          <span className="overflow-hidden font-medium text-[14px] leading-[20px]">
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
