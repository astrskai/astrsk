// Source: https://github.com/shadcn-ui/ui/issues/5834#issuecomment-2479234949
"use client";

import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { ArrowLeftFromLine, ArrowRightFromLine, List } from "lucide-react";
import * as React from "react";

import { cn } from "@/components-v2/lib/utils";
import { Button } from "@/components-v2/ui/button";
import { FloatingActionButton } from "@/components-v2/ui/floating-action-button";
import { Input } from "@/components-v2/ui/input";
import { Separator } from "@/components-v2/ui/separator";
import { Skeleton } from "@/components-v2/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components-v2/ui/tooltip";
import { useAppStore } from "@/app/stores/app-store";

// Mobile sidebar content with swipe to close functionality
const MobileSidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side: "left" | "right";
    setOpen: (open: boolean) => void;
    isMobile: boolean;
  }
>(({ side, setOpen, isMobile, className, children, ...props }, ref) => {
  const [startX, setStartX] = React.useState<number | null>(null);
  const [currentX, setCurrentX] = React.useState<number | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile) return;
      setStartX(e.touches[0].clientX);
      setCurrentX(e.touches[0].clientX);
      setIsDragging(true);
    },
    [isMobile],
  );

  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || !isDragging || startX === null) return;
      setCurrentX(e.touches[0].clientX);
    },
    [isMobile, isDragging, startX],
  );

  const handleTouchEnd = React.useCallback(() => {
    if (!isMobile || !isDragging || startX === null || currentX === null) {
      setStartX(null);
      setCurrentX(null);
      setIsDragging(false);
      return;
    }

    const deltaX = currentX - startX;
    const threshold = 100; // Minimum swipe distance

    // For left sidebar, swipe left to close
    if (side === "left" && deltaX < -threshold) {
      setOpen(false);
    }
    // For right sidebar, swipe right to close
    else if (side === "right" && deltaX > threshold) {
      setOpen(false);
    }

    setStartX(null);
    setCurrentX(null);
    setIsDragging(false);
  }, [isMobile, isDragging, startX, currentX, side, setOpen]);

  return (
    <div
      ref={ref}
      className={cn(
        "group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col bg-[#2A313A] group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-xs",
        className,
      )}
      data-sidebar="sidebar"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {children}
    </div>
  );
});
MobileSidebarContent.displayName = "MobileSidebarContent";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "320px";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

interface SidebarContextProps {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarLeftContext = React.createContext<SidebarContextProps | null>(
  null,
);
const SidebarRightContext = React.createContext<SidebarContextProps | null>(
  null,
);

function useSidebarLeft() {
  const context = React.useContext(SidebarLeftContext);
  if (!context) {
    throw new Error(
      "useSidebarLeft must be used within a SidebarLeftProvider.",
    );
  }

  return context;
}

function useSidebarRight() {
  const context = React.useContext(SidebarRightContext);
  if (!context) {
    throw new Error(
      "useSidebarRight must be used within a SidebarRightProvider.",
    );
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    changeDefaultOpen?: (open: boolean) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    SidebarContext: React.Context<SidebarContextProps | null>;
  }
>(
  (
    {
      defaultOpen = true,
      changeDefaultOpen,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      SidebarContext,
      children,
      ...props
    },
    ref,
  ) => {
    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open],
    );

    React.useEffect(() => {
      if (changeDefaultOpen) {
        changeDefaultOpen(open);
      }
    }, [open]);

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      setOpen((o) => !o);
    }, [setOpen]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        toggleSidebar,
      }),
      [state, open, setOpen, toggleSidebar],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            className={cn(
              "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
              className,
            )}
            ref={ref}
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

function SidebarLeftProvider({
  ref,
  ...props
}: Omit<React.ComponentProps<typeof SidebarProvider>, "SidebarContext">) {
  return (
    <SidebarProvider SidebarContext={SidebarLeftContext} ref={ref} {...props} />
  );
}

function SidebarRightProvider({
  ref,
  ...props
}: Omit<React.ComponentProps<typeof SidebarProvider>, "SidebarContext">) {
  return (
    <SidebarProvider
      SidebarContext={SidebarRightContext}
      ref={ref}
      {...props}
    />
  );
}

