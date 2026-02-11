import { useState, useEffect } from 'react';
import { update } from 'idb-keyval';
import { BookOpen, Flame, TrendingUp, ChevronRight, Plus } from 'lucide-react';
import './ReadingAnalytics.css';

export default function ReadingAnalytics({ books, onNavigateBook }) {
    const [currentBook, setCurrentBook] = useState(null);
    const [streak, setStreak] = useState(0);
    const [pagesReadThisYear, setPagesReadThisYear] = useState(0);
    const [goal] = useState(30); // Hardcoded goal for now

    useEffect(() => {
        calculateStats();
    }, [books]);

    const calculateStats = () => {
        // 1. Find Current Book (Most recently started but not finished)
        const reading = books.filter(b => !b.finishedDate && b.startedDate).sort((a, b) => new Date(b.startedDate) - new Date(a.startedDate));
        setCurrentBook(reading[0] || null);

        // 2. Simple Streak Calculation
        setStreak(books.length > 0 ? 12 : 0); // Mock per design for now

        // 3. Pages Read (Annual)
        const thisYear = new Date().getFullYear();
        const finishedPages = books
            .filter(b => b.finishedDate && new Date(b.finishedDate).getFullYear() === thisYear)
            .reduce((acc, b) => acc + (b.totalPages || 0), 0);

        const currentPages = books
            .filter(b => !b.finishedDate)
            .reduce((acc, b) => acc + (b.currentPage || 0), 0);

        setPagesReadThisYear(finishedPages + currentPages);
    };

    const getProgressPercentage = () => {
        if (!currentBook || !currentBook.totalPages) return 0;
        return Math.round((currentBook.currentPage / currentBook.totalPages) * 100);
    };

    return (
        <div className="analytics-container">
            <div className="analytics-grid">

                {/* Reading Goal Card */}
                <div className="analytics-card goal-card">
                    <div className="goal-card-header">
                        <div>
                            <h3 className="goal-title">Reading Goal</h3>
                            <div className="goal-percentage">
                                {Math.round((books.filter(b => b.finishedDate).length / goal) * 100)}%
                            </div>
                            <span className="goal-status">On Track</span>
                        </div>
                        <span className="goal-tag">Yearly</span>
                    </div>
                    <div className="goal-footer">
                        {books.filter(b => b.finishedDate).length} of {goal} books read
                    </div>
                    {/* Decorative Ring Partial */}
                    <div className="goal-decoration"></div>
                </div>

                {/* Streak Card */}
                <div className="analytics-card streak-card">
                    <div className="streak-header">
                        <h3 className="streak-title">Streak</h3>
                        <Flame size={20} className="streak-icon" />
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        <div className="streak-number">{streak}</div>
                        <div className="streak-label">Days Left</div>
                    </div>

                    {/* Wave decoration */}
                    <svg viewBox="0 0 100 20" className="streak-wave">
                        <path d="M0,10 Q25,20 50,10 T100,10" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            {/* Current Session Card */}
            <div
                className="analytics-card session-card"
                onClick={() => currentBook && onNavigateBook(currentBook.id)}
            >

                <div className="session-header">
                    <span className="session-label">Current Session</span>
                    <span className="session-time-left">
                        {(currentBook?.totalPages && currentBook?.currentPage) ? Math.round((currentBook.totalPages - currentBook.currentPage) / 20) + ' hr left' : ''}
                    </span>
                </div>

                {currentBook ? (
                    <div className="session-content">
                        {/* Book Cover */}
                        <div
                            className="session-book-cover"
                            style={{ backgroundImage: `url(${currentBook.coverUrl})` }}
                        >
                            {!currentBook.coverUrl && <BookOpen size={20} color="#555" />}
                        </div>

                        <div className="session-info">
                            <h3 className="session-book-title">{currentBook.title}</h3>
                            <p className="session-book-author">{currentBook.author}</p>

                            {/* Progress */}
                            <div className="session-progress-bar">
                                <div
                                    className="session-progress-fill"
                                    style={{ width: `${getProgressPercentage()}%` }}
                                ></div>
                            </div>
                            <div className="session-stats">
                                <span>Page {currentBook.currentPage || 0}</span>
                                <span>{getProgressPercentage()}%</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="session-empty">
                        <BookOpen size={30} style={{ marginBottom: '10px' }} />
                        <p>Start reading a book to track it here.</p>
                    </div>
                )}

                {/* Background Blur Effect */}
                {currentBook?.coverUrl && (
                    <div
                        className="session-blur-bg"
                        style={{ backgroundImage: `url(${currentBook.coverUrl})` }}
                    ></div>
                )}
            </div>
        </div>
    );
}
