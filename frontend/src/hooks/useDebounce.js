import { useState, useEffect } from "react";

/**
 * Debounces a rapidly-changing value.
 * Returns the value only after `delay` ms of inactivity.
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel previous timer on re-render
  }, [value, delay]);

  return debounced;
}
