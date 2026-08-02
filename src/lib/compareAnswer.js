// lib/compareAnswer.js

function normalize(str) {
    return str.trim().replace(/\s+/g, ' ');
}

function wordsOf(str) {
    return normalize(str).split(' ').filter(Boolean);
}

// Word-level diff between what the user typed and the correct answer.
// Returns a sequence of { type: 'match' | 'wrong' | 'missing', text }
// - match: word typed correctly
// - wrong: word typed but incorrect (shown struck through)
// - missing: word that should've been typed but wasn't (shown as what was expected)
export function diffWords(userAnswer, correctAnswer) {
    const a = wordsOf(userAnswer);
    const b = wordsOf(correctAnswer);

    // Standard LCS table, case-insensitive match
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) {
        for (let j = b.length - 1; j >= 0; j--) {
            dp[i][j] =
                a[i].toLowerCase() === b[j].toLowerCase()
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }

    const result = [];
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
        if (a[i].toLowerCase() === b[j].toLowerCase()) {
            result.push({ type: 'match', text: b[j] });
            i++; j++;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            result.push({ type: 'wrong', text: a[i] });
            i++;
        } else {
            result.push({ type: 'missing', text: b[j] });
            j++;
        }
    }
    while (i < a.length) { result.push({ type: 'wrong', text: a[i] }); i++; }
    while (j < b.length) { result.push({ type: 'missing', text: b[j] }); j++; }

    return result;
}

export function isExactMatch(userAnswer, correctAnswer) {
    return normalize(userAnswer).toLowerCase() === normalize(correctAnswer).toLowerCase();
}