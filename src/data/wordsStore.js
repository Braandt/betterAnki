// // data/wordsStore.js
// import { loadCollection, saveCollection } from './storage';

// const KEY = 'words';

// export function loadWords() {
//     return loadCollection(KEY);
// }

// export function saveWords(words) {
//     saveCollection(KEY, words);
// }

// export function createWord({ text, definition, notes = '' }) {
//     return {
//         id: crypto.randomUUID(),
//         text: text.toLowerCase().trim(),
//         definition,
//         notes,
//         createdAt: Date.now(),
//     };
// }

// // Turns array into { [key]: word } for fast lookup by ClickableText
// export function toWordDict(words) {
//     return Object.fromEntries(words.map((w) => [w.text, w]));
// }

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