type SidebarProps = React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
};

const Sidebar = React.forwardRef<
  HTMLDivElement,
  SidebarProps & {
    state?: "expanded" | "collapsed";
    setOpen: (open: boolean) => void;
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      state,
      setOpen,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile } = useAppStore();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        className="text-sidebar-foreground group peer block"
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-side={side}
        data-state={state}
        data-variant={variant}
        ref={ref}
      >
        {/* This is what handles the sidebar gap on desktop - hidden on mobile */}
        <div
          className={cn(
            "relative h-[calc(100svh-var(--topbar-height))] w-(--sidebar-width) bg-transparent transition-[width] duration-300 ease-out",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
            // Hide on mobile to prevent pushing content
            isMobile && "hidden",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 z-30 flex h-[calc(100svh-var(--topbar-height))] w-(--sidebar-width) transition-[left,right,width] duration-300 ease-out",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className,
          )}
          {...props}
        >
          <MobileSidebarContent
            side={side}
            setOpen={setOpen}
            isMobile={isMobile}
          >
            {children}
          </MobileSidebarContent>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

const SidebarLeft = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ ...props }, ref) => {
    const { state, setOpen } = useSidebarLeft();

    return (
      <Sidebar
        ref={ref}
        {...props}
        side="left"
        state={state}
        setOpen={setOpen}
      />
    );
  },
);
SidebarLeft.displayName = "SidebarLeft";

const SidebarRight = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ ...props }, ref) => {
    const { state, setOpen } = useSidebarRight();

    return (
      <Sidebar
        ref={ref}
        {...props}
        side="right"
        state={state}
        setOpen={setOpen}
      />
    );
  },
);
SidebarRight.displayName = "SidebarRight";

type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
  label?: string;
};

function SidebarOpenTrigger({
  className,
  onClick,
  ref,
  side,
  setOpen,
  icon,
  label = "Show Sidebar",
  ...props
}: SidebarTriggerProps & {
  side: "left" | "right";
  setOpen: (open: boolean) => void;
}) {
  return (
    <FloatingActionButton
      className={className}
      data-sidebar="trigger"
      onClick={(e) => {
        onClick?.(e);
        setOpen(true);
      }}
      ref={ref}
      position={side === "left" ? "top-left" : "top-right"}
      icon={icon ?? <List className="min-h-[24px] min-w-[24px]" />}
      label={label}
      {...props}
    />
  );
}

function SidebarCloseTrigger({
  className,
  onClick,
  ref,
  side,
  setOpen,
  icon,
  label = "Hide",
  ...props
}: SidebarTriggerProps & {
  side: "left" | "right";
  setOpen: (open: boolean) => void;
}) {
  return (
    <FloatingActionButton
      className={cn(
        side === "left" ? "right-[12px]" : "left-[12px]",
        className,
      )}
      data-sidebar="trigger"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      ref={ref}
      position={side === "left" ? "top-right" : "top-left"}
      icon={
        icon ??
        (side === "left" ? (
          <ArrowLeftFromLine className="min-h-[24px] min-w-[24px]" />
        ) : (
          <ArrowRightFromLine className="min-h-[24px] min-w-[24px]" />
        ))
      }
      label={label}
      {...props}
    />
  );
}

function SidebarLeftTrigger(props: SidebarTriggerProps) {
  const { setOpen } = useSidebarLeft();

  return <SidebarOpenTrigger {...props} side="left" setOpen={setOpen} />;
}

// Mobile-specific trigger that's not absolutely positioned
function MobileSidebarLeftTrigger({
  className,
  onClick,
  icon,
  label,
  ...props
}: Omit<SidebarTriggerProps, "ref">) {
  const { setOpen } = useSidebarLeft();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-10 w-10", className)}
          data-sidebar="trigger"
          onClick={(e) => {
            onClick?.(e);
            setOpen(true);
          }}
          {...props}
        >
          {icon ?? <List className="h-6 w-6" />}
          <span className="sr-only">{label ?? "Open menu"}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label ?? "Open menu"}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function SidebarRightTrigger(props: SidebarTriggerProps) {
  const { setOpen } = useSidebarRight();

  return <SidebarOpenTrigger {...props} side="right" setOpen={setOpen} />;
}

