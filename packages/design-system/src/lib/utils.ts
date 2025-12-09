import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format large numbers to compact notation
 * @example
 * formatCompactNumber(1000) // "1k"
 * formatCompactNumber(1500) // "1.5k"
 * formatCompactNumber(1000000) // "1M"
 * formatCompactNumber(1000000000) // "1B"
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  const units = ['', 'k', 'M', 'B', 'T'];
  const order = Math.floor(Math.log10(num) / 3);
  const unitName = units[order];
  const value = num / Math.pow(1000, order);

  // Remove unnecessary decimals
  const formatted = value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);

  return `${formatted}${unitName}`;
}
