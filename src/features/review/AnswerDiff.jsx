// features/review/AnswerDiff.jsx
import { diffWords, isExactMatch } from '../../lib/compareAnswer';

export default function AnswerDiff({ userAnswer, correctAnswer }) {
    const correct = isExactMatch(userAnswer, correctAnswer);

    if (correct) {
        return (
            <div className="flex flex-col items-center gap-1">
                <p className="text-green-600 font-medium">Correct!</p>
                <p className="text-xl text-gray-700">{correctAnswer}</p>
            </div>
        );
    }

    const diff = diffWords(userAnswer, correctAnswer);

    return (
        <div className="flex flex-col items-center gap-2">
            <p className="text-red-500 font-medium">Not quite</p>
            <p className="text-lg leading-relaxed text-center">
                {diff.map((part, i) => {
                    if (part.type === 'match') {
                        return (
                            <span key={i} className="text-green-600">
                                {part.text}{' '}
                            </span>
                        );
                    }
                    if (part.type === 'wrong') {
                        return (
                            <span key={i} className="text-red-500 line-through">
                                {part.text}{' '}
                            </span>
                        );
                    }
                    // missing — a word that should've been typed
                    return (
                        <span key={i} className="text-gray-400 underline">
                            {part.text}{' '}
                        </span>
                    );
                })}
            </p>
            <p className="text-sm text-gray-400 mt-1">correct answer: {correctAnswer}</p>
        </div>
    );
}