// App.jsx
import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import NavBar from './components/NavBar';
import ReviewScreen from './features/review/ReviewScreen';
import PhraseList from './features/phrases/PhraseList';
import WordList from './features/words/WordList';
import PhraseModal from './features/phrases/PhraseModal';
import CustomStudyModal from './features/study/CustomStudyModal';
import Login from './components/Login';

function Home() {
    const { phrases, updatePhrase } = useApp();
    const [view, setView] = useState('review');
    const [showAddPhrase, setShowAddPhrase] = useState(false);
    const [showCustomStudy, setShowCustomStudy] = useState(false);
    const [studyFilter, setStudyFilter] = useState(null); // null = normal review, else { tags, words, includeAll }
    const [prefillWords, setPrefillWords] = useState([]); // used when jumping in from "practice this word"

    function startWordPractice(wordKey) {
        setPrefillWords([wordKey]);
        setShowCustomStudy(true);
    }

    useEffect(() => {
        function handleKeyDown(e) {
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }
            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                setShowAddPhrase(true);
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="relative min-h-screen">
            <NavBar view={view} onChange={setView} />

            <button
                onClick={() => { setPrefillWords([]); setShowCustomStudy(true); }}
                className="fixed top-16 right-4 z-20 text-sm bg-white border rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-50 shadow-sm"
            >
                Custom study
            </button>
            {view === 'review' &&
                (phrases.length === 0 ? (
                    <div className="min-h-screen flex items-center justify-center text-gray-500">
                        No phrases yet — add one to get started.
                    </div>
                ) : (
                    <ReviewScreen
                        key={studyFilter ? JSON.stringify(studyFilter) : 'default'}
                        phrases={phrases}
                        filterTags={studyFilter?.tags ?? []}
                        filterWords={studyFilter?.words ?? []}
                        includeAll={studyFilter?.includeAll ?? false}
                        onExit={studyFilter ? () => setStudyFilter(null) : undefined}
                        onGrade={(phrase, newSrs) => updatePhrase(phrase.id, { srs: newSrs })}
                        onPracticeWord={startWordPractice}
                    />
                ))}

            {view === 'phrases' && <PhraseList />}
            {view === 'words' && <WordList />}

            <button
                onClick={() => setShowAddPhrase(true)}
                className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 text-2xl shadow-lg hover:bg-blue-700"
                title="Add phrase (a)"
            >
                +
            </button>

            <PhraseModal open={showAddPhrase} onClose={() => setShowAddPhrase(false)} />

            <CustomStudyModal
                open={showCustomStudy}
                initialWords={prefillWords}
                onClose={() => setShowCustomStudy(false)}
                onStart={(filter) => {
                    setStudyFilter(filter);
                    setView('review');
                }}
            />
        </div>
    );
}

function Root() {
    const { session } = useApp();
    if (session === undefined) {
        return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    }
    return session ? <Home /> : <Login />;
}

export default function App() {
    return (
        <AppProvider>
            <Root />
        </AppProvider>
    );
}