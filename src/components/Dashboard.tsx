import { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { BarChart2, Keyboard, Globe, FileText, Zap } from 'lucide-react';
import type { StatsSummary } from '../types';
import { getCategoryMeta } from '../categoryMeta';


const RANGE_OPTIONS = [
  { label: 'Last Hour', hours: 1 },
  { label: 'Today', hours: 24 },
  { label: 'This Week', hours: 168 },
];


export default function Dashboard() {
  const [rangeIdx, setRangeIdx] = useState(1);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const hours = RANGE_OPTIONS[rangeIdx].hours;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const s = await window.electronAPI.getStats(hours);
        setStats(s);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    void load();
  }, [hours]);

  useEffect(() => {
    const loadSummary = async () => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const s = await window.electronAPI.getDailySummary(today);
        if (s) setSummary(s.summary);
      } catch (e) { console.error(e); }
    };
    void loadSummary();
  }, []);

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const settings = await window.electronAPI.getSettings();
      const logs = await window.electronAPI.getTimelineRange(24, 100);
      const ctx = logs.map(l => `[${l.eventType}] ${l.appName || ''}: ${l.content}`).join('\n');
      const prompt = `Summarize the user's computer activity from today in 3-5 sentences, focusing on what they worked on, websites visited, and topics typed. Be concise and insightful.\n\nActivity:\n${ctx}\n\nSummary:`;

      const res = await fetch(`${settings.ollamaUrl}/api/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: settings.modelName, prompt, stream: false }),
      });
      const data = await res.json() as { response: string };
      const today = new Date().toISOString().split('T')[0];
      await window.electronAPI.saveDailySummary(today, data.response);
      setSummary(data.response);
    } catch (e) { console.error(e); }
    finally { setSummaryLoading(false); }
  };

  // Per-category breakdown: comes from DB query covering BOTH window + website events
  const categoryBreakdown = (stats?.categoryStats || []).map(c => ({
    cat: c.tag,
    count: c.count,
    totalSeconds: c.totalSeconds,
    meta: getCategoryMeta(c.tag),
  }));

  const totalCatSeconds = categoryBreakdown.reduce((s, c) => s + c.totalSeconds, 0);


  // Productivity score: time-weighted average
  const productivityScore = totalCatSeconds > 0
    ? Math.round(
        categoryBreakdown.reduce((s, c) => s + c.totalSeconds * c.meta.productive, 0)
        / totalCatSeconds * 100
      )
    : 0;

  const pieData = categoryBreakdown.map(c => ({ name: c.meta.label, value: c.totalSeconds, color: c.meta.color }));


  const siteBarData = (() => {
    const hostnameMap = new Map<string, number>();
    for (const s of (stats?.siteTime || [])) {
      if (!s.content) continue;
      let host: string;
      try { host = new URL(s.content).hostname; }
      catch { host = s.content.slice(0, 30); }
      host = host.replace(/^www\./, '');
      hostnameMap.set(host, (hostnameMap.get(host) || 0) + s.count);
    }
    return Array.from(hostnameMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  })();

  const wordsTyped = Math.round((stats?.totalKeystrokes || 0) / 5);
  const totalEvents = (stats?.eventCounts || []).reduce((a, e) => a + e.count, 0);

  const scoreColor = productivityScore >= 70 ? '#14b8a6' : productivityScore >= 40 ? '#f59e0b' : productivityScore >= 0 ? '#ef4444' : '#be123c';


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Your activity at a glance.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {RANGE_OPTIONS.map((r, i) => (
            <button key={i} onClick={() => setRangeIdx(i)} style={{
              padding: '0.35rem 0.85rem', borderRadius: '99px',
              border: '1px solid var(--border-subtle)',
              background: rangeIdx === i ? 'var(--primary)' : 'var(--bg-surface)',
              color: rangeIdx === i ? '#000' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600
            }}>{r.label}</button>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Stat Cards + Productivity Score */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {[
            { icon: <BarChart2 size={18} color="var(--primary)" />, label: 'Total Events', value: totalEvents.toLocaleString() },
            { icon: <Keyboard size={18} color="#8b5cf6" />, label: 'Words Typed', value: wordsTyped.toLocaleString() },
            { icon: <Globe size={18} color="#3b82f6" />, label: 'Sites Visited', value: (siteBarData.length).toString() },
            { icon: <Zap size={18} color={scoreColor} />, label: 'Productivity Score', value: `${productivityScore}%` },
          ].map((card, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{card.icon}</div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: i === 3 ? scoreColor : 'var(--text-main)' }}>{loading ? '—' : card.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Summary Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <FileText size={16} color="var(--primary)" /> Today's AI Summary
            </div>
            <button className="btn-primary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.9rem' }} onClick={generateSummary} disabled={summaryLoading}>
              {summaryLoading ? 'Generating…' : summary ? '↺ Regenerate' : '✦ Generate'}
            </button>
          </div>
          {summary ? (
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>{summary}</p>
          ) : (
            <p style={{ color: 'var(--text-muted)', opacity: 0.5, fontSize: '0.85rem' }}>Click "Generate" to get an AI summary of your day's activity using your local Ollama model.</p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Category Breakdown Donut */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Productivity Breakdown</div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                      {pieData.map((d, idx) => <Cell key={idx} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f4f4f5', fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                  {categoryBreakdown.slice(0, 6).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.meta.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ color: 'var(--text-muted)', flex: 1 }}>{c.meta.emoji} {c.meta.label}</span>
                      <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
                        {totalCatSeconds > 0 ? `${Math.round(c.totalSeconds / totalCatSeconds * 100)}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>No data yet</div>}
          </div>

          {/* Top Sites Bar */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Top Websites</div>
            {siteBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={siteBarData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#a1a1aa' }} width={110} />
                  <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f4f4f5', fontSize: '0.8rem' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>No browsing data yet</div>}
          </div>
        </div>

        {/* Category Time Bars */}
        {categoryBreakdown.length > 0 && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>Time by Category</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {categoryBreakdown.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '110px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <span>{c.meta.emoji}</span> {c.meta.label}
                  </div>
                  <div style={{ flex: 1, height: '8px', borderRadius: '99px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${totalCatSeconds > 0 ? (c.totalSeconds / categoryBreakdown[0].totalSeconds) * 100 : 0}%`,
                      background: c.meta.color,
                      borderRadius: '99px',
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{ width: '40px', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {totalCatSeconds > 0 ? `${Math.round(c.totalSeconds / totalCatSeconds * 100)}%` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

