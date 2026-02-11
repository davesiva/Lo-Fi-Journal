import { useState, useRef, useEffect } from 'react';
import JournalEditor from './components/JournalEditor';
import Dashboard from './components/Dashboard';
import VoiceRecorder from './components/VoiceRecorder';
import TimeCapsuleComposer from './components/TimeCapsuleComposer';
import TimeCapsuleViewer from './components/TimeCapsuleViewer';
import Bookshelf from './components/Bookshelf';

import BookDetail from './components/BookDetail';
import bookshelfIcon from './assets/bookshelf-icon.png';
import './styles/ModernTheme.css';
import './styles/MinimalTheme.css';

import { ChevronDown } from 'lucide-react';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'write', 'voice', 'time-capsule', 'bookshelf', 'book-detail'
  const [selectedDate, setSelectedDate] = useState(null);
  const [initialEditorContent, setInitialEditorContent] = useState('');
  const [selectedCapsule, setSelectedCapsule] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef(null);

  const navigateToWrite = (date = null, content = '') => {
    setSelectedDate(date);
    setInitialEditorContent(content);
    setView('write');
  };

  const navigateHome = () => {
    setView('dashboard');
    setSelectedDate(null);
    setInitialEditorContent('');
    setSelectedCapsule(null);
    setSelectedBook(null); // Clear selected book on home navigation
  };

  const navigateToBookshelf = () => {
    setView('bookshelf');
    setSelectedDate(null);
    setSelectedCapsule(null);
    setSelectedBook(null);
  };

  const navigateToBook = (bookId) => {
    setSelectedBook(bookId);
    setView('book-detail');
  };

  const navigateToCapsule = (capsule = null) => {
    setSelectedCapsule(capsule);
    setView('time-capsule');
  }

  // Initialize theme from localStorage or default to 'modern'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ttyl-theme') || 'modern';
  });

  // Persist theme changes
  useEffect(() => {
    localStorage.setItem('ttyl-theme', theme);
  }, [theme]);

  // Close theme menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setThemeMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getThemeClass = () => {
    if (theme === 'modern') return 'modern-theme';
    // Minimal theme is Design 2 (Dark Mode Only)
    if (theme === 'minimal') return 'minimal-theme';
    return '';
  };

  const getThemeLabel = () => {
    if (theme === 'modern') return 'Modern';
    if (theme === 'minimal') return 'Dark';
    return 'Classic';
  }

  return (
    <div className={getThemeClass()} style={{ minHeight: '100vh' }}>
      <div className="app-container">
        <header className="app-header" style={{
          padding: '30px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '40px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1
              className="app-logo"
              onClick={navigateHome}
            >
              ttyl
            </h1>
            <p style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              margin: 0,
              fontStyle: 'italic'
            }}>
              notes for now & later
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>

            {/* Theme Dropdown */}
            <div style={{ position: 'relative' }} ref={themeMenuRef}>
              <button
                className="theme-dropdown-btn"
                onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  padding: '5px 10px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-ui)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderRadius: '6px'
                }}
              >
                {getThemeLabel()} <ChevronDown size={14} />
              </button>

              {themeMenuOpen && (
                <div className="dropdown-menu" style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  zIndex: 100,
                  minWidth: '140px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                  <button
                    onClick={() => { setTheme('default'); setThemeMenuOpen(false); }}
                    style={{
                      fontWeight: theme === 'default' ? 'bold' : 'normal',
                      backgroundColor: theme === 'default' ? 'rgba(127, 127, 127, 0.1)' : 'transparent'
                    }}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => { setTheme('modern'); setThemeMenuOpen(false); }}
                    style={{
                      fontWeight: theme === 'modern' ? 'bold' : 'normal',
                      backgroundColor: theme === 'modern' ? 'rgba(127, 127, 127, 0.1)' : 'transparent'
                    }}
                  >
                    Modern
                  </button>
                  <button
                    onClick={() => { setTheme('minimal'); setThemeMenuOpen(false); }}
                    style={{
                      fontWeight: theme === 'minimal' ? 'bold' : 'normal',
                      backgroundColor: theme === 'minimal' ? 'rgba(127, 127, 127, 0.1)' : 'transparent'
                    }}
                  >
                    Dark
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={navigateToBookshelf}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textDecoration: view === 'bookshelf' ? 'underline' : 'none',
                color: view === 'bookshelf' ? 'var(--text-color)' : 'var(--text-secondary)', // Text fade
                display: 'flex',
                alignItems: 'center',
                gap: '0px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                Bookshelf
                <img
                  src={bookshelfIcon}
                  alt=""
                  style={{
                    height: '24px',
                    width: 'auto',
                    marginLeft: '4px', // Add space
                    imageRendering: 'pixelated',
                    // Use brightness to fade the black to gray, avoid opacity logic issues
                    filter: view === 'bookshelf' ? 'none' : 'contrast(1.2) brightness(1.5) grayscale(100%)',
                    mixBlendMode: 'multiply',
                    position: 'relative',
                    top: '0px' // Down 1px from -1px
                  }}
                />
              </span>
            </button>
          </div>
        </header>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {view === 'dashboard' && (
            <Dashboard
              onNavigate={navigateToWrite}
              onNavigateVoice={() => setView('voice')}
              onNavigateCapsule={navigateToCapsule}
            />
          )}

          {view === 'bookshelf' && (
            <Bookshelf onNavigateHome={navigateHome} onNavigateBook={navigateToBook} />
          )}

          {view === 'book-detail' && selectedBook && (
            <BookDetail bookId={selectedBook} onBack={navigateToBookshelf} />
          )}

          {view === 'write' && (
            <JournalEditor
              initialDate={selectedDate}
              initialContent={initialEditorContent}
              onBack={navigateHome}
            />
          )}

          {view === 'voice' && (
            <VoiceRecorder onBack={navigateHome} theme={theme} />
          )}

          {view === 'time-capsule' && (
            selectedCapsule ? (
              <TimeCapsuleViewer entry={selectedCapsule} onBack={navigateHome} />
            ) : (
              <TimeCapsuleComposer onBack={navigateHome} />
            )
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
