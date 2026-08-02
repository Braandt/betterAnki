import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function AddPhraseForm() {
    const { addPhrase } = useApp();
    const [text, setText] = useState('');
    const [answer, setAnswer] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (!text.trim() || !answer.trim()) return;
        addPhrase({ text: text.trim(), answer: answer.trim() });
        setText('');
        setAnswer('');
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 w-80">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Phrase (e.g. Ich habe einen Hund.)"
                className="border rounded px-3 py-2"
            />
            <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer / translation"
                className="border rounded px-3 py-2"
            />
            <button type="submit" className="bg-blue-600 text-white rounded px-3 py-2">
                Add phrase
            </button>
        </form>
    );
}