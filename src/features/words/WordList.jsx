// features/words/WordList.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';
import { tokenize } from '../../lib/tokenize';
import { masteryLabel } from '../../lib/wordMastery';
import { phraseContainsWord } from '../../lib/phraseWords';

const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'weak', label: 'Weak' },
    { id: 'learning', label: 'Learning' },
    { id: 'strong', label: 'Strong' },
];

function WordDetailPanel({ word, deleteWord, onBack, onEdit, onPractice }) {
    const { phrases } = useApp();
    const { label, color } = masteryLabel(word.mastery?.score ?? 50);
    const colorClasses = { red: 'bg-danger-soft text-danger-soft-text', yellow: 'bg-warning-soft text-warning-soft-text', green: 'bg-success-soft text-success-soft-text' };
    const barColor = { red: 'bg-danger', yellow: 'bg-warning', green: 'bg-success' }[color];
    const seenIn = phrases.filter((p) => phraseContainsWord(p, word.text));
    const score = word.mastery?.score ?? 50;

    return (
        <div className="max-w-xl mx-auto pt-8 px-6 pb-24">
            <button onClick={onBack} className="text-sm text-muted mb-4">← Back</button>

            <p className="font-voice text-2xl text-ink capitalize mb-1">{word.text}</p>
            <p className="text-sm text-muted mb-2">{word.definition}</p>
            {word.notes && <p className="text-xs text-faint whitespace-pre-line mb-2">{word.notes}</p>}
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[color]}`}>{label} · {score}</span>

            <div className="border-t border-border mt-5 pt-4">
                <p className="text-xs text-faint mb-2">Your performance</p>
                <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${score}%` }} />
                </div>
                <p className="text-xs text-muted mt-1">
                    {word.mastery?.correct ?? 0} correct · {word.mastery?.wrong ?? 0} wrong
                </p>
            </div>

            <div className="border-t border-border mt-4 pt-4">
                <p className="text-xs text-faint mb-2">Seen in {seenIn.length} phrase{seenIn.length === 1 ? '' : 's'}</p>
                <div className="flex flex-col gap-2">
                    {seenIn.map((p) => (
                        <div key={p.id} className="text-sm">
                            <span className="font-voice text-ink">{p.text}</span>
                            {p.answer && <span className="text-muted"> — {p.answer}</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 mt-6">
                <button onClick={onPractice} className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-lg hover:bg-accent-hover">
                    Practice this word
                </button>
                <button onClick={onEdit} className="text-sm text-muted px-3 py-2 border border-border rounded-lg">Edit</button>
                <button onClick={() => { if (confirm('Delete this word?')) { deleteWord(word.id); onBack(); } }} className="text-sm text-danger-soft-text px-3 py-2 border border-border rounded-lg">Delete</button>
            </div>
        </div>
    );
}

export default function WordList({ onPractice }) {
    const { words, updateWord, deleteWord, addWord } = useApp();
    const [search, setSearch] = useState('');
    const [masteryFilter, setMasteryFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [addingWord, setAddingWord] = useState(null);

    const normalizedSearch = search.toLowerCase().trim().replace(/\s+/g, ' ');

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return words
            .filter((w) => !q || w.text.includes(q) || w.definition.toLowerCase().includes(q))
            .filter((w) => {
                if (masteryFilter === 'all') return true;
                const { label } = masteryLabel(w.mastery?.score ?? 50);
                return label.toLowerCase() === masteryFilter;
            })
            .sort((a, b) => (masteryFilter === 'weak' ? (a.mastery?.score ?? 50) - (b.mastery?.score ?? 50) : 0));
    }, [words, search, masteryFilter]);

    const editingWord = words.find((w) => w.id === editingId) ?? null;
    const validNewWord = normalizedSearch !== '' && filtered.find(word => word.text === normalizedSearch) === undefined

    if (selected) {
        const word = words.find((w) => w.id === selected.id) ?? selected;
        return (
            <>
                <WordDetailPanel
                    word={word}
                    deleteWord={deleteWord}
                    onBack={() => setSelected(null)}
                    onEdit={() => setEditingId(word.id)}
                    onPractice={() => onPractice?.(word.text)}
                />
                <WordEditorModal
                    wordKey={editingWord?.text ?? null}
                    existing={editingWord}
                    onSave={(updates) => editingWord && updateWord(editingWord.id, updates)}
                    onClose={() => setEditingId(null)}
                />
            </>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pt-8 px-6 pb-24">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search or add words..."
                className="border border-border rounded-lg px-3 py-2 w-full mb-2 bg-surface text-sm"
            />

            <div className="flex flex-wrap gap-1.5 mb-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.id}
                        onClick={() => setMasteryFilter(f.id)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${masteryFilter === f.id ? 'bg-ink text-white border-ink' : 'text-muted border-border hover:bg-surface-sunken'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <p className="text-sm text-muted mb-2">
                {search.trim() || masteryFilter !== 'all' ? `${filtered.length} of ${words.length} words` : `${words.length} words`}
            </p>

            {filtered.length === 0 && <p className="text-muted text-sm">No words found.</p>}

            {validNewWord &&
                <button
                    onClick={() => setAddingWord(normalizedSearch)}
                    className='text-sm mb-2 text-blue-600'
                >
                    Add new word{normalizedSearch.includes(' ') ? ' / expression' : ''}
                </button>
            }

            <div className="flex flex-col gap-2">
                {filtered.map((word) => {
                    const { label, color } = masteryLabel(word.mastery?.score ?? 50);
                    const colorClasses = { red: 'bg-danger-soft text-danger-soft-text', yellow: 'bg-warning-soft text-warning-soft-text', green: 'bg-success-soft text-success-soft-text' };
                    return (
                        <button
                            key={word.id}
                            onClick={() => setSelected(word)}
                            className="bg-surface border border-border rounded-xl px-4 py-3 text-left hover:border-border-strong"
                        >
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-ink capitalize">{word.text}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[color]}`}>{label} · {word.mastery?.score ?? 50}</span>
                            </div>
                            <p className="text-sm text-muted">{word.definition}</p>
                        </button>
                    );
                })}
            </div>

            <WordEditorModal
                wordKey={addingWord ?? null}
                existing={null}
                onSave={({ definition, notes }) => addWord({ text: addingWord, definition, notes })}
                onClose={() => setAddingWord(null)}
            />
        </div>
    );
}