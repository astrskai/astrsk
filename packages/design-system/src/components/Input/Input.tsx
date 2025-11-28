import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          // Base styles
          'flex h-9 w-full rounded-xl border px-3 py-2 text-sm transition-colors',
          // Colors
          'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--fg-default)]',
          // Placeholder
          'placeholder:text-[var(--fg-subtle)]',
          // Focus
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // File input
          'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--fg-default)]',
          // Invalid state (aria-invalid)
          'aria-invalid:border-[var(--color-status-error)] aria-invalid:ring-[var(--color-status-error)]/20',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
