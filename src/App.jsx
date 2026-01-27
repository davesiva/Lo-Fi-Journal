import { useState } from 'react';
import JournalEditor from './components/JournalEditor';
import Dashboard from './components/Dashboard';
import VoiceRecorder from './components/VoiceRecorder';

function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'write', 'voice'
  const [selectedDate, setSelectedDate] = useState(null);

  const navigateToWrite = (date = null) => {
    setSelectedDate(date);
    setView('write');
  };

  const navigateHome = () => {
    setView('dashboard');
    setSelectedDate(null);
  };

  return (
    <div className="app-container">
      <header className="app-header" style={{
        padding: '30px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '2px solid var(--border-color)',
        marginBottom: '40px'
      }}>
        <h1
          style={{ fontSize: '2.5rem', cursor: 'pointer' }}
          onClick={navigateHome}
        >
          ttyl
        </h1>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {view === 'dashboard' && (
          <Dashboard
            onNavigate={navigateToWrite}
            onNavigateVoice={() => setView('voice')}
          />
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
      </main>
    </div>
  );
}

export default App;
