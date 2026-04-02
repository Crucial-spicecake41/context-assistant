import { useState } from 'react';
import { CheckCircle, XCircle, ArrowRight, Brain, Shield, Activity } from 'lucide-react';

const STEPS = ['welcome', 'ollama', 'permissions', 'done'] as const;
type Step = typeof STEPS[number];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>('welcome');
  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');

  const checkOllama = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
      setOllamaStatus(res.ok ? 'ok' : 'fail');
    } catch { setOllamaStatus('fail'); }
  };

  const finish = async () => {
    await window.electronAPI.updateSetting('ollamaUrl', ollamaUrl);
    await window.electronAPI.updateSetting('onboardingComplete', 'true');
    onComplete();
  };

  const stepIdx = STEPS.indexOf(step);
  const progress = ((stepIdx) / (STEPS.length - 1)) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(9,9,11,0.97)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: '520px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Progress */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--primary)', transition: 'width 0.4s ease', borderRadius: '99px' }} />
        </div>

        {/* Welcome */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'rgba(20,184,166,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={36} color="var(--primary)" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome to Aura Context</h1>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>Your private, local AI that understands your computer activity — what you open, type, browse — all stored on-device, never in the cloud.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', textAlign: 'left', width: '100%' }}>
              {[
                { icon: <Shield size={18} color="var(--primary)" />, text: '100% local — nothing leaves your machine' },
                { icon: <Activity size={18} color="#3b82f6" />, text: 'Tracks apps, websites & keystrokes in the background' },
                { icon: <Brain size={18} color="#8b5cf6" />, text: 'Powered by your local Ollama LLM' },
              ].map((f, i) => (
                <div key={i} className="glass-panel" style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {f.icon}
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.text}</p>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem' }} onClick={() => setStep('ollama')}>
              Get Started <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Ollama Check */}
        {step === 'ollama' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>Connect to Ollama</h2>
              <p style={{ color: 'var(--text-muted)' }}>Aura uses a locally running <strong>Ollama</strong> instance for all AI features. Make sure it's running before proceeding.</p>
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ollama URL</label>
              <input className="input-field" value={ollamaUrl} onChange={e => setOllamaUrl(e.target.value)} placeholder="http://localhost:11434" />
              <button className="btn-primary" onClick={checkOllama} disabled={ollamaStatus === 'checking'} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {ollamaStatus === 'checking' ? 'Checking…' : 'Test Connection'}
              </button>
              {ollamaStatus === 'ok' && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}><CheckCircle size={16} /> Ollama is reachable!</div>}
              {ollamaStatus === 'fail' && (
                <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 600 }}>
                    <XCircle size={16} /> Cannot reach Ollama. Is it installed?
                  </div>
                  <div style={{ color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: '1.5rem' }}>
                    <p style={{ marginBottom: '0.5rem' }}>1. Download it from <a href="#" onClick={(e) => { e.preventDefault(); window.electronAPI ? window.electronAPI.openExternal?.('https://ollama.com/download') : window.open('https://ollama.com/download'); }} style={{ color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}>ollama.com/download</a></p>
                    <p style={{ marginBottom: '0.5rem' }}>2. Open the Ollama app to start the background server.</p>
                    <p>3. Run this in your terminal: <code style={{ background: 'rgba(0,0,0,0.5)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>ollama run llama3</code></p>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="nav-item" onClick={() => setStep('welcome')}>← Back</button>
              <button className="btn-primary" onClick={() => setStep('permissions')}>
                {ollamaStatus === 'ok' ? 'Continue' : 'Skip for now'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Permissions */}
        {step === 'permissions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>macOS Permissions</h2>
              <p style={{ color: 'var(--text-muted)' }}>For full tracking functionality, Aura needs two macOS permissions:</p>
            </div>
            {[
              {
                title: 'Accessibility Access',
                desc: 'Required to detect which app is currently active and read window titles.',
                path: 'System Settings → Privacy & Security → Accessibility',
                color: 'var(--primary)',
                onRequest: () => window.electronAPI?.requestAccessibility?.()
              },
              {
                title: 'Input Monitoring',
                desc: 'Required for the global keystroke logger to capture typed text.',
                path: 'System Settings → Privacy & Security → Input Monitoring',
                color: '#8b5cf6',
                onRequest: () => window.electronAPI?.requestInputMonitoring?.()
              },
            ].map((p, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1.25rem', borderLeft: `3px solid ${p.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <button onClick={p.onRequest} style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', background: p.color, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Request Access</button>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{p.desc}</p>
                <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>{p.path}</code>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="nav-item" onClick={() => setStep('ollama')}>← Back</button>
              <button className="btn-primary" onClick={() => setStep('done')}>I've set permissions <ArrowRight size={16} /></button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(20,184,166,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={36} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>You're all set!</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>Aura is now tracking your activity in the background. Head to the Dashboard to see your first insights, or open the Assistant Chat to ask questions.</p>
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }} onClick={finish}>
              Open Aura Context ✦
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
