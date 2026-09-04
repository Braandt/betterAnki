// features/review/ReviewScreen.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import ClickableText from '../words/ClickableText';
import InputAnswer from './InputAnswer';
import AnswerDiff from './AnswerDiff';
import ClozeCard from './ClozeCard';
import ClozeResult from './ClozeResult';
import PhraseModal from '../phrases/PhraseModal';
import { isDue, schedule, DEFAULT_SRS } from '../../lib/srs';
import { phraseContainsWord } from '../../lib/phraseWords';
import { useApp } from '../../context/AppContext';
import { adjustMastery } from '../../lib/wordMastery';
import AudioRecorder from '../../components/AudioRecorder';
import ExpressionList from '../../components/ExpressionList';
import { resolveConfirmedExpressions } from '../../lib/expressions';

export default function ReviewScreen({
    phrases,
    onGrade,
    filterTags = [],
    filterWords = [],
    includeAll = false,
    onExit,
    onPracticeWord,
    onFirstAction,
    onAudioAdded
}) {
    const { getAudioUrl, wordDict, updateWord, saveAudio } = useApp();

    const [queueIds, setQueueIds] = useState(() =>
        phrases
            .filter((p) => {
                const dueOk = includeAll || isDue(p);
                const tagsOk = filterTags.every((t) => (p.tags || []).includes(t));
                const wordsOk = filterWords.length === 0 || filterWords.some((w) => phraseContainsWord(p, w));
                return dueOk && tagsOk && wordsOk;
            })
            .sort((a, b) => (a.srs?.due ?? 0) - (b.srs?.due ?? 0))
            .map((p) => p.id)
    );

    const [revealed, setRevealed] = useState(false);
    const [userAnswer, setUserAnswer] = useState(null);
    const [clozeResults, setClozeResults] = useState(null);
    const [autoGrade, setAutoGrade] = useState(null); // grade computed automatically from cloze correctness
    const [editingPhrase, setEditingPhrase] = useState(false);
    const [duplicatingPhrase, setDuplicatingPhrase] = useState(false);
    const [recordingAudio, setRecordingAudio] = useState(false);

    const currentAudioRef = useRef(null);

    async function handleAudioRecorded(action) {
        if (action.type === 'recorded') {
            await saveAudio(current.id, action.blob, action.mimeType);
            onAudioAdded?.(current.id);
        }
        setRecordingAudio(false);
    }

    const current = phrases.find((p) => p.id === queueIds[0]) ?? null;
    const cardType = current?.type ?? 'flip';

    const isChecked =
        cardType === 'input' ? userAnswer !== null :
            cardType === 'cloze' ? clozeResults !== null :
                revealed;

    const handleGrade = useCallback(
        (grade) => {
            if (!current) return;
            const prevSrs = current.srs ?? DEFAULT_SRS;
            const newSrs = schedule(prevSrs, grade);

            setHistory((h) => [...h, { queueIdsBefore: queueIds, phrase: current, prevSrs }]);

            onGrade?.(current, newSrs, grade);

            setQueueIds((ids) => {
                const rest = ids.slice(1);
                return grade === 'difficult' ? [...rest, current.id] : rest;
            });
            setRevealed(false);
            setUserAnswer(null);
            setClozeResults(null);
            setAutoGrade(null);
        },
        [current, onGrade, queueIds]
    );

    const handleInputSubmit = useCallback((value) => {
        onFirstAction?.();
        setUserAnswer(value);
    }, [onFirstAction]);

    const handleClozeSubmit = useCallback((results) => {
        setClozeResults(results);
        const allCorrect = results.every((r) => r.isCorrect);
        setAutoGrade(allCorrect ? 'easy' : 'difficult');

        // Grade each blanked word individually, based on this first attempt —
        // words without a dictionary entry are silently skipped (nothing to grade).
        results.forEach((r) => {
            const word = wordDict[r.key];
            if (word) {
                updateWord(word.id, { mastery: adjustMastery(word.mastery, r.isCorrect) });
            }
        });
    }, [wordDict, updateWord]);

    const [history, setHistory] = useState([]); // stack of { queueIdsBefore, phrase, prevSrs }
    const goBack = useCallback(() => {
        setHistory((h) => {
            if (h.length === 0) return h;
            const last = h[h.length - 1];
            onGrade?.(last.phrase, last.prevSrs); // revert the SRS change
            setQueueIds(last.queueIdsBefore);
            setRevealed(false);
            setUserAnswer(null);
            setClozeResults(null);
            setAutoGrade(null);
            return h.slice(0, -1);
        });
    }, [onGrade]);

    const confirmedExpressions = current ? resolveConfirmedExpressions(current.expressions, wordDict) : [];

    // Audio autoplay
    useEffect(() => {
        let cancelled = false;
        let objectUrl = null;

        async function playIfAvailable() {
            if (cardType === 'cloze' || cardType === 'input') return;
            if (!current?.hasAudio) return;

            const url = await getAudioUrl(current.id);
            if (url && !cancelled) {
                objectUrl = url;
                const audio = new Audio(url);
                currentAudioRef.current = audio;
                audio.play().catch(() => { });
            }
        }
        playIfAvailable();

        return () => {
            cancelled = true;
            currentAudioRef.current?.pause();
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [current?.id], cardType);

    useEffect(() => {
        if (cardType !== 'cloze' || clozeResults === null) return;
        if (!current?.hasAudio) return;

        let cancelled = false;
        (async () => {
            const url = await getAudioUrl(current.id);
            if (url && !cancelled) {
                const audio = new Audio(url);
                currentAudioRef.current = audio;
                audio.play().catch(() => { });
            }
        })();

        return () => { cancelled = true; };
    }, [clozeResults, cardType, current?.id, current?.hasAudio]);

    async function replayAudio() {
        if (!current?.hasAudio) return;
        if (currentAudioRef.current && cardType !== 'cloze' && cardType !== 'input') {
            currentAudioRef.play().catch(() => { })
            return
        }
        const url = await getAudioUrl(current.id)
        if (url) {
            const audio = new Audio(url)
            currentAudioRef.current = audio
            audio.play().catch(() => { })
        }
    }

    function handleCardTap() {
        if (cardType !== 'flip') return;
        if (!revealed) {
            onFirstAction?.();
            setRevealed(true);
        } else {
            handleGrade('easy');
        }
    }

    useEffect(() => {
        function handleKeyDown(e) {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            if (e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                setEditingPhrase(true);
                return;
            }

            if (e.key === 'b' || e.key === 'B') {
                e.preventDefault();
                goBack();
                return;
            }

            if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                setDuplicatingPhrase(true);
                return;
            }

            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                if (current?.hasAudio) {
                    replayAudio();
                } else if (isChecked) {
                    setRecordingAudio(true);
                }
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                if (cardType === 'flip') {
                    if (!revealed) {
                        onFirstAction?.()
                        setRevealed(true);
                    } else {
                        handleGrade('easy');
                    }
                } else if (cardType === 'cloze' && isChecked) {
                    handleGrade(autoGrade);
                } else if (isChecked) {
                    handleGrade('easy');
                }
                return;
            }

            if (isChecked) {
                if (e.key === '1') { e.preventDefault(); handleGrade('difficult'); }
                if (e.key === '2') { e.preventDefault(); handleGrade('easy'); }
            }

        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cardType, revealed, isChecked, autoGrade, handleGrade, goBack, current?.hasAudio, replayAudio]);

    if (!current) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center text-muted">
                <p className="mb-3">{includeAll ? 'No phrases match this filter.' : `All caught up${filterTags.length ? ' for this filter' : ''} — no cards due right now.`}</p>
                {onExit && <button onClick={onExit} className="text-sm text-accent underline">Back to normal review</button>}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl">
                {filterTags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap justify-center items-center mb-4">
                        {filterTags.map((t) => (
                            <span key={t} className="text-xs bg-accent-soft text-accent-soft-text px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                        {onExit && <button onClick={onExit} className="text-xs text-muted underline ml-2">exit custom study</button>}
                    </div>
                )}

                <div className="flex justify-between items-center mb-6 text-xs text-muted">
                    <span>{queueIds.length} more due</span>
                    <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, queueIds.length) }).map((_, i) => (
                            <div key={i} className={`w-5 h-0.5 rounded-full ${i === 0 ? 'bg-accent' : 'bg-border'}`} />
                        ))}
                    </div>
                    {current.hasAudio && (
                        <button onClick={replayAudio} className="text-muted hover:text-ink">🔊 Replay</button>
                    )}
                </div>

                {current.tags?.length > 0 && (
                    <p className="text-xs text-faint tracking-wide mb-2">{current.tags.join(' · ')}</p>
                )}

                {/* CARD */}
                <div className="bg-surface border border-border rounded-xl px-7 py-9 mb-5">
                    {current.context && (
                        <p className=" text-faint italic mb-4">{current.context}:</p>
                    )}

                    {cardType === 'cloze' ? (
                        clozeResults === null ? (
                            <ClozeCard phrase={current} onSubmitted={handleClozeSubmit} onPracticeWord={onPracticeWord} onFirstAction={onFirstAction} />
                        ) : (
                            <ClozeResult phrase={current} results={clozeResults} onPracticeWord={onPracticeWord} />
                        )
                    ) : current.direction === 'production' ? (
                        <div onClick={cardType === 'flip' ? handleCardTap : undefined} className={cardType === 'flip' && 'cursor-pointer select-none mx-4'}>
                            <p className="font-voice text-2xl leading-relaxed text-left text-ink px-4">{current.answer}</p>

                            {cardType === 'input' ? (
                                userAnswer === null ? (
                                    <InputAnswer phraseId={current.id} onSubmitted={handleInputSubmit} />
                                ) : (
                                    <AnswerDiff
                                        userAnswer={userAnswer}
                                        correctAnswer={current.text}
                                        onPracticeWord={onPracticeWord}
                                        useWordLookup
                                        expressions={confirmedExpressions}
                                    />
                                )
                            ) : (
                                <>
                                    {revealed ? (
                                        <div className="mt-4">
                                            <ClickableText text={current.text} onPracticeWord={onPracticeWord} confirmedExpressions={current.expressions ?? []} />
                                            <ExpressionList expressions={confirmedExpressions} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 mt-4">
                                            <button onClick={(e) => { e.stopPropagation(); onFirstAction?.(); setRevealed(true); }} className="text-sm bg-accent text-white rounded-lg px-4 py-1.5 hover:bg-accent-hover">
                                                Check
                                            </button>
                                            <p className="text-xs text-faint">tap card or press space to reveal</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div onClick={cardType === 'flip' ? handleCardTap : undefined} className={cardType === 'flip' ? 'cursor-pointer select-none' : ''}>
                            <ClickableText text={current.text} onPracticeWord={onPracticeWord} confirmedExpressions={current.expressions ?? []} />
                            {cardType === 'input' ? (
                                userAnswer === null ? (
                                    <InputAnswer phraseId={current.id} onSubmitted={handleInputSubmit} />
                                ) : (
                                    <AnswerDiff
                                        userAnswer={userAnswer}
                                        correctAnswer={current.answer}
                                        onPracticeWord={onPracticeWord}
                                        expressions={confirmedExpressions}
                                    />
                                )
                            ) : (
                                <>
                                    {revealed ? (
                                        <div className='mt-4 text-left mx-4'>
                                            <p className="text-lg text-muted">{current.answer}</p>
                                            <ExpressionList expressions={confirmedExpressions} />
                                        </div>

                                    ) : (
                                        <div className="flex flex-col items-center gap-2 mt-4">
                                            <button onClick={(e) => { e.stopPropagation(); onFirstAction?.(); setRevealed(true); }} className="text-sm bg-accent text-white rounded-lg px-4 py-1.5 hover:bg-accent-hover">
                                                Check
                                            </button>
                                            <p className="text-xs text-faint">tap card or press space to reveal</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                </div>
                {/* CARD */}

                {cardType === 'cloze' && clozeResults !== null && (
                    <div className="flex justify-center mb-5">
                        <button
                            onClick={() => handleGrade(autoGrade)}
                            className={`text-sm font-medium px-6 py-2.5 rounded-lg text-white ${autoGrade === 'easy' ? 'bg-success' : 'bg-danger'}`}
                        >
                            Continue
                        </button>
                    </div>
                )}

                {isChecked && cardType !== 'cloze' && (
                    <div className="flex gap-3 justify-center mb-5">
                        <button onClick={() => handleGrade('difficult')} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-danger-soft text-danger-soft-text hover:opacity-80">
                            Difficult
                        </button>
                        <button onClick={() => handleGrade('easy')} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-success-soft text-success-soft-text hover:opacity-80">
                            Easy
                        </button>
                    </div>
                )}

                {isChecked && !current.hasAudio && (
                    <div className="flex flex-col items-center gap-2 mb-5">
                        {!recordingAudio ? (
                            <button onClick={() => setRecordingAudio(true)} className="text-xs text-muted underline">
                                🎤 Add pronunciation recording
                            </button>
                        ) : (
                            <AudioRecorder existingUrl={null} onChange={handleAudioRecorded} />
                        )}
                    </div>
                )}

                <div className="border-t border-border pt-3 flex justify-center gap-5 text-xs text-faint pb-6">
                    <span>e edit</span>
                    <span>d duplicate</span>
                    {current.hasAudio ? (
                        <span>r replay</span>
                    ) : (
                        isChecked && <span>r record</span>
                    )}
                    {history.length > 0 && <span>b back</span>}
                </div>
            </div>

            <PhraseModal open={editingPhrase} existingPhrase={current} onClose={() => setEditingPhrase(false)} />
            <PhraseModal
                open={duplicatingPhrase}
                duplicateFrom={current}
                onClose={() => setDuplicatingPhrase(false)}
            />
        </div>
    );
}