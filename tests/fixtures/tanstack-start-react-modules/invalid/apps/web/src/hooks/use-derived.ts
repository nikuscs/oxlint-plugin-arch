import { useEffect, useState } from 'react';

export function useDerived(value: string) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    setLabel(value.toUpperCase());
  }, [value]);

  return label;
}
