// features/review/ReviewScreen.jsx
import { useState, useEffect, useCallback } from 'react';
import ClickableText from '../words/ClickableText';
import InputAnswer from './InputAnswer';
import AnswerDiff from './AnswerDiff';
import PhraseModal from '../phrases/PhraseModal';

export default function ReviewScreen({ phrases, onGrade }) {
    const [index, setIndex] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [userAnswer, setUserAnswer] = useState(null);
    const [editingPhrase, setEditingPhrase] = useState(false);

    const current = phrases[index];
    const cardType = current?.type ?? 'flip';
    const isChecked = cardType === 'input' ? userAnswer !== null : revealed;

    const goNext = useCallback(() => {
        setRevealed(false);
        setUserAnswer(null);
        setIndex((i) => (i + 1) % phrases.length);
    }, [phrases.length]);

    const handleGrade = useCallback(
        (grade) => {
            onGrade?.(current, grade);
            goNext();
        },
        [current, onGrade, goNext]
    );

    const handleInputSubmit = useCallback((value) => {
        setUserAnswer(value);
    }, []);

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
                } else if (isChecked) {
                    handleGrade('easy');
                }
                return;
            }

            if (isChecked) {
                if (e.key === '1') handleGrade('difficult');
                if (e.key === '2') handleGrade('easy');
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cardType, revealed, isChecked, handleGrade]);

    if (!current) return <p>No phrases to review.</p>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-8 px-4 pt-16">
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

            {isChecked && (
                <div className="flex gap-4">
                    <button
                        onClick={() => handleGrade('difficult')}
                        className="px-6 py-2 rounded bg-red-100 text-red-700 hover:bg-red-200"
                    >
                        Difficult
                    </button>
                    <button
                        onClick={() => handleGrade('easy')}
                        className="px-6 py-2 rounded bg-green-100 text-green-700 hover:bg-green-200"
                    >
                        Easy
                    </button>
                </div>
            )}

            <p className="text-xs text-gray-300">press "e" to edit this phrase</p>

            <PhraseModal
                open={editingPhrase}
                existingPhrase={current}
                onClose={() => setEditingPhrase(false)}
            />
        </div>
    );
}