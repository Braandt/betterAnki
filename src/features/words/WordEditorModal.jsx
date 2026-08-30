// features/words/WordEditorModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';

export default function WordEditorModal({ wordKey, existing, onSave, onClose }) {
    const [definition, setDefinition] = useState(existing?.definition ?? '');
    const [notes, setNotes] = useState(existing?.notes ?? '');

    useEffect(() => {
        setDefinition(existing?.definition ?? '');
        setNotes(existing?.notes ?? '');
    }, [wordKey, existing]);

    function handleSubmit(e) {
        e?.preventDefault();
        e?.stopPropagation(); // don't let this bubble into an ancestor form (e.g. PhraseModal's)
        if (!definition.trim()) return;
        onSave({ definition: definition.trim(), notes: notes.trim() });
        onClose();
    }

    return (
        <Modal open={!!wordKey} onClose={onClose} onConfirm={handleSubmit}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold capitalize">{wordKey}</h2>
                <textarea
                    autoFocus
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="Definition"
                    className="border rounded px-3 py-2 resize-none"
                    rows={2}
                />
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    className="border rounded px-3 py-2 resize-none"
                    rows={2}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-gray-500">
                        Cancel
                    </button>
                    <button type="submit" className="bg-blue-600 text-white rounded px-4 py-1.5">
                        Save <span className="text-blue-200 text-xs ml-1">(Ctrl+Enter)</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}