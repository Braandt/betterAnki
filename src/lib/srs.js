// lib/srs.js

const DAY = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

export const DEFAULT_SRS = { interval: 0, ease: 2.5, due: Date.now(), reps: 0 };

export function isDue(phrase) {
    const srs = phrase.srs ?? DEFAULT_SRS;
    return srs.due <= Date.now();
}

// Given current SRS state and a grade, returns the *next* SRS state.
// 'difficult' = lapse: reset progress, shrink ease slightly, come back soon.
// 'easy'      = success: grow the interval, using the ease factor as a multiplier.
export function schedule(srs, grade) {
    const current = srs ?? DEFAULT_SRS;

    if (grade === 'difficult') {
        return {
            interval: 0,
            ease: Math.max(MIN_EASE, current.ease - 0.2),
            due: Date.now() + 10 * 60 * 1000, // 10 min — come back later this session
            reps: 0,
        };
    }

    // grade === 'easy'
    const ease = current.ease + 0.1;
    let interval;
    if (current.reps === 0) {
        interval = 1; // first success: 1 day
    } else if (current.reps === 1) {
        interval = 4; // second success: 4 days
    } else {
        interval = Math.round(current.interval * ease); // grows from here
    }

    return {
        interval,
        ease,
        due: Date.now() + interval * DAY,
        reps: current.reps + 1,
    };
}