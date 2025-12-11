import * as React from 'react';
import { cn } from '../../lib/utils';
import { inputBaseStyles } from './input-styles';

export interface IconInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icon to display inside the input (optional - use leftIcon/rightIcon as alternatives) */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
  /** Callback when icon is clicked (makes icon clickable) */
  onIconClick?: () => void;
  /** Accessible label for the clickable icon button */
  iconAriaLabel?: string;
  /** Icon to display on the left side (additional to main icon) */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side (additional to main icon) */
  rightIcon?: React.ReactNode;
  /** Callback when right icon is clicked */
  onRightIconClick?: () => void;
  /** Accessible label for the right icon button */
  rightIconAriaLabel?: string;
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
      leftIcon,
      rightIcon,
      onRightIconClick,
      rightIconAriaLabel,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    // Determine which icons are present
    const hasLeftIcon = leftIcon || iconPosition === 'left';
    const hasRightIcon = rightIcon || iconPosition === 'right';

    const isMainIconClickable = !!onIconClick;
    const isRightIconClickable = !!onRightIconClick;

    // Render left icon (either leftIcon prop or icon with position='left')
    const renderLeftIcon = () => {
      const iconToRender = leftIcon || (iconPosition === 'left' ? icon : null);
      if (!iconToRender) return null;

      const isClickable = leftIcon ? false : isMainIconClickable;
      const clickHandler = leftIcon ? undefined : onIconClick;
      const ariaLabel = leftIcon ? undefined : iconAriaLabel;

      if (isClickable) {
        return (
          <button
            type='button'
            onClick={clickHandler}
            aria-label={ariaLabel}
            tabIndex={-1}
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
              '[&_svg]:size-4',
              'cursor-pointer transition-colors hover:text-[var(--fg-default)]'
            )}
          >
            {iconToRender}
          </button>
        );
      }

      return (
        <div
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
            '[&_svg]:size-4'
          )}
        >
          {iconToRender}
        </div>
      );
    };

    // Render right icon (either rightIcon prop or icon with position='right')
    const renderRightIcon = () => {
      const iconToRender =
        rightIcon || (iconPosition === 'right' ? icon : null);
      if (!iconToRender) return null;

      const isClickable = rightIcon ? isRightIconClickable : isMainIconClickable;
      const clickHandler = rightIcon ? onRightIconClick : onIconClick;
      const ariaLabel = rightIcon ? rightIconAriaLabel : iconAriaLabel;

      if (isClickable) {
        return (
          <button
            type='button'
            onClick={clickHandler}
            aria-label={ariaLabel}
            tabIndex={-1}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
              '[&_svg]:size-4',
              'cursor-pointer transition-colors hover:text-[var(--fg-default)]'
            )}
          >
            {iconToRender}
          </button>
        );
      }

      return (
        <div
          className={cn(
            'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
            '[&_svg]:size-4'
          )}
        >
          {iconToRender}
        </div>
      );
    };

    return (
      <div className={cn('relative', className)}>
        {renderLeftIcon()}
        {renderRightIcon()}
        <input
          type={type}
          ref={ref}
          data-slot='input'
          className={cn(
            inputBaseStyles,
            hasLeftIcon ? 'pl-9' : 'pl-3',
            hasRightIcon ? 'pr-9' : 'pr-3'
          )}
          {...props}
        />
      </div>
    );
  }
);

IconInput.displayName = 'IconInput';

export { IconInput };
