// lib/autoCloze.js
import { tokenize } from './tokenize';
import { diffWords } from './compareAnswer';
import { createPhrase } from '../data/phrasesStore';

function pickRandom(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

// Builds a one-off cloze phrase reinforcing words the person got wrong on a
// production-direction input card. Returns null only if there were zero
// mistakes — with 1-2 wrong words, all of them are blanked; with 3+, two are
// picked at random rather than overwhelming the follow-up card with blanks.
export function buildAutoClozeFromMistake(phrase, userAnswer) {
    const tokens = tokenize(phrase.text);
    const wordTokenIndices = tokens.map((t, i) => (t.isWord ? i : null)).filter((i) => i !== null);

    const diff = diffWords(userAnswer, phrase.text);

    const missingWordPositions = [];
    let wordPos = 0;
    diff.forEach((part) => {
        if (part.type === 'match' || part.type === 'missing') {
            if (part.type === 'missing') missingWordPositions.push(wordPos);
            wordPos++;
        }
    });

    if (missingWordPositions.length < 1) return null;

    const positionsToBlank =
        missingWordPositions.length > 2 ? pickRandom(missingWordPositions, 2) : missingWordPositions;

    const clozeIndices = positionsToBlank
        .map((pos) => wordTokenIndices[pos])
        .filter((i) => i !== undefined)
        .sort((a, b) => a - b); // keep blanks in reading order regardless of random pick order

    if (clozeIndices.length === 0) return null;

    return createPhrase({
        text: phrase.text,
        answer: phrase.answer,
        tags: phrase.tags,
        type: 'cloze',
        clozeIndices,
        context: phrase.context,
        expressions: phrase.expressions,
        showTranslationUpfront: false,
    });
}