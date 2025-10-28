"use client";

import { parse, stringify } from "superjson";
import { PersistStorage, StorageValue } from "zustand/middleware";

export class LocalPersistStorage<S> implements PersistStorage<S> {
  getItem(name: string) {
    const str = localStorage.getItem(name);
    if (!str) {
      return null;
    }
    return parse(str) as StorageValue<S>;
  }

  setItem(name: string, value: StorageValue<S>) {
    localStorage.setItem(name, stringify(value));
  }

  removeItem(name: string) {
    localStorage.removeItem(name);
  }
}
