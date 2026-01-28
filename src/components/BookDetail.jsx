import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { ArrowLeft, Plus, X, Save, Trash2 } from 'lucide-react';
import './Dashboard.css'; // Use dashboard styles
import './JournalEditor.css'; // Reuse editor styles for textarea

export default function BookDetail({ bookId, onBack }) {
    const [book, setBook] = useState(null);
    const [reflections, setReflections] = useState('');
    const [takeaways, setTakeaways] = useState([]); // Array of { id, text }
    const [newTakeaway, setNewTakeaway] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBook();
    }, [bookId]);

    const loadBook = async () => {
        try {
            const data = await get(bookId);
            if (data) {
                setBook(data);
                setReflections(data.notes || '');
                setTakeaways(data.takeaways || []);
            }
        } catch (err) {
            console.error("Failed to load book:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!book) return;

        const updatedBook = {
            ...book,
            notes: reflections,
            takeaways: takeaways
        };

        try {
            await set(bookId, updatedBook);
            setBook(updatedBook);
            // Optional: Visual feedback "Saved"
        } catch (err) {
            console.error("Failed to save:", err);
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

    if (loading) return <div className="loading">Loading book...</div>;
    if (!book) return <div className="loading">Book not found.</div>;

    return (
        <div className="dashboard-container" style={{ paddingTop: '20px' }}>
            {/* Header / Nav */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <button onClick={onBack} className="btn-icon" style={{ marginRight: '15px' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '2.5rem',
                        fontWeight: '400',
                        margin: 0
                    }}>
                        {book.title}
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: '1.1rem',
                        color: 'var(--text-secondary)',
                        margin: '5px 0 0 0'
                    }}>
                        by {book.author}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '40px', maxWidth: '800px', margin: '0 auto' }}>

                {/* Reflections Section */}
                <section>
                    <h3 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Reflections</h3>
                    <textarea
                        value={reflections}
                        onChange={(e) => setReflections(e.target.value)}
                        placeholder="Write your thoughts, feelings, and what you learned..."
                        className="journal-input" // Reusing from JournalEditor
                        style={{
                            minHeight: '200px',
                            fontSize: '1.1rem',
                            lineHeight: '1.6',
                            padding: '20px',
                            background: '#fff',
                            border: '2px solid var(--border-color)',
                            borderRadius: '8px',
                            width: '100%',
                            resize: 'vertical'
                        }}
                    />
                </section>

                {/* Key Takeaways Section */}
                <section>
                    <h3 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Key Takeaways</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                        {takeaways.map(t => (
                            <div key={t.id} style={{
                                display: 'flex',
                                alignItems: 'start',
                                gap: '10px',
                                padding: '15px',
                                background: '#fff',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontFamily: 'var(--font-body)',
                                fontSize: '1.1rem'
                            }}>
                                <div style={{
                                    minWidth: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: 'var(--text-primary)',
                                    marginTop: '10px'
                                }}></div>
                                <span style={{ flex: 1 }}>{t.text}</span>
                                <button
                                    onClick={() => removeTakeaway(t.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={addTakeaway} style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={newTakeaway}
                            onChange={(e) => setNewTakeaway(e.target.value)}
                            placeholder="Add a key point..."
                            style={{
                                flex: 1,
                                padding: '12px',
                                border: '2px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontFamily: 'var(--font-ui)'
                            }}
                        />
                        <button type="submit" className="btn-new-entry" style={{ padding: '0 20px', fontSize: '1rem' }}>
                            <Plus size={20} />
                        </button>
                    </form>
                </section>

                {/* Save Action */}
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSave}
                        className="btn-new-entry"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '15px 40px',
                            borderRadius: '30px',
                            background: 'var(--accent-color, #000)'
                        }}
                    >
                        <Save size={20} /> Save Changes
                    </button>
                </div>

            </div>
        </div>
    );
}
