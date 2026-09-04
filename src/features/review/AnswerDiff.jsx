// features/review/AnswerDiff.jsx
import { diffWords, isExactMatch } from '../../lib/compareAnswer';
import WordSpan from '../words/WordSpan';
import ExpressionList from '../../components/ExpressionList';

function toToken(text) {
    return { text, key: text.toLowerCase().trim(), isWord: true };
}

export default function AnswerDiff({ userAnswer, correctAnswer, onPracticeWord, useWordLookup = false, expressions = [] }) {
    const correct = isExactMatch(userAnswer, correctAnswer);
    const renderWord = (text, className) =>
        useWordLookup
            ? <WordSpan token={toToken(text)} onPracticeWord={onPracticeWord} textClassName={className} />
            : <span className={className}>{text}</span>;

    if (correct) {
        return (
            <div className="flex flex-col gap-2 mt-5 mx-4">
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success-soft text-success-soft-text w-fit">Correct</span>
                <p className="text-xl">{correctAnswer.split(' ').map((w, i) => <span key={i}>{renderWord(w, 'text-ink')}{' '}</span>)}</p>
                {useWordLookup && <ExpressionList expressions={expressions} />}
            </div>
        );
    }

    const diff = diffWords(userAnswer, correctAnswer);

    return (
        <div className="flex flex-col gap-3 mt-5 mx-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-danger-soft text-danger-soft-text w-fit">Incorrect</span>
            <div>
                <p className="text-xs text-faint mb-1">Your answer</p>
                <p className="text-lg leading-relaxed">
                    {diff.filter((p) => p.type !== 'missing').map((p, i) =>
                        <span key={i} className={p.type === 'wrong' ? 'text-danger-soft-text underline decoration-danger' : 'text-ink'}>{p.text}{' '}</span>
                    )}
                </p>
            </div>
            <div>
                <p className="text-xs text-faint mb-1">Correct solution</p>
                <p className="text-lg leading-relaxed">
                    {diff.filter((p) => p.type !== 'wrong').map((p, i) =>
                        <span key={i}>{renderWord(p.text, p.type === 'missing' ? 'text-success-soft-text font-semibold' : 'text-ink')}{' '}</span>
                    )}
                </p>
                {useWordLookup && <ExpressionList expressions={expressions} />}
            </div>
        </div>
    );
}