type SidebarRailProps = React.ComponentProps<"button">;

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { toggleSidebar: () => void }
>(({ className, toggleSidebar, ...props }, ref) => {
  return (
    <button
      aria-label="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:hover:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      data-sidebar="rail"
      onClick={toggleSidebar}
      ref={ref}
      tabIndex={-1}
      title="Toggle Sidebar"
      type="button"
      {...props}
    />
  );
});
SidebarRail.displayName = "SidebarRail";

function SidebarLeftRail(props: SidebarRailProps) {
  const { toggleSidebar } = useSidebarLeft();

  return <SidebarRail {...props} toggleSidebar={toggleSidebar} />;
}

function SidebarRightRail(props: SidebarRailProps) {
  const { toggleSidebar } = useSidebarRight();

  return <SidebarRail {...props} toggleSidebar={toggleSidebar} />;
}

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      className={cn(
        "bg-background relative flex flex-1 flex-col overflow-hidden",
        "z-0 peer-data-[variant=inset]:rounded-xl peer-data-[variant=inset]:shadow-xs",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      className={cn(
        "bg-background focus-visible:ring-sidebar-ring h-8 w-full shadow-none focus-visible:ring-2",
        className,
      )}
      data-sidebar="input"
      ref={ref}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="header"
      ref={ref}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("flex flex-col gap-2 p-2", className)}
      data-sidebar="footer"
      ref={ref}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      data-sidebar="separator"
      ref={ref}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      data-sidebar="content"
      ref={ref}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      data-sidebar="group"
      ref={ref}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opa] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      data-sidebar="group-label"
      ref={ref}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-sidebar="group-action"
      ref={ref}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    className={cn("w-full text-sm", className)}
    data-sidebar="group-content"
    ref={ref}
    {...props}
  />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    className={cn("flex w-full min-w-0 flex-col gap-1", className)}
    data-sidebar="menu"
    ref={ref}
    {...props}
  />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    className={cn("group/menu-item relative", className)}
    data-sidebar="menu-item"
    ref={ref}
    {...props}
  />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type SidebarMenuButtonProps = React.ComponentProps<typeof Button> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>;

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps & {
    state?: "expanded" | "collapsed";
  }
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      state,
      tooltip,
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const button = (
      <Comp
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        data-active={isActive}
        data-sidebar="menu-button"
        data-size={size}
        ref={ref}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          align="center"
          hidden={state !== "collapsed"}
          side="right"
          {...tooltip}
        />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

function SidebarLeftMenuButton(props: SidebarMenuButtonProps) {
  const { state } = useSidebarLeft();

  return <SidebarMenuButton {...props} state={state} />;
}

function SidebarRightMenuButton(props: SidebarMenuButtonProps) {
  const { state } = useSidebarRight();

  return <SidebarMenuButton {...props} state={state} />;
}

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground opacity-0 group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100",
        className,
      )}
      data-sidebar="menu-action"
      ref={ref}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
      "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
      "peer-data-[size=sm]/menu-button:top-1",
      "peer-data-[size=default]/menu-button:top-1.5",
      "peer-data-[size=lg]/menu-button:top-2.5",
      "group-data-[collapsible=icon]:hidden",
      className,
    )}
    data-sidebar="menu-badge"
    ref={ref}
    {...props}
  />
));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      data-sidebar="menu-skeleton"
      ref={ref}
      {...props}
    >
      {showIcon ? (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      ) : null}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    className={cn(
      "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
      "group-data-[collapsible=icon]:hidden",
      className,
    )}
    data-sidebar="menu-sub"
    ref={ref}
    {...props}
  />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      data-active={isActive}
      data-sidebar="menu-sub-button"
      data-size={size}
      ref={ref}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarLeft,
  SidebarLeftMenuButton,
  SidebarLeftProvider,
  SidebarLeftRail,
  SidebarLeftTrigger,
  MobileSidebarLeftTrigger,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRight,
  SidebarRightMenuButton,
  SidebarRightProvider,
  SidebarRightRail,
  SidebarRightTrigger,
  SidebarSeparator,
  useSidebarLeft,
  useSidebarRight,
};
