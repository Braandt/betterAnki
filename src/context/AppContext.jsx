// context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { createWord, toWordDict } from '../data/wordsStore';
import { createPhrase } from '../data/phrasesStore';
import {
    loadDirHandle,
    verifyPermission,
    pickDirectory,
    readJsonFile,
    writeJsonFile,
    isFileSystemAccessSupported,
} from '../lib/fileSystemStore';

const WORDS_FILE = 'words.json';
const PHRASES_FILE = 'phrases.json';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [dirHandle, setDirHandle] = useState(null);
    // 'checking' | 'unsupported' | 'disconnected' | 'connected'
    const [status, setStatus] = useState('checking');
    const [words, setWords] = useState([]);
    const [phrases, setPhrases] = useState([]);

    // On load: try to silently reconnect to a previously granted folder
    useEffect(() => {
        if (!isFileSystemAccessSupported()) {
            setStatus('unsupported');
            return;
        }
        (async () => {
            const saved = await loadDirHandle();
            if (saved && (await verifyPermission(saved, 'readwrite'))) {
                await loadFromDir(saved);
            } else {
                setStatus('disconnected');
            }
        })();
    }, []);

    async function loadFromDir(handle) {
        const [w, p] = await Promise.all([
            readJsonFile(handle, WORDS_FILE),
            readJsonFile(handle, PHRASES_FILE),
        ]);
        setWords(w);
        setPhrases(p);
        setDirHandle(handle);
        setStatus('connected');
    }

    // Must be called from a user gesture (button click) — browser requirement
    async function connectFolder() {
        const handle = await pickDirectory();
        await loadFromDir(handle);
    }

    function persistWords(next) {
        setWords(next);
        if (dirHandle) writeJsonFile(dirHandle, WORDS_FILE, next);
    }

    function persistPhrases(next) {
        setPhrases(next);
        if (dirHandle) writeJsonFile(dirHandle, PHRASES_FILE, next);
    }

    function addWord({ text, definition, notes }) {
        const word = createWord({ text, definition, notes });
        persistWords([...words, word]);
        return word;
    }

    function updateWord(id, updates) {
        persistWords(words.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    }

    function deleteWord(id) {
        persistWords(words.filter((w) => w.id !== id));
    }

    function addPhrase({ text, answer, tags, type }) {
        const phrase = createPhrase({ text, answer, tags, type });
        persistPhrases([...phrases, phrase]);
        return phrase;
    }

    function updatePhrase(id, updates) {
        persistPhrases(phrases.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    }

    function deletePhrase(id) {
        persistPhrases(phrases.filter((p) => p.id !== id));
    }

    function importWords(newWords) {
        persistWords(newWords);
    }

    function importPhrases(newPhrases) {
        persistPhrases(newPhrases);
    }

    function addPhrase({ text, answer, tags, type, clozeIndices }) {
        const phrase = createPhrase({ text, answer, tags, type, clozeIndices });
        setPhrases((prev) => [...prev, phrase]);
        return phrase;
    }

    const value = {
        status,
        connectFolder,
        words,
        phrases,
        wordDict: toWordDict(words),
        addWord,
        updateWord,
        deleteWord,
        addPhrase,
        updatePhrase,
        deletePhrase,
        importWords,
        importPhrases,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used inside AppProvider');
    return ctx;
}