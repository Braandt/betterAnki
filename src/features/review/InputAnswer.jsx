// features/review/InputAnswer.jsx
import { useState, useEffect, useRef } from 'react';
import { diffWords, isExactMatch } from '../../lib/compareAnswer';

export default function InputAnswer({ phraseId, onSubmitted }) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    // Focus the input whenever a new card loads
    useEffect(() => {
        setValue('');
        inputRef.current?.focus();
    }, [phraseId]);

    function handleSubmit(e) {
        e.preventDefault();
        if (!value.trim()) return;
        onSubmitted(value);
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full max-w-md">
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Type the answer..."
                className="border-0 border-b-2 border-border-strong bg-transparent text-center text-lg w-full max-w-xs mx-auto outline-none py-1 text-ink focus:border-accent"
                autoComplete="off" autoCorrect="off" spellCheck="false"
            />
            <p className="text-xs text-faint mt-3">press enter to check</p>
        </form>
    );
}