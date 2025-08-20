"use client";
// Source: https://ui.shadcn.com/docs/components/combobox

import { Check, ChevronDown, Search } from "lucide-react";
import * as React from "react";

import { cn } from "@/components-v2/lib/utils";
import {
  useIsMobileWithOverride,
  MobileOverrideProvider,
} from "@/components-v2/hooks/use-mobile-override";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components-v2/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components-v2/ui/popover";

interface ComboboxOption {
  label: string;
  value: string;
  sub?: ComboboxOption[];
  keywords?: string[];
}

const renderComboboxOption = ({
  option,
  selectedValue,
  onSelect,
  groupIsOpenMap,
  toggleGroupIsOpen,
  isMobile,
  zoomScale = 1,
  isZoom = false,
}: {
  option: ComboboxOption;
  selectedValue?: string;
  onSelect?: (selectedValue: string) => void;
  groupIsOpenMap: Map<string, boolean>;
  toggleGroupIsOpen: (group: string) => void;
  isMobile?: boolean;
  zoomScale?: number;
  isZoom?: boolean;
}) => {
  if (option.sub) {
    const groupIsOpen = groupIsOpenMap.get(option.value) ?? true;
    return (
      <CommandGroup
        key={option.value}
        heading={
          <div
            className={cn(
              "flex flex-row justify-between items-center",
              isMobile && "h-12 px-0 py-2.5",
            )}
            style={{
              height: isMobile ? `${isZoom ? zoomScale * 3 : 3}rem` : `${isZoom ? zoomScale * 2 : 2}rem`,
              padding: `${isZoom ? zoomScale * 0.5 : 0.5}rem ${isZoom ? zoomScale * 0.5 : 0.5}rem`,
            }}
            onClick={() => toggleGroupIsOpen(option.value)}
          >
            <span
              className={cn(
                isMobile
                  ? "text-text-placeholder text-base font-normal leading-relaxed"
                  : "",
              )}
              style={{
                fontSize: `${isZoom ? zoomScale * 0.75 : 0.75}rem`,
              }}
              onClick={() => console.log(`[Group Header] "${option.label}" fontSize:`, `${zoomScale * 0.75}rem`, 'zoomScale:', zoomScale)}
            >
              {option.label}
            </span>
            <ChevronDown
              className={cn(
                isMobile ? "min-w-4 min-h-4 text-text-placeholder" : "size-4",
                groupIsOpen && "rotate-180",
              )}
              style={{
                width: `${isZoom ? zoomScale : 1}rem`,
                height: `${isZoom ? zoomScale : 1}rem`,
              }}
            />
          </div>
        }
      >
        <div className={cn(!groupIsOpen && "hidden")}>
          {option.sub?.map((subOption) =>
            renderComboboxOption({
              option: subOption,
              selectedValue: selectedValue,
              onSelect: onSelect,
              groupIsOpenMap: groupIsOpenMap,
              toggleGroupIsOpen: toggleGroupIsOpen,
              isMobile: isMobile,
              zoomScale: zoomScale,
              isZoom: isZoom,
            }),
          ) ?? null}
        </div>
      </CommandGroup>
    );
  }

  return (
    <CommandItem
      key={option.value}
      value={option.value}
      onSelect={() => {
        onSelect?.(option.value);
      }}
      keywords={[option.label, ...(option.keywords ?? [])]}
      className={cn(
        isMobile &&
          "h-12 px-4 py-2.5 mb-1 rounded flex items-center bg-background-surface-4 justify-between text-left hover:bg-background-surface-3 data-[selected=true]:bg-background-surface-3",
        option.value === selectedValue
          ? "bg-background-surface-2"
          : "bg-background-surface-4",
      )}
      style={{
        height: isMobile ? `${isZoom ? zoomScale * 3 : 3}rem` : `${isZoom ? zoomScale * 2.5 : 2.5}rem`,
        padding: `${isZoom ? zoomScale * 0.5 : 0.5}rem ${isZoom ? zoomScale * 1 : 1}rem`,
      }}
    >
      <span
        className={cn(
          "flex-1 text-base font-normal leading-relaxed text-text-primary",
        )}
        style={{
          fontSize: `${zoomScale * 0.75}rem`,
        }}
      >
        {option.label}
      </span>
      {option.value === selectedValue && (
        <Check 
          className="text-text-primary" 
          style={{
            minWidth: `${isZoom ? zoomScale : 1}rem`,
            minHeight: `${isZoom ? zoomScale : 1}rem`,
            width: `${isZoom ? zoomScale : 1}rem`,
            height: `${isZoom ? zoomScale : 1}rem`,
          }}
        />
      )}
    </CommandItem>
  );
};

