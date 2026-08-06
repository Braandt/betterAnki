// lib/phraseWords.js
import { tokenize } from './tokenize';

export function phraseContainsWord(phrase, wordKey) {
    return tokenize(phrase.text).some((t) => t.isWord && t.key === wordKey);
}