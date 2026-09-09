export default function BottomNav({ view, onChange, dueCount, onCustomStudy }) {
    const tabs = [
        { id: 'today', icon: '☀', label: 'Today' },
        { id: 'review', icon: '🎯', label: 'Review', badge: dueCount > 0 ? dueCount : null },
        { id: 'phrases', icon: '📖', label: 'Phrases' },
        { id: 'words', icon: '🔤', label: 'Words' },
        { id: 'more', icon: '⋯', label: 'More' },
    ];

    function handleTap(id) {
        if (id === 'more') onCustomStudy(); // simplest entry point for Custom Study + Settings on mobile for now
        else onChange(id);
    }

    return (
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-border flex justify-around"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => handleTap(tab.id)}
                    className={`relative flex flex-col items-center gap-0.5 py-2 px-3 text-xs ${view === tab.id ? 'text-accent' : 'text-muted'
                        }`}
                >
                    <span className="text-lg leading-none">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.badge && (
                        <span className="absolute top-0.5 right-1 bg-accent text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                            {tab.badge}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}