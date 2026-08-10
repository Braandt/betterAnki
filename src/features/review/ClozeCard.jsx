// features/review/ClozeCard.jsx
import { useState, useRef, useEffect } from 'react';
import { tokenize } from '../../lib/tokenize';
import { checkClozeAnswers } from '../../lib/cloze';
import { useApp } from '../../context/AppContext';

const MIN_WIDTH = 60;
const EXTRA_PADDING = 16;

function AutoWidthInput({ value, onChange, onKeyDown, inputRef, placeholder, disabled, status }) {
    const [width, setWidth] = useState(MIN_WIDTH);
    const measureRef = useRef(null);

    useEffect(() => {
        if (measureRef.current) {
            const measured = measureRef.current.offsetWidth + EXTRA_PADDING;
            setWidth(Math.max(MIN_WIDTH, measured));
        }
    }, [value, placeholder]);

    const statusClass =
        status === 'correct'
            ? 'border-green-500 bg-green-50 text-green-700'
            : status === 'wrong'
                ? 'border-red-400 bg-red-50'
                : 'border-blue-400 bg-blue-50';

    return (
        <span className="relative inline-block align-middle mx-1">
            <span ref={measureRef} className="invisible absolute whitespace-pre text-3xl" aria-hidden="true">
                {value || placeholder || ''}
            </span>
            <input
                ref={inputRef}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                style={{ width: `${width}px` }}
                className={`inline-block border-b-2 text-center outline-none rounded px-1 text-3xl transition-[width] duration-100 placeholder-gray-300 disabled:opacity-100 ${statusClass}`}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                autoCapitalize='none'
            />
        </span>
    );
}

export default function ClozeCard({ phrase, onSubmitted }) {
    const { wordDict } = useApp();
    const tokens = tokenize(phrase.text);
    const clozeIndices = phrase.clozeIndices || [];

    const [values, setValues] = useState(() => clozeIndices.map(() => ''));
    const [phase, setPhase] = useState('answering'); // 'answering' | 'correcting'
    const [firstResults, setFirstResults] = useState(null); // locked in from the first attempt — used for grading
    const [retryValues, setRetryValues] = useState(() => clozeIndices.map(() => ''));
    const [corrected, setCorrected] = useState(() => clozeIndices.map(() => false));
    const inputRefs = useRef([]);

    useEffect(() => {
        setValues(clozeIndices.map(() => ''));
        setRetryValues(clozeIndices.map(() => ''));
        setCorrected(clozeIndices.map(() => false));
        setFirstResults(null);
        setPhase('answering');
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
                inputRefs.current[i + 1]?.focus();
            } else {
                handleCheck();
            }
        }
    }

    function handleCheck() {
        const results = checkClozeAnswers(tokens, clozeIndices, values);
        const allCorrect = results.every((r) => r.isCorrect);

        if (allCorrect) {
            onSubmitted(results);
            return;
        }

        // Enter correction mode: clear wrong blanks, lock correct ones
        setFirstResults(results);
        setRetryValues(results.map((r) => (r.isCorrect ? r.correctText : '')));
        setCorrected(results.map((r) => r.isCorrect));
        setPhase('correcting');

        const firstWrongPos = results.findIndex((r) => !r.isCorrect);
        setTimeout(() => inputRefs.current[firstWrongPos]?.focus(), 0);
    }

    function handleRetryChange(i, val) {
        setRetryValues((prev) => {
            const next = [...prev];
            next[i] = val;
            return next;
        });

        const correctText = firstResults[i].correctText;
        if (val.trim().toLowerCase() === correctText.toLowerCase()) {
            setCorrected((prev) => {
                const next = [...prev];
                next[i] = true;
                return next;
            });
            // move focus to the next not-yet-corrected blank
            const nextIndex = firstResults.findIndex((r, idx) => idx > i && !r.isCorrect && !corrected[idx]);
            if (nextIndex !== -1) {
                setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
            }
        }
    }

    function handleRetryKeyDown(e, i) {
        if (e.key === 'Enter' && allCorrected) {
            e.preventDefault();
            handleContinue();
        }
    }

    function handleContinue() {
        onSubmitted(firstResults);
    }

    const allCorrected = phase === 'correcting' && corrected.every(Boolean);

    useEffect(() => {
        if (!allCorrected) return;

        function handleGlobalKeyDown(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleContinue();
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [allCorrected]);

    const wordHints = phrase.showTranslationUpfront
        ? clozeIndices
            .map((tokenIndex) => wordDict[tokens[tokenIndex].key])
            .filter(Boolean)
            .map((entry) => [entry.definition, entry.notes].filter(Boolean).join(' | '))
        : [];

    return (
        <div className="flex flex-col items-center gap-3 max-w-2xl">
            <p className="text-3xl leading-relaxed text-center">
                {tokens.map((token, i) => {
                    const blankPos = clozeIndices.indexOf(i);
                    if (blankPos === -1) return <span key={i}>{token.text}</span>;

                    if (phase === 'answering') {
                        return (
                            <AutoWidthInput
                                key={i}
                                value={values[blankPos]}
                                onChange={(e) => handleChange(blankPos, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, blankPos)}
                                inputRef={(el) => (inputRefs.current[blankPos] = el)}
                            />
                        );
                    }

                    // correcting phase
                    const isCorrect = corrected[blankPos];
                    return (
                        <AutoWidthInput
                            key={i}
                            value={retryValues[blankPos]}
                            onChange={(e) => handleRetryChange(blankPos, e.target.value)}
                            onKeyDown={(e) => handleRetryKeyDown(e, blankPos)}
                            inputRef={(el) => (inputRefs.current[blankPos] = el)}
                            placeholder={!isCorrect ? firstResults[blankPos].correctText : undefined}
                            disabled={isCorrect}
                            status={isCorrect ? 'correct' : 'wrong'}
                        />
                    );
                })}
            </p>

            {phase === 'correcting' && (
                <p className="text-sm text-red-500">Type the correct word(s) to continue</p>
            )}

            {wordHints.length > 0 && (
                <div className="flex flex-col items-center gap-0.5">
                    {wordHints.map((hint, i) => (
                        <p key={i} className="text-sm text-gray-500">
                            {hint}
                        </p>
                    ))}
                </div>
            )}

            {phrase.showTranslationUpfront && phrase.answer && (
                <p className="text-sm text-gray-400 italic">{phrase.answer}</p>
            )}

            {phase === 'answering' ? (
                <button onClick={handleCheck} className="text-sm bg-blue-600 text-white rounded px-4 py-1.5 mt-1">
                    Check
                </button>
            ) : (
                <button
                    onClick={handleContinue}
                    disabled={!allCorrected}
                    className="text-sm bg-blue-600 text-white rounded px-4 py-1.5 mt-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Continue
                </button>
            )}
        </div>
    );
}