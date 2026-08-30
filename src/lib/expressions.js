// lib/expressions.js
const MAX_SPAN = 6; // max token distance from first to last word of an expression

// Finds expression dictionary entries (any wordDict key with a space) as
// subsequences within tokens — words can have other words between them
// (e.g. "holde på med" matching "holder du på med"), as long as they appear
// in order within MAX_SPAN tokens of each other.
export function findExpressionMatches(tokens, wordDict) {
    const expressionKeys = Object.keys(wordDict)
        .filter((k) => k.includes(' '))
        .sort((a, b) => b.split(' ').length - a.split(' ').length); // longer/more specific first

    const wordPositions = tokens.map((t, i) => (t.isWord ? i : null)).filter((i) => i !== null);
    const used = new Set();
    const matches = [];

    for (const key of expressionKeys) {
        const parts = key.split(' ');

        for (let start = 0; start < wordPositions.length; start++) {
            const startIdx = wordPositions[start];
            if (used.has(startIdx) || tokens[startIdx].key !== parts[0]) continue;

            const matchedIndices = [startIdx];
            let cursor = start;
            let ok = true;

            for (let p = 1; p < parts.length; p++) {
                let found = -1;
                for (let j = cursor + 1; j < wordPositions.length; j++) {
                    const idx = wordPositions[j];
                    if (idx - startIdx > MAX_SPAN) break;
                    if (used.has(idx)) continue;
                    if (tokens[idx].key === parts[p]) { found = j; break; }
                }
                if (found === -1) { ok = false; break; }
                matchedIndices.push(wordPositions[found]);
                cursor = found;
            }

            if (ok) {
                matchedIndices.forEach((idx) => used.add(idx));
                matches.push({ key, entry: wordDict[key], tokenIndices: matchedIndices });
                break; // one occurrence of this expression per phrase is enough
            }
        }
    }

    return matches;
}

// tokenIndex -> match, for O(1) lookup while rendering
export function buildExpressionIndex(matches) {
    const map = new Map();
    matches.forEach((m) => m.tokenIndices.forEach((idx) => map.set(idx, m)));
    return map;
}