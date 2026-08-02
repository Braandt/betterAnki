// features/phrases/PhraseList.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';

export default function PhraseList() {
    const { phrases, updatePhrase, deletePhrase } = useApp();
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [draftText, setDraftText] = useState('');
    const [draftAnswer, setDraftAnswer] = useState('');

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return phrases;
        return phrases.filter(
            (p) => p.text.toLowerCase().includes(q) || p.answer.toLowerCase().includes(q)
        );
    }, [phrases, search]);

    function startEdit(phrase) {
        setEditingId(phrase.id);
        setDraftText(phrase.text);
        setDraftAnswer(phrase.answer);
    }

    function saveEdit(id) {
        if (!draftText.trim() || !draftAnswer.trim()) return;
        updatePhrase(id, { text: draftText.trim(), answer: draftAnswer.trim() });
        setEditingId(null);
    }

    return (
        <div className="max-w-2xl mx-auto pt-32 px-4 pb-24">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phrases..."
                className="border rounded px-3 py-2 w-full mb-4"
            />

            {filtered.length === 0 && (
                <p className="text-gray-400 text-sm">No phrases found.</p>
            )}

            <ul className="flex flex-col gap-2">
                {filtered.map((phrase) => (
                    <li key={phrase.id} className="border rounded-lg p-3">
                        {editingId === phrase.id ? (
                            <div className="flex flex-col gap-2">
                                <input
                                    autoFocus
                                    value={draftText}
                                    onChange={(e) => setDraftText(e.target.value)}
                                    className="border rounded px-2 py-1"
                                />
                                <input
                                    value={draftAnswer}
                                    onChange={(e) => setDraftAnswer(e.target.value)}
                                    className="border rounded px-2 py-1"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 px-2">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => saveEdit(phrase.id)}
                                        className="text-sm bg-blue-600 text-white rounded px-3 py-1"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start gap-3">
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <p className="font-medium">{phrase.text}</p>
                                        <span className='text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500'>
                                            {phrase.type === 'input' ? 'type answer' : 'flip'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{phrase.answer}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => startEdit(phrase)} className="text-sm text-blue-600">
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this phrase?')) deletePhrase(phrase.id);
                                        }}
                                        className="text-sm text-red-500"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}