// components/NavBar.jsx
export default function NavBar({ view, onChange }) {
    const tabs = [
        { id: 'review', label: 'Review' },
        { id: 'phrases', label: 'Phrases' },
        { id: 'words', label: 'Words' },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b flex justify-center gap-1 px-4 py-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${view === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    );
}