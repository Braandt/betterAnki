// features/phrases/PhraseModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import TagInput from '../../components/TagInput';
import AudioRecorder from '../../components/AudioRecorder';
import { getAllTags } from '../../lib/tags';
import { tokenize } from '../../lib/tokenize';
import { useApp } from '../../context/AppContext';
import { findExpressionMatches } from '../../lib/expressions';
import WordEditorModal from '../words/WordEditorModal';
import Field from '../../components/Field';
import { getAllContexts } from '../../lib/contexts';

function ExpressionHelper({ text, selectedExpressions, onChangeSelected }) {
    const { wordDict, addWord } = useApp();
    const [manualSelected, setManualSelected] = useState([]);
    const [showPicker, setShowPicker] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [hoveredKey, setHoveredKey] = useState(null);
    const tokens = tokenize(text);
    const candidates = findExpressionMatches(tokens, wordDict);

    function toggleCandidate(key) {
        onChangeSelected(
            selectedExpressions.includes(key)
                ? selectedExpressions.filter((k) => k !== key)
                : [...selectedExpressions, key]
        );
    }

    function toggleManualWord(i) {
        setManualSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b)));
    }

    const manualKey = manualSelected.length >= 2 ? manualSelected.map((i) => tokens[i].key).join(' ') : null;
    const manualAlreadyExists = manualKey && wordDict[manualKey];
    const hoveredIndices = new Set(candidates.find((c) => c.key === hoveredKey)?.tokenIndices ?? []);

    if (!text.trim()) return null;

    return (
        <div className="flex flex-col gap-2">
            {candidates.length > 0 && (
                <Field label="Recognized expressions — select which are actually used">
                    <div className="flex flex-col gap-1">
                        {candidates.map((c) => (
                            <label
                                key={c.key}
                                onMouseEnter={() => setHoveredKey(c.key)}
                                onMouseLeave={() => setHoveredKey(null)}
                                className="flex items-center gap-2 text-sm cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedExpressions.includes(c.key)}
                                    onChange={() => toggleCandidate(c.key)}
                                />
                                <span className="text-ink">{c.key}</span>
                                <span className="text-muted text-xs">— {c.entry.definition}</span>
                            </label>
                        ))}
                    </div>
                </Field>
            )}

            {!showPicker ? (
                <button type="button" onClick={() => setShowPicker(true)} className="text-sm text-accent underline w-fit">
                    + Define a new expression from this phrase
                </button>
            ) : (
                <Field label="Click 2+ words to define a new expression">
                    <p className="border rounded px-3 py-2 bg-gray-50 leading-relaxed">
                        {tokens.map((t, i) =>
                            !t.isWord ? (
                                <span key={i}>{t.text}</span>
                            ) : (
                                <span
                                    key={i}
                                    onClick={() => toggleManualWord(i)}
                                    className={`cursor-pointer rounded px-0.5 ${manualSelected.includes(i) ? 'bg-accent text-white' :
                                        hoveredIndices.has(i) ? 'bg-yellow-200' : 'hover:bg-yellow-200'
                                        }`}
                                >
                                    {t.text}
                                </span>
                            )
                        )}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        {manualKey && (
                            <button
                                type="button"
                                onClick={() => setShowEditor(true)}
                                disabled={!!manualAlreadyExists}
                                className="text-sm text-accent underline disabled:text-faint disabled:no-underline w-fit"
                            >
                                {manualAlreadyExists ? `"${manualKey}" already defined` : `+ Add "${manualKey}" as expression`}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => { setShowPicker(false); setManualSelected([]); }}
                            className="text-sm text-muted underline w-fit"
                        >
                            Cancel
                        </button>
                    </div>
                </Field>
            )}

            <WordEditorModal
                wordKey={showEditor ? manualKey : null}
                existing={null}
                onSave={({ definition, notes }) => {
                    addWord({ text: manualKey, definition, notes });
                    onChangeSelected([...selectedExpressions, manualKey]);
                }}
                onClose={() => { setShowEditor(false); setManualSelected([]); setShowPicker(false); }}
            />
        </div>
    );
}

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
    const [expressions, setExpressions] = useState([]);
    const [context, setContext] = useState('');
    const [direction, setDirection] = useState('recognition');

    const canSubmit =
        text.trim() !== '' &&
        (type === 'cloze' ? clozeIndices.length > 0 : answer.trim() !== '');

    const allTags = getAllTags(phrases);
    const allContexts = getAllContexts(phrases);
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
        setExpressions(existingPhrase?.expressions ?? []);
        setContext(source?.context ?? '');
        setDirection(source?.direction ?? 'recognition');

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
            audioExt,
            showTranslationUpfront: type === 'cloze' ? showTranslationUpfront : false,
            expressions,
            context: context.trim(),
            direction: type !== 'cloze' ? direction : 'recognition',
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

                <Field label="Context (optional)">
                    <input
                        list="context-options"
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        className="border rounded px-3 py-2 text-sm"
                    />
                    <datalist id="context-options">
                        {allContexts.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </Field>

                <Field label="Phrase">
                    <input
                        autoFocus
                        value={text}
                        onChange={handleTextChange}
                        className="border rounded px-3 py-2"
                    />
                </Field>

                <ExpressionHelper text={text} selectedExpressions={expressions} onChangeSelected={setExpressions} />

                {type === 'cloze' ? (
                    <>
                        <ClozeWordPicker text={text} selected={clozeIndices} onToggle={toggleClozeIndex} />
                        <Field label="Translation (optional)">
                            <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border rounded px-3 py-2" />
                        </Field>
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input type="checkbox" checked={showTranslationUpfront} onChange={(e) => setShowTranslationUpfront(e.target.checked)} />
                            Show hints before answering (word definition + translation)
                        </label>
                    </>
                ) : (
                    <>
                        <Field label="Answer / translation">
                            <input value={answer} onChange={(e) => setAnswer(e.target.value)} className="border rounded px-3 py-2" />
                        </Field>

                        <Field label="Direction">
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setDirection('recognition')} className={`flex-1 px-3 py-2 rounded text-sm border ${direction === 'recognition' ? 'bg-accent text-white border-accent' : 'text-muted border-border'}`}>
                                    Norwegian → English
                                </button>
                                <button type="button" onClick={() => setDirection('production')} className={`flex-1 px-3 py-2 rounded text-sm border ${direction === 'production' ? 'bg-accent text-white border-accent' : 'text-muted border-border'}`}>
                                    English → Norwegian
                                </button>
                            </div>
                        </Field>
                    </>
                )}

                <Field label="Tags">
                    <TagInput tags={tags} onChange={setTags} suggestions={allTags} placeholder="Add tags..." />
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
                        disabled={!canSubmit}
                        className="bg-accent text-white rounded-lg px-4 py-1.5 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent"
                    >
                        {existingPhrase ? 'Save' : 'Add'} <span className="text-white/70 text-xs ml-1">(Ctrl+Enter)</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
}