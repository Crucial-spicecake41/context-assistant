import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(app.getPath('userData'), 'context-logs.db');
const db = new Database(dbPath);

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      eventType TEXT NOT NULL,
      content TEXT NOT NULL,
      appName TEXT,
      tag TEXT
    )
  `);
  // Add tag column to existing DBs
  try { db.exec('ALTER TABLE activity_logs ADD COLUMN tag TEXT'); } catch { /* already exists */ }
  // Add duration column to existing DBs
  try { db.exec('ALTER TABLE activity_logs ADD COLUMN duration_seconds INTEGER'); } catch { /* already exists */ }
  // Add page_title column to existing DBs
  try { db.exec('ALTER TABLE activity_logs ADD COLUMN page_title TEXT'); } catch { /* already exists */ }

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS daily_summaries (
      date TEXT PRIMARY KEY,
      summary TEXT NOT NULL,
      generatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed defaults only if they don't exist yet
  const defaults: Record<string, string> = {
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
    onboardingComplete: 'false',
  };
  const insert = db.prepare('INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)');
  for (const [key, value] of Object.entries(defaults)) {
    insert.run(key, value);
  }
}

export function logActivity(
  eventType: 'window' | 'clipboard' | 'website' | 'keystrokes',
  content: string,
  appName?: string,
  tag?: string,
  durationSeconds?: number,
  pageTitle?: string
) {
  const stmt = db.prepare(`
    INSERT INTO activity_logs (eventType, content, appName, tag, duration_seconds, page_title)
    VALUES (@eventType, @content, @appName, @tag, @duration_seconds, @page_title)
  `);
  stmt.run({
    eventType, content,
    appName: appName || null,
    tag: tag || null,
    duration_seconds: durationSeconds || null,
    page_title: pageTitle || null,
  });
}

export function getTimeline(limit = 100) {
  const stmt = db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT ?');
  return stmt.all(limit);
}

export function getTimelineForRange(hours: number, limit = 200) {
  const stmt = db.prepare(`
    SELECT * FROM activity_logs
    WHERE timestamp >= datetime('now', ?)
    ORDER BY timestamp DESC LIMIT ?
  `);
  return stmt.all(`-${hours} hours`, limit);
}

export function searchTimeline(query: string) {
  const stmt = db.prepare("SELECT * FROM activity_logs WHERE content LIKE ? OR appName LIKE ? ORDER BY timestamp DESC LIMIT 100");
  return stmt.all('%' + query + '%', '%' + query + '%');
}

export function tagActivity(id: number, tag: string) {
  db.prepare('UPDATE activity_logs SET tag = ? WHERE id = ?').run(tag, id);
}

export function pruneOldLogs(days: number) {
  db.prepare(`DELETE FROM activity_logs WHERE timestamp < datetime('now', ?)`).run(`-${days} days`);
}

export function getStatsSummary(hours: number) {
  const windowSince = `-${hours} hours`;
  const appTime = db.prepare(`
    SELECT appName,
           COUNT(*) as count,
           COALESCE(SUM(duration_seconds), COUNT(*) * 5) as totalSeconds
    FROM activity_logs
    WHERE eventType = 'window' AND timestamp >= datetime('now', ?)
    GROUP BY appName ORDER BY totalSeconds DESC LIMIT 10
  `).all(windowSince);

  const siteTime = db.prepare(`
    SELECT content, appName,
           COUNT(*) as count,
           COALESCE(SUM(duration_seconds), COUNT(*) * 5) as totalSeconds
    FROM activity_logs
    WHERE eventType = 'website' AND timestamp >= datetime('now', ?)
    GROUP BY content ORDER BY totalSeconds DESC LIMIT 10
  `).all(windowSince);

  const totalKeystrokes = (db.prepare(`
    SELECT SUM(LENGTH(content)) as total FROM activity_logs
    WHERE eventType = 'keystrokes' AND timestamp >= datetime('now', ?)
  `).get(windowSince) as { total: number | null })?.total || 0;

  const eventCounts = db.prepare(`
    SELECT eventType, COUNT(*) as count FROM activity_logs
    WHERE timestamp >= datetime('now', ?)
    GROUP BY eventType
  `).all(windowSince) as { eventType: string; count: number }[];

  // Per-category breakdown combining BOTH window and website events
  const categoryStats = db.prepare(`
    SELECT
      COALESCE(tag, 'system') as tag,
      COUNT(*) as count,
      COALESCE(SUM(duration_seconds), COUNT(*) * 5) as totalSeconds
    FROM activity_logs
    WHERE eventType IN ('window', 'website')
      AND timestamp >= datetime('now', ?)
    GROUP BY COALESCE(tag, 'system')
    ORDER BY totalSeconds DESC
  `).all(windowSince) as { tag: string; count: number; totalSeconds: number }[];

  return { appTime, siteTime, totalKeystrokes, eventCounts, categoryStats };
}

export function exportLogs(): object[] {
  return db.prepare('SELECT * FROM activity_logs ORDER BY timestamp DESC').all() as object[];
}

// --- Chat History ---
export function getChatHistory(sessionId: string) {
  return db.prepare('SELECT * FROM conversations WHERE sessionId = ? ORDER BY timestamp ASC').all(sessionId);
}

export function saveChatMessage(sessionId: string, role: string, content: string) {
  db.prepare('INSERT INTO conversations (sessionId, role, content) VALUES (?, ?, ?)').run(sessionId, role, content);
}

export function clearChatSession(sessionId: string) {
  db.prepare('DELETE FROM conversations WHERE sessionId = ?').run(sessionId);
}

export function getRecentSessions(limit = 10) {
  return db.prepare(`
    SELECT sessionId, MIN(timestamp) as startTime, MAX(timestamp) as lastTime, COUNT(*) as messageCount
    FROM conversations GROUP BY sessionId ORDER BY lastTime DESC LIMIT ?
  `).all(limit);
}

// --- Daily Summaries ---
export function getDailySummary(date: string) {
  return db.prepare('SELECT * FROM daily_summaries WHERE date = ?').get(date) as { date: string; summary: string } | undefined;
}

export function saveDailySummary(date: string, summary: string) {
  db.prepare('INSERT OR REPLACE INTO daily_summaries (date, summary) VALUES (?, ?)').run(date, summary);
}

// --- Settings ---
export interface AppSettings {
  ollamaUrl: string;
  modelName: string;
  trackKeystrokes: string;
  trackWebsite: string;
  trackClipboard: string;
  pollingInterval: string;
  contextSize: string;
  retentionDays: string;
  excludeList: string;
  theme: string;
  onboardingComplete: string;
}

export function getSettings(): AppSettings {
  const rows = db.prepare('SELECT key, value FROM app_settings').all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map(r => [r.key, r.value])) as unknown as AppSettings;
}

export function updateSetting(key: string, value: string) {
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}
