import { useState, useEffect, useCallback } from 'react';
import { Activity, Bot, Settings as SettingsIcon, Database, BarChart2 } from 'lucide-react';
import Timeline from './components/Timeline';
import AIChat from './components/AIChat';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';

type Tab = 'timeline' | 'chat' | 'dashboard' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('timeline');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const s = await window.electronAPI.getSettings();
        document.documentElement.setAttribute('data-theme', s.theme || 'dark');
        if (s.onboardingComplete !== 'true') {
          setShowOnboarding(true);
        }
      } catch (e) { console.error(e); }
      finally { setReady(true); }
    };
    void init();
  }, []);

  const handleThemeChange = useCallback((t: string) => {
    document.documentElement.setAttribute('data-theme', t);
  }, []);

  if (!ready) return null;

  return (
    <>
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
            <Database size={22} />
            <span>Aura Context</span>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
            {([
              { key: 'timeline', Icon: Activity, label: 'Timeline Log' },
              { key: 'chat', Icon: Bot, label: 'Assistant Chat' },
              { key: 'dashboard', Icon: BarChart2, label: 'Dashboard' },
            ] as const).map(({ key, Icon, label }) => (
              <button
                key={key}
                className={`nav-item ${activeTab === key ? 'active' : ''}`}
                onClick={() => setActiveTab(key)}
              >
                <Icon size={17} /> {label}
              </button>
            ))}
          </nav>

          <div>
            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              style={{ width: '100%' }}
              onClick={() => setActiveTab('settings')}
            >
              <SettingsIcon size={17} /> Preferences
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeTab === 'timeline' && <Timeline />}
          {activeTab === 'chat' && <AIChat />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'settings' && <Settings onThemeChange={handleThemeChange} />}
        </main>
      </div>
    </>
  );
}

export default App;
