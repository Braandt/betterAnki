// lib/cloze.js

// Compares what the user typed into each blank against the correct word at
// that token position. tokens = full tokenize(text) output, clozeIndices =
// which token indices are blanks, userAnswers = array aligned to clozeIndices.
export function checkClozeAnswers(tokens, clozeIndices, userAnswers) {
    return clozeIndices.map((tokenIndex, i) => {
        const correctText = tokens[tokenIndex].text;
        const given = (userAnswers[i] || '').trim();
        return {
            tokenIndex,
            correctText,
            given,
            isCorrect: given.toLowerCase() === correctText.toLowerCase(),
        };
    });
}