// features/phrases/PhraseModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { useApp } from '../../context/AppContext';

export default function PhraseModal({ open, onClose, existingPhrase = null }) {
    const { addPhrase, updatePhrase } = useApp();
    const [text, setText] = useState('');
    const [answer, setAnswer] = useState('');
    const [type, setType] = useState('flip');

    // Repopulate fields whenever a different phrase is opened for editing,
    // or reset to blank when opening in "add" mode.
    useEffect(() => {
        setText(existingPhrase?.text ?? '');
        setAnswer(existingPhrase?.answer ?? '');
        setType(existingPhrase?.type ?? 'flip');
    }, [open, existingPhrase]);

    function handleSubmit(e) {
        e?.preventDefault();
        if (!text.trim() || !answer.trim()) return;

        if (existingPhrase) {
            updatePhrase(existingPhrase.id, { text: text.trim(), answer: answer.trim(), type });
        } else {
            addPhrase({ text: text.trim(), answer: answer.trim(), type });
        }
        onClose();
    }

    return (
        <Modal open={open} onClose={onClose} onConfirm={handleSubmit}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">{existingPhrase ? 'Edit phrase' : 'Add phrase'}</h2>

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setType('flip')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium border ${type === 'flip' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'
                            }`}
                    >
                        Flip card
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('input')}
                        className={`flex-1 px-3 py-2 rounded text-sm font-medium border ${type === 'input' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'
                            }`}
                    >
                        Type answer
                    </button>
                </div>

                <input
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Phrase (e.g. Ich habe einen Hund.)"
                    className="border rounded px-3 py-2"
                />
                <input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Answer / translation"
                    className="border rounded px-3 py-2"
                />

                <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-gray-500">
                        Cancel
                    </button>
                    <button type="submit" className="bg-blue-600 text-white rounded px-4 py-1.5">
                        {existingPhrase ? 'Save' : 'Add'} <span className="text-blue-200 text-xs ml-1">(Ctrl+Enter)</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}