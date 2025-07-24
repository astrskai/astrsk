"use client";

// Source: https://github.com/nightspite/shadcn-color-picker

import { forwardRef, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { cn } from "@/shared/utils/tailwind-utils";

import { useForwardedRef } from "@/components-v2/hooks/use-forwarded-ref";
import type { ButtonProps } from "@/components-v2/ui/button";
import { Button } from "@/components-v2/ui/button";
import { Input } from "@/components-v2/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components-v2/ui/popover";

interface ColorPickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  orientation?: "horizontal" | "vertical";
}

const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, "value" | "onChange" | "onBlur"> & ColorPickerProps
>(
  (
    {
      disabled,
      value,
      onChange,
      onBlur,
      name,
      className,
      orientation = "vertical",
      ...props
    },
    forwardedRef,
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);

    const parsedValue = useMemo(() => {
      return value?.toUpperCase();
    }, [value]);

    const handleOnChange = (newValue: string | null) => {
      if (newValue === "") {
        onChange(null);
      } else {
        // Ensure the value has a # prefix
        const formattedValue =
          newValue && !newValue.startsWith("#") ? `#${newValue}` : newValue;
        onChange(formattedValue);
      }
    };

    return (
      <Popover onOpenChange={setOpen} open={open} modal={true}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            variant="ghost"
            className={cn(
              "p-0 rounded-[8px] flex gap-[8px] hover:bg-transparent",
              orientation === "vertical"
                ? "w-[57px] h-[62px] flex-col gap-[8px] justify-center items-start"
                : "h-[16px] flex-row",
              className,
            )}
          >
            {orientation === "vertical" ? (
              <>
                <div
                  className="grow w-full rounded-[8px] border border-border-light"
                  style={{
                    backgroundColor: parsedValue ?? undefined,
                  }}
                />
                <div className="min-h-[15px] font-[400] text-[12px] leading-[15px] text-text-body ">
                  {parsedValue}
                </div>
              </>
            ) : (
              <>
                <div
                  className="min-w-[32px] min-h-[16px] rounded-full"
                  style={{
                    backgroundColor: parsedValue ?? undefined,
                  }}
                />
                <div className="min-w-[60px] min-h-[15px] font-[400] text-[12px] leading-[15px] text-text-input-subtitle text-left">
                  {parsedValue}
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-[4px] bg-text-primary rounded-[8px]">
          <HexColorPicker
            color={parsedValue ?? undefined}
            onChange={handleOnChange}
          />
          <Input
            className="bg-transparent font-[400] text-[12px] leading-[15px] text-background-card outline-none"
            maxLength={7}
            onChange={(e) => {
              const inputValue = e?.currentTarget?.value;
              // If the input doesn't start with # and has content, add it
              const formattedValue =
                inputValue &&
                inputValue.length > 0 &&
                !inputValue.startsWith("#")
                  ? `#${inputValue}`
                  : inputValue;
              handleOnChange(formattedValue);
            }}
            ref={ref}
            value={parsedValue ?? undefined}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
