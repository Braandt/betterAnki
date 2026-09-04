// lib/contexts.js
export function getAllContexts(phrases) {
    const set = new Set(phrases.map((p) => p.context).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
}