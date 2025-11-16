// Source: https://github.com/nightspite/shadcn-color-picker

import { forwardRef, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { cn } from "@/shared/lib";

import { useForwardedRef } from "@/shared/hooks/use-forwarded-ref";
import type { ButtonProps } from "@/shared/ui";
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui";

interface ColorPickerProps {
  value?: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  orientation?: "horizontal" | "vertical";
  isShowValue?: boolean;
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
      isShowValue = true,
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
              "flex gap-[8px] rounded-[8px] p-0 hover:bg-transparent",
              orientation === "vertical"
                ? "h-[62px] w-[57px] flex-col items-start justify-center gap-[8px]"
                : "h-[16px] flex-row",
              className,
            )}
          >
            {orientation === "vertical" ? (
              <>
                <div
                  className="border-border-light w-full grow rounded-[8px] border"
                  style={{
                    backgroundColor: parsedValue ?? undefined,
                  }}
                />
                {isShowValue && (
                  <div className="text-text-body min-h-[15px] text-[12px] leading-[15px] font-[400]">
                    {parsedValue}
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  className="min-h-[16px] min-w-[32px] rounded-full"
                  style={{
                    backgroundColor: parsedValue ?? undefined,
                  }}
                />
                {isShowValue && (
                  <div className="text-text-input-subtitle min-h-[15px] min-w-[60px] text-left text-[12px] leading-[15px] font-[400]">
                    {parsedValue}
                  </div>
                )}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-text-primary w-full rounded-[8px] p-[4px]">
          <HexColorPicker
            color={parsedValue ?? undefined}
            onChange={handleOnChange}
          />
          <Input
            className="text-background-card bg-transparent text-[12px] leading-[15px] font-[400] outline-none"
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
