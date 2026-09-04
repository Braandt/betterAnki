// features/words/WordSpan.jsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';

function isDesktopPointer() {
    return typeof window !== 'undefined' &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

export default function WordSpan({ token, onPracticeWord, textClassName }) {
    const { wordDict, addWord, updateWord } = useApp();
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const wrapperRef = useRef(null);

    const entry = wordDict[token.key];

    useEffect(() => {
        if (!tooltipOpen) return;
        function handleOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setTooltipOpen(false);
            }
        }
        document.addEventListener('pointerdown', handleOutside);
        return () => document.removeEventListener('pointerdown', handleOutside);
    }, [tooltipOpen]);

    function handleSave({ definition, notes }) {
        if (entry) {
            updateWord(entry.id, { definition, notes });
        } else {
            addWord({ text: token.key, definition, notes });
        }
    }

    function handleWordClick(e) {
        e.stopPropagation();
        if (isDesktopPointer()) {
            // Mouse users already get the peek from hover — a click can go
            // straight to editing, same as the original desktop behavior.
            setTooltipOpen(false);
            setEditing(true);
        } else {
            // Touch has no hover, so the first tap has to peek instead —
            // editing happens via the explicit button inside the tooltip.
            setTooltipOpen((open) => !open);
        }
    }

    return (
        <>
            <span ref={wrapperRef} className="relative inline-block" style={{ touchAction: 'manipulation' }}
                onMouseEnter={() => setTooltipOpen(true)} onMouseLeave={() => setTooltipOpen(false)}>
                <span
                    className={`cursor-pointer hover:bg-yellow-200 rounded px-0.5 ${textClassName ?? (entry ? 'underline decoration-dotted decoration-gray-400 underline-offset-4' : '')
                        }`}
                    onClick={handleWordClick}
                >
                    {token.text}
                </span>

                {tooltipOpen && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-full pt-1 z-10">
                        <span className="w-max max-w-xs rounded bg-gray-800 text-white text-sm px-3 py-2 shadow-lg text-left flex flex-col gap-1.5">
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
                                <span>No definition yet</span>
                            )}

                            <div className="flex gap-3 border-t border-gray-600 pt-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTooltipOpen(false);
                                        setEditing(true);
                                    }}
                                    className="text-left text-blue-300 text-xs underline hover:text-blue-200"
                                >
                                    {entry ? 'Edit' : '+ Add definition'}
                                </button>
                                {onPracticeWord && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTooltipOpen(false);
                                            onPracticeWord(token.key);
                                        }}
                                        className="text-left text-yellow-300 text-xs underline hover:text-yellow-200"
                                    >
                                        Practice this word →
                                    </button>
                                )}
                            </div>
                        </span>
                    </span>
                )}
            </span>

            <WordEditorModal
                wordKey={editing ? token.key : null}
                existing={entry}
                onSave={handleSave}
                onClose={() => setEditing(false)}
            />
        </>
    );
}