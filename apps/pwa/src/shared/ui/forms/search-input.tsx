import { Search } from "lucide-react";
import { cn } from "@/shared/lib";

/**
 * Simple search input with icon - uses native input element
 */
export function SearchInput({
  placeholder = "Search",
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="text-text-secondary absolute top-1/2 left-3 -translate-y-1/2"
        size={18}
      />
      <input
        type="text"
        placeholder={placeholder}
        className="bg-background-surface-4 text-text-primary placeholder:text-text-secondary focus:ring-primary/50 h-10 w-full rounded-lg pr-4 pl-10 text-sm focus:ring-2 focus:outline-none"
        {...props}
      />
    </div>
  );
}
