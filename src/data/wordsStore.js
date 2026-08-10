// data/wordsStore.js
export function createWord({ text, definition, notes = '' }) {
    return {
        id: crypto.randomUUID(),
        text: text.toLowerCase().trim(),
        definition,
        notes,
        createdAt: Date.now(),
    };
}

export function toWordDict(words) {
    return Object.fromEntries(words.map((w) => [w.text, w]));
}