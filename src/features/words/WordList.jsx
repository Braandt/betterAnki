// features/words/WordList.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';
import { tokenize } from '../../lib/tokenize';
import { masteryLabel } from '../../lib/wordMastery';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'weak', label: 'Weak' },
    { id: 'learning', label: 'Learning' },
    { id: 'strong', label: 'Strong' },
];

export default function WordList() {
    const { words, updateWord, deleteWord, addWord, wordDict } = useApp();
    const [search, setSearch] = useState('');
    const [masteryFilter, setMasteryFilter] = useState('all');
    const [editingId, setEditingId] = useState(null);
    const [addingWord, setAddingWord] = useState(null)

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return words
            .filter((w) => !q || w.text.includes(q) || w.definition.toLowerCase().includes(q))
            .filter((w) => {
                if (masteryFilter === 'all') return true;
                const { label } = masteryLabel(w.mastery?.score ?? 50);
                return label.toLowerCase() === masteryFilter;
            })
            .sort((a, b) =>
                masteryFilter === 'weak' ? (a.mastery?.score ?? 50) - (b.mastery?.score ?? 50) : 0
            );
    }, [words, search, masteryFilter]);

    const editingWord = words.find((w) => w.id === editingId) ?? null;

    const validNewWord = search.trim() != '' && filtered.find(word => word.text == search.toLowerCase().trim()) == undefined

    return (
        <div className="max-w-2xl mx-auto pt-20 px-4 pb-24">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or add words..."
                className="border rounded px-3 py-2 w-full mb-2"
            />

            <div className="flex flex-wrap gap-1.5 mb-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setMasteryFilter(f.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${masteryFilter === f.id
                                ? 'bg-gray-800 text-white border-gray-800'
                                : 'text-gray-500 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <p className="text-sm text-gray-400">
                {search.trim() || masteryFilter !== 'all'
                    ? `${filtered.length} of ${words.length} words`
                    : `${words.length} word${words.length === 1 ? '' : 's'}`}
            </p>


            {filtered.length === 0 && (
                <p className="text-gray-400 text-sm">No words found.</p>
            )}

            {validNewWord &&
                <button
                    onClick={() => setAddingWord(tokenize(search)[0].key)}
                    className='text-sm mb-2 text-blue-600'
                >
                    Add new word
                </button>
            }

            <ul className="flex flex-col gap-2">
                {filtered.map((word) => (
                    <li key={word.id} className="border rounded-lg p-3 flex justify-between items-start gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium capitalize">{word.text}</p>
                                {(() => {
                                    const { label, color } = masteryLabel(word.mastery?.score ?? 50);
                                    const colorClasses = {
                                        red: 'bg-red-50 text-red-600',
                                        yellow: 'bg-yellow-50 text-yellow-700',
                                        green: 'bg-green-50 text-green-700',
                                    };
                                    return (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[color]}`}>
                                            {label} · {word.mastery?.score ?? 50}
                                        </span>
                                    );
                                })()}
                            </div>
                            <p className="text-sm text-gray-500">{word.definition}</p>
                            {word.notes && <p className="text-xs text-gray-400 mt-1 whitespace-pre-line">{word.notes}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={() => setEditingId(word.id)}
                                className="text-sm text-blue-600"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Delete this word?')) deleteWord(word.id);
                                }}
                                className="text-sm text-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            <WordEditorModal
                wordKey={editingWord?.text ?? null}
                existing={editingWord}
                onSave={(updates) => editingWord && updateWord(editingWord.id, updates)}
                onClose={() => setEditingId(null)}
            />

            <WordEditorModal
                wordKey={addingWord ?? null}
                existing={null}
                onSave={({ definition, notes }) => addWord({ text: addingWord, definition, notes })}
                onClose={() => setAddingWord(null)}
            />
        </div>
    );
}