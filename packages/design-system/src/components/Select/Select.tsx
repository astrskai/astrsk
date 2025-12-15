import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Options to display */
  options: SelectOption[];
  /** Current value */
  value?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional class name for trigger */
  className?: string;
  /** Alignment of dropdown */
  align?: 'start' | 'end';
}

/**
 * Select Component
 *
 * A fully custom select dropdown with keyboard navigation and accessibility.
 * Built without external dependencies.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState('');
 *
 * <Select
 *   options={[
 *     { value: 'asc', label: 'Ascending' },
 *     { value: 'desc', label: 'Descending' },
 *   ]}
 *   value={value}
 *   onChange={setValue}
 *   placeholder="Select order..."
 * />
 * ```
 */
const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select...',
      disabled = false,
      className,
      align = 'start',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    // Close on outside click
    React.useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Reset highlighted index when opening
    React.useEffect(() => {
      if (isOpen) {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
      }
    }, [isOpen, options, value]);

    // Scroll highlighted item into view
    React.useEffect(() => {
      if (isOpen && listRef.current && highlightedIndex >= 0) {
        const items = listRef.current.querySelectorAll('[role="option"]');
        items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
      }
    }, [highlightedIndex, isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            const option = options[highlightedIndex];
            if (option && !option.disabled) {
              onChange?.(option.value);
              setIsOpen(false);
            }
          } else {
            setIsOpen(true);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) => {
              let next = prev + 1;
              while (next < options.length && options[next]?.disabled) {
                next++;
              }
              return next < options.length ? next : prev;
            });
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && options[next]?.disabled) {
                next--;
              }
              return next >= 0 ? next : prev;
            });
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case 'Tab':
          setIsOpen(false);
          break;
        case 'Home':
          e.preventDefault();
          if (isOpen) {
            const firstEnabled = options.findIndex((opt) => !opt.disabled);
            if (firstEnabled >= 0) setHighlightedIndex(firstEnabled);
          }
          break;
        case 'End':
          e.preventDefault();
          if (isOpen) {
            for (let i = options.length - 1; i >= 0; i--) {
              if (!options[i]?.disabled) {
                setHighlightedIndex(i);
                break;
              }
            }
          }
          break;
      }
    };

    const handleOptionClick = (option: SelectOption) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className='relative inline-block'>
        {/* Trigger Button */}
        <button
          ref={ref}
          type='button'
          role='combobox'
          aria-expanded={isOpen}
          aria-haspopup='listbox'
          aria-controls='select-listbox'
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            // Base styles
            'flex h-9 w-full min-w-[8rem] items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
            // Colors
            'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--fg-default)]',
            // Focus
            'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]',
            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Enabled hover
            !disabled && 'cursor-pointer hover:border-[var(--border-focus)]',
            className
          )}
        >
          <span
            className={cn(
              'truncate',
              !selectedOption && 'text-[var(--fg-subtle)]'
            )}
          >
            {selectedOption?.label || placeholder}
          </span>
          {/* Chevron Icon */}
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
            className={cn(
              'shrink-0 text-[var(--fg-subtle)] transition-transform',
              isOpen && 'rotate-180'
            )}
          >
            <path d='m6 9 6 6 6-6' />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <ul
            ref={listRef}
            id='select-listbox'
            role='listbox'
            aria-activedescendant={
              highlightedIndex >= 0
                ? `select-option-${highlightedIndex}`
                : undefined
            }
            className={cn(
              // Position & size
              'absolute z-50 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto rounded-lg border p-1',
              // Colors
              'bg-[var(--bg-surface)] border-[var(--border-default)]',
              // Shadow
              'shadow-lg',
              // Animation
              'animate-in fade-in-0 zoom-in-95',
              // Alignment
              align === 'end' ? 'right-0' : 'left-0'
            )}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`select-option-${index}`}
                role='option'
                aria-selected={option.value === value}
                aria-disabled={option.disabled}
                onClick={() => handleOptionClick(option)}
                onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
                className={cn(
                  // Base
                  'relative flex cursor-pointer select-none items-center rounded-md px-2 py-1.5 text-sm outline-none transition-colors',
                  // Default text color
                  'text-[var(--fg-default)]',
                  // Hover state (CSS)
                  !option.disabled && 'hover:bg-[var(--bg-surface-overlay)]',
                  // Highlighted state (keyboard navigation)
                  highlightedIndex === index &&
                    !option.disabled &&
                    'bg-[var(--bg-surface-overlay)]',
                  // Selected state
                  option.value === value && 'font-medium',
                  // Disabled state
                  option.disabled &&
                    'cursor-not-allowed text-[var(--fg-subtle)] opacity-50'
                )}
              >
                {/* Check Icon for selected */}
                <span className='mr-2 flex h-4 w-4 items-center justify-center'>
                  {option.value === value && (
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
                      <path d='M20 6 9 17l-5-5' />
                    </svg>
                  )}
                </span>
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
