// components/Modal.jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ open, onClose, onConfirm, children }) {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                onClose();
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                // If the focused/target element isn't inside THIS modal's own DOM,
                // this isn't the modal the user is actually interacting with —
                // let whichever nested modal actually owns it handle the shortcut.
                if (modalRef.current && !modalRef.current.contains(e.target)) {
                    return;
                }
                e.preventDefault();
                onConfirm?.();
                return;
            }

            if (e.key === 'Enter' && modalRef.current && !modalRef.current.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
            }
        }

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [open, onClose, onConfirm]);

    if (!open) return null;

    return createPortal(
        <div
            ref={modalRef}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-base"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            <div
                className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}