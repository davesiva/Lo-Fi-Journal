import { useState } from 'react';
import { ArrowLeft, Lock, Unlock, Clock } from 'lucide-react';
import './JournalEditor.css'; // Reusing styles

export default function TimeCapsuleViewer({ entry, onBack }) {
    const [step, setStep] = useState(entry.subtype === 'guided' ? 'answer' : 'reveal');
    const [newAnswers, setNewAnswers] = useState({});

    if (!entry) return null;

    // Guided Mode: "Answer Again" Phase
    const handleReveal = () => {
        setStep('reveal');
    };

    const isGuided = entry.subtype === 'guided';
    const originalQuestions = isGuided ? entry.originalData.content : [];

    // Helper to get formatted date
    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header className="editor-header">
                <button className="btn-icon" onClick={onBack}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {step === 'reveal' ? <Unlock size={18} color="var(--accent-color)" /> : <Lock size={18} />}
                    <span className="date-display">
                        Created on {formatDate(entry.originalData.createdAt)}
                    </span>
                </div>
                <div style={{ width: 24 }}></div>
            </header>

            <main className="editor-content" style={{ padding: '20px' }}>

                {/* Freeform View */}
                {!isGuided && (
                    <div className="capsule-content">
                        <h2 style={{ marginBottom: '20px', fontFamily: 'serif', fontStyle: 'italic' }}>Message from the Past:</h2>
                        <div style={{
                            whiteSpace: 'pre-wrap',
                            lineHeight: '1.6',
                            fontSize: '1.2rem',
                            padding: '20px',
                            background: 'var(--item-bg)',
                            borderRadius: '12px',
                            border: '1px solid var(--border-color)'
                        }}>
                            {entry.originalData.content}
                        </div>
                    </div>
                )}

                {/* Guided View - Step 1: Answer Again */}
                {isGuided && step === 'answer' && (
                    <div className="guided-unlock-flow">
                        <h2 style={{ marginBottom: '10px' }}>Unlock Your Capsule</h2>
                        <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>
                            To unlock this memory, answer the same questions you asked yourself back then.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {originalQuestions.map((item, index) => (
                                <div key={index}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                        {item.question}
                                    </label>
                                    <textarea
                                        className="journal-textarea"
                                        style={{ minHeight: '80px', height: '80px', padding: '10px', fontSize: '1rem' }}
                                        value={newAnswers[item.question] || ''}
                                        onChange={(e) => setNewAnswers(prev => ({ ...prev, [item.question]: e.target.value }))}
                                        placeholder="Answer now..."
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            className="action-btn"
                            onClick={handleReveal}
                            disabled={Object.keys(newAnswers).length < originalQuestions.length}
                            style={{
                                marginTop: '30px',
                                width: '100%',
                                justifyContent: 'center',
                                background: 'var(--text-primary)',
                                color: 'var(--bg-color)'
                            }}
                        >
                            <Unlock size={18} /> Reveal Past Answers
                        </button>
                    </div>
                )}

                {/* Guided View - Step 2: Comparison */}
                {isGuided && step === 'reveal' && (
                    <div className="guided-reveal-flow">
                        <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Then vs. Now</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                            {originalQuestions.map((item, index) => (
                                <div key={index} className="comparison-row" style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                    borderBottom: '1px solid var(--border-color)',
                                    paddingBottom: '20px'
                                }}>
                                    <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-color)' }}>{item.question}</h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {/* THEN */}
                                        <div style={{ background: 'var(--item-bg)', padding: '15px', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>
                                                {formatDate(entry.originalData.createdAt)}
                                            </div>
                                            <div style={{ fontStyle: 'italic' }}>"{item.answer}"</div>
                                        </div>

                                        {/* NOW */}
                                        <div style={{ background: 'var(--input-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>
                                                Today
                                            </div>
                                            <div>"{newAnswers[item.question] || '(No answer provided)'}"</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
