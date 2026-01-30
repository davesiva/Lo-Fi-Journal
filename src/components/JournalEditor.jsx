import { useState, useEffect, useRef } from 'react';
import { get, set, del } from 'idb-keyval';
import { generateSummary } from '../services/ai';
import ConfirmModal from './ConfirmModal';
import { Sparkles, ChevronLeft, Trash2 } from 'lucide-react';
import './JournalEditor.css';

export default function JournalEditor({ initialDate, onBack }) {
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('loading'); // loading, saved, saving
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const textareaRef = useRef(null);

    // Use prop date or today (Safely formatted as YYYY-MM-DD local)
    const getTodayString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const targetDate = initialDate || getTodayString();

    const getKey = () => `journal-${targetDate}`;

    useEffect(() => {
        loadEntry();
    }, [targetDate]);

    // Auto-summarize debounce effect (run 3s after typing stops)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (content && content.length > 40) {
                autoSummarize(content);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [content]);

    const loadEntry = async () => {
        try {
            const saved = await get(getKey());
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
        const currentData = await get(getKey()) || {};
        const oldSummary = typeof currentData === 'object' ? currentData.summary : null;
        const safeOldSummary = typeof currentData === 'string' ? null : oldSummary;

        const newData = {
            content: text,
            summary: summary !== null ? summary : safeOldSummary,
            updatedAt: new Date().toISOString()
        };

        await set(getKey(), newData);
        return newData;
    };

    const handleChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        setStatus('saving');

        // Quick save debounce
        clearTimeout(window.saveTimeout);
        window.saveTimeout = setTimeout(async () => {
            await saveContent(newContent);
            setStatus('saved');
        }, 500);
    };

    const handleBackClick = async () => {
        // Ensure final save and attempt summary before leaving
        await saveContent(content);
        if (content.length > 40) {
            // We don't await this to keep UI snappy, 
            // but we fire it off. The backend request will complete.
            autoSummarize(content);
        }
        onBack();
    };

    // Keep handleBlur for just generic focus loss (clicking outside window)
    const handleBlur = async () => {
        await saveContent(content);
        setStatus('saved');
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await del(getKey());
            onBack();
        } catch (err) {
            console.error(err);
            alert('Failed to delete entry');
        }
    };

    // Silent auto-summarizer
    const autoSummarize = async (text) => {
        if (!text || text.length < 40) return;

        try {
            const currentData = await get(getKey());

            // Allow re-summarization if the text has changed significantly or user wants updates.
            // We previously blocked this if `currentData.summary` existed.
            // Removing that block to allow "always fresh" summaries on significant edits.

            // (Optional: We could check if text length matches roughly what served the summary, 
            // but for now, let's just trust the debounce to not spam).

            const summary = await generateSummary(text);
            if (summary) {
                await saveContent(text, summary);
                // Force status update if component still mounted (optional, ignore error)
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
            }
        } catch (err) {
            console.error(err);
        } finally {
            setStatus('saved');
        }
    };

    // Robust parsing for YYYY-MM-DD
    const [y, m, d] = targetDate.split('-').map(Number);
    // Note: Month is 0-indexed in Date constructor
    const dateObj = new Date(y, m - 1, d);

    // Fallback if Invalid Date
    const isValidDate = !isNaN(dateObj.getTime());
    const displayDate = isValidDate
        ? dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
        : "New Entry";

    return (
        <div className="journal-container">
            <div className="editor-nav">
                <button className="btn-back" onClick={handleBackClick}>
                    <ChevronLeft size={20} />
                    <span className="btn-text">Back to Dashboard</span>
                </button>
                <div className="editor-actions">
                    <button className="btn-action" onClick={handleSummarize} title="Auto-Summarize">
                        <Sparkles size={18} />
                    </button>
                    <button className="btn-delete" onClick={handleDeleteClick} title="Delete Entry">
                        <Trash2 size={18} />
                        <span className="btn-text">Delete Entry</span>
                    </button>
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

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Entry?"
                message="Are you sure you want to delete this entry? This cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteModal(false)}
                isDanger={true}
            />
        </div>
    );
}
