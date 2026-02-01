import { useState } from 'react';
import { set } from 'idb-keyval';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import PixelCalendar from './PixelCalendar';
import './JournalEditor.css'; // Reuse existing styles where possible

export default function ManualBookEntry({ onSave, onCancel, initialData }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [author, setAuthor] = useState(initialData?.author || '');
    const [startedDate, setStartedDate] = useState(new Date().toISOString().split('T')[0]);
    const [finishedDate, setFinishedDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);

    // New Fields
    const [reflections, setReflections] = useState('');
    const [takeaways, setTakeaways] = useState([]);
    const [newTakeaway, setNewTakeaway] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !author.trim()) return;

        const bookData = {
            id: `book-${Date.now()}`,
            title,
            author,
            startedDate,
            finishedDate,
            notes: reflections,
            takeaways,
            createdAt: new Date().toISOString(),
            type: 'book',
            folderId: null // Initialize as null
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
                <h2 style={{ flex: 1, textAlign: 'center', margin: 0 }}>Add Book</h2>
                <div style={{ width: 24 }}></div>
            </div>

            <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="The Great Gatsby"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1.1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: 'inherit'
                        }}
                        required
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Author</label>
                    <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="F. Scott Fitzgerald"
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '1.1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            background: 'transparent',
                            color: 'inherit'
                        }}
                        required
                    />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Date Read</label>
                    {!finishedDate ? (
                        <button
                            type="button"
                            onClick={() => setShowCalendar(!showCalendar)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '1.2rem',
                                border: '2px solid var(--border-color)',
                                borderRadius: '8px',
                                background: '#fff',
                                color: 'inherit',
                                textAlign: 'left',
                                fontFamily: 'var(--font-ui)',
                                cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                        >
                            <span>mm/dd/yyyy</span>
                            <Calendar size={18} />
                        </button>
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
                                {new Date(finishedDate).toLocaleDateString()}
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
                                value={finishedDate}
                                onChange={(date) => {
                                    setFinishedDate(date);
                                    setStartedDate(date);
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
