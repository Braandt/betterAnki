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

export default function ReviewScreen({
    phrases,
    onGrade,
    filterTags = [],
    filterWords = [],
    includeAll = false,
    onExit,
    onPracticeWord,
}) {
    const { getAudioUrl } = useApp();

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
    const currentAudioRef = useRef(null);

    const current = phrases.find((p) => p.id === queueIds[0]) ?? null;
    const cardType = current?.type ?? 'flip';

    const isChecked =
        cardType === 'input' ? userAnswer !== null :
            cardType === 'cloze' ? clozeResults !== null :
                revealed;

    const handleGrade = useCallback(
        (grade) => {
            if (!current) return;
            const newSrs = schedule(current.srs ?? DEFAULT_SRS, grade);
            onGrade?.(current, newSrs);

            setQueueIds((ids) => {
                const rest = ids.slice(1);
                return grade === 'difficult' ? [...rest, current.id] : rest;
            });
            setRevealed(false);
            setUserAnswer(null);
            setClozeResults(null);
            setAutoGrade(null);
        },
        [current, onGrade]
    );

    const handleInputSubmit = useCallback((value) => setUserAnswer(value), []);

    const handleClozeSubmit = useCallback((results) => {
        setClozeResults(results);
        const allCorrect = results.every((r) => r.isCorrect);
        setAutoGrade(allCorrect ? 'easy' : 'difficult');
    }, []);

    // Audio autoplay — unchanged
    useEffect(() => {
        let cancelled = false;
        let objectUrl = null;

        async function playIfAvailable() {
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
    }, [current?.id]);

    function replayAudio() {
        currentAudioRef.current?.play().catch(() => { });
    }

    function handleCardTap() {
        if (cardType !== 'flip') return;
        if (!revealed) {
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

            if (e.code === 'Space') {
                e.preventDefault();
                if (cardType === 'flip') {
                    if (!revealed) {
                        setRevealed(true);
                    } else {
                        handleGrade('easy');
                    }
                } else if (cardType === 'cloze' && isChecked) {
                    handleGrade(autoGrade); // continue using the auto-computed grade
                } else if (isChecked) {
                    handleGrade('easy');
                }
                return;
            }

            // 1/2 still work as an override — for cloze cards this overrides autoGrade
            if (isChecked) {
                if (e.key === '1') { e.preventDefault(); handleGrade('difficult'); }
                if (e.key === '2') { e.preventDefault(); handleGrade('easy'); }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cardType, revealed, isChecked, autoGrade, handleGrade]);

    if (!current) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-400 pt-16">
                <p>
                    {includeAll
                        ? 'No phrases match this filter.'
                        : `All caught up${filterTags.length ? ' for this filter' : ''} — no cards due right now.`}
                </p>
                {onExit && (
                    <button onClick={onExit} className="text-sm text-blue-500 underline">
                        Back to normal review
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-8 px-4 pt-16">
            {filterTags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap justify-center items-center">
                    {filterTags.map((t) => (
                        <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {t}
                        </span>
                    ))}
                    {onExit && (
                        <button onClick={onExit} className="text-xs text-gray-400 underline ml-2">
                            exit custom study
                        </button>
                    )}
                </div>
            )}

            {cardType === 'cloze' ? (
                clozeResults === null ? (
                    <ClozeCard phrase={current} onSubmitted={handleClozeSubmit} />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <ClozeResult phrase={current} results={clozeResults} />
                        <button
                            onClick={() => handleGrade(autoGrade)}
                            className={`text-sm px-4 py-1.5 rounded ${autoGrade === 'easy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                        >
                            Continue
                        </button>
                        <p className="text-xs text-gray-300">press space to continue · 1/2 to override grade</p>
                    </div>
                )
            ) : (
                <div onClick={cardType === 'flip' ? handleCardTap : undefined} className={cardType === 'flip' ? 'cursor-pointer select-none' : ''}>
                    <ClickableText text={current.text} onPracticeWord={onPracticeWord} />
                    {cardType === 'input' ? (
                        userAnswer === null ? (
                            <InputAnswer phraseId={current.id} onSubmitted={handleInputSubmit} />
                        ) : (
                            <AnswerDiff userAnswer={userAnswer} correctAnswer={current.answer} />
                        )
                    ) : (
                        <>
                            {revealed && <p className="text-xl text-gray-500 mt-4">{current.answer}</p>}
                            {!revealed && <p className="text-sm text-gray-400 mt-4">tap or press space to reveal</p>}
                        </>
                    )}
                </div>
            )}

            {current.hasAudio && (
                <button onClick={replayAudio} className="text-sm text-blue-500 hover:text-blue-700" title="Replay audio">
                    🔊 Replay
                </button>
            )}

            {isChecked && cardType !== 'cloze' && (
                <div className="flex gap-4">
                    <button onClick={() => handleGrade('difficult')} className="px-6 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200">
                        Difficult
                    </button>
                    <button onClick={() => handleGrade('easy')} className="px-6 py-2 rounded bg-green-100 text-green-700 hover:bg-green-200">
                        Easy
                    </button>
                </div>
            )}

            <p className="text-xs text-gray-300">{queueIds.length - 1} more due · press "e" to edit this phrase</p>

            <PhraseModal open={editingPhrase} existingPhrase={current} onClose={() => setEditingPhrase(false)} />
        </div>
    );
}