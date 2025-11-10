import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarArrowUp,
  CalendarArrowDown,
} from "lucide-react";
import type { SelectOption } from "@/shared/ui/forms";

/**
 * Sort option value constants
 * Centralized management for sort values
 */
export const SORT_VALUES = {
  LATEST: "latest",
  OLDEST: "oldest",
  TITLE_A_TO_Z: "title-atoz",
  TITLE_Z_TO_A: "title-ztoa",
} as const;

/**
 * Sort options for card lists
 * Used across character, scenario, and other card list pages
 */
export const SORT_OPTIONS: SelectOption[] = [
  {
    value: SORT_VALUES.LATEST,
    label: "Newest first",
    icon: CalendarArrowUp,
  },
  {
    value: SORT_VALUES.OLDEST,
    label: "Oldest first",
    icon: CalendarArrowDown,
  },
  {
    value: SORT_VALUES.TITLE_A_TO_Z,
    label: "Name (A-Z)",
    icon: ArrowDownAZ,
  },
  {
    value: SORT_VALUES.TITLE_Z_TO_A,
    label: "Name (Z-A)",
    icon: ArrowUpAZ,
  },
] as const;

/**
 * Type for sort option values
 */
export type SortOptionValue = (typeof SORT_OPTIONS)[number]["value"];

/**
 * Default sort option
 */
export const DEFAULT_SORT_VALUE = SORT_VALUES.LATEST;
