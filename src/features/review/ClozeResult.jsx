// features/review/ClozeResult.jsx
import { tokenize } from '../../lib/tokenize';

export default function ClozeResult({ phrase, results }) {
    const tokens = tokenize(phrase.text);
    const resultMap = Object.fromEntries(results.map((r) => [r.tokenIndex, r]));
    const allCorrect = results.every((r) => r.isCorrect);

    return (
        <div className="flex flex-col items-center gap-2 max-w-2xl">
            <p className={allCorrect ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                {allCorrect ? 'Correct!' : 'Not quite'}
            </p>
            <p className="text-2xl leading-relaxed text-center">
                {tokens.map((token, i) => {
                    const r = resultMap[i];
                    if (!r) return <span key={i}>{token.text}</span>;

                    if (r.isCorrect) {
                        return (
                            <span key={i} className="text-green-600 font-semibold">
                                {r.correctText}
                            </span>
                        );
                    }
                    return (
                        <span key={i} className="inline-flex flex-col items-center mx-1 align-middle">
                            <span className="text-red-500 line-through text-sm leading-none">{r.given || '—'}</span>
                            <span className="text-green-600 font-semibold">{r.correctText}</span>
                        </span>
                    );
                })}
            </p>
            {phrase.answer && <p className="text-sm text-gray-400 mt-1">{phrase.answer}</p>}
        </div>
    );
}