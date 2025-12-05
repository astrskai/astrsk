import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';
import { IconInput, type IconInputProps } from './IconInput';
import { Label } from '../Label';

export interface PasswordInputProps
  extends Omit<
    IconInputProps,
    | 'type'
    | 'icon'
    | 'iconPosition'
    | 'onIconClick'
    | 'iconAriaLabel'
    | 'rightIcon'
    | 'onRightIconClick'
    | 'rightIconAriaLabel'
  > {
  /** Label text */
  label?: string;
  /** Helper text shown below input */
  hint?: string;
  /** Error message (also sets aria-invalid) */
  error?: string;
  /**
   * Label position: top (above), left (inline), inner (floating on border)
   * Note: `inner` label position cannot be used with `leftIcon`
   */
  labelPosition?: 'top' | 'left' | 'inner';
  /** Required field indicator */
  required?: boolean;
}

/**
 * PasswordInput Component
 *
 * A specialized input for password fields with built-in show/hide toggle.
 * Supports label, hint, error, and left icon for consistency with other inputs.
 *
 * @example
 * ```tsx
 * <PasswordInput placeholder="Enter password" />
 * <PasswordInput label="Password" required />
 * <PasswordInput label="Password" leftIcon={<Lock />} error="Required" />
 * ```
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      leftIcon,
      label,
      hint,
      error,
      labelPosition = 'top',
      required,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    // leftIcon is ignored when labelPosition is 'inner'
    const effectiveLeftIcon = labelPosition === 'inner' ? undefined : leftIcon;

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    const inputElement = (
      <IconInput
        {...props}
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [errorId, hintId].filter(Boolean).join(' ') || undefined
        }
        type={showPassword ? 'text' : 'password'}
        leftIcon={effectiveLeftIcon}
        rightIcon={
          showPassword ? (
            <EyeOff aria-hidden='true' />
          ) : (
            <Eye aria-hidden='true' />
          )
        }
        onRightIconClick={togglePasswordVisibility}
        rightIconAriaLabel={showPassword ? 'Hide password' : 'Show password'}
        className={className}
      />
    );

    const labelElement = label && (
      <Label
        htmlFor={inputId}
        required={required}
        error={!!error}
        className={cn(labelPosition === 'left' && 'min-w-[100px]')}
      >
        {label}
      </Label>
    );

    const messageElement = (error || hint) && (
      <div className='flex flex-col gap-1'>
        {error && (
          <p id={errorId} className='text-xs text-[var(--color-status-error)]'>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className='text-xs text-[var(--fg-subtle)]'>
            {hint}
          </p>
        )}
      </div>
    );

    const innerLabelElement = label && (
      <label
        htmlFor={inputId}
        className={cn(
          'pointer-events-none absolute left-3 top-0 -translate-y-1/2 rounded-sm px-1 text-xs font-medium',
          'bg-[var(--input-bg)]',
          error
            ? 'text-[var(--color-status-error)]'
            : 'text-[var(--fg-muted)]',
          effectiveLeftIcon && 'left-9'
        )}
      >
        {label}
        {required && (
          <span className='ml-0.5 text-[var(--color-status-error)]'>*</span>
        )}
      </label>
    );

    // Inner (floating label on border)
    if (labelPosition === 'inner') {
      return (
        <div className='relative'>
          {inputElement}
          {innerLabelElement}
          {messageElement}
        </div>
      );
    }

    // Left (inline label)
    if (labelPosition === 'left') {
      return (
        <div className='flex items-start gap-3'>
          {labelElement}
          <div className='flex flex-1 flex-col gap-1.5'>
            {inputElement}
            {messageElement}
          </div>
        </div>
      );
    }

    // No label - just return input with messages
    if (!label) {
      return (
        <div className='flex flex-col gap-1.5'>
          {inputElement}
          {messageElement}
        </div>
      );
    }

    // Top (default)
    return (
      <div className='flex flex-col gap-1.5'>
        {labelElement}
        {inputElement}
        {messageElement}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
