import { useState, useEffect } from "react";

/**
 * useDebounce — Debounces a value by a given delay.
 *
 * Returns the debounced value that only updates after the specified
 * delay has elapsed since the last change. Used primarily for search
 * inputs to avoid firing a request on every keystroke.
 *
 * @param {T} value - The value to debounce
 * @param {number} [delayMs=300] - Debounce delay in milliseconds (250–400ms recommended for search)
 * @returns {T} The debounced value
 *
 * @example
 * const [search, setSearch] = useState("");
 * const debouncedSearch = useDebounce(search, 300);
 * // debouncedSearch updates 300ms after the last setSearch call
 */
export function useDebounce(value, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
