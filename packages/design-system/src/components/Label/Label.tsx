import * as React from 'react';
import { cn } from '../../lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Show required indicator (*) */
  required?: boolean;
  /** Error state styling */
  error?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, error, ...props }, ref) => {
    return (
      <label
        ref={ref}
        data-slot="label"
        className={cn(
          'text-sm font-medium',
          error ? 'text-[var(--color-status-error)]' : 'text-[var(--fg-default)]',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-[var(--color-status-error)] ml-1">*</span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';

export { Label };
