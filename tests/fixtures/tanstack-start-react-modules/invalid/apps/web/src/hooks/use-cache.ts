import { useMemo } from 'react';

export function useCache() {
  return useMemo(() => 1, []);
}
