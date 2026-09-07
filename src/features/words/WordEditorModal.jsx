// features/words/WordEditorModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import TagInput from '../../components/TagInput';
import AudioRecorder from '../../components/AudioRecorder';
import { useApp } from '../../context/AppContext';
import { PARTS_OF_SPEECH, FORM_FIELDS } from '../../lib/wordForms';
import { phraseContainsWord } from '../../lib/phraseWords';

function getAllTopicTags(words) {
    const set = new Set();
    words.forEach((w) => (w.topicTags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
}

export default function WordEditorModal({ wordKey, existing, onSave, onClose }) {
    const { words, phrases, saveWordAudio, removeWordAudio, getWordAudioUrl } = useApp();

    const [definition, setDefinition] = useState('');
    const [extraSenses, setExtraSenses] = useState([]);
    const [newSense, setNewSense] = useState('');
    const [notes, setNotes] = useState('');
    const [partOfSpeech, setPartOfSpeech] = useState('');
    const [forms, setForms] = useState({});
    const [topicTags, setTopicTags] = useState([]);
    const [existingAudioUrl, setExistingAudioUrl] = useState(null);
    const [audioAction, setAudioAction] = useState(null);

    const allTopicTags = getAllTopicTags(words);
    const seenIn = existing ? phrases.filter((p) => phraseContainsWord(p, existing.text)).slice(0, 5) : [];

    useEffect(() => {
        setDefinition(existing?.definition ?? '');
        setExtraSenses(existing?.extraSenses ?? []);
        setNewSense('');
        setNotes(existing?.notes ?? '');
        setPartOfSpeech(existing?.partOfSpeech ?? '');
        setForms(existing?.forms ?? {});
        setTopicTags(existing?.topicTags ?? []);
        setAudioAction(null);
        setExistingAudioUrl(null);

        if (existing?.hasAudio) {
            getWordAudioUrl(existing.id, existing.audioExt).then(setExistingAudioUrl);
        }
    }, [wordKey, existing]);

    function updateForm(key, value) {
        setForms((prev) => ({ ...prev, [key]: value }));
    }

    function addSense() {
        if (!newSense.trim()) return;
        setExtraSenses((prev) => [...prev, newSense.trim()]);
        setNewSense('');
    }

    function removeSense(i) {
        setExtraSenses((prev) => prev.filter((_, idx) => idx !== i));
    }

    async function handleSubmit(e) {
        e?.preventDefault();
        e?.stopPropagation();
        if (!definition.trim()) return;

        let hasAudio = existing?.hasAudio ?? false;
        let audioExt = existing?.audioExt ?? 'webm';
        const wordId = existing?.id ?? crypto.randomUUID();

        if (audioAction?.type === 'recorded') {
            audioExt = await saveWordAudio(wordId, audioAction.blob, audioAction.mimeType);
            hasAudio = true;
        } else if (audioAction?.type === 'deleted') {
            await removeWordAudio(wordId, existing?.audioExt ?? 'webm');
            hasAudio = false;
        }

        onSave({
            definition: definition.trim(),
            notes: notes.trim(),
            partOfSpeech,
            forms,
            extraSenses,
            topicTags,
            hasAudio,
            audioExt,
        });
        onClose();
    }

    const relevantFormFields = FORM_FIELDS[partOfSpeech] ?? [];

    return (
        <Modal open={!!wordKey} onClose={onClose} onConfirm={handleSubmit}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-h-[80vh] overflow-y-auto scrollbar-hide">
                <div className="flex items-baseline justify-between">
                    <h2 className="font-voice text-2xl text-ink capitalize">{wordKey}</h2>
                    {partOfSpeech && (
                        <span className="text-xs bg-accent-soft text-accent-soft-text px-2 py-0.5 rounded-full capitalize">
                            {partOfSpeech}
                        </span>
                    )}
                </div>

                <Field label="Part of speech">
                    <div className="flex flex-wrap gap-1.5">
                        {PARTS_OF_SPEECH.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPartOfSpeech(p === partOfSpeech ? '' : p)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize ${partOfSpeech === p ? 'bg-accent text-white border-accent' : 'text-muted border-border hover:bg-surface-sunken'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </Field>

                {relevantFormFields.length > 0 && (
                    <Field label="Forms">
                        <div className="grid grid-cols-2 gap-2">
                            {relevantFormFields.map((f) => (
                                <input
                                    key={f.key}
                                    value={forms[f.key] ?? ''}
                                    onChange={(e) => updateForm(f.key, e.target.value)}
                                    placeholder={f.label}
                                    className="border rounded px-2 py-1.5 text-sm"
                                />
                            ))}
                        </div>
                    </Field>
                )}

                <Field label="Definition">
                    <textarea
                        autoFocus
                        value={definition}
                        onChange={(e) => setDefinition(e.target.value)}
                        className="border rounded px-3 py-2 resize-none"
                        rows={2}
                    />
                </Field>

                {extraSenses.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                        {extraSenses.map((sense, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <span className="text-faint">{i + 2}.</span>
                                <span className="flex-1 text-ink">{sense}</span>
                                <button type="button" onClick={() => removeSense(i)} className="text-danger-soft-text text-xs">×</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <input
                        value={newSense}
                        onChange={(e) => setNewSense(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSense(); } }}
                        placeholder="Add another sense..."
                        className="border rounded px-3 py-1.5 text-sm flex-1"
                    />
                    <button type="button" onClick={addSense} className="text-sm text-accent underline shrink-0">
                        + Add
                    </button>
                </div>

                <Field label="Notes">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="border rounded px-3 py-2 resize-none"
                        rows={2}
                    />
                </Field>

                {seenIn.length > 0 && (
                    <Field label={`Seen in ${seenIn.length} phrase${seenIn.length === 1 ? '' : 's'}`}>
                        <div className="flex flex-col gap-1">
                            {seenIn.map((p) => (
                                <p key={p.id} className="font-voice text-sm text-muted">{p.text}</p>
                            ))}
                        </div>
                    </Field>
                )}

                <Field label="Topic tags">
                    <TagInput tags={topicTags} onChange={setTopicTags} suggestions={allTopicTags} placeholder="Add topic tags..." />
                </Field>

                <Field label="Pronunciation">
                    <AudioRecorder existingUrl={existingAudioUrl} onChange={setAudioAction} />
                </Field>

                <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={onClose} className="px-3 py-1.5 text-gray-500">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!definition.trim()}
                        className="bg-accent text-white rounded-lg px-4 py-1.5 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Save <span className="text-white/70 text-xs ml-1">(Ctrl+Enter)</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}