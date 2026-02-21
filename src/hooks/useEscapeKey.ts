import { useEffect } from 'react';

export function useEscapeKey(callback: () => void, condition: boolean = true) {
  useEffect(() => {
    if (!condition) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [callback, condition]);
}