// data/phrasesStore.js
export function createPhrase({ text, answer = '', tags = [], type = 'flip', clozeIndices = [] }) {
    return {
        id: crypto.randomUUID(),
        text,
        answer,
        tags,
        type, // 'flip' | 'input' | 'cloze'
        clozeIndices, // token indices (from tokenize) that are blanked, only used when type === 'cloze'
        srs: { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
        createdAt: Date.now(),
    };
}