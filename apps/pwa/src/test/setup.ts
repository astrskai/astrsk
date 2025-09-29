import { vi } from 'vitest';

// Mock indexedDB for test environment
const mockIndexedDB = {
  open: vi.fn(() => ({
    onsuccess: vi.fn(),
    onerror: vi.fn(),
    result: {
      close: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({
            onsuccess: vi.fn(),
            onerror: vi.fn(),
          })),
          put: vi.fn(() => ({
            onsuccess: vi.fn(),
            onerror: vi.fn(),
          })),
          delete: vi.fn(() => ({
            onsuccess: vi.fn(),
            onerror: vi.fn(),
          })),
        })),
      })),
    },
  })),
  deleteDatabase: vi.fn(),
};

// @ts-ignore
global.indexedDB = mockIndexedDB;
