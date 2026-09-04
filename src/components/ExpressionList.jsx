// components/ExpressionList.jsx
export default function ExpressionList({ expressions }) {
    if (!expressions || expressions.length === 0) return null;

    return (
        <div className="mt-4 flex flex-col gap-0.5 bg-paper p-2 rounded-sm ">
            <p className="text-xs text-faint">Expressions:</p>
            {expressions.map(({ key, entry }) => (
                <p key={key} className="text-sm text-muted">
                    <span className="text-ink font-medium [word-spacing:3px]">{key}</span> — {entry.definition}
                </p>
            ))}
        </div>
    );
}