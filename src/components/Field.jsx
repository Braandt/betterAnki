// components/Field.jsx
export default function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs text-faint">{label}</label>
            {children}
        </div>
    );
}