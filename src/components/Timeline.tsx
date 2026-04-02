import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Copy, AppWindow, Globe, Keyboard, Search, Download } from 'lucide-react';
import type { LogEntry } from '../types';
import { getCategoryMeta } from '../categoryMeta';


type TimeRange = 'all' | '1h' | 'today' | 'week';

const BORDER_COLORS: Record<string, string> = {
  window: 'var(--primary)',
  website: '#3b82f6',
  keystrokes: '#8b5cf6',
  clipboard: 'rgba(255,255,255,0.2)',
};

export default function Timeline() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<TimeRange>('all');
  const [searching, setSearching] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      let data: LogEntry[];
      if (query.trim()) {
        setSearching(true);
        data = await window.electronAPI.searchTimeline(query.trim());
        setSearching(false);
      } else if (range === '1h') {
        data = await window.electronAPI.getTimelineRange(1);
      } else if (range === 'today') {
        data = await window.electronAPI.getTimelineRange(24);
      } else if (range === 'week') {
        data = await window.electronAPI.getTimelineRange(168);
      } else {
        data = await window.electronAPI.getTimeline(200);
      }
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  }, [query, range]);

  useEffect(() => {
    const id = setTimeout(() => { void fetchLogs(); }, query ? 350 : 0);
    return () => clearTimeout(id);
  }, [fetchLogs, query]);

  useEffect(() => {
    if (query) return; // Don't auto-refresh while searching
    const interval = setInterval(() => { void fetchLogs(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, query]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const exportLogs = async (format: 'csv' | 'json') => {
    await window.electronAPI.exportLogs(format);
  };

  const RANGES: { key: TimeRange; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: '1h', label: 'Last Hour' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '1.25rem' }}>
        <h1>Activity Timeline</h1>
        <p>Live stream of your desktop context, keystrokes, and clipboard.</p>
      </header>

      {/* Controls bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input-field"
            style={{ paddingLeft: '2.2rem', width: '100%' }}
            placeholder="Search activity…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        {/* Range pills */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {RANGES.map(r => (
            <button
              key={r.key}
              onClick={() => { setRange(r.key); setQuery(''); }}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '99px',
                border: '1px solid var(--border-subtle)',
                background: range === r.key && !query ? 'var(--primary)' : 'var(--bg-surface)',
                color: range === r.key && !query ? '#000' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                transition: 'all 0.15s',
              }}
            >{r.label}</button>
          ))}
        </div>

        {/* Export */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="nav-item" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }} onClick={() => exportLogs('csv')}>
            <Download size={13} /> CSV
          </button>
          <button className="nav-item" style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }} onClick={() => exportLogs('json')}>
            <Download size={13} /> JSON
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {searching && <div style={{ color: 'var(--text-muted)', padding: '1rem', textAlign: 'center' }}>Searching…</div>}
        {!searching && logs.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
            <Clock size={28} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p>{query ? `No results for "${query}"` : 'No activity recorded yet.'}</p>
          </div>
        ) : (
          (() => {
            let lastDate = '';
            const items: React.ReactElement[] = [];
            for (const log of logs) {
              const dateLabel = formatDate(log.timestamp);
              if (dateLabel !== lastDate) {
                lastDate = dateLabel;
                items.push(
                  <div key={`date-${log.id}`} style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0 0.25rem' }}>
                    {dateLabel}
                  </div>
                );
              }
              items.push(
                <div key={log.id} style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  background: 'var(--bg-surface)',
                  borderRadius: '10px',
                  borderLeft: `3px solid ${BORDER_COLORS[log.eventType] || 'var(--border-subtle)'}`,
                  transition: 'background 0.15s',
                }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', width: '76px', flexShrink: 0, fontWeight: 500, paddingTop: '2px' }}>
                    {formatTime(log.timestamp)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', flexShrink: 0 }}>
                    {log.eventType === 'window' ? <AppWindow size={15} color="var(--primary)" /> :
                     log.eventType === 'website' ? <Globe size={15} color="#3b82f6" /> :
                     log.eventType === 'keystrokes' ? <Keyboard size={15} color="#8b5cf6" /> :
                     <Copy size={15} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {log.eventType === 'window' && log.appName ? log.appName :
                       log.eventType === 'website' ? (log.appName || 'Browser') :
                       log.eventType === 'keystrokes' ? 'Typed Text' : 'Clipboard Copy'}
                      {log.tag && (() => { const m = getCategoryMeta(log.tag); return <span style={{ fontSize: '0.68rem', background: `${m.color}22`, color: m.color, padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>{m.emoji} {m.label}</span>; })()}
                      {log.duration_seconds != null && log.duration_seconds > 0 && (log.eventType === 'window' || log.eventType === 'website') && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          ⏱ {log.duration_seconds >= 60
                            ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s`
                            : `${log.duration_seconds}s`}
                        </span>
                      )}
                    </div>

                    <div style={{
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: (log.eventType === 'clipboard' || log.eventType === 'keystrokes') ? 'monospace' : 'inherit',
                      background: (log.eventType === 'clipboard' || log.eventType === 'keystrokes') ? 'rgba(0,0,0,0.2)' : 'transparent',
                      padding: (log.eventType === 'clipboard' || log.eventType === 'keystrokes') ? '0.3rem 0.5rem' : '0',
                      borderRadius: '4px',
                    }}>
                      {/* For website events: show page title first, then URL as fine subtitle */}
                      {log.eventType === 'website' && log.page_title ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.page_title}
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.content}
                          </span>
                        </div>
                      ) : log.content}
                    </div>
                  </div>

                </div>
              );
            }
            return items;
          })()
        )}
      </div>
    </div>
  );
}
