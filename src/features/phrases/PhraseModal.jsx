// features/phrases/PhraseModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import TagInput from '../../components/TagInput';
import AudioRecorder from '../../components/AudioRecorder';
import { getAllTags } from '../../lib/tags';
import { tokenize } from '../../lib/tokenize';
import { useApp } from '../../context/AppContext';

function ClozeWordPicker({ text, selected, onToggle }) {
    const tokens = tokenize(text);
    if (!text.trim()) return null;

    return (
        <div>
            <p className="text-xs text-gray-400 mb-1">Click the word(s) to blank out:</p>
            <p className="text-lg leading-relaxed border rounded px-3 py-2 bg-gray-50">
                {tokens.map((token, i) => {
                    if (!token.isWord) return <span key={i}>{token.text}</span>;
                    const isSelected = selected.includes(i);
                    return (
                        <span
                            key={i}
                            onClick={() => onToggle(i)}
                            className={`cursor-pointer rounded px-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-yellow-200'
                                }`}
                        >
                            {token.text}
                        </span>
                    );
                })}
            </p>
        </div>
    );
}

// existingPhrase: editing this exact phrase (updates it on save)
// duplicateFrom: pre-fill fields from this phrase, but save as a brand-new phrase
export default function PhraseModal({ open, onClose, existingPhrase = null, duplicateFrom = null }) {
    const { addPhrase, updatePhrase, phrases, saveAudio, removeAudio, getAudioUrl } = useApp();
    const [phraseId, setPhraseId] = useState(null);
    const [text, setText] = useState('');
    const [answer, setAnswer] = useState('');
    const [type, setType] = useState('cloze');
    const [tags, setTags] = useState([]);
    const [clozeIndices, setClozeIndices] = useState([]);
    const [showTranslationUpfront, setShowTranslationUpfront] = useState(true);
    const [existingAudioUrl, setExistingAudioUrl] = useState(null);
    const [audioAction, setAudioAction] = useState(null);

    const allTags = getAllTags(phrases);
    const source = existingPhrase ?? duplicateFrom; // whichever one supplies the pre-fill data

    useEffect(() => {
        if (!open) return;

        const id = existingPhrase?.id ?? crypto.randomUUID();
        setPhraseId(id);
        setText(source?.text ?? '');
        setAnswer(source?.answer ?? '');
        setType(source?.type ?? 'cloze');
        setTags(source?.tags ?? []);
        setClozeIndices(source?.clozeIndices ?? []);
        setShowTranslationUpfront(source?.showTranslationUpfront ?? true);
        setAudioAction(null);
        setExistingAudioUrl(null);

        // Only preload existing audio when actually editing — a duplicate starts
        // with no audio, since re-using someone else's recording as-is rarely makes sense.
        if (existingPhrase?.hasAudio) {
            getAudioUrl(existingPhrase.id, existingPhrase.audioExt).then(setExistingAudioUrl);
        }
    }, [open, existingPhrase, duplicateFrom]);

    function handleTextChange(e) {
        setText(e.target.value);
        setClozeIndices([]);
    }

    function toggleClozeIndex(i) {
        setClozeIndices((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b)));
    }

    async function handleSubmit(e) {
        e?.preventDefault();
        if (!text.trim()) return;
        if (type === 'cloze' && clozeIndices.length === 0) return;
        if (type !== 'cloze' && !answer.trim()) return;

        let hasAudio = existingPhrase?.hasAudio ?? false;
        let audioExt = existingPhrase?.audioExt ?? 'webm';
        if (audioAction?.type === 'recorded') {
            audioExt = await saveAudio(phraseId, audioAction.blob, audioAction.mimeType);
            hasAudio = true;
        } else if (audioAction?.type === 'deleted') {
            await removeAudio(phraseId, existingPhrase?.audioExt ?? 'webm');
            hasAudio = false;
        }

        const payload = {
            text: text.trim(),
            answer: answer.trim(),
            type,
            tags,
            clozeIndices: type === 'cloze' ? clozeIndices : [],
            hasAudio,
            showTranslationUpfront: type === 'cloze' ? showTranslationUpfront : false,
        };

        if (existingPhrase) {
            updatePhrase(existingPhrase.id, payload);
        } else {
            addPhrase({ id: phraseId, ...payload });
        }
        onClose();
    }

    return (
        <Modal open={open} onClose={onClose} onConfirm={handleSubmit}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <h2 className="text-lg font-semibold">
                    {existingPhrase ? 'Edit phrase' : duplicateFrom ? 'New phrase (from duplicate)' : 'Add phrase'}
                </h2>

                <div className="flex gap-2">
                    <button type="button" onClick={() => setType('flip')} className={`flex-1 px-3 py-2 rounded text-sm font-medium border ${type === 'flip' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'}`}>
                        Flip card
                    </button>
                    <button type="button" onClick={() => setType('input')} className={`flex-1 px-3 py-2 rounded text-sm font-medium border ${type === 'input' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'}`}>
                        Type answer
                    </button>
                    <button type="button" onClick={() => setType('cloze')} className={`flex-1 px-3 py-2 rounded text-sm font-medium border ${type === 'cloze' ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 border-gray-300'}`}>
                        Cloze
                    </button>
                </div>

                <input
                    autoFocus
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Phrase (e.g. Jeg spiste frokost.)"
                    className="border rounded px-3 py-2"
                />

                {type === 'cloze' ? (
                    <>
                        <ClozeWordPicker text={text} selected={clozeIndices} onToggle={toggleClozeIndex} />
                        <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Translation (optional)" className="border rounded px-3 py-2" />
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={showTranslationUpfront}
                                onChange={(e) => setShowTranslationUpfront(e.target.checked)}
                            />
                            Show hints before answering (word definition + translation)
                        </label>
                    </>
                ) : (
                    <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Answer / translation" className="border rounded px-3 py-2" />
                )}

                <TagInput tags={tags} onChange={setTags} suggestions={allTags} placeholder="Add tags..." />

                <AudioRecorder existingUrl={existingAudioUrl} onChange={setAudioAction} />

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