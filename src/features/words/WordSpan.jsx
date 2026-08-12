// features/words/WordSpan.jsx
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import WordEditorModal from './WordEditorModal';

export default function WordSpan({ token, onPracticeWord }) {
    const { wordDict, addWord, updateWord } = useApp();
    const [hovered, setHovered] = useState(false);
    const [editing, setEditing] = useState(false);

    const entry = wordDict[token.key];

    function handleSave({ definition, notes }) {
        if (entry) {
            updateWord(entry.id, { definition, notes });
        } else {
            addWord({ text: token.key, definition, notes });
        }
    }

    return (
        <>
            <span
                className={`relative cursor-pointer pb-2 group ${entry ? 'underline decoration-dotted decoration-gray-400 underline-offset-4' : ''
                    }`}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={(e) => {
                    e.stopPropagation(); // don't let this bubble into e.g. a flip card's tap-to-reveal
                    setEditing(true);
                }}
            >

                <span className='group-hover:bg-yellow-200 px-0.5 rounded'>
                    {token.text}
                </span>

                {hovered && (
                    <span className="absolute left-1/2 -translate-x-1/2 top-full z-10 w-max max-w-xs rounded bg-gray-800 text-white text-sm px-3 py-2 shadow-lg text-left flex flex-col gap-1.5">
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
                                    e.stopPropagation();
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

            <WordEditorModal
                wordKey={editing ? token.key : null}
                existing={entry}
                onSave={handleSave}
                onClose={() => setEditing(false)}
            />
        </>
    );
}