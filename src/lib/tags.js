// lib/tags.js
export function getAllTags(phrases) {
    const set = new Set();
    phrases.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}