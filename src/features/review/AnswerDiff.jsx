// features/review/AnswerDiff.jsx
import { diffWords, isExactMatch } from '../../lib/compareAnswer';

export default function AnswerDiff({ userAnswer, correctAnswer }) {
    const correct = isExactMatch(userAnswer, correctAnswer);

    if (correct) {
        return (
            <div className="flex flex-col items-center gap-2 mt-5">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success-soft text-success-soft-text">Correct</span>
                <p className="text-xl text-ink">{correctAnswer}</p>
            </div>
        );
    }

    const diff = diffWords(userAnswer, correctAnswer);

    return (
        <div className="flex flex-col items-center gap-2 mt-5">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-danger-soft text-danger-soft-text">Not quite</span>
            <p className="text-lg leading-relaxed text-left max-w-md mx-auto">
                {diff.map((part, i) => {
                    if (part.type === 'match') return <span key={i} className="text-success-soft-text">{part.text}{' '}</span>;
                    if (part.type === 'wrong') return <span key={i} className="text-danger-soft-text line-through">{part.text}{' '}</span>;
                    return <span key={i} className="text-faint underline">{part.text}{' '}</span>;
                })}
            </p>
            <p className="text-sm text-faint text-left max-w-md mx-auto">correct answer: {correctAnswer}</p>
        </div>
    );
}