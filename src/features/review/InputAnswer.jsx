// features/review/InputAnswer.jsx
import { useState, useEffect, useRef } from 'react';

export default function InputAnswer({ phraseId, onSubmitted }) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mx-4 mt-2">
            <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Type the answer..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="border-0 border-b-2 border-border-strong bg-transparent text-lg w-full outline-none py-1 text-ink focus:border-accent placeholder:text-faint placeholder:italic"
            />
            <div className="flex justify-center mt-2">
                <button
                    type="submit"
                    disabled={!value.trim()}
                    className="text-sm bg-accent text-white rounded-lg px-4 py-1.5 hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Check
                </button>
            </div>
            <p className="text-xs text-faint text-center">press enter to check</p>
        </form>
    );
}