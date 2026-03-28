import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Thin wrapper around react-router-dom's useSearchParams.
 *
 * • get(key, fallback)  — read a single param
 * • setParams(updates)  — merge an object of key/value into the URL
 *                          (empty strings / null are removed)
 * • clearAll()          — reset the query string
 */
export default function useQueryParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  /** Read a param, falling back to a default value */
  const get = useCallback(
    (key, fallback) => searchParams.get(key) ?? defaults[key] ?? fallback ?? "",
    [searchParams, defaults]
  );

  /** Merge updates into existing params; null / "" removes the key */
  const setParams = useCallback(
    (updates) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([k, v]) => {
          if (v === null || v === undefined || v === "") {
            next.delete(k);
          } else {
            next.set(k, v);
          }
        });
        return next;
      });
    },
    [setSearchParams]
  );

  /** Remove every param */
  const clearAll = useCallback(
    () => setSearchParams(new URLSearchParams()),
    [setSearchParams]
  );

  /** Snapshot of all current params as a plain object */
  const all = useMemo(() => Object.fromEntries(searchParams), [searchParams]);

  return { get, setParams, clearAll, all };
}
