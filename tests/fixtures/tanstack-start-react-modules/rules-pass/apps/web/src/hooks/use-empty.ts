import { useEffect } from 'react'; export function useEmpty() { useEffect(() => { document.title = 'Chat'; }, []); }
