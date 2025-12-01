import * as React from 'react';
import { cn } from '../../lib/utils';
import { Input, type InputProps } from './Input';

export interface IconInputProps extends InputProps {
  /** Icon to display inside the input */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
}

/**
 * IconInput Component
 *
 * An Input wrapper that displays an icon inside the input field.
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
  ({ icon, iconPosition = 'left', className, ...props }, ref) => {
    if (!icon) {
      return <Input ref={ref} className={className} {...props} />;
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
        <Input
          ref={ref}
          className={cn(
            iconPosition === 'left' && 'pl-9',
            iconPosition === 'right' && 'pr-9',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

IconInput.displayName = 'IconInput';

export { IconInput };
