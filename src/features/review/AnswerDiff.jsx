import { diffWords, isExactMatch } from '../../lib/compareAnswer';

export default function AnswerDiff({ userAnswer, correctAnswer }) {
    const correct = isExactMatch(userAnswer, correctAnswer);

    if (correct) {
        return (
            <div className="flex flex-col items-center gap-1">
                <p className="text-success-soft-text font-medium">Correct!</p>
                <p className="text-xl text-ink">{correctAnswer}</p>
            </div>
        );
    }

    const diff = diffWords(userAnswer, correctAnswer);

    return (
        <div className="flex flex-col items-center gap-2">
            <p className="text-danger-soft-text font-medium">Not quite</p>
            <p className="text-lg leading-relaxed text-center">
                {diff.map((part, i) => {
                    if (part.type === 'match') {
                        return (
                            <span key={i} className="text-success-soft-text">
                                {part.text}{' '}
                            </span>
                        );
                    }
                    if (part.type === 'wrong') {
                        return (
                            <span key={i} className="text-danger-soft-text line-through">
                                {part.text}{' '}
                            </span>
                        );
                    }
                    return (
                        <span key={i} className="text-faint underline">
                            {part.text}{' '}
                        </span>
                    );
                })}
            </p>
            <p className="text-sm text-faint mt-1">correct answer: {correctAnswer}</p>
        </div>
    );
}