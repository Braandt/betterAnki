// features/review/ClozeResult.jsx
import { useState } from 'react';
import { tokenize } from '../../lib/tokenize';
import { useApp } from '../../context/AppContext';
import WordEditorModal from '../words/WordEditorModal';

export default function ClozeResult({ phrase, results }) {
    const { wordDict, addWord } = useApp();
    const [addingKey, setAddingKey] = useState(null);

    const tokens = tokenize(phrase.text);
    const resultMap = Object.fromEntries(results.map((r) => [r.tokenIndex, r]));
    const allCorrect = results.every((r) => r.isCorrect);

    // Blanked words that have no dictionary entry — worth prompting for right now,
    // since the correct word/context is freshest in mind at this exact moment.
    const undefinedBlankedWords = [...new Set(results.map((r) => r.key))]
        .filter((key) => !wordDict[key]);

    return (
        <div className="flex flex-col gap-2 max-w-2xl">
            <p className={allCorrect ? 'text-white bg-green-600 max-w-fit py-0.5 px-2 rounded-full font-medium' : 'text-white bg-red-500 max-w-fit py-0.5 px-2 rounded-full font-medium'}>
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
            {phrase.answer && <p className="text-gray-400 font-semibold mt-1">{phrase.answer}</p>}

            {undefinedBlankedWords.length > 0 && (
                <div className="mt-2 flex flex-col items-center gap-1.5 border-t pt-3 w-full">
                    <p className="text-xs text-gray-400">These blanked words have no definition yet:</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {undefinedBlankedWords.map((key) => (
                            <button
                                key={key}
                                onClick={() => setAddingKey(key)}
                                className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
                            >
                                + {key}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <WordEditorModal
                wordKey={addingKey}
                existing={null}
                onSave={({ definition, notes }) => addWord({ text: addingKey, definition, notes })}
                onClose={() => setAddingKey(null)}
            />
        </div>
    );
}