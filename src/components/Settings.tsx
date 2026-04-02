import { useState, useEffect } from 'react';
import type { AppSettings } from '../types';
import { Save, RotateCcw, Server, Brain, Eye, Keyboard, Globe, Clipboard, Clock, Database, Shield, Moon, Sun, Trash2 } from 'lucide-react';

const DEFAULTS: AppSettings = {
  ollamaUrl: 'http://localhost:11434',
  modelName: 'llama3',
  trackKeystrokes: 'true',
  trackWebsite: 'true',
  trackClipboard: 'true',
  pollingInterval: '5000',
  contextSize: '50',
  retentionDays: '30',
  excludeList: '',
  theme: 'dark',
  onboardingComplete: 'true',
};

export default function Settings({ onThemeChange }: { onThemeChange: (theme: string) => void }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await window.electronAPI.getSettings();
        setSettings(s);
        onThemeChange(s.theme || 'dark');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    void load();
  }, [onThemeChange]);

  const update = (key: keyof AppSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (key === 'theme') onThemeChange(value);
  };

  const save = async () => {
    for (const [key, value] of Object.entries(settings)) {
      await window.electronAPI.updateSetting(key, value);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const reset = async () => {
    setSettings(DEFAULTS);
    for (const [key, value] of Object.entries(DEFAULTS)) {
      await window.electronAPI.updateSetting(key, value);
    }
    onThemeChange(DEFAULTS.theme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ settingKey }: { settingKey: keyof AppSettings }) => {
    const on = settings[settingKey] === 'true';
    return (
      <button onClick={() => update(settingKey, on ? 'false' : 'true')} style={{
        position: 'relative', width: '48px', height: '26px', borderRadius: '13px',
        background: on ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
        border: 'none', cursor: 'pointer', transition: 'background 0.2s ease', flexShrink: 0,
      }}>
        <span style={{
          position: 'absolute', top: '3px', left: on ? '25px' : '3px',
          width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s ease', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }} />
      </button>
    );
  };

  const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {icon} {label}
    </div>
  );

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading preferences…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1>Preferences</h1>
        <p>Customize how Aura tracks and interacts with your activity.</p>
      </header>

      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* LLM */}
        <section>
          <SectionHeader icon={<Brain size={15} />} label="LLM Configuration" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Server size={13} color="var(--text-muted)" /> Ollama Host URL</span>
              <input className="input-field" value={settings.ollamaUrl} onChange={e => update('ollamaUrl', e.target.value)} placeholder="http://localhost:11434" />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Brain size={13} color="var(--text-muted)" /> Model Name</span>
              <input className="input-field" value={settings.modelName} onChange={e => update('modelName', e.target.value)} placeholder="llama3" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Any model pulled via <code>ollama pull</code> (e.g. llama3, mistral, gemma2)</span>
            </label>
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Tracking Toggles */}
        <section>
          <SectionHeader icon={<Eye size={15} />} label="Activity Tracking" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {([
              { key: 'trackKeystrokes', Icon: Keyboard, label: 'Keystroke Logging', desc: 'Buffers keystrokes system-wide. Password fields are auto-masked.' },
              { key: 'trackWebsite', Icon: Globe, label: 'Website Tracking', desc: 'Log URLs of active browser tabs.' },
              { key: 'trackClipboard', Icon: Clipboard, label: 'Clipboard Tracking', desc: 'Record text copied to the clipboard.' },
            ] as const).map(({ key, Icon, label, desc }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem', background: 'var(--bg-surface)', borderRadius: '10px' }}>
                <Icon size={16} color="var(--text-muted)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                <Toggle settingKey={key} />
              </div>
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Privacy */}
        <section>
          <SectionHeader icon={<Shield size={15} />} label="Privacy & Data" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Shield size={13} color="var(--text-muted)" /> App / Domain Exclude List</span>
              <input className="input-field" value={settings.excludeList} onChange={e => update('excludeList', e.target.value)} placeholder="e.g. 1Password, keychain, id.apple.com" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comma-separated app names or domain keywords that will never be logged.</span>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Trash2 size={13} color="var(--text-muted)" /> Log Retention (days)</span>
              <input className="input-field" type="number" min={1} max={365} value={settings.retentionDays} onChange={e => update('retentionDays', e.target.value)} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logs older than this are automatically deleted on startup.</span>
            </label>
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Context & Performance */}
        <section>
          <SectionHeader icon={<Database size={15} />} label="Context & Performance" />
          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Clock size={13} color="var(--text-muted)" /> Polling Interval (ms)</span>
              <input className="input-field" type="number" min={1000} step={1000} value={settings.pollingInterval} onChange={e => update('pollingInterval', e.target.value)} />
            </label>
            <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, display: 'flex', gap: '0.4rem', alignItems: 'center' }}><Database size={13} color="var(--text-muted)" /> LLM Context Size</span>
              <input className="input-field" type="number" min={10} max={200} value={settings.contextSize} onChange={e => update('contextSize', e.target.value)} />
            </label>
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

        {/* Appearance */}
        <section>
          <SectionHeader icon={<Moon size={15} />} label="Appearance" />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(['dark', 'light'] as const).map(t => (
              <button key={t} onClick={() => update('theme', t)} style={{
                flex: 1, padding: '0.85rem', borderRadius: '10px', cursor: 'pointer',
                background: settings.theme === t ? 'rgba(20,184,166,0.1)' : 'var(--bg-surface)',
                border: `1px solid ${settings.theme === t ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
                color: settings.theme === t ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem',
              }}>
                {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                {t.charAt(0).toUpperCase() + t.slice(1)} Mode
              </button>
            ))}
          </div>
        </section>
      </div>

      <div style={{ paddingTop: '1rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button className="nav-item" style={{ padding: '0.6rem 1.2rem' }} onClick={reset}><RotateCcw size={15} /> Reset to Defaults</button>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem' }} onClick={save}>
          <Save size={15} />{saved ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
