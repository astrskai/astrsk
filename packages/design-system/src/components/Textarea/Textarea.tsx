import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          // Base styles
          'flex min-h-20 w-full rounded-xl border px-3 py-2 text-sm transition-colors',
          // Colors
          'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--fg-default)]',
          // Placeholder
          'placeholder:text-[var(--fg-subtle)]',
          // Focus
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]',
          // Disabled
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Invalid state (aria-invalid)
          'aria-invalid:border-[var(--color-status-error)] aria-invalid:ring-[var(--color-status-error)]/20',
          // Resize
          'resize-y',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
