import { Search, X } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, memo } from "react";

import { cn } from "@/components-v2/lib/utils";
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
            "flex flex-row items-center h-[50px] w-full rounded-lg bg-background-input py-3 shadow-2xs transition-colors",
            className,
          )}
        >
          <div className="relative w-full">
            <Search
              size={24}
              className="absolute left-[16px] top-1/2 -translate-y-1/2 text-text-input-subtitle"
            />
            <Input
              placeholder={placeholder}
              className={cn(
                "pl-[56px] border-0! text-text-primary placeholder:text-text-placeholder",
                value && onClear ? "pr-[48px]" : "pr-[16px]"
              )}
              value={value}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              style={{ fontSize: '16px' }}
            />
            {value && onClear && (
              <button
                onClick={onClear}
                className="absolute right-[16px] top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-text-input-subtitle hover:text-text-primary transition-colors"
                type="button"
              >
                <X className="w-4 h-4" strokeWidth={2} />
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
            "w-full px-4 py-2 bg-background-surface-4 rounded-lg flex flex-col justify-start items-start gap-2.5 overflow-hidden",
            className,
          )}
        >
          <div className="self-stretch inline-flex justify-start items-center gap-4 ">
            <div className="w-6 h-6 relative overflow-hidden">
              <Search
                className="min-w-4 min-h-4 left-[3px] absolute outline-offset-[-1px] text-text-body outline-text-body"
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
              style={{ fontSize: '16px' }}
              className="flex-1 justify-start text-text-primary text-base font-normal leading-relaxed bg-transparent outline-none border-none focus:outline-none focus:ring-0 placeholder:text-text-placeholder"
            />
            {value && onClear && (
              <button
                onClick={onClear}
                className="w-6 h-6 flex items-center justify-center text-text-body hover:text-text-primary transition-colors"
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
          "self-stretch px-2 py-1 bg-background-surface-4 rounded-md inline-flex flex-col justify-start items-start gap-0 overflow-hidden min-h-[32px]",
          className,
        )}
      >
        <div className="self-stretch inline-flex justify-start items-center gap-2 min-h-[24px]">
          <div className="w-4 h-4 relative overflow-hidden">
            <Search
              className="min-w-1 max-w-4 min-h-1 max-h-4 absolute left-[1px] top-[0px] text-text-body"
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
            style={{ fontSize: '16px' }}
            className="flex-1 justify-start text-text-placeholder text-xs font-normal bg-transparent outline-none placeholder:text-text-placeholder"
          />
          {value && onClear && (
            <button
              onClick={onClear}
              className="w-4 h-4 flex items-center justify-center text-text-body hover:text-text-primary transition-colors"
              type="button"
            >
              <X className="w-3 h-3" strokeWidth={1.33} />
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

const SearchInputMobile = ({
  placeholder = "Search",
  value,
  onChange,
  onClear,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}) => {
  return (
    <div
      className={cn(
        "flex flex-row items-center h-[44px] w-full rounded-lg bg-background-input py-[8px] px-[16px] shadow-2xs transition-colors",
      )}
    >
      <div className="relative w-full">
        <Search
          size={24}
          className="absolute left-0 top-1/2 -translate-y-1/2 text-text-placeholder"
        />
        <Input
          placeholder={placeholder}
          className={cn(
            "pl-[32px] border-0! bg-transparent text-base text-text-primary placeholder:text-text-placeholder h-[28px] py-0",
            value && onClear ? "pr-[32px]" : "pr-0"
          )}
          value={value}
          onChange={onChange}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          style={{ fontSize: '16px' }}
        />
        {value && onClear && (
          <button
            onClick={onClear}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-text-placeholder hover:text-text-primary transition-colors"
            type="button"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
};

export { MemoizedSearchInput as SearchInput, SearchInputMobile };
