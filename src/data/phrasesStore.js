// data/phrasesStore.js
export function createPhrase({
    id = crypto.randomUUID(),
    text,
    answer = '',
    tags = [],
    type = 'flip',
    clozeIndices = [],
    hasAudio = false,
    showTranslationUpfront = true, // cloze-only: show the translation above the blank before answering
}) {
    return {
        id,
        text,
        answer,
        tags,
        type,
        clozeIndices,
        hasAudio,
        showTranslationUpfront,
        srs: { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
        createdAt: Date.now(),
    };
}