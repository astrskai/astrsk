import { cn } from '../../lib/utils';

/**
 * Common base styles for all input components
 * Centralized here to ensure consistent styling across Input, IconInput, PasswordInput, etc.
 */
export const inputBaseStyles = cn(
  // Base styles
  'flex h-9 w-full rounded-lg border py-2 text-sm transition-colors',
  // Colors
  'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--fg-default)]',
  // Placeholder
  'placeholder:text-[var(--fg-subtle)]',
  // Focus
  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]',
  // Disabled
  'disabled:cursor-not-allowed disabled:opacity-50',
  // File input
  'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--fg-default)]',
  // Invalid state (aria-invalid)
  'aria-invalid:border-[var(--color-status-error)] aria-invalid:ring-[var(--color-status-error)]/20'
);