const ComboboxInner = ({
  label,
  triggerPlaceholder = "Select an option",
  searchPlaceholder = "Search...",
  searchEmpty = "No item found.",
  options = [],
  value,
  onValueChange,
  disabled,
  searchable = true,
  zoomScale = 1,
  isZoom = false,
}: {
  label?: string;
  triggerPlaceholder?: string;
  searchPlaceholder?: string;
  searchEmpty?: React.ReactNode;
  options?: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  zoomScale?: number;
  isZoom?: boolean;
}) => {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const isMobile = useIsMobileWithOverride();

  // Prevent auto-focus on mobile by blurring the input when popover opens
  React.useEffect(() => {
    if (open && isMobile) {
      // Small delay to ensure the DOM is ready
      setTimeout(() => {
        const input = document.querySelector(
          "[cmdk-input]",
        ) as HTMLInputElement;
        if (input) {
          input.blur();
        }
      }, 50);
    }
  }, [open, isMobile]);

  // Selected option label
  const optionsLabelMap = React.useMemo(() => {
    return new Map(
      options.flatMap((option) => {
        if (option.sub) {
          return option.sub.map((subOption) => [
            subOption.value,
            `${option.label} - ${subOption.label}`,
          ]);
        } else {
          return [[option.value, option.label]];
        }
      }),
    );
  }, [options]);

  // Toggle group open state
  const [groupIsOpenMap, setGroupIsOpenMap] = React.useState(
    new Map<string, boolean>(),
  );
  const toggleGroupIsOpenMap = React.useCallback(
    (group: string) => {
      const isOpen = groupIsOpenMap.get(group) ?? true;
      const newMap = new Map(groupIsOpenMap);
      newMap.set(group, !isOpen);
      setGroupIsOpenMap(newMap);
    },
    [groupIsOpenMap],
  );

  // Render options
  const renderedOptions = React.useMemo(() => {
    return options.map((option) =>
      renderComboboxOption({
        option: option,
        selectedValue: value,
        onSelect: (selectedValue) => {
          onValueChange?.(selectedValue);
          setOpen(false);
        },
        groupIsOpenMap: groupIsOpenMap,
        toggleGroupIsOpen: toggleGroupIsOpenMap,
        isMobile: isMobile,
        zoomScale: zoomScale,
        isZoom: isZoom,
      }),
    );
  }, [
    groupIsOpenMap,
    onValueChange,
    options,
    toggleGroupIsOpenMap,
    value,
    isMobile,
    zoomScale,
    isZoom,
  ]);

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setSearchValue("");
        }
      }}
      modal={true}
    >
      <PopoverTrigger asChild>
        {isMobile ? (
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="self-stretch px-4 py-2 bg-background-surface-4 rounded flex flex-col justify-start items-start gap-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <div className="self-stretch inline-flex justify-between items-center">
              <div className="flex-1 inline-flex flex-col justify-start items-start">
                <div className="self-stretch text-left text-text-body text-xs font-normal">
                  {label || "Flow"}
                </div>
                <div className="self-stretch text-left text-text-primary text-base font-normal leading-relaxed">
                  {optionsLabelMap.get(value ?? "") ?? triggerPlaceholder}
                </div>
              </div>
              <div className="w-6 h-6 relative overflow-hidden">
                <ChevronDown className="min-w-4 min-h-4 absolute left-[4px] top-[4px] text-background-surface-5" />
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="self-stretch min-h-8 px-4 py-2 bg-background-surface-0 rounded-md outline-1 outline-offset-[-1px] outline-border-normal inline-flex justify-between items-center overflow-hidden w-full hover:outline-1 hover:outline-border-selected-inverse focus:outline-1 focus:outline-border-selected-inverse transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            <div className="flex-1 flex justify-start items-center gap-4">
              <div className="text-left text-text-primary text-xs font-normal">
                {optionsLabelMap.get(value ?? "") ?? triggerPlaceholder}
              </div>
            </div>
            <div className="w-4 h-4 relative">
              <ChevronDown className="min-w-3 min-h-3 absolute left-[-1px] top-[-2px] text-background-surface-5" />
            </div>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-(--radix-popover-trigger-width) p-0",
          isMobile
            ? "bg-background-surface-4 border-0"
            : "bg-background-surface-0 border-border-normal",
        )}
        style={
          isMobile
            ? { backgroundColor: "var(--background-surface-4)" }
            : undefined
        }
        side={"bottom"}
        align="start"
        sideOffset={isMobile ? 8 : 4}
        avoidCollisions={true}
        collisionPadding={isMobile ? 16 : 8}
      >
        <Command
          className={
            isMobile ? "bg-background-surface-4" : "bg-background-surface-0"
          }
          style={
            isMobile
              ? { backgroundColor: "var(--background-surface-4)" }
              : undefined
          }
          filter={(value, search, keywords = []) => {
            const valueWithKeywords = [value, ...keywords]
              .join(" ")
              .toLowerCase();
            if (valueWithKeywords.includes(search.toLowerCase())) {
              return 1;
            }
            return 0;
          }}
          loop={false}
        >
          {searchable &&
            searchPlaceholder !== "" &&
            (isMobile ? (
              <div className="p-2 bg-background-surface-4">
                <div className="h-12 px-4 py-3.5 bg-background-surface-4 rounded-lg flex items-center gap-4">
                  <Search className="min-w-4 min-h-4 text-text-subtle" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent text-base font-normal placeholder:text-text-placeholder text-text-primary outline-none border-0"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      // Sync with the hidden CommandInput
                      const cmdkInput = document.querySelector(
                        "[cmdk-input]",
                      ) as HTMLInputElement;
                      if (cmdkInput) {
                        const nativeInputValueSetter =
                          Object.getOwnPropertyDescriptor(
                            window.HTMLInputElement.prototype,
                            "value",
                          )?.set;
                        nativeInputValueSetter?.call(cmdkInput, e.target.value);
                        const event = new Event("input", { bubbles: true });
                        cmdkInput.dispatchEvent(event);
                      }
                    }}
                  />
                </div>
                <div className="sr-only">
                  <CommandInput
                    placeholder=""
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                </div>
              </div>
            ) : (
              <div 
                className="flex items-center border-b border-border-normal px-3 bg-background-surface-0"
                style={{
                  height: `${isZoom ? zoomScale * 2.5 : 2.5}rem`,
                  padding: `0 ${isZoom ? zoomScale * 0.75 : 0.75}rem`,
                }}
              >
                <Search 
                  className="mr-2 text-text-placeholder" 
                  style={{
                    width: `${isZoom ? zoomScale : 1}rem`,
                    height: `${isZoom ? zoomScale : 1}rem`,
                    marginRight: `${isZoom ? zoomScale * 0.5 : 0.5}rem`,
                  }}
                />
                <input
                  className="flex h-10 w-full rounded-md bg-transparent py-2 text-xs outline-hidden text-text-primary placeholder:text-text-placeholder disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    // Sync with the hidden CommandInput
                    const cmdkInput = document.querySelector(
                      "[cmdk-input]",
                    ) as HTMLInputElement;
                    if (cmdkInput) {
                      const nativeInputValueSetter =
                        Object.getOwnPropertyDescriptor(
                          window.HTMLInputElement.prototype,
                          "value",
                        )?.set;
                      nativeInputValueSetter?.call(cmdkInput, e.target.value);
                      const event = new Event("input", { bubbles: true });
                      cmdkInput.dispatchEvent(event);
                    }
                  }}
                  style={{
                    fontSize: `${isZoom ? zoomScale * 0.75 : 0.75}rem`,
                    height: `${isZoom ? zoomScale * 2.5 : 2.5}rem`,
                    padding: `${isZoom ? zoomScale * 0.5 : 0.5}rem 0`,
                  }}
                />
              </div>
            ))}
          {searchable && searchPlaceholder !== "" && !isMobile && (
            <div className="sr-only">
              <CommandInput
                placeholder=""
                value={searchValue}
                onValueChange={setSearchValue}
              />
            </div>
          )}
          <CommandList
            className={cn(isMobile && "px-2 pb-2 bg-background-surface-4")}
            style={
              {
                scrollbarColor: "var(--border-container) transparent",
                resize: "none",
                padding: isMobile ? `0 ${isZoom ? zoomScale * 0.5 : 0.5}rem ${isZoom ? zoomScale * 0.5 : 0.5}rem` : `${isZoom ? zoomScale * 0.25 : 0.25}rem`,
                ...(isMobile
                  ? { backgroundColor: "var(--background-surface-4)" }
                  : {}),
              } as React.CSSProperties
            }
          >
            <CommandEmpty
              className={cn(isMobile && "px-4 py-2 text-text-placeholder")}
              style={{
                fontSize: `${isZoom ? zoomScale * 0.75 : 0.75}rem`,
              }}
            >
              {searchEmpty}
            </CommandEmpty>
            {renderedOptions}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// Main Combobox component with optional forceMobile prop
const Combobox = (props: {
  label?: string;
  triggerPlaceholder?: string;
  searchPlaceholder?: string;
  searchEmpty?: React.ReactNode;
  options?: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  searchable?: boolean;
  forceMobile?: boolean;
  zoomScale?: number;
  isZoom?: boolean;
}) => {
  const { forceMobile, ...comboboxProps } = props;

  if (forceMobile !== undefined) {
    return (
      <MobileOverrideProvider forceMobile={forceMobile}>
        <ComboboxInner {...comboboxProps} />
      </MobileOverrideProvider>
    );
  }

  return <ComboboxInner {...comboboxProps} />;
};

export { Combobox };
export type { ComboboxOption };
