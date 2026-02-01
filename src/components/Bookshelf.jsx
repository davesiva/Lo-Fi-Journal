import { useState, useEffect } from 'react';
import { keys, get, del, set, update } from 'idb-keyval'; // Added set/update for folders
import { Plus, BookOpen, Trash2, Edit2, ScanLine, Type, Folder, Check, Sparkles, X, ChevronDown, List as ListIcon, Grid as GridIcon } from 'lucide-react';
import ManualBookEntry from './ManualBookEntry';
import BookScanner from './BookScanner';
import ConfirmModal from './ConfirmModal';
import { suggestBookCategory } from '../services/ai';
import './Dashboard.css';

export default function Bookshelf({ onNavigateHome, onNavigateBook }) {
    const [view, setView] = useState('list'); // 'list', 'manual', 'scan'
    const [books, setBooks] = useState([]);
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [sortMethod, setSortMethod] = useState('recent'); // 'recent', 'title', 'author'
    const [currentFolder, setCurrentFolder] = useState(null); // null = All Books
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedBooks, setSelectedBooks] = useState([]);

    const [showAddMenu, setShowAddMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [bookToDelete, setBookToDelete] = useState(null);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [scanData, setScanData] = useState(null);
    const [isAISorting, setIsAISorting] = useState(false);

    useEffect(() => {
        loadLibrary();

        const handleClickOutside = (event) => {
            setShowAddMenu(false);
            setShowSortMenu(false); // Close sort menu too
        }; document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const loadLibrary = async () => {
        setLoading(true);
        try {
            // Load Books
            const allKeys = await keys();
            const bookKeys = allKeys.filter(k => k.toString().startsWith('book-'));
            const bookData = await Promise.all(bookKeys.map(k => get(k)));

            // Load Folders
            const folderKeys = allKeys.filter(k => k.toString().startsWith('folder-'));
            const folderData = await Promise.all(folderKeys.map(k => get(k)));

            setBooks(bookData);
            setFolders(folderData || []);
        } catch (err) {
            console.error("Failed to load library:", err);
        } finally {
            setLoading(false);
        }
    };

    // --- SORTING & FILTERING ---
    const getSortedBooks = () => {
        let filtered = books;

        // Filter by Folder
        if (currentFolder) {
            filtered = books.filter(b => b.folderId === currentFolder.id);
        }

        // Sort
        return filtered.sort((a, b) => {
            if (sortMethod === 'title') return a.title.localeCompare(b.title);
            if (sortMethod === 'author') return a.author.localeCompare(b.author);
            // Default: Recent
            const dateA = new Date(a.finishedDate || a.startedDate);
            const dateB = new Date(b.finishedDate || b.startedDate);
            return dateB - dateA;
        });
    };

    const sortedBooks = getSortedBooks();

    // --- SELECTION MODE ---
    const toggleSelection = (bookId) => {
        if (!selectionMode) return;
        if (selectedBooks.includes(bookId)) {
            setSelectedBooks(selectedBooks.filter(id => id !== bookId));
        } else {
            setSelectedBooks([...selectedBooks, bookId]);
        }
    };

    const handleLongPress = (bookId) => {
        if (!selectionMode) {
            setSelectionMode(true);
            setSelectedBooks([bookId]);
            if (window.navigator.vibrate) window.navigator.vibrate(50); // Haptic feedback
        }
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedBooks([]);
    };

    // --- ACTIONS ---
    const handleDeleteClick = (e, book) => {
        e.stopPropagation();
        setBookToDelete(book);
    };

    const confirmDelete = async () => {
        if (!bookToDelete) return;
        try {
            await del(bookToDelete.id);
            loadLibrary();
        } catch (err) { console.error(err); }
        finally { setBookToDelete(null); }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        const folder = {
            id: `folder-${Date.now()}`,
            name: newFolderName.trim(),
            createdAt: new Date().toISOString()
        };

        await set(folder.id, folder);
        setFolders([...folders, folder]);
        setNewFolderName('');
        setShowFolderModal(false);
    };

    const handleMoveSelected = async (targetFolderId) => {
        // Move selected books to folder
        for (const bookId of selectedBooks) {
            const book = books.find(b => b.id === bookId);
            if (book) {
                book.folderId = targetFolderId; // targetFolderId can be null (to remove from folder)
                await set(bookId, book);
            }
        }
        loadLibrary();
        exitSelectionMode();
    };

    const handleAISort = async () => {
        setIsAISorting(true);
        // Find unsorted books
        const unsortedBooks = books.filter(b => !b.folderId);

        let newFolders = [...folders];
        let updatedBooks = [...books];
        let changesMade = false;

        for (const book of unsortedBooks) {
            const category = await suggestBookCategory(book.title, book.author);
            if (category) {
                // Find or Create Folder
                let folder = newFolders.find(f => f.name.toLowerCase() === category.toLowerCase());

                if (!folder) {
                    folder = {
                        id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: category,
                        createdAt: new Date().toISOString()
                    };
                    await set(folder.id, folder);
                    newFolders.push(folder);
                }

                // Update Book
                book.folderId = folder.id;
                book.category = category; // Save inferred category
                await set(book.id, book);
                changesMade = true;
            }
        }

        if (changesMade) {
            loadLibrary();
            alert("Library organized!");
        } else {
            alert("No changes needed or AI couldn't categorize.");
        }
        setIsAISorting(false);
    };

    // --- RENDER HELPERS ---
    if (view === 'manual') return <ManualBookEntry onSave={() => { setView('list'); setScanData(null); loadLibrary(); }} onCancel={() => { setView('list'); setScanData(null); }} initialData={scanData} />;
    if (view === 'scan') return <BookScanner onScanComplete={(d) => { setScanData(d); setView('manual'); }} onCancel={() => setView('list')} />;

    return (
        <div className="dashboard-container" style={{ paddingBottom: selectionMode ? '80px' : '20px' }}>
            {/* --- HEADER --- */}
            <div className="dashboard-header" style={{ alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {currentFolder && (
                            <button onClick={() => setCurrentFolder(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                <X size={20} />
                            </button>
                        )}
                        <h2 className="section-title" style={{ margin: 0 }}>
                            {currentFolder ? currentFolder.name : 'My Bookshelf'}
                        </h2>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontStyle: 'italic', margin: 0 }}>
                        {currentFolder ? `${sortedBooks.length} items` : 'your digital library'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {!selectionMode && (
                        <div style={{ position: 'relative' }}>
                            {/* SORT & ADD Controls */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleAISort}
                                    disabled={isAISorting}
                                    style={{
                                        background: 'none',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '20px',
                                        padding: '8px 12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'var(--font-ui)',
                                        fontSize: '0.9rem'
                                    }}
                                    title={isAISorting ? 'AI Sorting...' : 'Auto-Organize with AI'}
                                >
                                    <Sparkles size={16} className={isAISorting ? "spinning-icon" : ""} />
                                </button>

                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowSortMenu(!showSortMenu); setShowAddMenu(false); }}
                                        style={{
                                            background: 'none',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '20px',
                                            padding: '8px 32px 8px 16px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontFamily: 'var(--font-ui)',
                                            fontSize: '0.9rem',
                                            minWidth: '100px',
                                            position: 'relative',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {sortMethod.charAt(0).toUpperCase() + sortMethod.slice(1)}
                                        <ChevronDown size={14} style={{ position: 'absolute', right: '12px', opacity: 0.6 }} />
                                    </button>

                                    {showSortMenu && (
                                        <div className="dropdown-menu" style={{ right: 0, top: '120%', minWidth: '120px' }}>
                                            <button onClick={() => { setSortMethod('recent'); setShowSortMenu(false); }}>
                                                Recent
                                            </button>
                                            <button onClick={() => { setSortMethod('title'); setShowSortMenu(false); }}>
                                                Title
                                            </button>
                                            <button onClick={() => { setSortMethod('author'); setShowSortMenu(false); }}>
                                                Author
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
                                    style={{
                                        background: 'var(--text-primary)',
                                        color: 'var(--bg-primary)',
                                        border: '1px solid var(--text-primary)',
                                        borderRadius: '20px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontFamily: 'var(--font-ui)',
                                        fontSize: '0.9rem',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <Plus size={16} /> Add
                                </button>
                            </div>

                            {/* Add Menu Dropdown */}
                            {showAddMenu && (
                                <div className="dropdown-menu" style={{ right: 0, top: '120%' }}>
                                    <button onClick={() => { setView('scan'); setShowAddMenu(false); }}>
                                        <ScanLine size={16} /> Scan Cover
                                    </button>
                                    <button onClick={() => { setView('manual'); setShowAddMenu(false); }}>
                                        <Type size={16} /> Manual Entry
                                    </button>
                                    <button onClick={() => { setShowFolderModal(true); setShowAddMenu(false); }}>
                                        <Folder size={16} /> New Folder
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- FOLDER SHELF (Only visible in 'All Books' view) --- */}
            {!currentFolder && folders.length > 0 && !selectionMode && (
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px' }}>
                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            onClick={() => setCurrentFolder(folder)}
                            style={{
                                minWidth: '120px',
                                padding: '15px',
                                background: '#f5f5f5',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
                            }}
                        >
                            <Folder size={24} fill="var(--text-secondary)" stroke="none" />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, textAlign: 'center' }}>{folder.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* --- BOOK GRID / LIST --- */}
            {loading ? (
                <div className="loading">Loading library...</div>
            ) : sortedBooks.length === 0 ? (
                <div className="empty-state">
                    <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
                    <p>No books found.</p>
                </div>
            ) : (
                <div className="entries-list">
                    {sortedBooks.map(book => {
                        const isSelected = selectedBooks.includes(book.id);
                        return (
                            <div
                                key={book.id}
                                className={`entry-card ${isSelected ? 'selected' : ''}`}
                                style={{
                                    cursor: 'pointer',
                                    border: isSelected ? '2px solid var(--accent-color, #000)' : '1px solid var(--border-color)',
                                    background: isSelected ? 'rgba(0,0,0,0.05)' : '#fff',
                                    position: 'relative'
                                }}
                                onClick={() => selectionMode ? toggleSelection(book.id) : onNavigateBook(book.id)}
                                onContextMenu={(e) => { e.preventDefault(); handleLongPress(book.id); }} // Desktop right click
                                onTouchStart={(e) => {
                                    // Simple long press detection
                                    const timer = setTimeout(() => handleLongPress(book.id), 500);
                                    e.target.addEventListener('touchend', () => clearTimeout(timer), { once: true });
                                    e.target.addEventListener('touchmove', () => clearTimeout(timer), { once: true });
                                }}
                            >
                                <div className="entry-content">
                                    <div className="entry-header-row">
                                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '1.4rem', fontWeight: 500 }}>
                                            {book.title}
                                        </span>
                                        {/* Selection Checkbox (Visual only) */}
                                        {selectionMode && (
                                            <div style={{
                                                width: '20px', height: '20px',
                                                borderRadius: '50%',
                                                border: '2px solid var(--text-color)',
                                                background: isSelected ? 'var(--text-color)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {isSelected && <Check size={12} color="#fff" />}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '1rem', opacity: 0.8, marginTop: '4px', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
                                        by {book.author}
                                    </div>
                                    <div className="entry-date" style={{ marginTop: '8px' }}>
                                        {book.category && <span style={{ marginRight: '10px', fontSize: '0.8rem', background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{book.category}</span>}
                                        {book.finishedDate ? `Read ${new Date(book.finishedDate).toLocaleDateString()}` : `Started ${new Date(book.startedDate).toLocaleDateString()}`}
                                    </div>
                                </div>

                                {/* Standard Menu (only if not selecting) */}
                                {!selectionMode && (
                                    <div className="menu-container">
                                        <button className="btn-menu-trigger" onClick={(e) => handleDeleteClick(e, book)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- SELECTION MODE BOTTOM BAR --- */}
            {selectionMode && (
                <div style={{
                    position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                    width: '90%', maxWidth: '400px',
                    background: '#222', color: '#fff',
                    borderRadius: '20px',
                    padding: '15px 25px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                    zIndex: 1000
                }}>
                    <span style={{ fontWeight: 'bold' }}>{selectedBooks.length} selected</span>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button onClick={() => setShowFolderModal(true)} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem' }}>
                            <Folder size={20} /> Move
                        </button>
                        <button onClick={() => {
                            // Bulk Delete Logic (Simplified: reuse single delete for now or loop)
                            if (confirm(`${selectedBooks.length} books will be deleted.`)) {
                                selectedBooks.forEach(id => del(id));
                                exitSelectionMode();
                                setTimeout(loadLibrary, 500);
                            }
                        }} style={{ background: 'none', border: 'none', color: '#ff6b6b', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem' }}>
                            <Trash2 size={20} /> Delete
                        </button>
                        <button onClick={exitSelectionMode} style={{ background: 'none', border: 'none', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '0.7rem' }}>
                            <X size={20} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* --- NEW FOLDER MODAL or MOVE TO FOLDER MODAL --- */}
            {showFolderModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ minWidth: '300px' }}>
                        {selectionMode ? (
                            <>
                                <h3>Move to Folder</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                                    <button
                                        onClick={() => handleMoveSelected(null)} // Uncategorized
                                        style={{ padding: '15px', background: '#f5f5f5', border: 'none', textAlign: 'left', borderRadius: '8px' }}
                                    >
                                        Remove from Folder
                                    </button>
                                    {folders.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => { handleMoveSelected(f.id); setShowFolderModal(false); }}
                                            style={{ padding: '15px', background: '#f5f5f5', border: 'none', textAlign: 'left', borderRadius: '8px' }}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                    <div style={{ height: '1px', background: '#eee', margin: '10px 0' }}></div>
                                    <input
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Or create new folder..."
                                        style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                                    />
                                    {newFolderName && (
                                        <button onClick={async (e) => {
                                            // Handle Create & Move
                                            e.preventDefault();
                                            const folder = { id: `folder-${Date.now()}`, name: newFolderName, createdAt: new Date().toISOString() };
                                            await set(folder.id, folder);
                                            setFolders([...folders, folder]);
                                            await handleMoveSelected(folder.id);
                                            setShowFolderModal(false);
                                            setNewFolderName('');
                                        }} className="btn-confirm">
                                            Create & Move
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => setShowFolderModal(false)} className="btn-cancel" style={{ marginTop: '15px', width: '100%' }}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <h3>Create New Folder</h3>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Folder Name"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <div className="modal-actions">
                                    <button onClick={() => setShowFolderModal(false)} className="btn-cancel">Cancel</button>
                                    <button onClick={handleCreateFolder} className="btn-confirm">Create</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!bookToDelete}
                title="Remove from Shelf?"
                message="This book will be permanently deleted."
                confirmText="Remove"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setBookToDelete(null)}
                isDanger={true}
            />
        </div>
    );
}
