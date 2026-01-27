import { useState, useEffect, useRef } from 'react';
import { get, set, del } from 'idb-keyval';
import { generateSummary } from '../services/ai';
import { Sparkles } from 'lucide-react';
import './JournalEditor.css';

export default function JournalEditor({ initialDate, onBack }) {
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('loading'); // loading, saved, saving
    const textareaRef = useRef(null);

    // Use prop date or today
    const targetDate = initialDate || new Date().toLocaleDateString('en-CA');

    const getKey = () => `journal-${targetDate}`;

    useEffect(() => {
        loadEntry();
    }, [targetDate]);

    const loadEntry = async () => {
        try {
            const saved = await get(getKey());
            // Handle legacy string vs new object format
            if (saved && typeof saved === 'object') {
                setContent(saved.content || '');
            } else if (saved) {
                setContent(saved); // Legacy string support
            } else {
                setContent('');
            }
            setStatus('saved');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    const saveContent = async (text, summary = null) => {
        // We need to fetch existing summary if we are only saving text, 
        // OR we just overwrite if we don't care. 
        // Better: Read current state.
        const currentData = await get(getKey()) || {};
        const oldSummary = typeof currentData === 'object' ? currentData.summary : null;

        // Support legacy string read if existing data is string
        const safeOldSummary = typeof currentData === 'string' ? null : oldSummary;

        const newData = {
            content: text,
            summary: summary !== null ? summary : safeOldSummary, // Preserves summary if not updating it
            updatedAt: new Date().toISOString()
        };

        await set(getKey(), newData);
        return newData;
    };

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        setStatus('saving');

        // Debounce save
        clearTimeout(window.saveTimeout);
        window.saveTimeout = setTimeout(async () => {
            await saveContent(newContent);
            setStatus('saved');
        }, 500);
    };

    const handleBlur = async () => {
        // Immediate save on blur to catch quick exits
        await saveContent(content);
        setStatus('saved');

        // Trigger auto-summarize on exit/blur if enough text
        autoSummarize(content);
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
            try {
                await del(getKey());
                onBack(); // Return to dashboard
            } catch (err) {
                console.error(err);
                alert('Failed to delete entry');
            }
        }
    };

    // Silent auto-summarizer
    const autoSummarize = async (text) => {
        if (!text || text.length < 40) return;

        // Check if we already have a summary? 
        // For auto-mode, we only verify if it's worth generating.
        // To be safe, we just fetch current state to see if valid summary exists?
        // Actually, let's just try to generate if it's long enough.
        // Optimally: check if summary exists.

        try {
            const currentData = await get(getKey());
            // If we already have a summary, maybe skip? 
            // User said "automatically generate it...". 
            // If they edit significantly, we might want to update.
            // For now, let's update if no summary OR if explicitly requested.
            // Simple logic: If text is long enough, generate. 
            // But to save API, let's only do it if !summary.
            if (currentData && typeof currentData === 'object' && currentData.summary) {
                return; // Already has summary
            }

            const summary = await generateSummary(text);
            if (summary) {
                await saveContent(text, summary);
                // No notification
            }
        } catch (err) {
            console.error("Auto-summary failed", err);
        }
    };

    const handleSummarize = async () => {
        setStatus('saving');
        try {
            const summary = await generateSummary(content);
            if (summary) {
                await saveContent(content, summary);
                // No alert, just visual update via save check
            }
        } catch (err) {
            console.error(err);
        } finally {
            setStatus('saved');
        }
    };

    // Format Display Date
    // Robust parsing for YYYY-MM-DD to Local Date
    const [y, m, d] = targetDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    const displayDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="journal-container">
            <div className="editor-nav">
                <button className="btn-back" onClick={onBack}>&lt; Back to Dashboard</button>
                <div className="editor-actions">
                    <button className="btn-action" onClick={handleSummarize} title="Auto-Summarize">
                        <Sparkles size={18} />
                    </button>
                    <button className="btn-delete" onClick={handleDelete}>Delete Entry</button>
                </div>
            </div>

            <div className="journal-meta">
                <h1 className="date-display">{displayDate}</h1>
                <span className={`save-status ${status}`}>
                    {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : ''}
                </span>
            </div>

            <textarea
                ref={textareaRef}
                className="journal-editor"
                value={content}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="What's on your mind today?"
                autoFocus
            />
        </div>
    );
}
