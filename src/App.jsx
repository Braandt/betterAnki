// App.jsx
import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import ReviewScreen from './features/review/ReviewScreen';
import PhraseList from './features/phrases/PhraseList';
import WordList from './features/words/WordList';
import Login from './components/Login';
import PhraseModal from './features/phrases/PhraseModal';
import CustomStudyModal from './features/study/CustomStudyModal';
import { isDue } from './lib/srs';
import { getWeakWords } from './lib/wordMastery';
import { tokenize } from './lib/tokenize';

function TodayScreen({ phrases, words, onStartReview }) {
    const dueCount = phrases.filter(isDue).length;
    const newCount = phrases.filter((p) => (p.srs?.reps ?? 0) === 0).length;
    const weakCount = getWeakWords(words).length;
    const estimatedMin = Math.max(1, Math.round((dueCount * 20) / 60));

    const recentlyLearned = phrases
        .filter((p) => (p.srs?.reps ?? 0) > 0)
        .sort((a, b) => (b.srs?.due ?? 0) - (a.srs?.due ?? 0))
        .slice(0, 3);

    return (
        <div className="max-w-xl mx-auto pt-10 px-6">
            <p className="font-voice text-2xl text-ink">Good to see you</p>
            <p className="text-sm text-muted mb-6">Your Norwegian is waiting</p>

            <div className="bg-surface border border-border rounded-xl px-6 py-5 flex items-center justify-between mb-6">
                <div>
                    <p className="text-2xl font-medium text-ink">{dueCount} card{dueCount === 1 ? '' : 's'} due</p>
                    <p className="text-xs text-muted mt-1">Estimated time: {estimatedMin} min</p>
                </div>
                <button
                    onClick={onStartReview}
                    disabled={dueCount === 0}
                    className="bg-accent text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-hover disabled:opacity-40"
                >
                    Start review →
                </button>
            </div>

            <p className="text-xs text-faint mb-2">Today's focus</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-accent-soft rounded-xl px-4 py-3">
                    <p className="text-xl font-medium text-accent-soft-text">{newCount}</p>
                    <p className="text-xs text-accent-soft-text">New phrases</p>
                </div>
                <div className="bg-danger-soft rounded-xl px-4 py-3">
                    <p className="text-xl font-medium text-danger-soft-text">{weakCount}</p>
                    <p className="text-xs text-danger-soft-text">Difficult words</p>
                </div>
            </div>

            {recentlyLearned.length > 0 && (
                <>
                    <p className="text-xs text-faint mb-2">Recently learned</p>
                    <div className="flex flex-col gap-px bg-border rounded-xl overflow-hidden border border-border">
                        {recentlyLearned.map((p) => (
                            <div key={p.id} className="bg-surface px-4 py-3">
                                <p className="font-voice text-sm text-ink">{p.text}</p>
                                {p.answer && <p className="text-xs text-muted mt-0.5">{p.answer}</p>}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function Home() {
    const { phrases, words, updatePhrase, logReview } = useApp();
    const [view, setView] = useState('today');
    const [showAddPhrase, setShowAddPhrase] = useState(false);
    const [showCustomStudy, setShowCustomStudy] = useState(false);
    const [studyFilter, setStudyFilter] = useState(null);
    const [prefillWords, setPrefillWords] = useState([]);
    const [focusMode, setFocusMode] = useState(false);

    const dueCount = phrases.filter(isDue).length;

    function handleViewChange(newView) {
        if (newView !== 'review') setFocusMode(false);
        setView(newView);
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
        <div className="flex min-h-screen bg-paper">
            <Sidebar
                view={view}
                onChange={handleViewChange}
                dueCount={dueCount}
                onCustomStudy={() => { setPrefillWords([]); setShowCustomStudy(true); }}
                collapsed={focusMode}
                onExpand={() => setFocusMode(false)}
            />

            <div className="flex-1 relative">
                {view === 'today' && <TodayScreen phrases={phrases} words={words} onStartReview={() => setView('review')} />}

                {view === 'review' &&
                    (phrases.length === 0 ? (
                        <div className="min-h-screen flex items-center justify-center text-muted">
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
                            onGrade={(phrase, newSrs, grade) => { updatePhrase(phrase.id, { srs: newSrs }); logReview(phrase.id, grade); }}
                            onPracticeWord={(key) => { setPrefillWords([key]); setShowCustomStudy(true); }}
                            onFirstAction={() => setFocusMode(true)}
                        />
                    ))}

                {view === 'phrases' && (
                    <PhraseList
                        onPractice={(phrase) => {
                            const words = tokenize(phrase.text).filter((t) => t.isWord).map((t) => t.key);
                            setPrefillWords(words);
                            setShowCustomStudy(true);
                        }}
                    />
                )}
                {view === 'words' && (
                    <WordList onPractice={(key) => { setPrefillWords([key]); setShowCustomStudy(true); }} />
                )}
                {view === 'settings' && <div className="p-10 text-muted text-sm">Settings — nothing here yet.</div>}

                <button
                    onClick={() => setShowAddPhrase(true)}
                    className="fixed bottom-6 right-6 bg-accent text-white rounded-full w-14 h-14 text-2xl shadow-lg hover:bg-accent-hover"
                    title="Add phrase (a)"
                >
                    +
                </button>

                <PhraseModal open={showAddPhrase} onClose={() => setShowAddPhrase(false)} />
                <CustomStudyModal
                    open={showCustomStudy}
                    initialWords={prefillWords}
                    onClose={() => setShowCustomStudy(false)}
                    onStart={(filter) => { setStudyFilter(filter); setView('review'); }}
                />
            </div>
        </div>
    );
}

function Root() {
    const { session } = useApp();
    if (session === undefined) return <div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>;
    return session ? <Home /> : <Login />;
}

export default function App() {
    return (
        <AppProvider>
            <Root />
        </AppProvider>
    );
}
