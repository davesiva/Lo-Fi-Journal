import { useState, useEffect } from 'react';
import { keys, get, del } from 'idb-keyval';
import { Plus, BookOpen, Trash2, Edit2, ScanLine, Type } from 'lucide-react';
import ManualBookEntry from './ManualBookEntry';
import BookScanner from './BookScanner';
import './Dashboard.css'; // Reusing dashboard styles for consistency

export default function Bookshelf({ onNavigateHome }) {
    const [view, setView] = useState('list'); // 'list', 'manual', 'scan'
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanData, setScanData] = useState(null);
    const [showAddMenu, setShowAddMenu] = useState(false);

    useEffect(() => {
        loadBooks();
    }, []);

    const loadBooks = async () => {
        setLoading(true);
        try {
            const allKeys = await keys();
            const bookKeys = allKeys.filter(k => k.toString().startsWith('book-'));
            const bookData = await Promise.all(bookKeys.map(k => get(k)));

            // Sort by finishedDate descending, then startedDate
            bookData.sort((a, b) => {
                const dateA = new Date(a.finishedDate || a.startedDate);
                const dateB = new Date(b.finishedDate || b.startedDate);
                return dateB - dateA;
            });

            setBooks(bookData);
        } catch (err) {
            console.error("Failed to load books:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Remove this book from your shelf?")) {
            await del(id);
            loadBooks();
        }
    };

    const handleScanComplete = (data) => {
        setScanData(data);
        setView('manual'); // Verify/Edit before saving
    };

    const handleSave = () => {
        setView('list');
        setScanData(null); // Clear scan data
        loadBooks();
    };

    if (view === 'manual') {
        return (
            <ManualBookEntry
                onSave={handleSave}
                onCancel={() => {
                    setView('list');
                    setScanData(null);
                }}
                initialData={scanData}
            />
        );
    }

    if (view === 'scan') {
        return (
            <BookScanner
                onScanComplete={handleScanComplete}
                onCancel={() => setView('list')}
            />
        );
    }

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2 className="section-title">My Bookshelf</h2>
                <div style={{ position: 'relative' }}>
                    <button
                        className="btn-new-entry"
                        onClick={() => setShowAddMenu(!showAddMenu)}
                    >
                        <Plus size={18} /> Add Book
                    </button>

                    {showAddMenu && (
                        <div className="dropdown-menu" style={{ right: 0, top: '120%' }}>
                            <button onClick={() => {
                                setView('scan');
                                setShowAddMenu(false);
                            }}>
                                <ScanLine size={16} /> Scan Cover
                            </button>
                            <button onClick={() => {
                                setView('manual');
                                setShowAddMenu(false);
                            }}>
                                <Type size={16} /> Manual Entry
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading library...</div>
            ) : books.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
                    <p>Your shelf is empty.</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Scan a book or type it in to get started.</p>
                </div>
            ) : (
                <div className="entries-list">
                    {books.map(book => (
                        <div key={book.id} className="entry-card" style={{ cursor: 'default' }}>
                            <div className="entry-content">
                                <div className="entry-header-row">
                                    <span style={{
                                        fontFamily: '"Playfair Display", serif',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {book.title}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    opacity: 0.8,
                                    marginTop: '4px',
                                    fontStyle: 'italic'
                                }}>
                                    by {book.author}
                                </div>
                                <div className="entry-date" style={{ marginTop: '8px' }}>
                                    {book.finishedDate ? `Read on ${new Date(book.finishedDate).toLocaleDateString()}` : `Started ${new Date(book.startedDate).toLocaleDateString()}`}
                                </div>
                            </div>

                            <div className="menu-container">
                                <button
                                    className="btn-menu-trigger"
                                    onClick={(e) => handleDelete(e, book.id)}
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
