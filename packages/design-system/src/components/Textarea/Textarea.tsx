import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Enable auto-resize based on content */
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    // Expose the internal ref to the parent via forwardRef
    // Note: internalRef.current is guaranteed to be set during commit phase when useImperativeHandle runs
    React.useImperativeHandle(ref, () => internalRef.current!, []);

    // Auto-resize logic
    React.useEffect(() => {
      if (!autoResize || !internalRef.current) return;

      const textarea = internalRef.current;

      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      adjustHeight();
      textarea.addEventListener('input', adjustHeight);
      textarea.addEventListener('focus', adjustHeight);

      return () => {
        textarea.removeEventListener('input', adjustHeight);
        textarea.removeEventListener('focus', adjustHeight);
      };
    }, [autoResize, props.value]);

    return (
      <textarea
        ref={internalRef}
        data-slot="textarea"
        className={cn(
          // Base styles
          'flex min-h-20 w-full rounded-lg border px-3 py-2 text-sm transition-colors',
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
          autoResize ? 'resize-none overflow-hidden' : 'resize-y',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
