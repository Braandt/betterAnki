// data/phrasesStore.js
export function createPhrase({
    id = crypto.randomUUID(),
    text,
    answer = '',
    tags = [],
    type = 'flip',
    clozeIndices = [],
    hasAudio = false,
}) {
    return {
        id,
        text,
        answer,
        tags,
        type,
        clozeIndices,
        hasAudio, // whether an audio/<id>.webm recording exists
        srs: { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
        createdAt: Date.now(),
    };
}