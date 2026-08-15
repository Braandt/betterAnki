// components/AudioRecorder.jsx
import { useState, useRef, useEffect } from 'react';
import { getSupportedMimeType } from '../lib/audioFormat';

export default function AudioRecorder({ existingUrl, onChange }) {
    const [recording, setRecording] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(existingUrl || null);
    const [error, setError] = useState(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    useEffect(() => {
        setPreviewUrl(existingUrl || null);
    }, [existingUrl]);

    async function startRecording() {
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('This browser doesn\'t support audio recording. Try Chrome or Safari, and make sure you\'re on HTTPS.');
            return;
        }

        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            setError('No supported audio format found on this device.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType });
            chunksRef.current = [];
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setPreviewUrl(URL.createObjectURL(blob));
                onChange({ type: 'recorded', blob, mimeType });
                stream.getTracks().forEach((t) => t.stop());
            };
            recorder.start();
            mediaRecorderRef.current = recorder;
            setRecording(true);
        } catch (err) {
            // Surface the real reason instead of a generic message — the cause
            // (denied permission, no mic, insecure context) needs different fixes.
            if (err.name === 'NotAllowedError') {
                setError('Microphone access was denied. Check your browser/site permissions.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found on this device.');
            } else if (err.name === 'SecurityError') {
                setError('Recording requires a secure (HTTPS) connection.');
            } else {
                setError(`Recording failed: ${err.message || err.name}`);
            }
        }
    }

    function stopRecording() {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    }

    function removeAudio() {
        setPreviewUrl(null);
        onChange({ type: 'deleted' });
    }

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
                {!recording ? (
                    <button
                        type="button"
                        onClick={startRecording}
                        className="text-sm px-3 py-1.5 rounded border text-gray-600 hover:bg-gray-50"
                    >
                        🎤 {previewUrl ? 'Re-record' : 'Record pronunciation'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={stopRecording}
                        className="text-sm px-3 py-1.5 rounded bg-red-600 text-white animate-pulse"
                    >
                        ⏹ Stop recording
                    </button>
                )}

                {previewUrl && (
                    <>
                        <audio src={previewUrl} controls className="h-8" />
                        <button type="button" onClick={removeAudio} className="text-xs text-red-500">
                            Remove
                        </button>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}