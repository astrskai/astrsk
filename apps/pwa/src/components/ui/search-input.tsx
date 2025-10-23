import { Search, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, memo } from "react";

import { cn } from "@/shared/lib";
import { Input } from "@/components-v2/ui/input";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  variant?: "default" | "v1" | "mobile";
  className?: string;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      placeholder = "Search",
      value,
      onChange,
      onFocus,
      onBlur,
      onClear,
      variant = "default",
      className,
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => inputRef.current!, []);
    // V1 variant - original design
    if (variant === "v1") {
      return (
        <div
          className={cn(
            "bg-background-input flex h-[50px] w-full flex-row items-center rounded-lg py-3 shadow-2xs transition-colors",
            className,
          )}
        >
          <div className="relative w-full">
            <Search
              size={24}
              className="text-text-input-subtitle absolute top-1/2 left-[16px] -translate-y-1/2"
            />
            <Input
              placeholder={placeholder}
              className={cn(
                "text-text-primary placeholder:text-text-placeholder border-0! pl-[56px]",
                value && onClear ? "pr-[48px]" : "pr-[16px]",
              )}
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ fontSize: "16px" }}
            />
            {value && onClear && (
              <button
                onClick={onClear}
                className="text-text-input-subtitle hover:text-text-primary absolute top-1/2 right-[16px] flex h-6 w-6 -translate-y-1/2 items-center justify-center transition-colors"
                type="button"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      );
    }

    // Mobile variant - matches the Figma mobile search design
    if (variant === "mobile") {
      return (
        <div
          className={cn(
            "bg-background-surface-4 flex w-full flex-col items-start justify-start gap-2.5 overflow-hidden rounded-lg px-4 py-2",
            className,
          )}
        >
          <div className="inline-flex items-center justify-start gap-4 self-stretch">
            <div className="relative h-6 w-6 overflow-hidden">
              <Search
                className="text-text-body outline-text-body absolute left-[3px] min-h-4 min-w-4 outline-offset-[-1px]"
                strokeWidth={2}
              />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ fontSize: "16px" }}
              className="text-text-primary placeholder:text-text-placeholder flex-1 justify-start border-none bg-transparent text-base leading-relaxed font-normal outline-none focus:ring-0 focus:outline-none"
            />
            {value && onClear && (
              <button
                onClick={onClear}
                className="text-text-body hover:text-text-primary flex h-6 w-6 items-center justify-center transition-colors"
                type="button"
              >
                <X size={24} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      );
    }

    // Default variant - new Figma design
    return (
      <div
        className={cn(
          "bg-background-surface-4 inline-flex min-h-[32px] flex-col items-start justify-start gap-0 self-stretch overflow-hidden rounded-md px-2 py-1",
          className,
        )}
      >
        <div className="inline-flex min-h-[24px] items-center justify-start gap-2 self-stretch">
          <div className="relative h-4 w-4 overflow-hidden">
            <Search
              className="text-text-body absolute top-[0px] left-[1px] max-h-4 min-h-1 max-w-4 min-w-1"
              strokeWidth={1.33}
            />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            style={{ fontSize: "16px" }}
            className="text-text-placeholder placeholder:text-text-placeholder flex-1 justify-start bg-transparent text-xs font-normal outline-none"
          />
          {value && onClear && (
            <button
              onClick={onClear}
              className="text-text-body hover:text-text-primary flex h-4 w-4 items-center justify-center transition-colors"
              type="button"
            >
              <X className="h-3 w-3" strokeWidth={1.33} />
            </button>
          )}
        </div>
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

const MemoizedSearchInput = memo(SearchInput);
MemoizedSearchInput.displayName = "SearchInput";

export { MemoizedSearchInput as SearchInput };
