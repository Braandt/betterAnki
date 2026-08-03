// features/review/ReviewScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import ClickableText from '../words/ClickableText';
import InputAnswer from './InputAnswer';
import AnswerDiff from './AnswerDiff';
import ClozeCard from './ClozeCard';
import ClozeResult from './ClozeResult';
import PhraseModal from '../phrases/PhraseModal';
import { isDue, schedule, DEFAULT_SRS } from '../../lib/srs';

export default function ReviewScreen({ phrases, onGrade, filterTags = [], includeAll = false, onExit }) {
    const [queueIds, setQueueIds] = useState(() =>
        phrases
            .filter((p) => (includeAll || isDue(p)) && filterTags.every((t) => (p.tags || []).includes(t)))
            .sort((a, b) => (a.srs?.due ?? 0) - (b.srs?.due ?? 0))
            .map((p) => p.id)
    );

    const [revealed, setRevealed] = useState(false);
    const [userAnswer, setUserAnswer] = useState(null);   // 'input' cards
    const [clozeResults, setClozeResults] = useState(null); // 'cloze' cards
    const [editingPhrase, setEditingPhrase] = useState(false);

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
        },
        [current, onGrade]
    );

    const handleInputSubmit = useCallback((value) => setUserAnswer(value), []);
    const handleClozeSubmit = useCallback((results) => setClozeResults(results), []);

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
                    if (!revealed) setRevealed(true);
                    else handleGrade('easy');
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
    }, [cardType, revealed, isChecked, handleGrade]);

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
                    <ClozeResult phrase={current} results={clozeResults} />
                )
            ) : (
                <>
                    <ClickableText text={current.text} />
                    {cardType === 'input' ? (
                        userAnswer === null ? (
                            <InputAnswer phraseId={current.id} onSubmitted={handleInputSubmit} />
                        ) : (
                            <AnswerDiff userAnswer={userAnswer} correctAnswer={current.answer} />
                        )
                    ) : (
                        <>
                            {revealed && <p className="text-xl text-gray-500">{current.answer}</p>}
                            {!revealed && <p className="text-sm text-gray-400">press space to reveal</p>}
                        </>
                    )}
                </>
            )}

            {isChecked && (
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