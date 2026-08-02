// hooks/useUnsavedChangesWarning.js
import { useEffect } from 'react';

// Shows the browser's native "leave site?" confirmation when the tab is closed
// or navigated away from. Text is browser-controlled, can't be customized.
export function useUnsavedChangesWarning(enabled = true) {
    useEffect(() => {
        if (!enabled) return;

        function handleBeforeUnload(e) {
            e.preventDefault();
            e.returnValue = ''; // required for the dialog to show in most browsers
        }

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [enabled]);
}