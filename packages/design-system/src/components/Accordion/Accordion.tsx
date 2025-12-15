import React, { useState, useCallback, useId, useRef } from 'react';
import { cn } from '../../lib/utils';

export interface AccordionItem {
  /** Unique identifier for the item */
  value: string;
  /** Header content - can be string or any React node */
  trigger: React.ReactNode;
  /** Panel content */
  content: React.ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
}

export interface AccordionProps {
  /** Array of accordion items */
  items: AccordionItem[];
  /** Controlled expanded values (for controlled mode) */
  value?: string[];
  /** Default expanded values (for uncontrolled mode) */
  defaultValue?: string[];
  /** Callback when expanded state changes */
  onChange?: (value: string[]) => void;
  /** Whether multiple items can be expanded at once */
  multiple?: boolean;
  /** Whether all items can be collapsed */
  collapsible?: boolean;
  /** Visual variant */
  variant?: 'default' | 'bordered' | 'separated';
  /** Additional CSS classes */
  className?: string;
}

// Style constants moved outside component
const CONTAINER_CLASSES = {
  default: 'divide-y divide-zinc-800',
  bordered: 'divide-y divide-zinc-800 border border-zinc-800 rounded-lg overflow-hidden',
  separated: 'space-y-2',
} as const;

const ITEM_CLASSES = {
  default: '',
  bordered: '',
  separated: 'border border-zinc-800 rounded-lg overflow-hidden',
} as const;

const TRIGGER_CLASSES = cn(
  'flex w-full items-center justify-between py-4 px-4',
  'text-left font-medium text-zinc-100',
  'transition-colors duration-200',
  'hover:bg-zinc-800/50',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-inset',
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent'
);

const CONTENT_INNER_CLASSES = cn(
  'px-4 pb-4 text-zinc-400'
);

/**
 * Chevron Icon Component (Internal)
 */
function ChevronIcon({ className, isOpen }: { className?: string; isOpen: boolean }) {
  return (
    <svg
      className={cn(
        'h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300',
        isOpen && 'rotate-180',
        className
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Accordion Component
 *
 * A flexible accordion component for expandable/collapsible content sections.
 *
 * @example
 * ```tsx
 * // Simple usage
 * <Accordion
 *   items={[
 *     { value: 'item-1', trigger: 'Section 1', content: 'Content 1' },
 *     { value: 'item-2', trigger: 'Section 2', content: 'Content 2' },
 *   ]}
 * />
 *
 * // Multiple items can be expanded
 * <Accordion
 *   items={items}
 *   multiple
 *   defaultValue={['item-1']}
 * />
 *
 * // Controlled mode
 * <Accordion
 *   items={items}
 *   value={expanded}
 *   onChange={setExpanded}
 *   multiple
 * />
 *
 * // With custom trigger content
 * <Accordion
 *   items={[
 *     {
 *       value: 'faq-1',
 *       trigger: (
 *         <span className="flex items-center gap-2">
 *           <HelpIcon className="size-4" />
 *           How do I get started?
 *         </span>
 *       ),
 *       content: 'Follow these steps...',
 *     },
 *   ]}
 * />
 * ```
 */
export function Accordion({
  items,
  value: controlledValue,
  defaultValue = [],
  onChange,
  multiple = false,
  collapsible = true,
  variant = 'default',
  className,
}: AccordionProps) {
  const baseId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue);

  // Determine if controlled or uncontrolled
  const isControlled = controlledValue !== undefined;
  const expandedValues = isControlled ? controlledValue : internalValue;

  const toggleItem = useCallback(
    (itemValue: string) => {
      let newValue: string[];

      if (expandedValues.includes(itemValue)) {
        // Closing
        if (!collapsible && expandedValues.length === 1) {
          // Can't collapse if not collapsible and it's the only open item
          return;
        }
        newValue = expandedValues.filter((v) => v !== itemValue);
      } else {
        // Opening
        if (multiple) {
          newValue = [...expandedValues, itemValue];
        } else {
          newValue = [itemValue];
        }
      }

      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    },
    [expandedValues, multiple, collapsible, isControlled, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const enabledItems = items
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => !item.disabled);

      if (enabledItems.length === 0) return;

      const currentEnabledIndex = enabledItems.findIndex(({ idx }) => idx === index);
      let nextIndex: number | undefined;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (currentEnabledIndex + 1) % enabledItems.length;
        nextIndex = enabledItems[next].idx;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length;
        nextIndex = enabledItems[prev].idx;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = enabledItems[0].idx;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = enabledItems[enabledItems.length - 1].idx;
      }

      if (nextIndex !== undefined) {
        const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>(
          'button[aria-expanded]'
        );
        buttons?.[nextIndex]?.focus();
      }
    },
    [items]
  );

  return (
    <div ref={containerRef} className={cn(CONTAINER_CLASSES[variant], className)}>
      {items.map((item, index) => {
        const isExpanded = expandedValues.includes(item.value);
        const isDisabled = item.disabled;
        const triggerId = `${baseId}-trigger-${index}`;
        const contentId = `${baseId}-content-${index}`;

        return (
          <div key={item.value} className={ITEM_CLASSES[variant]}>
            <h3>
              <button
                type="button"
                id={triggerId}
                onClick={() => !isDisabled && toggleItem(item.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={isDisabled}
                aria-expanded={isExpanded}
                aria-controls={contentId}
                className={TRIGGER_CLASSES}
              >
                <span className="flex-1">{item.trigger}</span>
                <ChevronIcon isOpen={isExpanded} />
              </button>
            </h3>
            {isExpanded && (
              <div
                id={contentId}
                role="region"
                aria-labelledby={triggerId}
                className={CONTENT_INNER_CLASSES}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

Accordion.displayName = 'Accordion';
