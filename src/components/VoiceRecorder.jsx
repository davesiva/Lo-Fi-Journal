import { useState, useRef, useEffect } from 'react';
import { set, get } from 'idb-keyval';
import { generateAudioTitle } from '../services/ai';
import { Mic, Square, Play, Trash2, Save, ArrowLeft } from 'lucide-react';
import './VoiceRecorder.css';

export default function VoiceRecorder({ onBack, theme }) {
    const [state, setState] = useState('idle'); // idle, recording, review
    const [audioURL, setAudioURL] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                setState('review');
            };

            mediaRecorderRef.current.start();
            setState('recording');

            // Start timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && state === 'recording') {
            mediaRecorderRef.current.stop();
            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            clearInterval(timerRef.current);
        }
    };

    const discardRecording = () => {
        setAudioURL(null);
        setState('idle');
        setRecordingTime(0);
    };

    const saveRecording = async () => {
        if (!audioURL) return;

        try {
            // Fetch blob from URL
            const response = await fetch(audioURL);
            const blob = await response.blob();

            // Generate key (YYYY-MM-DD-HH-mm-ss) for uniqueness
            const timestamp = new Date().toISOString();
            const keyDesc = timestamp.replace(/[:.]/g, '-');
            const key = `voice-${keyDesc}`;

            // Generate AI Title
            let title = "voice note";
            try {
                title = await generateAudioTitle(blob);
            } catch (ignore) { }

            // Save as object
            const voiceEntry = {
                type: 'voice',
                audio: blob,
                summary: title || "voice note",
                createdAt: timestamp
            };

            await set(key, voiceEntry);
            alert(`Saved: "${voiceEntry.summary}"`);
            onBack();
        } catch (err) {
            console.error("Save failed", err);
            alert("Failed to save recording.");
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`voice-container ${theme === 'modern' ? 'modern-voice' : ''}`}>
            <button className="btn-back-voice" onClick={onBack}>
                <ArrowLeft size={18} /> Back
            </button>

            {theme === 'modern' ? (
                // Modern UI
                <div className="modern-recorder">
                    <div className="modern-time-display">{formatTime(recordingTime)}</div>

                    {state === 'recording' && (
                        <div className="audio-waves">
                            <div className="wave"></div>
                            <div className="wave"></div>
                            <div className="wave"></div>
                            <div className="wave"></div>
                            <div className="wave"></div>
                        </div>
                    )}

                    <div className="modern-controls">
                        {state === 'idle' && (
                            <button className="btn-modern-record" onClick={startRecording}>
                                <div className="record-dot"></div>
                            </button>
                        )}

                        {state === 'recording' && (
                            <button className="btn-modern-stop" onClick={stopRecording}>
                                <Square size={24} fill="currentColor" />
                            </button>
                        )}

                        {state === 'review' && (
                            <div className="modern-review-controls">
                                <audio src={audioURL} controls className="audio-player-modern" />
                                <div className="modern-action-buttons">
                                    <button className="btn-modern-discard" onClick={discardRecording}>
                                        <Trash2 size={20} />
                                    </button>
                                    <button className="btn-modern-save" onClick={saveRecording}>
                                        Save Recording
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="modern-instruction">
                        {state === 'idle' ? 'Tap to record' :
                            state === 'recording' ? 'Recording...' : 'Review'}
                    </p>
                </div>
            ) : (
                // Classic Cassette UI
                <>
                    <div className="recorder-display">
                        <div className="tape-window">
                            <div className={`spools ${state === 'recording' ? 'spinning' : ''}`}>
                                <div className="spool left"></div>
                                <div className="spool right"></div>
                            </div>
                        </div>
                        <div className="time-display">{formatTime(recordingTime)}</div>
                        {state === 'recording' && <div className="rec-indicator">REC</div>}
                    </div>

                    <div className="controls">
                        {state === 'idle' && (
                            <button className="btn-record" onClick={startRecording}>
                                <Mic size={32} />
                            </button>
                        )}

                        {state === 'recording' && (
                            <button className="btn-stop" onClick={stopRecording}>
                                <Square size={32} fill="currentColor" />
                            </button>
                        )}

                        {state === 'review' && (
                            <div className="review-controls">
                                <audio src={audioURL} controls className="audio-player" />
                                <div className="action-buttons">
                                    <button className="btn-discard" onClick={discardRecording} title="Discard">
                                        <Trash2 size={24} />
                                    </button>
                                    <button className="btn-save-voice" onClick={saveRecording} title="Save Tape">
                                        <Save size={24} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="instruction-text">
                        {state === 'idle' ? 'Tap mic to record.' :
                            state === 'recording' ? 'Recording...' :
                                'Review your tape.'}
                    </p>
                </>
            )}
        </div>
    );
}
