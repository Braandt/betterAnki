// components/Sidebar.jsx
export default function Sidebar({ view, onChange, dueCount, onCustomStudy, collapsed, onExpand }) {
    const item = (id, icon, label) => (
        <button
            onClick={() => onChange(id)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm ${view === id ? 'bg-accent-soft text-accent-soft-text font-medium' : 'text-muted hover:bg-surface-sunken'
                }`}
        >
            <span>{icon}</span>
            <span className="flex-1">{label}</span>
        </button>
    );

    return (
        <>
            <div
                className={`bg-surface border-r border-border shrink-0 min-h-screen overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? 'w-0 border-r-0' : 'w-48'
                    }`}
            >
                <div className="w-48 p-3.5 flex flex-col gap-5 h-full">
                    <div className="text-sm font-medium text-ink px-1">BetterAnki</div>

                    <div className="flex flex-col gap-1">
                        {item('today', '☀', 'Today')}
                        <button
                            onClick={() => onChange('review')}
                            className="flex items-center justify-between px-2.5 py-1.5 pl-9 text-sm text-muted hover:text-ink"
                        >
                            <span>Review</span>
                            {dueCount > 0 && <span className="text-xs text-accent font-medium">{dueCount} due</span>}
                        </button>

                        <div className="text-xs text-faint px-2.5 pt-3 pb-1">Library</div>
                        {item('phrases', '📖', 'Phrases')}
                        {item('words', '🔤', 'Words')}

                        <div className="text-xs text-faint px-2.5 pt-3 pb-1">Practice</div>
                        <button
                            onClick={onCustomStudy}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-sm text-muted hover:bg-surface-sunken"
                        >
                            <span>🎯</span>
                            <span>Custom study</span>
                        </button>
                    </div>

                    <div className="mt-auto">{item('settings', '⚙', 'Settings')}</div>
                </div>
            </div>

            {collapsed && (
                <button
                    onClick={onExpand}
                    className="fixed top-4 left-4 z-30 w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border text-muted hover:text-ink shadow-sm"
                    title="Show menu"
                >
                    ☰
                </button>
            )}
        </>
    );
}