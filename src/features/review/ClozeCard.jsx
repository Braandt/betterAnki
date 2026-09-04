// features/review/ClozeCard.jsx
import { useState, useRef, useEffect } from 'react';
import { tokenize } from '../../lib/tokenize';
import { checkClozeAnswers } from '../../lib/cloze';
import { useApp } from '../../context/AppContext';
import WordSpan from '../words/WordSpan';
import ExpressionSpan from '../words/ExpressionSpan';
import { buildExpressionIndex, findExpressionMatches } from '../../lib/expressions';

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
        status === 'correct' ? 'border-success bg-success-soft text-success-soft-text' :
            status === 'wrong' ? 'border-danger bg-danger-soft' :
                'border-accent bg-accent-soft';

    return (
        <span className="relative inline-block align-middle mx-1">
            <span ref={measureRef} className="invisible absolute whitespace-pre font-voice text-2xl" aria-hidden="true">
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
                className={`inline-block border-b-2 text-center outline-none rounded px-1 font-voice text-2xl transition-[width] duration-100 placeholder-faint disabled:opacity-100 ${statusClass}`}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
            />
        </span>
    );
}

export default function ClozeCard({ phrase, onSubmitted, onPracticeWord, onFirstAction }) {
    const { wordDict } = useApp();
    const tokens = tokenize(phrase.text);
    const clozeIndices = phrase.clozeIndices || [];
    const blankedSet = new Set(clozeIndices);
    const allExpressionMatches = findExpressionMatches(tokens, wordDict);
    const confirmedMatches = allExpressionMatches.filter((m) => (phrase.expressions ?? []).includes(m.key));
    const expressionIndex = buildExpressionIndex(confirmedMatches);

    const [values, setValues] = useState(() => clozeIndices.map(() => ''));
    const [phase, setPhase] = useState('answering');
    const [firstResults, setFirstResults] = useState(null);
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
        onFirstAction?.();
        const results = checkClozeAnswers(tokens, clozeIndices, values);
        const allCorrect = results.every((r) => r.isCorrect);

        if (allCorrect) {
            onSubmitted(results);
            return;
        }

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
        ? (() => {
            const seen = new Set();
            const hints = [];
            clozeIndices.forEach((tokenIndex) => {
                const match = expressionIndex.get(tokenIndex);
                if (match) {
                    if (!seen.has(match.key)) {
                        seen.add(match.key);
                        hints.push([match.entry.definition, match.entry.notes].filter(Boolean).join(' | '));
                    }
                    return;
                }
                const entry = wordDict[tokens[tokenIndex].key];
                if (entry) hints.push([entry.definition, entry.notes].filter(Boolean).join(' | '));
            });
            return hints;
        })()
        : [];


    const renderExpressionIndex = new Map(
        [...expressionIndex].filter(([idx, m]) => !m.tokenIndices.some((i) => blankedSet.has(i)))
    );

    return (
        <div className="flex flex-col gap-3 mx-4">
            <p className="font-voice text-2xl leading-relaxed text-left text-ink">
                {tokens.map((token, i) => {
                    const blankPos = clozeIndices.indexOf(i);
                    if (blankPos !== -1) {
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
                    }

                    if (!token.isWord) return <span key={i}>{token.text}</span>;

                    const match = renderExpressionIndex.get(i);
                    return match ? (
                        <ExpressionSpan key={i} token={token} match={match} allTokens={tokens} onPracticeWord={onPracticeWord} />
                    ) : (
                        <WordSpan key={i} token={token} onPracticeWord={onPracticeWord} />
                    );
                })}
            </p>

            {phase === 'correcting' && (
                <p className="text-sm bg-danger-soft text-danger-soft-text text-left max-w-md">Type the correct word(s) to continue</p>
            )}

            {wordHints.length > 0 && (
                <div className="flex flex-col gap-0.5 text-left max-w-md w-full mt-2">
                    {wordHints.map((hint, i) => <p key={i} className="text-sm text-muted">{hint}</p>)}
                </div>
            )}

            {phrase.showTranslationUpfront && phrase.answer && (
                <p className="text-faint italic text-left w-full">{phrase.answer}</p>
            )}

            {phase === 'answering' ? (
                <button onClick={handleCheck} className="self-center text-sm bg-accent text-white rounded-lg px-4 py-1.5 mt-1 hover:bg-accent-hover">
                    Check
                </button>
            ) : (
                <button
                    onClick={handleContinue}
                    disabled={!allCorrected}
                    className="text-sm bg-accent text-white rounded-lg px-4 py-1.5 mt-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-hover"
                >
                    Continue
                </button>
            )}
        </div>
    );
}