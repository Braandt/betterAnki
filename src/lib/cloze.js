// lib/cloze.js
export function checkClozeAnswers(tokens, clozeIndices, userAnswers) {
    return clozeIndices.map((tokenIndex, i) => {
        const correctText = tokens[tokenIndex].text;
        const given = (userAnswers[i] || '').trim();
        return {
            tokenIndex,
            key: tokens[tokenIndex].key, // dictionary lookup key for this blanked word
            correctText,
            given,
            isCorrect: given.toLowerCase() === correctText.toLowerCase(),
        };
    });
}