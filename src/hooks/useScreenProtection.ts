import { useEffect } from 'react';
import { screenProtection } from '@/utils/screenProtection';

export function useScreenProtection() {
  useEffect(() => {
    // Initialize screen protection on mount
    screenProtection.init();
    
    return () => {
      // Cleanup on unmount (optional, usually we want it to persist)
      // screenProtection.destroy();
    };
  }, []);
}
