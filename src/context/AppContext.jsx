// context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { phraseFromDb, phraseToDb, wordFromDb, wordToDb } from '../lib/mappers';

const AppContext = createContext(null);

export function AppProvider({ children }) {
    const [session, setSession] = useState(undefined); // undefined = checking, null = logged out
    const [words, setWords] = useState([]);
    const [phrases, setPhrases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session));
        const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session) return;
        (async () => {
            setLoading(true);
            const [{ data: w }, { data: p }] = await Promise.all([
                supabase.from('words').select('*').order('created_at'),
                supabase.from('phrases').select('*').order('created_at'),
            ]);
            setWords((w || []).map(wordFromDb));
            setPhrases((p || []).map(phraseFromDb));
            setLoading(false);
        })();
    }, [session]);

    async function addWord({ text, definition, notes = '' }) {
        const { data, error } = await supabase
            .from('words')
            .insert(wordToDb({ text: text.toLowerCase().trim(), definition, notes }))
            .select()
            .single();
        if (error) throw error;
        const word = wordFromDb(data);
        setWords((prev) => [...prev, word]);
        return word;
    }

    async function updateWord(id, updates) {
        const current = words.find((w) => w.id === id);
        const merged = { ...current, ...updates };
        const { error } = await supabase.from('words').update(wordToDb(merged)).eq('id', id);
        if (error) throw error;
        setWords((prev) => prev.map((w) => (w.id === id ? merged : w)));
    }

    async function deleteWord(id) {
        const { error } = await supabase.from('words').delete().eq('id', id);
        if (error) throw error;
        setWords((prev) => prev.filter((w) => w.id !== id));
    }

    async function addPhrase({ id, text, answer = '', tags = [], type = 'flip', clozeIndices = [], hasAudio = false }) {
        const base = {
            text,
            answer,
            tags,
            type,
            clozeIndices,
            hasAudio,
            srs: { interval: 0, ease: 2.5, due: Date.now(), reps: 0 },
        };
        const insertPayload = { ...phraseToDb(base), ...(id ? { id } : {}) };
        const { data, error } = await supabase.from('phrases').insert(insertPayload).select().single();
        if (error) throw error;
        const phrase = phraseFromDb(data);
        setPhrases((prev) => [...prev, phrase]);
        return phrase;
    }

    async function updatePhrase(id, updates) {
        const current = phrases.find((p) => p.id === id);
        const merged = { ...current, ...updates };
        const { error } = await supabase.from('phrases').update(phraseToDb(merged)).eq('id', id);
        if (error) throw error;
        setPhrases((prev) => prev.map((p) => (p.id === id ? merged : p)));
    }

    async function deletePhrase(id) {
        await supabase.storage.from('audio').remove([`${id}.webm`]); // ignore if it doesn't exist
        const { error } = await supabase.from('phrases').delete().eq('id', id);
        if (error) throw error;
        setPhrases((prev) => prev.filter((p) => p.id !== id));
    }

    async function saveAudio(phraseId, blob) {
        const { error } = await supabase.storage
            .from('audio')
            .upload(`${phraseId}.webm`, blob, { upsert: true, contentType: 'audio/webm' });
        if (error) throw error;
    }

    async function removeAudio(phraseId) {
        await supabase.storage.from('audio').remove([`${phraseId}.webm`]);
    }

    async function getAudioUrl(phraseId) {
        const { data, error } = await supabase.storage
            .from('audio')
            .createSignedUrl(`${phraseId}.webm`, 60 * 60); // 1 hour link
        if (error) return null;
        return data.signedUrl;
    }

    function importWords(newWords) {
        // Bulk replace: wipe and re-insert — simplest for occasional manual imports
        (async () => {
            await supabase.from('words').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { data } = await supabase.from('words').insert(newWords.map(wordToDb)).select();
            setWords((data || []).map(wordFromDb));
        })();
    }

    function importPhrases(newPhrases) {
        (async () => {
            await supabase.from('phrases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            const { data } = await supabase.from('phrases').insert(newPhrases.map(phraseToDb)).select();
            setPhrases((data || []).map(phraseFromDb));
        })();
    }

    const value = {
        session,
        loading,
        words,
        phrases,
        wordDict: Object.fromEntries(words.map((w) => [w.text, w])),
        addWord,
        updateWord,
        deleteWord,
        addPhrase,
        updatePhrase,
        deletePhrase,
        importWords,
        importPhrases,
        saveAudio,
        removeAudio,
        getAudioUrl,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used inside AppProvider');
    return ctx;
}