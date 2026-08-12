const CORRECT_DELTA = 8;
const WRONG_DELTA = -12;
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours — repeated testing within this window doesn't move the score further

export function adjustMastery(mastery, isCorrect, now = Date.now()) {
    const current = mastery ?? { score: 50, correct: 0, wrong: 0, lastUpdated: 0 };

    // Still within cooldown since the last real update — this repetition is
    // useful for learning, but shouldn't count as a second data point toward mastery.
    if (now - (current.lastUpdated || 0) < COOLDOWN_MS) {
        return current;
    }

    const delta = isCorrect ? CORRECT_DELTA : WRONG_DELTA;
    return {
        score: Math.max(0, Math.min(100, current.score + delta)),
        correct: current.correct + (isCorrect ? 1 : 0),
        wrong: current.wrong + (isCorrect ? 0 : 1),
        lastUpdated: now,
    };
}

const WEAK_THRESHOLD = 40;

export function getWeakWords(words) {
    return words.filter((w) => (w.mastery?.score ?? 50) < WEAK_THRESHOLD).map((w) => w.text);
}

export function masteryLabel(score) {
    if (score < 40) return { label: 'Weak', color: 'red' };
    if (score < 70) return { label: 'Learning', color: 'yellow' };
    return { label: 'Strong', color: 'green' };
}