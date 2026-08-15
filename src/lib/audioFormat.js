// lib/audioFormat.js

// iOS Safari doesn't support webm; it needs mp4. Desktop Chrome/Edge/Android
// support webm. Pick whichever this browser actually supports.
const CANDIDATES = [
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
];

export function getSupportedMimeType() {
    for (const type of CANDIDATES) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return ''; // let the browser pick its own default as a last resort
}

export function extensionForMimeType(mimeType) {
    if (mimeType.includes('mp4')) return 'm4a';
    if (mimeType.includes('ogg')) return 'ogg';
    return 'webm';
}