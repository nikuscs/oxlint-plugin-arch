import { useEffect } from 'react';

export function useEmpty() {
  useEffect(() => {}, []);
}
