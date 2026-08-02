// // data/phrasesStore.js
// import { loadCollection, saveCollection } from './storage';

// const KEY = 'phrases';

// export function loadPhrases() {
//     return loadCollection(KEY);
// }

// export function savePhrases(phrases) {
//     saveCollection(KEY, phrases);
// }

// export function createPhrase({ text, answer, tags = [], type = 'flip' }) {
//     return {
//         id: crypto.randomUUID(),
//         text,
//         answer,
//         tags,
//         type, // 'flip' (press space to reveal) or 'input' (type the answer)
//         srs: { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
//         createdAt: Date.now(),
//     };
// }

// data/phrasesStore.js
export function createPhrase({ text, answer, tags = [], type = 'flip' }) {
    return {
        id: crypto.randomUUID(),
        text,
        answer,
        tags,
        type,
        srs: { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
        createdAt: Date.now(),
    };
}