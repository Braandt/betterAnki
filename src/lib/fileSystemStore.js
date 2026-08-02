// lib/fileSystemStore.js

const DB_NAME = 'anki-better-fs';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'rootDir';

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// Remembers which folder you picked, so we can ask to reconnect on next load
// instead of losing the reference entirely.
async function saveDirHandle(handle) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function loadDirHandle() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

// Browsers require re-confirming permission on each session for security —
// this checks silently first, only prompting if truly needed.
async function verifyPermission(handle, mode = 'readwrite') {
    const opts = { mode };
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if ((await handle.requestPermission(opts)) === 'granted') return true;
    return false;
}

async function pickDirectory() {
    const handle = await window.showDirectoryPicker();
    await saveDirHandle(handle);
    return handle;
}

async function getFileHandle(dirHandle, name, create = true) {
    return dirHandle.getFileHandle(name, { create });
}

async function readJsonFile(dirHandle, name) {
    try {
        const fileHandle = await getFileHandle(dirHandle, name, false);
        const file = await fileHandle.getFile();
        const text = await file.text();
        return text ? JSON.parse(text) : [];
    } catch (err) {
        if (err.name === 'NotFoundError') return []; // file doesn't exist yet — start empty
        throw err;
    }
}

async function writeJsonFile(dirHandle, name, data) {
    const fileHandle = await getFileHandle(dirHandle, name, true);
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
}

function isFileSystemAccessSupported() {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export {
    loadDirHandle,
    verifyPermission,
    pickDirectory,
    readJsonFile,
    writeJsonFile,
    isFileSystemAccessSupported,
};