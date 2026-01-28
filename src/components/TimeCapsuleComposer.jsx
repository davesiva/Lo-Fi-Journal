import { useState } from 'react';
import { set } from 'idb-keyval';
import { ArrowLeft, Send, Sparkles, Wand2, Calendar, Lock } from 'lucide-react';
import './JournalEditor.css'; // Reusing general styles for consistency

const GUIDED_QUESTIONS = [
    "What is your biggest concern right now?",
    "What are you most excited about?",
    "Where do you see yourself when this unlocks?",
    "One piece of advice for your future self:",
    "Who are the most important people in your life right now?"
];

export default function TimeCapsuleComposer({ onBack }) {
    const [mode, setMode] = useState('freeform'); // 'freeform' | 'guided'

    // Freeform State
    const [content, setContent] = useState('');

    // Guided State
    const [answers, setAnswers] = useState({});

    // Scheduling State
    const [unlockDate, setUnlockDate] = useState('');
    const [scheduleType, setScheduleType] = useState('random'); // 'random', 'fixed', 'preset'
    const [isSealing, setIsSealing] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSealing(true);

        try {
            const key = `time-capsule-${Date.now()}`;

            // Calculate Unlock Date
            let finalUnlockDate;
            const now = new Date();

            if (scheduleType === 'fixed' && unlockDate) {
                finalUnlockDate = new Date(unlockDate).getTime();
            } else if (scheduleType === 'random') {
                // Random date between 3 months and 1 year
                const minTime = 90 * 24 * 60 * 60 * 1000;
                const maxTime = 365 * 24 * 60 * 60 * 1000;
                const randomDuration = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
                finalUnlockDate = now.getTime() + randomDuration;
            } else {
                // Default to 1 minute for testing purposes if not specified (should be longer in prod)
                // actually lets make "preset" = 6 months
                finalUnlockDate = now.getTime() + (180 * 24 * 60 * 60 * 1000);
            }

            // Construct Data
            const capsuleData = {
                type: 'time-capsule',
                subtype: mode,
                content: mode === 'freeform' ? content : Object.entries(answers).map(([q, a]) => ({ question: q, answer: a })),
                createdAt: now.toISOString(),
                unlockDate: new Date(finalUnlockDate).toISOString(),
                status: 'locked',
                summary: mode === 'freeform' ? 'Time Capsule (Freeform)' : 'Time Capsule (Guided)'
            };

            await set(key, capsuleData);

            // Simulate "Sealing" animation delay
            setTimeout(() => {
                onBack(); // Return to dashboard
            }, 1500);

        } catch (err) {
            console.error("Failed to seal capsule", err);
            setIsSealing(false);
        }
    };

    return (
        <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <header className="editor-header">
                <button className="btn-icon" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={18} />
                    <span className="date-display">New Time Capsule</span>
                </div>
                <div style={{ width: 24 }}></div> {/* Spacer */}
            </header>

            <main className="editor-content" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Mode Selection */}
                <div style={{ display: 'flex', gap: '10px', background: 'var(--item-bg)', padding: '5px', borderRadius: '12px' }}>
                    <button
                        onClick={() => setMode('freeform')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '8px',
                            background: mode === 'freeform' ? 'var(--input-bg)' : 'transparent',
                            color: mode === 'freeform' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: mode === 'freeform' ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                        }}
                    >
                        Freeform
                    </button>
                    <button
                        onClick={() => setMode('guided')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: 'none',
                            borderRadius: '8px',
                            background: mode === 'guided' ? 'var(--input-bg)' : 'transparent',
                            color: mode === 'guided' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: mode === 'guided' ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                        }}
                    >
                        Guided
                    </button>
                </div>

                {/* Editor Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {mode === 'freeform' ? (
                        <textarea
                            className="journal-textarea"
                            placeholder="Write a message to your future self..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{
                                minHeight: '400px',
                                resize: 'none',
                                padding: '25px',
                                fontSize: '1.2rem',
                                lineHeight: '1.6',
                                borderRadius: '8px',
                                border: '2px solid var(--border-color)',
                                fontFamily: 'var(--font-body)'
                            }}
                            autoFocus
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
                            {GUIDED_QUESTIONS.map((question, index) => (
                                <div key={index} className="guided-q-block">
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                                        {question}
                                    </label>
                                    <textarea
                                        className="journal-textarea"
                                        style={{ minHeight: '80px', height: '80px', padding: '10px', fontSize: '1rem', width: '100%' }}
                                        value={answers[question] || ''}
                                        onChange={(e) => setAnswers(prev => ({ ...prev, [question]: e.target.value }))}
                                        placeholder="Your answer..."
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scheduling Controls */}
                <div style={{
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '20px',
                    marginTop: 'auto'
                }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: 'var(--text-secondary)' }}>Deliver to Future Self...</h3>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setScheduleType('random')}
                            style={{
                                padding: '8px 15px',
                                borderRadius: '20px',
                                border: `1px solid ${scheduleType === 'random' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                background: scheduleType === 'random' ? 'var(--accent-color)' : 'transparent',
                                color: scheduleType === 'random' ? '#fff' : 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <Sparkles size={14} /> Surprise Me
                        </button>
                        <button
                            onClick={() => setScheduleType('fixed')}
                            style={{
                                padding: '8px 15px',
                                borderRadius: '20px',
                                border: `1px solid ${scheduleType === 'fixed' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                                background: scheduleType === 'fixed' ? 'var(--accent-color)' : 'transparent',
                                color: scheduleType === 'fixed' ? '#fff' : 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <Calendar size={14} /> Pick Date
                        </button>
                    </div>

                    {scheduleType === 'fixed' && (
                        <input
                            type="date"
                            className="date-picker-input"
                            value={unlockDate}
                            onChange={(e) => setUnlockDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-primary)', // Ensure it matches theme
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-ui)', // Use UI font
                                fontSize: '1.2rem',
                                marginBottom: '15px',
                                outline: 'none'
                            }}
                        />
                    )}
                </div>

                <button
                    className="action-btn"
                    onClick={handleSave}
                    disabled={mode === 'freeform' ? !content.trim() : Object.keys(answers).length === 0}
                    style={{
                        width: '100%',
                        justifyContent: 'center',
                        background: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        marginBottom: '20px'
                    }}
                >
                    {isSealing ? (
                        <span>Sealing...</span>
                    ) : (
                        <>
                            <Lock size={18} /> Seal Capsule
                        </>
                    )}
                </button>

            </main>
        </div>
    );
}
