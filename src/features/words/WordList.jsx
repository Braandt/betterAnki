// features/words/WordList.jsx
import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';
import { tokenize } from '../../lib/tokenize';
import { masteryLabel } from '../../lib/wordMastery';
import { phraseContainsWord } from '../../lib/phraseWords';
import { FORM_FIELDS } from '../../lib/wordForms';

const MASTERY_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'flagged', label: '🚩 Flagged' },
    { id: 'weak', label: 'Weak' },
    { id: 'learning', label: 'Learning' },
    { id: 'strong', label: 'Strong' },
];

function WordDetailPanel({ word, onBack, onEdit, onDelete }) {
    const { phrases, getWordAudioUrl } = useApp();
    const [audioUrl, setAudioUrl] = useState(null);
    const { label, color } = masteryLabel(word.mastery?.score ?? 50);
    const colorClasses = { red: 'bg-danger-soft text-danger-soft-text', yellow: 'bg-warning-soft text-warning-soft-text', green: 'bg-success-soft text-success-soft-text' };
    const barColor = { red: 'bg-danger', yellow: 'bg-warning', green: 'bg-success' }[color];
    const seenIn = phrases.filter((p) => phraseContainsWord(p, word.text));
    const score = word.mastery?.score ?? 50;
    const formFields = FORM_FIELDS[word.partOfSpeech] ?? [];
    const filledForms = formFields.filter((f) => word.forms?.[f.key]);

    useEffect(() => {
        setAudioUrl(null);
        if (word.hasAudio) getWordAudioUrl(word.id, word.audioExt).then(setAudioUrl);
    }, [word.id, word.hasAudio]);

    return (
        <div className="max-w-xl mx-auto pt-8 px-6 pb-24">
            <button onClick={onBack} className="text-sm text-muted mb-4">← Back</button>

            <div className="flex items-baseline gap-2 mb-1">
                <p className="font-voice text-2xl text-ink capitalize">{word.text}</p>
                {word.partOfSpeech && (
                    <span className="text-xs bg-accent-soft text-accent-soft-text px-2 py-0.5 rounded-full capitalize">{word.partOfSpeech}</span>
                )}
            </div>

            {audioUrl && (
                <button
                    onClick={() => new Audio(audioUrl).play().catch(() => { })}
                    className="text-xs text-muted mb-2 flex items-center gap-1"
                >
                    🔊 Play pronunciation
                </button>
            )}

            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[color]}`}>{label} · {score}</span>

            {filledForms.length > 0 && (
                <div className="border-t border-border mt-4 pt-4">
                    <p className="text-xs text-faint mb-2">Forms</p>
                    <div className="grid grid-cols-2 gap-2">
                        {filledForms.map((f) => (
                            <div key={f.key} className="text-sm">
                                <span className="text-faint text-xs">{f.label}: </span>
                                <span className="text-ink">{word.forms[f.key]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="border-t border-border mt-4 pt-4">
                <p className="text-xs text-faint mb-2">Definitions</p>
                <ol className="flex flex-col gap-1 list-decimal list-inside">
                    <li className="text-sm text-ink">{word.definition}</li>
                    {(word.extraSenses ?? []).map((s, i) => (
                        <li key={i} className="text-sm text-ink">{s}</li>
                    ))}
                </ol>
            </div>

            {word.notes && (
                <div className="border-t border-border mt-4 pt-4">
                    <p className="text-xs text-faint mb-2">Notes</p>
                    <p className="text-sm text-muted whitespace-pre-line">{word.notes}</p>
                </div>
            )}

            <div className="border-t border-border mt-4 pt-4">
                <p className="text-xs text-faint mb-2">Your performance</p>
                <div className="h-2 rounded-full bg-surface-sunken overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${score}%` }} />
                </div>
                <p className="text-xs text-muted mt-1">{word.mastery?.correct ?? 0} correct · {word.mastery?.wrong ?? 0} wrong</p>
            </div>

            <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[color]}`}>{label} · {score}</span>
                <button
                    onClick={() => updateWord(word.id, { flagged: !word.flagged })}
                    className={`text-xs px-2 py-0.5 rounded-full border ${word.flagged ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-muted border-border'}`}
                >
                    {word.flagged ? '🚩 Flagged' : '🚩 Flag this word'}
                </button>
            </div>

            {word.topicTags?.length > 0 && (
                <div className="border-t border-border mt-4 pt-4">
                    <p className="text-xs text-faint mb-2">Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                        {word.topicTags.map((t) => (
                            <span key={t} className="text-xs bg-accent-soft text-accent-soft-text px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                    </div>
                </div>
            )}

            {seenIn.length > 0 && (
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
            )}

            <div className="flex gap-2 mt-6">
                <button onClick={onEdit} className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-lg hover:bg-accent-hover">
                    Edit
                </button>
                <button onClick={onDelete} className="text-sm text-danger-soft-text px-3 py-2 border border-border rounded-lg">Delete</button>
            </div>
        </div>
    );
}

export default function WordList() {
    const { words, updateWord, deleteWord, addWord } = useApp();
    const [search, setSearch] = useState('');
    const [masteryFilter, setMasteryFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [addingWord, setAddingWord] = useState(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return words
            .filter((w) => !q || w.text.includes(q) || w.definition.toLowerCase().includes(q))
            .filter((w) => {
                if (masteryFilter === 'all') return true;
                if (masteryFilter === 'flagged') return !!w.flagged;
                const { label } = masteryLabel(w.mastery?.score ?? 50);
                return label.toLowerCase() === masteryFilter;
            })
            .sort((a, b) => (masteryFilter === 'weak' ? (a.mastery?.score ?? 50) - (b.mastery?.score ?? 50) : 0));
    }, [words, search, masteryFilter]);

    const editingWord = words.find((w) => w.id === editingId) ?? null;
    const validNewWord = search.trim() !== '' && filtered.find((w) => w.text === search.toLowerCase().trim()) === undefined;

    if (selected) {
        const word = words.find((w) => w.id === selected.id) ?? selected;
        return (
            <>
                <WordDetailPanel
                    word={word}
                    onBack={() => setSelected(null)}
                    onEdit={() => setEditingId(word.id)}
                    onDelete={() => { if (confirm('Delete this word?')) { deleteWord(word.id); setSelected(null); } }}
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
                {MASTERY_FILTERS.map((f) => (
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

            {validNewWord && (
                <button onClick={() => setAddingWord(search.toLowerCase().trim())} className="text-sm mb-2 text-accent">
                    + Add new word
                </button>
            )}

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
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-ink capitalize">{word.text}</p>
                                {word.partOfSpeech && (
                                    <span className="text-xs bg-surface-sunken text-muted px-2 py-0.5 rounded-full capitalize">{word.partOfSpeech}</span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[color]}`}>{label} · {word.mastery?.score ?? 50}</span>
                                {word.flagged && <span className="text-xs">🚩</span>}
                                {word.hasAudio && <span className="text-xs text-faint">🎤</span>}
                            </div>
                            <p className="text-sm text-muted">{word.definition}</p>
                            {word.topicTags?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {word.topicTags.map((t) => (
                                        <span key={t} className="text-xs text-accent-soft-text">#{t}</span>
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <WordEditorModal
                wordKey={addingWord ?? null}
                existing={null}
                onSave={(updates) => addWord({ text: addingWord, ...updates })}
                onClose={() => setAddingWord(null)}
            />
        </div>
    );
}