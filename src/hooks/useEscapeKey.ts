import { useEffect } from 'react';

/**
 * Hook to handle Escape key press
 * @param callback Function to call when Escape is pressed
 * @param isActive Whether the hook is active (e.g., modal is open)
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [callback, isActive]);
};
