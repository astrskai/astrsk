import * as React from 'react';
import { cn } from '../../lib/utils';

const variantStyles = {
  default:
    'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-bg-hover)]',
  destructive: 'bg-[var(--color-status-error)] text-white hover:opacity-90',
  outline:
    'border border-[var(--btn-outline-border)] bg-transparent text-[var(--btn-outline-fg)] hover:bg-[var(--btn-outline-bg-hover)]',
  secondary:
    'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)] border border-[var(--border-muted)] hover:bg-[var(--btn-secondary-bg-hover)]',
  ghost:
    'bg-transparent text-[var(--btn-ghost-fg)] hover:bg-[var(--btn-ghost-bg-hover)]',
  link: 'text-[var(--accent-primary)] underline-offset-4 hover:underline',
} as const;

const sizeStyles = {
  default: 'h-9 px-4 py-2 has-[>svg]:px-3',
  sm: 'h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5',
  lg: 'h-11 px-6 text-base has-[>svg]:px-4',
  icon: 'size-9',
  'icon-sm': 'size-8',
  'icon-lg': 'size-11',
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  /** If true, applies rounded-full instead of default border radius */
  round?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', round = false, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        data-slot="button"
        className={cn(
          // Base styles
          "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all",
          // Border radius
          round ? "rounded-full" : "rounded-lg",
          // Disabled
          "disabled:pointer-events-none disabled:opacity-50",
          // Focus
          "outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]",
          // SVG icon handling (shadcn v4 pattern)
          "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
          // Variant & Size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, variantStyles, sizeStyles };
