import { useState, useEffect } from 'react';
import { keys, get, del, set } from 'idb-keyval';
import { MoreVertical, Trash2, Edit2, Play, Mic } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ onNavigate, onNavigateVoice }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState(null); // Key of entry with open menu
    const [editingKey, setEditingKey] = useState(null); // Key of entry being edited
    const [editValue, setEditValue] = useState(''); // Text content being edited
    const [showNewEntryMenu, setShowNewEntryMenu] = useState(false);

    useEffect(() => {
        loadEntries();
        // Close menu on click outside
        // Close menu on click outside
        const handleClickOutside = () => {
            setActiveMenu(null);
            setShowNewEntryMenu(false);
        }
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadEntries = async () => {
        try {
            const allKeys = await keys();

            // Filter for journal AND voice entries
            const relevantKeys = allKeys.filter(k => k.startsWith('journal-') || k.startsWith('voice-'));

            const loadedEntries = await Promise.all(
                relevantKeys.map(async (key) => {
                    const data = await get(key);
                    const isVoice = key.startsWith('voice-');

                    // Determine Date
                    let dateStr = '';
                    if (isVoice) {
                        dateStr = data.createdAt || new Date().toISOString();
                    } else {
                        dateStr = key.replace('journal-', '');
                    }

                    // Determine Preview/Title
                    let preview = '';
                    let isSummary = false;

                    if (isVoice) {
                        preview = data.summary || "Voice Note";
                        isSummary = true;
                    } else {
                        // Text Entry
                        if (data && typeof data === 'object') {
                            if (data.summary) {
                                preview = data.summary;
                                isSummary = true;
                            } else {
                                const text = data.content || '';
                                preview = text.slice(0, 100) + (text.length > 100 ? '...' : '');
                            }
                        } else if (typeof data === 'string') {
                            preview = data.slice(0, 100) + (data.length > 100 ? '...' : '');
                        }
                    }

                    return {
                        key,
                        date: dateStr,
                        preview,
                        isSummary,
                        type: isVoice ? 'voice' : 'text',
                        audio: isVoice ? data.audio : null
                    };
                })
            );

            // Sort by date descending
            loadedEntries.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });

            setEntries(loadedEntries);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    };

    const handleDelete = async (e, key) => {
        e.stopPropagation();
        if (window.confirm('Delete this entry?')) {
            try {
                await del(key);
                loadEntries();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const startRenaming = (e, entry) => {
        e.stopPropagation();
        setEditingKey(entry.key);
        setEditValue(entry.preview);
        setActiveMenu(null);
    };

    const saveRename = async () => {
        if (!editingKey) return;

        if (editValue.trim() !== "") {
            try {
                const data = await get(editingKey);
                const newData = typeof data === 'object' ? { ...data, summary: editValue } : { content: data, summary: editValue };
                await set(editingKey, newData);
                loadEntries();
            } catch (err) {
                console.error("Rename failed", err);
            }
        }
        setEditingKey(null);
        setEditValue('');
    };

    const handleEditKeyDown = (e) => {
        if (e.key === 'Enter') {
            saveRename();
        } else if (e.key === 'Escape') {
            setEditingKey(null);
            setEditValue('');
        }
    };

    const toggleMenu = (e, key) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === key ? null : key);
    };

    const handleCardClick = (e, entry) => {
        if (editingKey === entry.key) return;

        if (entry.type === 'voice') {
            if (entry.audio) {
                const audio = new Audio(URL.createObjectURL(entry.audio));
                audio.play();
            } else {
                alert("Audio file missing");
            }
        } else {
            onNavigate(entry.date);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="section-title">Past Entries</h2>
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn-new-entry"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowNewEntryMenu(!showNewEntryMenu);
                        }}
                    >
                        + New Entry
                    </button>
                    {showNewEntryMenu && (
                        <div className="dropdown-menu" style={{ right: 0, top: '120%' }}>
                            <button onClick={() => onNavigate(null)}>
                                <Edit2 size={16} /> Write
                            </button>
                            <button onClick={() => {
                                if (onNavigateVoice) onNavigateVoice();
                            }}>
                                <Mic size={16} /> Voice Note
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading...</div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <p>No entries yet.</p>
                    <button className="btn-text" onClick={() => onNavigate('write')}>Start writing</button>
                </div>
            ) : (
                <div className="entries-list">
                    {entries.map(entry => (
                        <div
                            key={entry.key}
                            className="entry-card"
                            onClick={(e) => handleCardClick(e, entry)}
                        >
                            <div className="entry-content">
                                <div className="entry-header-row">
                                    <div className="entry-date">{formatDate(entry.date)}</div>
                                    {entry.type === 'voice' && <Mic size={16} className="voice-icon" />}
                                </div>

                                {editingKey === entry.key ? (
                                    <input
                                        type="text"
                                        className="entry-rename-input"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={saveRename}
                                        onKeyDown={handleEditKeyDown}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                ) : (
                                    <div className={`entry-preview ${entry.isSummary ? 'summary-text' : ''}`}>
                                        {entry.preview || '(Empty entry)'}
                                    </div>
                                )}
                            </div>

                            <div className="menu-container">
                                <button
                                    className="btn-menu-trigger"
                                    onClick={(e) => toggleMenu(e, entry.key)}
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {activeMenu === entry.key && (
                                    <div className="dropdown-menu">
                                        <button onClick={(e) => startRenaming(e, entry)}>
                                            <Edit2 size={16} /> Rename
                                        </button>
                                        <button onClick={(e) => handleDelete(e, entry.key)} className="danger">
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
