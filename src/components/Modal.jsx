// components/Modal.jsx
import { useEffect } from 'react';

export default function Modal({ open, onClose, onConfirm, children }) {
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            // Ctrl+Enter (or Cmd+Enter on Mac) confirms the modal
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                onConfirm?.();
            }
        }
        if (open) window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose, onConfirm]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}