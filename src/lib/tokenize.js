// lib/tokenize.js

// Splits "Ich habe einen Hund." into tokens, preserving whitespace/punctuation
// so we can re-render the exact original string with clickable word spans.
export function tokenize(text) {
    // Matches runs of word characters (including accented letters) as one group,
    // everything else (spaces, punctuation) as separate literal tokens.
    const parts = text.match(/[\p{L}\p{N}']+|[^\p{L}\p{N}']+/gu) || [];

    return parts.map((part) => ({
        text: part,
        isWord: /[\p{L}\p{N}]/u.test(part),
        key: part.toLowerCase().trim(),
    }));
}