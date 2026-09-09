import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { saveStored, storageKeys, storedSnapshot, subscribeStored } from '../lib/storage';

const key = storageKeys.planFavorites;
const subscribe = (onChange: () => void) => subscribeStored(key, onChange);
const getSnapshot = () => storedSnapshot(key);
const getServerSnapshot = () => null;

function readFavorites(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
      throw new TypeError('Expected a list of favorite plan identifiers');
    }
    return new Set(value);
  } catch (error) {
    console.warn('CONECTA favorites could not be read; stored value kept', error);
    return new Set();
  }
}

export function usePlanFavorites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const favorites = useMemo(() => readFavorites(snapshot), [snapshot]);
  const toggleFavorite = useCallback((title: string) => {
    const next = readFavorites(getSnapshot());
    if (next.has(title)) next.delete(title);
    else next.add(title);
    saveStored(key, [...next]);
  }, []);
  return { favorites, toggleFavorite };
}
