// Source: https://ui.shadcn.com/docs/components/combobox

import { Check, ChevronDown, Search } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib";
import {
  useIsMobileWithOverride,
  MobileOverrideProvider,
} from "@/shared/hooks/use-mobile-override";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui";

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
              "flex flex-row items-center justify-between",
              isMobile && "h-12 px-0 py-2.5",
            )}
            style={{
              height: isMobile
                ? `${isZoom ? zoomScale * 3 : 3}rem`
                : `${isZoom ? zoomScale * 2 : 2}rem`,
              padding: `${isZoom ? zoomScale * 0.5 : 0.5}rem ${isZoom ? zoomScale * 0.5 : 0.5}rem`,
            }}
            onClick={() => toggleGroupIsOpen(option.value)}
          >
            <span
              className={cn(
                isMobile
                  ? "text-fg-subtle text-base leading-relaxed font-normal"
                  : "",
              )}
              style={{
                fontSize: `${isZoom ? zoomScale * 0.75 : 0.75}rem`,
              }}
            >
              {option.label}
            </span>
            <ChevronDown
              className={cn(
                isMobile ? "text-fg-subtle min-h-4 min-w-4" : "size-4",
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
          "bg-surface hover:bg-hover data-[selected=true]:bg-hover mb-1 flex h-12 items-center justify-between rounded px-4 py-2.5 text-left",
        option.value === selectedValue ? "bg-active" : "bg-surface",
      )}
      style={{
        height: isMobile
          ? `${isZoom ? zoomScale * 3 : 3}rem`
          : `${isZoom ? zoomScale * 2.5 : 2.5}rem`,
        padding: `${isZoom ? zoomScale * 0.5 : 0.5}rem ${isZoom ? zoomScale * 1 : 1}rem`,
      }}
    >
      <span
        className={cn(
          "text-fg-default flex-1 text-base leading-relaxed font-normal",
        )}
        style={{
          fontSize: `${zoomScale * 0.75}rem`,
        }}
      >
        {option.label}
      </span>
      {option.value === selectedValue && (
        <Check
          className="text-fg-default"
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
            className="bg-surface flex w-full flex-col items-start justify-start gap-2 self-stretch rounded px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            <div className="inline-flex items-center justify-between self-stretch">
              <div className="inline-flex flex-1 flex-col items-start justify-start">
                <div className="text-fg-muted self-stretch text-left text-xs font-normal">
                  {label || "Flow"}
                </div>
                <div className="text-fg-default self-stretch text-left text-base leading-relaxed font-normal">
                  {optionsLabelMap.get(value ?? "") ?? triggerPlaceholder}
                </div>
              </div>
              <div className="relative h-6 w-6 overflow-hidden">
                <ChevronDown className="text-fg-subtle absolute top-[4px] left-[4px] min-h-4 min-w-4" />
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className="bg-canvas outline-border-default hover:outline-border-focus focus:outline-border-focus inline-flex min-h-8 w-full items-center justify-between self-stretch overflow-hidden rounded-md px-4 py-2 outline outline-offset-[-1px] transition-all hover:outline-1 focus:outline-1 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={disabled}
          >
            <div className="flex flex-1 items-center justify-start gap-4">
              <div className="text-fg-default text-left text-xs font-normal">
                {optionsLabelMap.get(value ?? "") ?? triggerPlaceholder}
              </div>
            </div>
            <div className="relative h-4 w-4">
              <ChevronDown className="text-fg-subtle absolute top-[-2px] left-[-1px] min-h-3 min-w-3" />
            </div>
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-(--radix-popover-trigger-width) p-0",
          isMobile ? "bg-surface border-0" : "bg-surface-raised border-border-default",
        )}
        style={{ backgroundColor: isMobile ? "var(--bg-surface)" : "var(--bg-surface-raised)" }}
        side={"bottom"}
        align="start"
        sideOffset={isMobile ? 8 : 4}
        avoidCollisions={true}
        collisionPadding={isMobile ? 16 : 8}
      >
        <Command
          className={isMobile ? "bg-surface" : "bg-surface-raised"}
          style={{ backgroundColor: isMobile ? "var(--bg-surface)" : "var(--bg-surface-raised)" }}
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
              <div className="bg-surface p-2">
                <div className="bg-surface flex h-12 items-center gap-4 rounded-lg px-4 py-3.5">
                  <Search className="text-fg-subtle min-h-4 min-w-4" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    className="placeholder:text-fg-subtle text-fg-default flex-1 border-0 bg-transparent text-base font-normal outline-none"
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
                className="border-border-default bg-surface-raised flex items-center border-b px-3"
                style={{
                  height: `${isZoom ? zoomScale * 2.5 : 2.5}rem`,
                  padding: `0 ${isZoom ? zoomScale * 0.75 : 0.75}rem`,
                  backgroundColor: "var(--bg-surface-raised)",
                }}
              >
                <Search
                  className="text-fg-subtle mr-2"
                  style={{
                    width: `${isZoom ? zoomScale : 1}rem`,
                    height: `${isZoom ? zoomScale : 1}rem`,
                    marginRight: `${isZoom ? zoomScale * 0.5 : 0.5}rem`,
                  }}
                />
                <input
                  className="text-fg-default placeholder:text-fg-subtle flex h-10 w-full rounded-md bg-transparent py-2 text-xs outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
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
            className={cn(isMobile && "bg-surface px-2 pb-2")}
            style={
              {
                scrollbarColor: "var(--border-default) transparent",
                resize: "none",
                padding: isMobile
                  ? `0 ${isZoom ? zoomScale * 0.5 : 0.5}rem ${isZoom ? zoomScale * 0.5 : 0.5}rem`
                  : `${isZoom ? zoomScale * 0.25 : 0.25}rem`,
                ...(isMobile ? { backgroundColor: "var(--surface)" } : {}),
              } as React.CSSProperties
            }
          >
            <CommandEmpty
              className={cn(isMobile && "text-fg-subtle px-4 py-2")}
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
