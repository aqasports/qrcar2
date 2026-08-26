import { useEffect } from 'react';

/**
 * useUnsavedChanges alerts the user if they try to close/refresh the tab or navigate away
 * while having unsaved form modifications.
 */
export function useUnsavedChanges(isDirty: boolean, warningMessage: string = 'Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?') {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = warningMessage;
      return warningMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, warningMessage]);
}
