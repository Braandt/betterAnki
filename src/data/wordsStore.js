// data/wordsStore.js
export function createWord({ text, definition, notes = '', mastery }) {
    return {
        id: crypto.randomUUID(),
        text: text.toLowerCase().trim(),
        definition,
        notes,
        mastery: mastery ?? { score: 50, correct: 0, wrong: 0 },
        createdAt: Date.now(),
    };
}

export function toWordDict(words) {
    return Object.fromEntries(words.map((w) => [w.text, w]));
}