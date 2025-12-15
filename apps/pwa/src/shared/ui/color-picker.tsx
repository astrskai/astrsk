// Source: https://github.com/nightspite/shadcn-color-picker

import { forwardRef, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";

import { cn } from "@/shared/lib";

import { useForwardedRef } from "@/shared/hooks/use-forwarded-ref";
import type { ButtonProps } from "@/shared/ui";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui";
import { Input } from "@/shared/ui/forms";

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

    const handleOnChange = (newValue: string) => {
      // HexColorPicker always returns uppercase hex with #
      onChange(newValue);
    };

    const handleInputChange = (inputValue: string) => {
      if (inputValue === "") {
        onChange(null);
      } else {
        // Ensure the value has a # prefix and convert to uppercase
        const formattedValue =
          inputValue && !inputValue.startsWith("#")
            ? `#${inputValue}`
            : inputValue;
        onChange(formattedValue?.toUpperCase() ?? null);
      }
    };

    const handleOpenChange = (newOpen: boolean) => {
      setOpen(newOpen);
    };

    return (
      <Popover onOpenChange={handleOpenChange} open={open} modal={true}>
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
                  className="border-border-muted w-full grow rounded-[8px] border"
                  style={{
                    backgroundColor: parsedValue ?? undefined,
                  }}
                />
                {isShowValue && (
                  <div className="text-fg-muted min-h-[15px] text-[12px] leading-[15px] font-[400]">
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
                  <div className="text-fg-subtle min-h-[15px] min-w-[60px] text-left text-[12px] leading-[15px] font-[400]">
                    {parsedValue}
                  </div>
                )}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-fg-default w-full rounded-[8px] p-[4px]">
          <HexColorPicker
            color={parsedValue ?? "#000000"}
            onChange={handleOnChange}
          />
          <Input
            className="text-surface bg-transparent text-[12px] leading-[15px] font-[400] outline-none"
            maxLength={7}
            onChange={(e) => {
              const inputValue = e?.currentTarget?.value;
              handleInputChange(inputValue);
            }}
            ref={ref}
            value={parsedValue ?? ""}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
