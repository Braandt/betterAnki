// components/TagInput.jsx
import { useState, useMemo } from 'react';

export default function TagInput({ tags, onChange, suggestions = [] }) {
    const [draft, setDraft] = useState('');

    const filteredSuggestions = useMemo(() => {
        const q = draft.toLowerCase().trim();
        if (!q) return [];
        return suggestions
            .filter((s) => s.toLowerCase().includes(q) && !tags.includes(s))
            .slice(0, 5);
    }, [draft, suggestions, tags]);

    function addTag(raw) {
        const value = raw.trim();
        if (!value) return;
        const exists = tags.some((t) => t.toLowerCase() === value.toLowerCase());
        if (!exists) onChange([...tags, value]);
        setDraft('');
    }

    function removeTag(value) {
        onChange(tags.filter((t) => t !== value));
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag(draft);
        } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
            removeTag(tags[tags.length - 1]);
        }
    }

    return (
        <div className="border rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center relative">
            {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-700">
                        ×
                    </button>
                </span>
            ))}
            <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tags.length === 0 ? 'Add tags... (past-tense, question)' : ''}
                className="flex-1 min-w-[100px] outline-none text-sm py-0.5"
            />
            {filteredSuggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-1 w-full bg-white border rounded shadow-lg z-10 text-sm">
                    {filteredSuggestions.map((s) => (
                        <button
                            type="button"
                            key={s}
                            onClick={() => addTag(s)}
                            className="block w-full text-left px-3 py-1.5 hover:bg-gray-100"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}