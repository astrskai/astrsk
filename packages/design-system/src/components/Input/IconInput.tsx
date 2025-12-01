import * as React from 'react';
import { cn } from '../../lib/utils';

export interface IconInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon to display inside the input */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
}

/**
 * IconInput Component
 *
 * An Input component that displays an icon inside the input field.
 * Useful for search inputs, email inputs, password inputs, etc.
 *
 * @example
 * ```tsx
 * import { Search, Mail, Lock } from 'lucide-react';
 *
 * <IconInput icon={<Search className="size-4" />} placeholder="Search..." />
 * <IconInput icon={<Mail className="size-4" />} type="email" placeholder="Email" />
 * <IconInput icon={<Lock className="size-4" />} iconPosition="right" type="password" />
 * ```
 */
const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, iconPosition = 'left', className, type = 'text', ...props }, ref) => {
    const inputStyles = cn(
      // Base styles
      'flex h-9 w-full rounded-xl border py-2 text-sm transition-colors',
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
      // Padding based on icon position
      icon && iconPosition === 'left' ? 'pl-9 pr-3' : '',
      icon && iconPosition === 'right' ? 'pl-3 pr-9' : '',
      !icon && 'px-3',
      className
    );

    if (!icon) {
      return (
        <input
          type={type}
          ref={ref}
          data-slot="input"
          className={inputStyles}
          {...props}
        />
      );
    }

    return (
      <div className="relative">
        <div
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
            '[&_svg]:size-4',
            iconPosition === 'left' ? 'left-3' : 'right-3'
          )}
        >
          {icon}
        </div>
        <input
          type={type}
          ref={ref}
          data-slot="input"
          className={inputStyles}
          {...props}
        />
      </div>
    );
  }
);

IconInput.displayName = 'IconInput';

export { IconInput };
