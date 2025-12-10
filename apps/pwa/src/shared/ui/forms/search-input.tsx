import { Search, X } from "lucide-react";
import { cn } from "@/shared/lib";
import { forwardRef, useState } from "react";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "dark";
}

/**
 * Simple search input with icon and clear button - uses native input element
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = "Search", className, value, onChange, variant = "default", ...props }, ref) => {
  const [internalValue, setInternalValue] = useState<string>("");

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value !== undefined ? value : internalValue;
  const hasValue = currentValue && String(currentValue).length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const handleClear = () => {
    if (value === undefined) {
      setInternalValue("");
    }
    // Trigger onChange with empty value
    if (onChange) {
      const syntheticEvent = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Search
        className="absolute top-1/2 left-3 -translate-y-1/2 text-neutral-400"
        strokeWidth={2.5}
        size={18}
      />
      <input
        ref={ref}
        type="text"
        placeholder={placeholder}
        value={currentValue}
        onChange={handleChange}
        className={cn(
          "h-10 w-full rounded-lg pr-10 pl-10 text-sm text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-inset focus:ring-brand-500/50 focus:outline-none",
          {
            "bg-neutral-800": variant === "default",
            "border border-zinc-700 bg-zinc-900": variant === "dark",
          },
        )}
        {...props}
      />
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-100"
          aria-label="Clear search"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = "SearchInput";
