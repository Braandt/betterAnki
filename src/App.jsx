// App.jsx
import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import ConnectFolder from './components/ConnectFolder';
import NavBar from './components/NavBar';
import ReviewScreen from './features/review/ReviewScreen';
import PhraseList from './features/phrases/PhraseList';
import WordList from './features/words/WordList';
import PhraseModal from './features/phrases/PhraseModal';
import CustomStudyModal from './features/study/CustomStudyModal';

function Home() {
    const { phrases, updatePhrase } = useApp();
    const [view, setView] = useState('review');
    const [showAddPhrase, setShowAddPhrase] = useState(false);
    const [showCustomStudy, setShowCustomStudy] = useState(false);
    const [studyTags, setStudyTags] = useState(null);
    const [studyIncludeAll, setStudyIncludeAll] = useState(false);

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
                onClick={() => setShowCustomStudy(true)}
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
                        key={studyTags ? studyTags.join(',') + studyIncludeAll : 'default'}
                        phrases={phrases}
                        filterTags={studyTags ?? []}
                        includeAll={studyIncludeAll}
                        onExit={studyTags ? () => { setStudyTags(null); setStudyIncludeAll(false); } : undefined}
                        onGrade={(phrase, newSrs) => updatePhrase(phrase.id, { srs: newSrs })}
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
                onClose={() => setShowCustomStudy(false)}
                onStart={({ tags, includeAll }) => {
                    setStudyTags(tags);
                    setStudyIncludeAll(includeAll);
                    setView('review');
                }}
            />
        </div>
    );
}

function Root() {
    const { status } = useApp();
    return status === 'connected' ? <Home /> : <ConnectFolder />;
}

export default function App() {
    return (
        <AppProvider>
            <Root />
        </AppProvider>
    );
}