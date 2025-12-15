import * as React from 'react';
import { cn } from '../../lib/utils';
import { inputBaseStyles } from './input-styles';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Callback when clear button is clicked */
  onClear?: () => void;
}

/**
 * SearchInput Component
 *
 * A specialized input component for search functionality with:
 * - Built-in search icon on the left
 * - Clear button on the right (appears when value exists)
 * - Supports both controlled and uncontrolled modes
 *
 * @example
 * ```tsx
 * // Controlled
 * const [value, setValue] = useState('');
 * <SearchInput
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   onClear={() => setValue('')}
 *   placeholder="Search..."
 * />
 *
 * // Uncontrolled
 * <SearchInput placeholder="Search..." />
 * ```
 */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState('');

    // Use controlled value if provided, otherwise use internal state
    const currentValue = value !== undefined ? value : internalValue;
    const hasValue = currentValue && String(currentValue).length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleClear = () => {
      if (value === undefined) {
        setInternalValue('');
      }
      onClear?.();
    };

    return (
      <div className={cn('relative', className)}>
        {/* Search Icon */}
        <div
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
            '[&_svg]:size-4'
          )}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='11' cy='11' r='8' />
            <path d='m21 21-4.3-4.3' />
          </svg>
        </div>

        {/* Input */}
        <input
          type='text'
          ref={ref}
          data-slot='input'
          value={currentValue}
          onChange={handleChange}
          className={cn(inputBaseStyles, 'pl-9', hasValue ? 'pr-9' : 'pr-3')}
          {...props}
        />

        {/* Clear Button */}
        {hasValue && (
          <button
            type='button'
            onClick={handleClear}
            aria-label='Clear search'
            tabIndex={-1}
            className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-subtle)]',
              '[&_svg]:size-4',
              'cursor-pointer transition-colors hover:text-[var(--fg-default)]'
            )}
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M18 6 6 18' />
              <path d='m6 6 12 12' />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
