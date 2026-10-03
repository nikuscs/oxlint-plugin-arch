import { useState } from 'react'; export function useCache() { const [value] = useState(1); return value + 1; }
