import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { IconInput, type IconInputProps } from './IconInput';

export interface PasswordInputProps
  extends Omit<
    IconInputProps,
    'type' | 'icon' | 'iconPosition' | 'onIconClick' | 'iconAriaLabel'
  > {}

/**
 * PasswordInput Component
 *
 * A specialized input for password fields with built-in show/hide toggle.
 * Uses IconInput internally for consistent styling.
 *
 * @example
 * ```tsx
 * <PasswordInput placeholder="Enter password" />
 * <PasswordInput placeholder="Confirm password" aria-label="Confirm password" />
 * ```
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (props, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    return (
      <IconInput
        {...props}
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        icon={
          showPassword ? (
            <EyeOff aria-hidden='true' />
          ) : (
            <Eye aria-hidden='true' />
          )
        }
        iconPosition='right'
        onIconClick={togglePasswordVisibility}
        iconAriaLabel={showPassword ? 'Hide password' : 'Show password'}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
