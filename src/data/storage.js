// // data/storage.js

// const PREFIX = 'anki-better:';

// export function loadCollection(key) {
//     try {
//         const raw = localStorage.getItem(PREFIX + key);
//         return raw ? JSON.parse(raw) : [];
//     } catch {
//         return [];
//     }
// }

// export function saveCollection(key, items) {
//     localStorage.setItem(PREFIX + key, JSON.stringify(items));
// }