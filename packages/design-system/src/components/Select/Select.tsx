import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  /** Options to display in the select */
  options: SelectOption[];
  /** Placeholder text (shown as first disabled option) */
  placeholder?: string;
}

const CHEVRON_ICON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, style, defaultValue, ...props }, ref) => {
    const isControlled = 'value' in props;
    const resolvedDefaultValue =
      !isControlled && placeholder && defaultValue === undefined ? '' : defaultValue;

    return (
      <select
        ref={ref}
        data-slot="select"
        defaultValue={resolvedDefaultValue}
        className={cn(
          // Base styles
          'flex h-9 w-full appearance-none rounded-xl border px-3 py-2 text-sm transition-colors',
          // Colors
          'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--fg-default)]',
          // Arrow indicator spacing
          'bg-no-repeat pr-10',
          // Focus
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Invalid state (aria-invalid)
          'aria-invalid:border-[var(--color-status-error)] aria-invalid:ring-[var(--color-status-error)]/20',
          className
        )}
        style={{
          backgroundImage: CHEVRON_ICON,
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px 16px',
          ...style,
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select };
