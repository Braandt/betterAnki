// features/phrases/PhraseList.jsx
import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllTags } from '../../lib/tags';
import { isDue } from '../../lib/srs';
import { tokenize } from '../../lib/tokenize';
import PhraseModal from './PhraseModal';
import { relativeTime } from '../../lib/relativeTime';
import { findExpressionMatches } from '../../lib/expressions';

const STATUS_FILTERS = ['All', 'Due', 'New', 'Learned'];

function statusOf(p) {
    if ((p.srs?.reps ?? 0) === 0) return 'New';
    if (isDue(p)) return 'Due';
    return 'Learned';
}

function PhraseDetailPanel({ phrase, onBack, onEdit, onDelete, onPractice }) {
    const { wordDict } = useApp();
    const tokens = tokenize(phrase.text);
    const expressionMatches = findExpressionMatches(tokens, wordDict);

    // Words not covered by any recognized expression — same "individual word" list as before
    const coveredIndices = new Set();
    expressionMatches.forEach((m) => m.tokenIndices.forEach((i) => coveredIndices.add(i)));

    const plainWordTokens = tokens.filter((t, i) => t.isWord && !coveredIndices.has(i));

    const status = statusOf(phrase);
    const statusStyle = {
        Due: 'bg-danger-soft text-danger-soft-text',
        New: 'bg-accent-soft text-accent-soft-text',
        Learned: 'bg-success-soft text-success-soft-text',
    }[status];

    return (
        <div className="max-w-xl mx-auto pt-8 px-6 pb-24">
            <button onClick={onBack} className="text-sm text-muted mb-4">← Back</button>

            <p className="font-voice text-2xl text-ink mb-1">{phrase.text}</p>
            {phrase.answer && <p className="text-sm text-muted mb-3">{phrase.answer}</p>}
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusStyle}`}>{status}</span>

            <div className="border-t border-border mt-5 pt-4">
                <p className="text-xs text-faint mb-2">Words</p>
                <div className="flex flex-col gap-2">
                    {plainWordTokens.map((t, i) => {
                        const entry = wordDict[t.key];
                        return (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-ink capitalize">{t.text}</span>
                                <span className="text-muted">{entry?.definition ?? '—'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {expressionMatches.length > 0 && (
                <div className="border-t border-border mt-4 pt-4">
                    <p className="text-xs text-faint mb-2">Expressions</p>
                    <div className="flex flex-col gap-2">
                        {expressionMatches.map((m, i) => (
                            <div key={i} className="flex justify-between text-sm gap-3">
                                <span className="text-ink capitalize">{m.key}</span>
                                <span className="text-muted text-right">{m.entry.definition}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {phrase.tags?.length > 0 && (
                <div className="border-t border-border mt-4 pt-4">
                    <p className="text-xs text-faint mb-2">Grammar</p>
                    <div className="flex flex-wrap gap-1.5">
                        {phrase.tags.map((t) => (
                            <span key={t} className="text-xs bg-accent-soft text-accent-soft-text px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-6">
                <button onClick={onPractice} className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-lg hover:bg-accent-hover">
                    Practice this phrase
                </button>
                <button onClick={onEdit} className="text-sm text-muted px-3 py-2 border border-border rounded-lg">Edit</button>
                <button onClick={onDelete} className="text-sm text-danger-soft-text px-3 py-2 border border-border rounded-lg">Delete</button>
            </div>
        </div>
    );
}

export default function PhraseList({ onPractice }) {
    const { phrases, deletePhrase } = useApp();
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('All');
    const [selected, setSelected] = useState(null);
    const [editingPhrase, setEditingPhrase] = useState(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return phrases.filter((p) => {
            const matchesSearch = !q || p.text.toLowerCase().includes(q) || p.answer.toLowerCase().includes(q);
            const matchesStatus = status === 'All' || statusOf(p) === status;
            return matchesSearch && matchesStatus;
        });
    }, [phrases, search, status]);

    if (selected) {
        const phrase = phrases.find((p) => p.id === selected.id) ?? selected;
        return (
            <>
                <PhraseDetailPanel
                    phrase={phrase}
                    onBack={() => setSelected(null)}
                    onEdit={() => setEditingPhrase(phrase)}
                    onDelete={() => { if (confirm('Delete this phrase?')) { deletePhrase(phrase.id); setSelected(null); } }}
                    onPractice={() => onPractice?.(phrase)}
                />
                <PhraseModal open={editingPhrase !== null} existingPhrase={editingPhrase} onClose={() => setEditingPhrase(null)} />
            </>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pt-8 px-6 pb-24">
            <div className="flex items-center justify-between mb-4">
                <p className="font-voice text-xl text-ink">Phrase library</p>
            </div>

            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phrases..."
                className="border border-border rounded-lg px-3 py-2 w-full mb-3 bg-surface text-sm"
            />

            <div className="flex gap-1.5 mb-4">
                {STATUS_FILTERS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border ${status === s ? 'bg-accent text-white border-accent' : 'text-muted border-border hover:bg-surface-sunken'
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {filtered.length === 0 && <p className="text-muted text-sm">No phrases found.</p>}

            <div className="flex flex-col gap-2">
                {filtered.map((phrase) => {
                    const s = statusOf(phrase);
                    const dot = { Due: 'bg-danger', New: 'bg-accent', Learned: 'bg-success' }[s];
                    return (
                        <button
                            key={phrase.id}
                            onClick={() => setSelected(phrase)}
                            className="bg-surface border border-border rounded-xl px-4 py-3 text-left hover:border-border-strong"
                        >
                            <p className="font-voice text-base text-ink">{phrase.text}</p>
                            <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted">{phrase.answer}</p>
                                <span className="flex items-center gap-1.5 text-xs text-faint">
                                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>{s}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}