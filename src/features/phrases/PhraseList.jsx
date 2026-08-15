// features/words/... wait, this is PhraseList.jsx
// features/phrases/PhraseList.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getAllTags } from '../../lib/tags';
import TagInput from '../../components/TagInput';
import AudioRecorder from '../../components/AudioRecorder';

const TYPE_LABELS = {
    flip: 'Flip',
    input: 'Type answer',
    cloze: 'Cloze',
};

export default function PhraseList() {
    const { phrases, updatePhrase, deletePhrase, saveAudio, removeAudio, getAudioUrl } = useApp();
    const [search, setSearch] = useState('');
    const [activeTags, setActiveTags] = useState([]);
    const [activeTypes, setActiveTypes] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [draftText, setDraftText] = useState('');
    const [draftAnswer, setDraftAnswer] = useState('');
    const [draftTags, setDraftTags] = useState([]);
    const [existingAudioUrl, setExistingAudioUrl] = useState(null);
    const [audioAction, setAudioAction] = useState(null);

    const allTags = getAllTags(phrases);

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return phrases.filter((p) => {
            const matchesSearch = !q || p.text.toLowerCase().includes(q) || p.answer.toLowerCase().includes(q);
            const matchesTags = activeTags.every((t) => (p.tags || []).includes(t));
            const matchesType = activeTypes.length === 0 || activeTypes.includes(p.type || 'flip');
            return matchesSearch && matchesTags && matchesType;
        });
    }, [phrases, search, activeTags, activeTypes]);

    function toggleTag(tag) {
        setActiveTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
    }

    function toggleType(type) {
        setActiveTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
    }

    async function startEdit(phrase) {
        setEditingId(phrase.id);
        setDraftText(phrase.text);
        setDraftAnswer(phrase.answer);
        setDraftTags(phrase.tags ?? []);
        setAudioAction(null);
        setExistingAudioUrl(null);
        if (phrase.hasAudio) {
            setExistingAudioUrl(await getAudioUrl(phrase.id));
        }
    }

    async function saveEdit(phrase, e) {
        e?.preventDefault(); // form submit — stop the actual page navigation/reload
        if (!draftText.trim() || !draftAnswer.trim()) return;

        let hasAudio = phrase.hasAudio ?? false;
        if (audioAction?.type === 'recorded') {
            await saveAudio(phrase.id, audioAction.blob);
            hasAudio = true;
        } else if (audioAction?.type === 'deleted') {
            await removeAudio(phrase.id);
            hasAudio = false;
        }

        updatePhrase(phrase.id, {
            text: draftText.trim(),
            answer: draftAnswer.trim(),
            tags: draftTags,
            hasAudio,
        });
        setEditingId(null);
    }

    return (
        <div className="max-w-2xl mx-auto pt-20 px-4 pb-24">
            <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phrases..."
                className="border rounded px-3 py-2 w-full mb-3"
            />

            <div className="flex flex-wrap gap-1.5 mb-2">
                {Object.entries(TYPE_LABELS).map(([type, label]) => (
                    <button
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`text-xs px-2.5 py-1 rounded-full border ${activeTypes.includes(type)
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'text-gray-500 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {allTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`text-xs px-2.5 py-1 rounded-full border ${activeTags.includes(tag)
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'text-gray-500 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            {filtered.length === 0 && <p className="text-gray-400 text-sm">No phrases found.</p>}

            <ul className="flex flex-col gap-2">
                {filtered.map((phrase) => (
                    <li key={phrase.id} className="border rounded-lg p-3">
                        {editingId === phrase.id ? (
                            <form onSubmit={(e) => saveEdit(phrase, e)} className="flex flex-col gap-2">
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
                                <TagInput tags={draftTags} onChange={setDraftTags} suggestions={allTags} />
                                <AudioRecorder existingUrl={existingAudioUrl} onChange={setAudioAction} />
                                <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={() => setEditingId(null)} className="text-sm text-gray-500 px-2">
                                        Cancel
                                    </button>
                                    <button type="submit" className="text-sm bg-blue-600 text-white rounded px-3 py-1">
                                        Save
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex justify-between items-start gap-3">
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium">{phrase.text}</p>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                            {TYPE_LABELS[phrase.type] || 'Flip'}
                                        </span>
                                        {phrase.hasAudio && <span className="text-xs text-gray-400">🎤</span>}
                                        {phrase.tags?.map((tag) => (
                                            <span key={tag} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
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