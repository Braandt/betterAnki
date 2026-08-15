// lib/mappers.js

export function phraseFromDb(row) {
    return {
        id: row.id,
        text: row.text,
        answer: row.answer,
        tags: row.tags || [],
        type: row.type,
        clozeIndices: row.cloze_indices || [],
        hasAudio: row.has_audio,
        showTranslationUpfront: row.show_translation_upfront || true,
        srs: row.srs,
        audioExt: row.audio_ext || 'webm',
        createdAt: new Date(row.created_at).getTime(),
    };
}

export function phraseToDb(phrase) {
    return {
        text: phrase.text,
        answer: phrase.answer,
        tags: phrase.tags,
        type: phrase.type,
        cloze_indices: phrase.clozeIndices,
        has_audio: phrase.hasAudio,
        show_translation_upfront: phrase.showTranslationUpfront,
        srs: phrase.srs,
        audio_ext: phrase.audioExt,
    };
}

export function wordFromDb(row) {
    return {
        id: row.id,
        text: row.text,
        definition: row.definition,
        notes: row.notes,
        mastery: row.mastery || { score: 50, correct: 0, wrong: 0 },
        createdAt: new Date(row.created_at).getTime(),
    };
}

export function wordToDb(word) {
    return {
        text: word.text,
        definition: word.definition,
        notes: word.notes,
        mastery: word.mastery,
    };
}