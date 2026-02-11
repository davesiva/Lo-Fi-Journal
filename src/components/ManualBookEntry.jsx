import { useState, useEffect } from 'react';
import { set } from 'idb-keyval';
import { ArrowLeft, Save, Calendar, Search, Book, Image as ImageIcon, Loader2 } from 'lucide-react'; // Added icons
import PixelCalendar from './PixelCalendar';
import './JournalEditor.css';

export default function ManualBookEntry({ onSave, onCancel, initialData }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [author, setAuthor] = useState(initialData?.author || '');
    const [startedDate, setStartedDate] = useState(initialData?.startedDate || new Date().toISOString().split('T')[0]);
    const [finishedDate, setFinishedDate] = useState(initialData?.finishedDate || '');
    const [showCalendar, setShowCalendar] = useState(false);

    // New Fields
    const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || '');
    const [totalPages, setTotalPages] = useState(initialData?.totalPages || '');
    const [currentPage, setCurrentPage] = useState(initialData?.currentPage || 0);
    const [isSearching, setIsSearching] = useState(false);

    const [reflections, setReflections] = useState(initialData?.notes || '');
    const [takeaways, setTakeaways] = useState(initialData?.takeaways || []);
    const [newTakeaway, setNewTakeaway] = useState('');

    // Auto-search when title/author loses focus if both are present and no cover yet
    const handleAutoSearch = async () => {
        if (title.length > 3 && !coverUrl && !isSearching) {
            await fetchBookDetails();
        }
    };

    const fetchBookDetails = async () => {
        if (!title.trim()) return;
        setIsSearching(true);
        try {
            const query = `intitle:${title}${author ? `+inauthor:${author}` : ''}`;
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=en`);
            const data = await res.json();

            if (data.items && data.items.length > 0) {
                // 1. Filter for English
                const englishBooks = data.items.filter(item => item.volumeInfo.language === 'en');
                const validBooks = englishBooks.length > 0 ? englishBooks : data.items;

                // 2. Filter out summaries/analyses
                const nonSummaries = validBooks.filter(item => {
                    const info = item.volumeInfo;
                    const title = (info.title || '').toLowerCase();
                    const subtitle = (info.subtitle || '').toLowerCase();
                    const authors = (info.authors || []).join(' ').toLowerCase();

                    const isSummary =
                        title.startsWith('summary') ||
                        title.includes('summary of') ||
                        title.includes('analysis of') ||
                        subtitle.startsWith('summary') ||
                        authors.includes('summary') ||
                        authors.includes('instaread') ||
                        authors.includes('penzen') ||
                        authors.includes('my mba') ||
                        authors.includes('goldmine reads');

                    return !isSummary;
                });

                // 3. Fallback logic: 
                // If we have non-summaries, use the first one. 
                // If we filtered everything out (rare), use the first valid English book.
                const bestMatch = nonSummaries.length > 0 ? nonSummaries[0] : validBooks[0];

                const book = bestMatch.volumeInfo;
                if (!author && book.authors) setAuthor(book.authors[0]);
                if (book.pageCount) setTotalPages(book.pageCount);
                if (book.imageLinks) {
                    // Prefer larger images if available, fallback to thumbnail
                    setCoverUrl(book.imageLinks.thumbnail?.replace('http:', 'https:') || '');
                }
            }
        } catch (err) {
            console.error("Failed to fetch book details:", err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const bookData = {
            id: initialData?.id || `book-${Date.now()}`,
            title,
            author: author || 'Unknown Author',
            startedDate,
            finishedDate,
            coverUrl,
            totalPages: Number(totalPages) || 0,
            currentPage: Number(currentPage) || 0,
            notes: reflections,
            takeaways,
            createdAt: initialData?.createdAt || new Date().toISOString(),
            type: 'book',
            folderId: initialData?.folderId || null,
            category: initialData?.category || null
        };

        try {
            await set(bookData.id, bookData);
            onSave();
        } catch (err) {
            console.error("Failed to save book:", err);
            alert("Failed to save book");
        }
    };

    const addTakeaway = (e) => {
        e.preventDefault();
        if (!newTakeaway.trim()) return;
        setTakeaways([...takeaways, { id: Date.now(), text: newTakeaway.trim() }]);
        setNewTakeaway('');
    };

    const removeTakeaway = (id) => {
        setTakeaways(takeaways.filter(t => t.id !== id));
    };

    return (
        <div className="editor-container">
            <div className="editor-header">
                <button onClick={onCancel} className="btn-icon">
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ flex: 1, textAlign: 'center', margin: 0 }}>
                    {initialData ? 'Edit Book' : 'Add Book'}
                </h2>
                <div style={{ width: 24 }}></div>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

                {/* Book Cover Preview */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <div style={{
                        width: '120px', height: '180px',
                        borderRadius: '8px',
                        background: '#f0f0f0',
                        backgroundImage: coverUrl ? `url(${coverUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid #ddd',
                        position: 'relative',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}>
                        {!coverUrl && <Book size={40} color="#ccc" />}
                        <button
                            type="button"
                            onClick={fetchBookDetails}
                            disabled={isSearching}
                            style={{
                                position: 'absolute', bottom: '-15px',
                                background: 'var(--text-color)', color: 'var(--bg-color)',
                                border: 'none', borderRadius: '20px',
                                padding: '6px 12px', fontSize: '0.8rem',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                            }}
                        >
                            {isSearching ? <Loader2 size={12} className="spin" /> : <Search size={12} />}
                            Auto-Fill
                        </button>
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleAutoSearch}
                        placeholder="Book Title"
                        style={{
                            width: '100%', padding: '12px', fontSize: '1.1rem',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            background: 'transparent', color: 'inherit'
                        }}
                        required
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Author</label>
                    <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Author Name"
                        style={{
                            width: '100%', padding: '12px', fontSize: '1.1rem',
                            border: '1px solid var(--border-color)', borderRadius: '8px',
                            background: 'transparent', color: 'inherit'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Total Pages</label>
                        <input
                            type="number"
                            value={totalPages}
                            onChange={(e) => setTotalPages(e.target.value)}
                            placeholder="e.g. 320"
                            style={{
                                width: '100%', padding: '12px', fontSize: '1rem',
                                border: '1px solid var(--border-color)', borderRadius: '8px',
                                background: 'transparent', color: 'inherit'
                            }}
                        />
                    </div>
                    {!finishedDate && (
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Current Page</label>
                            <input
                                type="number"
                                value={currentPage}
                                onChange={(e) => setCurrentPage(e.target.value)}
                                placeholder="0"
                                max={totalPages}
                                style={{
                                    width: '100%', padding: '12px', fontSize: '1rem',
                                    border: '1px solid var(--border-color)', borderRadius: '8px',
                                    background: 'transparent', color: 'inherit'
                                }}
                            />
                        </div>
                    )}
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Date Read</label>
                    {!finishedDate ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                style={{
                                    flex: 1, padding: '12px',
                                    border: '2px dashed var(--border-color)', borderRadius: '8px',
                                    background: 'none', color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setShowCalendar(true)}
                            >
                                + Mark as Finished
                            </button>
                        </div>

                    ) : (
                        <div style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid var(--text-primary)',
                            borderRadius: '8px',
                            background: '#fff',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '1.2rem' }}>
                                Finished: {new Date(finishedDate).toLocaleDateString()}
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowCalendar(!showCalendar)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Change
                            </button>
                        </div>
                    )}

                    {showCalendar && (
                        <div style={{ marginTop: '10px' }}>
                            <PixelCalendar
                                value={finishedDate || new Date().toISOString().split('T')[0]}
                                onChange={(date) => {
                                    setFinishedDate(date);
                                    if (totalPages) setCurrentPage(totalPages); // Auto-complete pages
                                    setShowCalendar(false);
                                }}
                                onClose={() => setShowCalendar(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Reflections Section */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Quick Reflections</label>
                    <textarea
                        value={reflections}
                        onChange={(e) => setReflections(e.target.value)}
                        placeholder="Thoughts, feelings, immediate reactions..."
                        style={{
                            width: '100%',
                            minHeight: '120px',
                            padding: '15px',
                            fontSize: '1rem',
                            lineHeight: '1.5',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: '#fff',
                            resize: 'vertical',
                            fontFamily: 'var(--font-body)'
                        }}
                    />
                </div>

                {/* Key Takeaways Section */}
                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Key Takeaways</label>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <input
                            type="text"
                            value={newTakeaway}
                            onChange={(e) => setNewTakeaway(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addTakeaway(e)}
                            placeholder="Add a key point..."
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '1rem'
                            }}
                        />
                        <button
                            type="button"
                            onClick={addTakeaway}
                            style={{
                                padding: '0 15px',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            +
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {takeaways.map(t => (
                            <div key={t.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px',
                                background: '#f5f5f5',
                                borderRadius: '6px',
                                fontSize: '0.95rem'
                            }}>
                                <span style={{ flex: 1 }}>{t.text}</span>
                                <button
                                    type="button"
                                    onClick={() => removeTakeaway(t.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '15px',
                        backgroundColor: 'var(--text-color)',
                        color: 'var(--bg-color)',
                        border: 'none',
                        borderRadius: '30px',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        marginBottom: '40px'
                    }}
                >
                    <Save size={20} />
                    Save to Bookshelf
                </button>
            </form>
        </div>
    );
}
