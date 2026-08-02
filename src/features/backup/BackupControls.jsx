// features/backup/BackupControls.jsx
import { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { exportWords, exportPhrases, exportAll, readJsonFile } from '../../data/backup';

export default function BackupControls() {
    const { words, phrases, importWords, importPhrases } = useApp();
    const wordsInputRef = useRef(null);
    const phrasesInputRef = useRef(null);

    async function handleImportWords(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await readJsonFile(file);
            importWords(data);
        } catch (err) {
            alert(err.message);
        } finally {
            e.target.value = '';
        }
    }

    async function handleImportPhrases(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const data = await readJsonFile(file);
            importPhrases(data);
        } catch (err) {
            alert(err.message);
        } finally {
            e.target.value = '';
        }
    }

    return (
        <div className="flex flex-wrap gap-2 text-sm items-center">
            <button
                onClick={() => exportAll(words, phrases)}
                className="px-3 py-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
            >
                Export all
            </button>

            <span className="w-px h-5 bg-gray-300 mx-1" />

            <button onClick={() => exportWords(words)} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">
                Export words
            </button>
            <button onClick={() => wordsInputRef.current.click()} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">
                Import words
            </button>
            <input ref={wordsInputRef} type="file" accept="application/json" onChange={handleImportWords} className="hidden" />

            <button onClick={() => exportPhrases(phrases)} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">
                Export phrases
            </button>
            <button onClick={() => phrasesInputRef.current.click()} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">
                Import phrases
            </button>
            <input ref={phrasesInputRef} type="file" accept="application/json" onChange={handleImportPhrases} className="hidden" />
        </div>
    );
}