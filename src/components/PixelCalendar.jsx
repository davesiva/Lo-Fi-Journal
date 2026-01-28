import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './PixelCalendar.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PixelCalendar({ value, onChange, minDate, onClose }) {
    // Initialize with selected date or today
    const [currentView, setCurrentView] = useState(() => {
        const d = value ? new Date(value) : new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const selectedDate = useMemo(() => value ? new Date(value) : null, [value]);

    // Calendar generation logic
    const calendarGrid = useMemo(() => {
        const year = currentView.getFullYear();
        const month = currentView.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Previous month filler
        const prevMonthDays = [];
        const daysInPrevMonth = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            prevMonthDays.push({
                day: daysInPrevMonth - i,
                type: 'prev',
                date: new Date(year, month - 1, daysInPrevMonth - i)
            });
        }

        // Current month days
        const currentDays = [];
        for (let i = 1; i <= daysInMonth; i++) {
            currentDays.push({
                day: i,
                type: 'current',
                date: new Date(year, month, i)
            });
        }

        // Next month filler
        const nextMonthDays = [];
        const totalSlots = 42; // 6 rows * 7 days
        const remainingSlots = totalSlots - (prevMonthDays.length + currentDays.length);
        for (let i = 1; i <= remainingSlots; i++) {
            nextMonthDays.push({
                day: i,
                type: 'next',
                date: new Date(year, month + 1, i)
            });
        }

        return [...prevMonthDays, ...currentDays, ...nextMonthDays];
    }, [currentView]);

    const handlePrevMonth = () => {
        setCurrentView(new Date(currentView.getFullYear(), currentView.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentView(new Date(currentView.getFullYear(), currentView.getMonth() + 1, 1));
    };

    const handleDateClick = (date) => {
        // Validation (e.g. minDate)
        if (minDate && date < new Date(new Date(minDate).setHours(0, 0, 0, 0))) {
            return;
        }

        // Return YYYY-MM-DD string format
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        onChange(`${year}-${month}-${day}`);
        if (onClose) onClose();
    };

    const isSelected = (date) => {
        if (!selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const isToday = (date) => {
        return date.toDateString() === new Date().toDateString();
    };

    const isDisabled = (date) => {
        if (!minDate) return false;
        return date < new Date(new Date(minDate).setHours(0, 0, 0, 0));
    };

    return (
        <div className="pixel-calendar">
            <div className="calendar-header">
                <button onClick={handlePrevMonth} className="nav-btn">
                    <ChevronLeft size={20} />
                </button>
                <span className="month-display">
                    {MONTHS[currentView.getMonth()]} {currentView.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="nav-btn">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="days-header">
                {DAYS.map(d => <div key={d} className="day-name">{d}</div>)}
            </div>

            <div className="calendar-grid">
                {calendarGrid.map((cell, idx) => (
                    <button
                        key={idx}
                        onClick={() => handleDateClick(cell.date)}
                        className={`day-cell ${cell.type} 
                            ${isSelected(cell.date) ? 'selected' : ''} 
                            ${isToday(cell.date) ? 'today' : ''}
                            ${isDisabled(cell.date) ? 'disabled' : ''}
                        `}
                        disabled={isDisabled(cell.date)}
                    >
                        {cell.day}
                    </button>
                ))}
            </div>
        </div>
    );
}
