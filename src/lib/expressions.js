// lib/expressions.js
const MAX_SPAN = 6;

// Finds ALL expression candidates as subsequences, without excluding shared
// words between candidates — words can belong to multiple overlapping
// candidates at once (e.g. "bli" in both "bli med" and "bli ferdig"). The
// person confirms which one(s) actually apply via the phrase editor, so
// showing every possibility here is correct; excluding overlaps would hide
// real candidates before the person even gets to choose.
export function findExpressionMatches(tokens, wordDict) {
    const expressionKeys = Object.keys(wordDict)
        .filter((k) => k.includes(' '))
        .sort((a, b) => b.split(' ').length - a.split(' ').length);

    const wordPositions = tokens.map((t, i) => (t.isWord ? i : null)).filter((i) => i !== null);
    const matches = [];

    for (const key of expressionKeys) {
        const parts = key.split(' ');

        for (let start = 0; start < wordPositions.length; start++) {
            const startIdx = wordPositions[start];
            if (tokens[startIdx].key !== parts[0]) continue;

            const matchedIndices = [startIdx];
            let cursor = start;
            let ok = true;

            for (let p = 1; p < parts.length; p++) {
                let found = -1;
                for (let j = cursor + 1; j < wordPositions.length; j++) {
                    const idx = wordPositions[j];
                    if (idx - startIdx > MAX_SPAN) break;
                    if (tokens[idx].key === parts[p]) { found = j; break; }
                }
                if (found === -1) { ok = false; break; }
                matchedIndices.push(wordPositions[found]);
                cursor = found;
            }

            if (ok) {
                matches.push({ key, entry: wordDict[key], tokenIndices: matchedIndices });
                break; // one occurrence of THIS key is enough; other keys still get their own chance below
            }
        }
    }

    return matches;
}

export function buildExpressionIndex(matches) {
    const map = new Map();
    matches.forEach((m) => m.tokenIndices.forEach((idx) => map.set(idx, m)));
    return map;
}

export function resolveConfirmedExpressions(expressionKeys, wordDict) {
    return (expressionKeys || [])
        .map((key) => ({ key, entry: wordDict[key] }))
        .filter((e) => e.entry);
}