// features/words/WordList.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';
import { tokenize } from '../../lib/tokenize';

export default function WordList() {
    const { words, updateWord, deleteWord, addWord, wordDict } = useApp();
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [addingWord, setAddingWord] = useState(null)

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return words;
        return words.filter(
            (w) => w.text.includes(q) || w.definition.toLowerCase().includes(q)
        );
    }, [words, search]);

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

            <p className="text-sm text-gray-400">
                {search.trim()
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
                            <p className="font-medium capitalize">{word.text}</p>
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