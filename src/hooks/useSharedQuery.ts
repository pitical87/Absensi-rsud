import { useEffect, useState } from "react";

type Entry<T> = {
  inFlight: Promise<T> | null;
  data: T | null;
  loadedAt: number;
};

const store = new Map<string, Entry<unknown>>();
const DEFAULT_TTL_MS = 5_000;

function get<T>(key: string): Entry<T> | undefined {
  return store.get(key) as Entry<T> | undefined;
}
export type SharedQueryOptions = { ttl?: number; enabled?: boolean };

export default function useSharedQuery<T>(key: string, fetcher: () => Promise<T>, options: SharedQueryOptions = {}): { data: T | null; loading: boolean } {
  const { ttl = DEFAULT_TTL_MS, enabled = true } = options;

  const current = get<T>(key);
  const [data, setData] = useState<T | null>(enabled && current?.data ? current.data : null);
  const [loading, setLoading] = useState(enabled ? !(current?.data ?? null) : false);

  useEffect(() => {
    if (!enabled) return;

    let aktif = true;

    const finish = (val: T) => {
      if (aktif) {
        setData(val);
        setLoading(false);
      }
    };
    const fail = () => {
      if (aktif) setLoading(false);
    };

    const entry = get<T>(key);
    const cached = entry?.data;
    const cachedAt = entry?.loadedAt ?? 0;

    if (cached && Date.now() - cachedAt < ttl) {
      Promise.resolve().then(() => finish(cached));
    } else if (entry?.inFlight) {
      entry.inFlight.then(finish, fail);
    } else {
      const baru: Entry<T> = { inFlight: null, data: null, loadedAt: 0 };
      store.set(key, baru as Entry<unknown>);
      baru.inFlight = fetcher().then(
        (val) => {
          baru.data = val;
          baru.loadedAt = Date.now();
          baru.inFlight = null;
          return val;
        },
        (err) => {
          baru.inFlight = null;
          throw err;
        },
      );
      baru.inFlight.then(finish, fail);
    }

    return () => {
      aktif = false;
    };
  }, [key, enabled, fetcher, ttl]);

  return { data, loading };
}
