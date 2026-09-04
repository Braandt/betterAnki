// features/words/ExpressionSpan.jsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';

function isDesktopPointer() {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

// `token`: the single word being rendered right now (its own position in the sentence)
// `match`: { key, entry, tokenIndices } — the full expression this word belongs to
// `allTokens`: full tokenize() output, used to look up the OTHER words' literal text/meaning
export default function ExpressionSpan({ token, match, allTokens, onPracticeWord }) {
    const { wordDict, addWord, updateWord } = useApp();
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [editingKey, setEditingKey] = useState(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!tooltipOpen) return;
        function handleOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setTooltipOpen(false);
        }
        document.addEventListener('pointerdown', handleOutside);
        return () => document.removeEventListener('pointerdown', handleOutside);
    }, [tooltipOpen]);

    function handleSave({ definition, notes }) {
        const existing = wordDict[editingKey];
        if (existing) updateWord(existing.id, { definition, notes });
        else addWord({ text: editingKey, definition, notes });
    }

    function handleClick(e) {
        e.stopPropagation();
        if (isDesktopPointer()) {
            setTooltipOpen(false);
            setEditingKey(match.key);
        } else {
            setTooltipOpen((o) => !o);
        }
    }

    const literalWords = match.tokenIndices.map((i) => allTokens[i]);

    return (
        <>
            <span
                ref={wrapperRef}
                className="relative inline-block"
                style={{ touchAction: 'manipulation' }}
                onMouseEnter={() => setTooltipOpen(true)}
                onMouseLeave={() => setTooltipOpen(false)}
            >
                <span
                    onClick={handleClick}
                    className="cursor-pointer hover:bg-yellow-200 rounded px-0.5 underline decoration-wavy decoration-accent underline-offset-4"
                >
                    {token.text}
                </span>

                {tooltipOpen && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-full pt-1 z-10">
                        <span className="block w-max max-w-xs rounded bg-gray-800 text-white text-sm px-3 py-2 shadow-lg text-left flex flex-col gap-1.5">
                            <span className="text-xs text-accent-soft font-medium tracking-wide">
                                Expression:
                                <span className='uppercase'> {match.key}</span>
                            </span>
                            <span>{match.entry.definition}</span>
                            {match.entry.notes && (
                                <span className="text-gray-300 text-xs border-t border-gray-600 pt-1 whitespace-pre-line">
                                    {match.entry.notes}
                                </span>
                            )}

                            <div className="border-t border-gray-600 pt-1 flex flex-col gap-1">
                                <span className="text-xs text-gray-400">Literal meaning:</span>
                                {literalWords.map((t, i) => {
                                    const entry = wordDict[t.key];
                                    return (
                                        <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                            <span className="capitalize">{t.text}</span>
                                            {entry ? (
                                                <span className="text-gray-300">{entry.definition}</span>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setTooltipOpen(false); setEditingKey(t.key); }}
                                                    className="text-blue-300 underline"
                                                >
                                                    + add
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 border-t border-gray-600 pt-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setTooltipOpen(false); setEditingKey(match.key); }}
                                    className="text-blue-300 text-xs underline"
                                >
                                    Edit expression
                                </button>
                                {onPracticeWord && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setTooltipOpen(false); onPracticeWord(match.key); }}
                                        className="text-yellow-300 text-xs underline"
                                    >
                                        Practice →
                                    </button>
                                )}
                            </div>
                        </span>
                    </span>
                )}
            </span>

            <WordEditorModal
                wordKey={editingKey}
                existing={editingKey ? wordDict[editingKey] : null}
                onSave={handleSave}
                onClose={() => setEditingKey(null)}
            />
        </>
    );
}