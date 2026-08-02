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
                className="border rounded px-4 py-2 text-lg w-full text-center"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
            />
            <p className="text-sm text-gray-400">press enter to check</p>
        </form>
    );
}