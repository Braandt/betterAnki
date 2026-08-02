// components/ConnectFolder.jsx
import { useApp } from '../context/AppContext';

export default function ConnectFolder() {
    const { status, connectFolder } = useApp();

    if (status === 'checking') {
        return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
    }

    if (status === 'unsupported') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <p className="text-center text-gray-500 max-w-sm">
                    This app needs a Chromium browser (Chrome or Edge) to save files to your computer.
                    Please open it there.
                </p>
            </div>
        );
    }

    // disconnected
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
            <p className="text-gray-500 text-center max-w-sm">
                Choose a folder on your computer where words.json and phrases.json will be saved.
            </p>
            <button
                onClick={connectFolder}
                className="bg-blue-600 text-white rounded px-6 py-2.5 font-medium hover:bg-blue-700"
            >
                Choose folder
            </button>
        </div>
    );
}