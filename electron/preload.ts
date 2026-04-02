import { contextBridge, ipcRenderer, shell } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Timeline
  getTimeline: (limit = 100) => ipcRenderer.invoke('get-timeline', limit),
  getTimelineRange: (hours: number, limit?: number) => ipcRenderer.invoke('get-timeline-range', hours, limit),
  searchTimeline: (query: string) => ipcRenderer.invoke('search-timeline', query),
  tagActivity: (id: number, tag: string) => ipcRenderer.invoke('tag-activity', id, tag),
  getStats: (hours: number) => ipcRenderer.invoke('get-stats', hours),
  exportLogs: (format: 'csv' | 'json') => ipcRenderer.invoke('export-logs', format),

  // Chat history
  getChatHistory: (sessionId: string) => ipcRenderer.invoke('get-chat-history', sessionId),
  saveChatMessage: (sessionId: string, role: string, content: string) => ipcRenderer.invoke('save-chat-message', sessionId, role, content),
  clearChatSession: (sessionId: string) => ipcRenderer.invoke('clear-chat-session', sessionId),
  getRecentSessions: () => ipcRenderer.invoke('get-recent-sessions'),

  // Daily summary
  getDailySummary: (date: string) => ipcRenderer.invoke('get-daily-summary', date),
  saveDailySummary: (date: string, summary: string) => ipcRenderer.invoke('save-daily-summary', date, summary),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSetting: (key: string, value: string) => ipcRenderer.invoke('update-setting', key, value),
  
  // Utils
  openExternal: (url: string) => shell.openExternal(url),
  requestAccessibility: () => ipcRenderer.invoke('request-accessibility'),
  requestInputMonitoring: () => ipcRenderer.invoke('request-input-monitoring'),
});
