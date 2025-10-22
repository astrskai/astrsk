import React, { useState } from "react";

import { cn } from "@/shared/utils";

import { Button } from "@/components-v2/ui/button";
import { ScrollArea, ScrollBar } from "@/components-v2/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components-v2/ui/sheet";

type FooterRenderer = (methods: {
  setOpen: (open: boolean) => void;
}) => React.ReactNode;

const CustomSheet = ({
  trigger,
  title,
  description,
  header,
  children,
  fill = false,
  footer,
  hideHeader = false,
  hideFooter = false,
  onOpenChange,
}: {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
  fill?: boolean;
  footer?: FooterRenderer;
  hideHeader?: boolean;
  hideFooter?: boolean;
  onOpenChange?: (open: boolean) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet
      modal={true}
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        onOpenChange?.(open);
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        className="bg-background-surface-3 min-w-[780px] p-0"
        hideClose
      >
        <div className="relative flex h-full w-full flex-col">
          {/* Sheet header */}
          <div className={cn("shrink-0 px-8 py-6", hideHeader && "hidden")}>
            <div className="flex flex-row justify-between">
              <SheetTitle>
                <div className="text-text-primary text-[24px] leading-[32px] font-[600]">
                  {title}
                </div>
              </SheetTitle>
              {header}
            </div>
            <SheetDescription>{description}</SheetDescription>
          </div>

          {/* Sheet content main */}
          <div className="relative grow overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className={cn(!fill && "px-8 py-6")}>{children}</div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>

          {/* Sheet footer */}
          {!hideFooter && (
            <div className="bg-background-surface-2 flex shrink-0 flex-row justify-end px-8 py-3">
              <SheetClose asChild>
                <Button size="lg" variant="ghost">
                  Close
                </Button>
              </SheetClose>
              {footer?.({ setOpen })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { CustomSheet };
