import { useState } from 'react';
import JournalEditor from './components/JournalEditor';
import Dashboard from './components/Dashboard';
import VoiceRecorder from './components/VoiceRecorder';
import TimeCapsuleComposer from './components/TimeCapsuleComposer';
import TimeCapsuleViewer from './components/TimeCapsuleViewer';
import Bookshelf from './components/Bookshelf';

import bookshelfIcon from './assets/bookshelf-icon.png';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'write', 'voice', 'time-capsule', 'bookshelf'
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCapsule, setSelectedCapsule] = useState(null);

  const navigateToWrite = (date = null) => {
    setSelectedDate(date);
    setView('write');
  };

  const navigateHome = () => {
    setView('dashboard');
    setSelectedDate(null);
    setSelectedCapsule(null);
  };

  const navigateToBookshelf = () => {
    setView('bookshelf');
    setSelectedDate(null);
    setSelectedCapsule(null);
  };

  const navigateToCapsule = (capsule = null) => {
    setSelectedCapsule(capsule);
    setView('time-capsule');
  }

  return (
    <div className="app-container">
      <header className="app-header" style={{
        padding: '30px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid var(--border-color)',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1
            style={{ fontSize: '2.5rem', cursor: 'pointer', margin: 0 }}
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
        <button
          onClick={navigateToBookshelf}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            // opacity: view === 'bookshelf' ? 1 : 0.6, // REMOVED to fix mix-blend-mode stacking context
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
                marginLeft: '-2px', // Pull closer to text
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
          <Bookshelf onNavigateHome={navigateHome} />
        )}

        {view === 'write' && (
          <JournalEditor
            initialDate={selectedDate}
            onBack={navigateHome}
          />
        )}

        {view === 'voice' && (
          <VoiceRecorder onBack={navigateHome} />
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
  );
}

export default App;
