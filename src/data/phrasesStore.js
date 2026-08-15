// data/phrasesStore.js
export function createPhrase({
    id = crypto.randomUUID(),
    text,
    answer = '',
    tags = [],
    type = 'flip',
    clozeIndices = [],
    hasAudio = false,
    audioExt = 'webm',
    showTranslationUpfront = true,
}) {
    return {
        id, text, answer, tags, type, clozeIndices, hasAudio, audioExt, showTranslationUpfront,
        srs: { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
        createdAt: Date.now(),
    };
}