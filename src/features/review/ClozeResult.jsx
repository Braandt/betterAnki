// features/review/ClozeResult.jsx
import { useState } from 'react';
import { tokenize } from '../../lib/tokenize';
import { useApp } from '../../context/AppContext';
import WordEditorModal from '../words/WordEditorModal';
import WordSpan from '../words/WordSpan';
import ExpressionSpan from '../words/ExpressionSpan';
import { findExpressionMatches, buildExpressionIndex, resolveConfirmedExpressions } from '../../lib/expressions';
import ExpressionList from '../../components/ExpressionList';

export default function ClozeResult({ phrase, results, onPracticeWord }) {
    const { wordDict, addWord } = useApp();
    const [addingKey, setAddingKey] = useState(null);

    const tokens = tokenize(phrase.text);
    const expressionIndex = buildExpressionIndex(findExpressionMatches(tokens, wordDict));
    const resultMap = Object.fromEntries(results.map((r) => [r.tokenIndex, r]));
    const allCorrect = results.every((r) => r.isCorrect);

    const undefinedBlankedWords = [...new Set(results.map((r) => r.key))].filter((key) => !wordDict[key]);

    const confirmedExpressions = resolveConfirmedExpressions(phrase.expressions, wordDict);

    return (
        <div className="flex flex-col gap-2 max-w-2xl">
            <span className={`text-xs font-medium self-center px-2.5 py-1 rounded-full ${allCorrect ? 'bg-success-soft text-success-soft-text' : 'bg-danger-soft text-danger-soft-text'}`}>
                {allCorrect ? 'Correct' : 'Incorrect'}
            </span>

            <p className="text-2xl leading-relaxed text-left mx-4">
                {tokens.map((token, i) => {
                    const r = resultMap[i];

                    if (r) {
                        // The blanked word — render it as a clickable word (correct answer, colored)
                        // even when you got it wrong; there's no need for a separate wrong/correct
                        // pair here since the correction phase (ClozeCard) already covered that.
                        const correctToken = { text: r.correctText, key: token.key, isWord: true };
                        return (
                            <span key={i} className="inline-flex flex-col items-center mx-1 align-middle">
                                {!r.isCorrect && (
                                    <span className="text-danger-soft-text line-through text-sm leading-none">{r.given || '—'}</span>
                                )}
                                <WordSpan
                                    token={correctToken}
                                    onPracticeWord={onPracticeWord}
                                    textClassName="text-success-soft-text font-semibold"
                                />
                            </span>
                        );
                    }

                    if (!token.isWord) return <span key={i}>{token.text}</span>;

                    const match = expressionIndex.get(i);
                    return match ? (
                        <ExpressionSpan key={i} token={token} match={match} allTokens={tokens} onPracticeWord={onPracticeWord} />
                    ) : (
                        <WordSpan key={i} token={token} onPracticeWord={onPracticeWord} />
                    );
                })}
            </p>

            {phrase.answer && <p className="italic text-faint mx-4">{phrase.answer}</p>}
            <ExpressionList expressions={confirmedExpressions} />

            {undefinedBlankedWords.length > 0 && (
                <div className="mt-2 flex flex-col items-center gap-1.5 border-t border-border pt-3 w-full">
                    <p className="text-xs text-faint">These blanked words have no definition yet:</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                        {undefinedBlankedWords.map((key) => (
                            <button
                                key={key}
                                onClick={() => setAddingKey(key)}
                                className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border-strong text-muted hover:bg-surface-sunken"
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