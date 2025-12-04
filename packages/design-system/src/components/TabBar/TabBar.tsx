import type { ReactNode, KeyboardEvent } from 'react';
import { useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem<T extends string = string> {
  /** Unique identifier for the tab */
  value: T;
  /** Tab label - can be string, icon, or any React node */
  label: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
}

export interface TabBarProps<T extends string = string> {
  /** Array of tab items */
  tabs: TabItem<T>[];
  /** Currently selected tab value */
  value: T;
  /** Callback when tab is selected */
  onChange?: (value: T) => void;
  /** Visual variant of the tab bar */
  variant?: 'default' | 'pills' | 'underline';
  /** Size of the tabs */
  size?: 'sm' | 'md' | 'lg';
  /** Whether tabs should take full width */
  fullWidth?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Accessible label for the tab list */
  'aria-label'?: string;
}

// Style constants moved outside component to prevent recreation on each render
const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
} as const;

const CONTAINER_CLASSES = {
  default: 'bg-zinc-900 rounded-lg p-1 gap-1',
  pills: 'gap-2',
  underline: 'border-b border-zinc-800 gap-0',
} as const;

const TAB_BASE_CLASSES = {
  default: 'rounded-md',
  pills: 'rounded-full border border-transparent',
  underline: 'border-b-2 border-transparent rounded-none -mb-px',
} as const;

const TAB_ACTIVE_CLASSES = {
  default: 'bg-zinc-700 text-white',
  pills: 'bg-zinc-800 border-zinc-700 text-white',
  underline: 'border-white text-white',
} as const;

const TAB_INACTIVE_CLASSES = {
  default: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800',
  pills: 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 hover:border-zinc-700/50',
  underline: 'text-zinc-400 hover:text-zinc-200 hover:border-zinc-600',
} as const;

/**
 * TabBar Component
 *
 * A flexible tab bar component that supports custom labels including
 * icons, text, counts, or any combination.
 *
 * @example
 * ```tsx
 * // Simple text tabs
 * <TabBar
 *   tabs={[
 *     { value: 'all', label: 'All' },
 *     { value: 'active', label: 'Active' },
 *   ]}
 *   value={activeTab}
 *   onChange={setActiveTab}
 * />
 *
 * // With icons
 * <TabBar
 *   tabs={[
 *     { value: 'grid', label: <GridIcon /> },
 *     { value: 'list', label: <ListIcon /> },
 *   ]}
 *   value={view}
 *   onChange={setView}
 * />
 *
 * // Icon + text + count
 * <TabBar
 *   tabs={[
 *     {
 *       value: 'inbox',
 *       label: (
 *         <span className="flex items-center gap-2">
 *           <InboxIcon className="size-4" />
 *           Inbox
 *           <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs">12</span>
 *         </span>
 *       ),
 *     },
 *   ]}
 *   value={tab}
 *   onChange={setTab}
 * />
 * ```
 */
export function TabBar<T extends string = string>({
  tabs,
  value,
  onChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  'aria-label': ariaLabel = 'Tabs',
}: TabBarProps<T>) {
  const tablistRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation handler for WAI-ARIA tabs pattern
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      const enabledTabs = tabs
        .map((tab, index) => ({ tab, index }))
        .filter(({ tab }) => !tab.disabled);

      if (enabledTabs.length === 0) return;

      const currentEnabledIndex = enabledTabs.findIndex(
        ({ index }) => index === currentIndex
      );

      let nextIndex: number | undefined;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (currentEnabledIndex + 1) % enabledTabs.length;
        nextIndex = enabledTabs[next].index;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev =
          (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length;
        nextIndex = enabledTabs[prev].index;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = enabledTabs[0].index;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = enabledTabs[enabledTabs.length - 1].index;
      }

      if (nextIndex !== undefined) {
        const buttons = tablistRef.current?.querySelectorAll<HTMLButtonElement>(
          'button[role="tab"]'
        );
        buttons?.[nextIndex]?.focus();
        onChange?.(tabs[nextIndex].value);
      }
    },
    [tabs, onChange]
  );

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex',
        CONTAINER_CLASSES[variant],
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isSelected = tab.value === value;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.value}
            role="tab"
            type="button"
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            tabIndex={isSelected ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange?.(tab.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              'flex items-center justify-center font-medium transition-all duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
              SIZE_CLASSES[size],
              TAB_BASE_CLASSES[variant],
              isSelected ? TAB_ACTIVE_CLASSES[variant] : TAB_INACTIVE_CLASSES[variant],
              isDisabled && 'cursor-not-allowed opacity-50',
              fullWidth && 'flex-1'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

TabBar.displayName = 'TabBar';
