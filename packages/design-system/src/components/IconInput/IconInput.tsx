import * as React from 'react';
import { cn } from '../../lib/utils';
import { Input, type InputProps } from '../Input';

export interface IconInputProps extends InputProps {
  /**
   * Icon element to display on the left side (decorative).
   * The icon is hidden from screen readers (aria-hidden).
   * Ensure the input has an accessible name via `placeholder` or `aria-label`.
   */
  icon: React.ReactNode;
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)] [&>svg]:size-4 pointer-events-none"
        >
          {icon}
        </span>
        <Input
          ref={ref}
          className={cn('pl-9', className)}
          {...props}
        />
      </div>
    );
  }
);

IconInput.displayName = 'IconInput';

export { IconInput };
