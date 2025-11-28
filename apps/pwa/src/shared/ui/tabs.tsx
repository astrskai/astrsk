"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/shared/lib";

// Create context for variant
const TabsVariantContext = React.createContext<
  "default" | "v1" | "mobile" | "dark-mobile"
>("default");

const Tabs = TabsPrimitive.Root;

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "v1" | "mobile" | "dark-mobile";
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => {
  const listClassName =
    variant === "v1"
      ? cn(
          "inline-flex h-9 items-center justify-center rounded-lg bg-background-container p-1 text-text-input-subtitle",
          className,
        )
      : variant === "mobile"
        ? cn(
            "self-stretch p-1 bg-surface-raised rounded-lg inline-flex justify-start items-center",
            className,
          )
        : variant === "dark-mobile"
          ? cn(
              "self-stretch p-1 bg-surface rounded-lg inline-flex justify-start items-center",
              className,
            )
          : cn(
              "self-stretch p-1 bg-surface rounded-lg inline-flex justify-start items-center",
              className,
            );

  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List ref={ref} className={listClassName} {...props} />
    </TabsVariantContext.Provider>
  );
});
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);

  const triggerClassName =
    variant === "v1"
      ? cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-canvas transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background-card data-[state=active]:text-text-primary data-[state=active]:shadow-xs",
          className,
        )
      : variant === "mobile" || variant === "dark-mobile"
        ? cn(
            "flex-1 self-stretch px-3 py-1 rounded-md flex justify-center items-center gap-2 transition-all",
            "text-text-body text-base font-normal leading-relaxed",
            "data-[state=active]:bg-surface-overlay data-[state=active]:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] data-[state=active]:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]",
            "data-[state=active]:text-text-primary data-[state=active]:font-semibold",
            "focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
            className,
          )
        : cn(
            "flex-1 self-stretch px-3 py-1 rounded-md flex justify-center items-center gap-2 transition-all",
            "text-text-body text-xs font-normal",
            "data-[state=active]:bg-surface-overlay data-[state=active]:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.06)] data-[state=active]:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.10)]",
            "data-[state=active]:text-text-primary data-[state=active]:font-semibold",
            "focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50",
            className,
          );

  return (
    <TabsPrimitive.Trigger ref={ref} className={triggerClassName} {...props} />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-canvas focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
