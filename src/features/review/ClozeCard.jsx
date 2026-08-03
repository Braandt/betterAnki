// features/review/ClozeCard.jsx
import { useState, useRef, useEffect } from 'react';
import { tokenize } from '../../lib/tokenize';
import { checkClozeAnswers } from '../../lib/cloze';

export default function ClozeCard({ phrase, onSubmitted }) {
    const tokens = tokenize(phrase.text);
    const clozeIndices = phrase.clozeIndices || [];
    const [values, setValues] = useState(() => clozeIndices.map(() => ''));
    const inputRefs = useRef([]);

    useEffect(() => {
        setValues(clozeIndices.map(() => ''));
        inputRefs.current[0]?.focus();
    }, [phrase.id]);

    function handleChange(i, val) {
        setValues((prev) => {
            const next = [...prev];
            next[i] = val;
            return next;
        });
    }

    function handleKeyDown(e, i) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (i < clozeIndices.length - 1) {
                inputRefs.current[i + 1]?.focus(); // jump to next blank
            } else {
                handleSubmit();
            }
        }
    }

    function handleSubmit() {
        onSubmitted(checkClozeAnswers(tokens, clozeIndices, values));
    }

    return (
        <div className="flex flex-col items-center gap-4 max-w-2xl">
            <p className="text-3xl leading-relaxed text-center">
                {tokens.map((token, i) => {
                    const blankPos = clozeIndices.indexOf(i);
                    if (blankPos === -1) return <span key={i}>{token.text}</span>;

                    return (
                        <input
                            key={i}
                            ref={(el) => (inputRefs.current[blankPos] = el)}
                            value={values[blankPos]}
                            onChange={(e) => handleChange(blankPos, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, blankPos)}
                            className="inline-block border-b-2 border-blue-400 bg-blue-50 text-center w-28 mx-1 outline-none rounded px-1"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                    );
                })}
            </p>
            <button onClick={handleSubmit} className="text-sm bg-blue-600 text-white rounded px-4 py-1.5">
                Check
            </button>
        </div>
    );
}