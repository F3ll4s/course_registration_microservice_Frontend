import { useEffect, useState } from "react";

// `value`, but only after it has stopped changing for `ms` (search-as-you-type without a request per key)
export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
