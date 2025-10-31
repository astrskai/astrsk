/**
 * Simple logger for Supermemory extension
 *
 * Since extensions can't import from core pwa code, we provide a minimal logger
 * that wraps console methods with consistent formatting.
 */

const PREFIX = "[Supermemory Extension]";

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`${PREFIX} ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`${PREFIX} ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    console.error(`${PREFIX} ${message}`, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    console.debug(`${PREFIX} ${message}`, ...args);
  },
};
