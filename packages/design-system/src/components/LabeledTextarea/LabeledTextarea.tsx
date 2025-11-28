import * as React from 'react';
import { cn } from '../../lib/utils';
import { Textarea, type TextareaProps } from '../Textarea';
import { Label } from '../Label';

export interface LabeledTextareaProps extends TextareaProps {
  /** Label text */
  label?: string;
  /** Helper text shown below textarea */
  hint?: string;
  /** Error message (also sets aria-invalid) */
  error?: string;
  /** Label position: top (above), left (inline), inner (floating on border) */
  labelPosition?: 'top' | 'left' | 'inner';
  /** Required field indicator */
  required?: boolean;
}

const LabeledTextarea = React.forwardRef<HTMLTextAreaElement, LabeledTextareaProps>(
  (
    {
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
    const textareaId = id || React.useId();
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    const labelElement = label && (
      <Label
        htmlFor={textareaId}
        required={required}
        className={cn(labelPosition === 'left' && 'min-w-[100px]')}
      >
        {label}
      </Label>
    );

    const textareaElement = (
      <Textarea
        ref={ref}
        id={textareaId}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          [errorId, hintId].filter(Boolean).join(' ') || undefined
        }
        className={className}
        {...props}
      />
    );

    const messageElement = (error || hint) && (
      <div className="flex flex-col gap-1">
        {error && (
          <p id={errorId} className="text-xs text-[var(--color-status-error)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-xs text-[var(--fg-subtle)]">
            {hint}
          </p>
        )}
      </div>
    );

    // Inner (floating label on border)
    if (labelPosition === 'inner') {
      return (
        <div className="relative">
          <Textarea
            ref={ref}
            id={textareaId}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              [errorId, hintId].filter(Boolean).join(' ') || undefined
            }
            placeholder={props.placeholder || ' '}
            className={className}
            {...props}
          />
          {label && (
            <label
              htmlFor={textareaId}
              className={cn(
                'absolute top-0 left-3 -translate-y-1/2 px-1 text-xs font-medium pointer-events-none',
                'bg-[var(--input-bg)] rounded-sm',
                error ? 'text-[var(--color-status-error)]' : 'text-[var(--fg-muted)]'
              )}
            >
              {label}
              {required && <span className="text-[var(--color-status-error)] ml-0.5">*</span>}
            </label>
          )}
          {messageElement}
        </div>
      );
    }

    // Left (inline label)
    if (labelPosition === 'left') {
      return (
        <div className="flex items-start gap-3">
          {labelElement}
          <div className="flex flex-1 flex-col gap-1.5">
            {textareaElement}
            {messageElement}
          </div>
        </div>
      );
    }

    // Top (default)
    return (
      <div className="flex flex-col gap-1.5">
        {labelElement}
        {textareaElement}
        {messageElement}
      </div>
    );
  }
);

LabeledTextarea.displayName = 'LabeledTextarea';

export { LabeledTextarea };
