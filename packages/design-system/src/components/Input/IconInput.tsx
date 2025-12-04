import * as React from 'react';
import { cn } from '../../lib/utils';
import { inputBaseStyles } from './input-styles';

export interface IconInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon to display inside the input */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
  /** Callback when icon is clicked (makes icon clickable) */
  onIconClick?: () => void;
  /** Accessible label for the clickable icon button */
  iconAriaLabel?: string;
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
 * <IconInput icon={<Eye className="size-4" />} iconPosition="right" onIconClick={() => {}} />
 * ```
 */
const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  (
    {
      icon,
      iconPosition = 'left',
      onIconClick,
      iconAriaLabel,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputStyles = cn(
      inputBaseStyles,
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
          data-slot='input'
          className={inputStyles}
          {...props}
        />
      );
    }

    const isClickable = !!onIconClick;

    return (
      <div className='relative'>
        {isClickable ? (
          <button
            type='button'
            onClick={onIconClick}
            aria-label={iconAriaLabel}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
              '[&_svg]:size-4',
              iconPosition === 'left' ? 'left-3' : 'right-3',
              'cursor-pointer hover:text-[var(--fg-default)] transition-colors'
            )}
          >
            {icon}
          </button>
        ) : (
          <div
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
              '[&_svg]:size-4',
              iconPosition === 'left' ? 'left-3' : 'right-3'
            )}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          data-slot='input'
          className={inputStyles}
          {...props}
        />
      </div>
    );
  }
);

IconInput.displayName = 'IconInput';

export { IconInput };
