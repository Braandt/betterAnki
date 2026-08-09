// features/words/ClickableText.jsx
import { useState } from 'react';
import { tokenize } from '../../lib/tokenize';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';

export default function ClickableText({ text, onPracticeWord }) {
    const { wordDict, addWord, updateWord } = useApp();
    const [hoveredKey, setHoveredKey] = useState(null);
    const [editingKey, setEditingKey] = useState(null);

    const tokens = tokenize(text);

    function handleSave({ definition, notes }) {
        const existing = wordDict[editingKey];
        if (existing) {
            updateWord(existing.id, { definition, notes });
        } else {
            addWord({ text: editingKey, definition, notes });
        }
    }

    return (
        <>
            <p className="text-3xl leading-relaxed text-center">
                {tokens.map((token, i) => {
                    if (!token.isWord) return <span key={i}>{token.text}</span>;

                    const entry = wordDict[token.key];
                    const isHovered = hoveredKey === token.key;

                    return (
                        <span
                            key={i}
                            className={`relative cursor-pointer hover:bg-yellow-200 rounded px-0.5 ${entry ? 'underline decoration-dotted decoration-gray-400 underline-offset-4' : ''
                                }`}
                            onMouseEnter={() => setHoveredKey(token.key)}
                            onMouseLeave={() => setHoveredKey(null)}
                            onClick={(e) => {
                                e.stopPropagation(); // don't also trigger the card's tap-to-reveal
                                setEditingKey(token.key);
                            }}
                        >
                            {token.text}

                            {isHovered && (
                                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-10 w-max max-w-xs rounded bg-gray-800 text-white text-sm px-3 py-2 shadow-lg text-left flex flex-col gap-1.5">
                                    {entry ? (
                                        <span className="flex flex-col gap-1">
                                            <span>{entry.definition}</span>
                                            {entry.notes && (
                                                <span className="text-gray-300 text-xs border-t border-gray-600 pt-1 mt-1 whitespace-pre-line">
                                                    {entry.notes}
                                                </span>
                                            )}
                                        </span>
                                    ) : (
                                        <span>Click to add definition</span>
                                    )}

                                    {onPracticeWord && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // don't also trigger the word's onClick (edit)
                                                onPracticeWord(token.key);
                                            }}
                                            className="text-left text-yellow-300 text-xs underline hover:text-yellow-200 border-t border-gray-600 pt-1"
                                        >
                                            Practice this word →
                                        </button>
                                    )}
                                </span>
                            )}
                        </span>
                    );
                })}
            </p>

            <WordEditorModal
                wordKey={editingKey}
                existing={editingKey ? wordDict[editingKey] : null}
                onSave={handleSave}
                onClose={() => setEditingKey(null)}
            />
        </>
    );
}