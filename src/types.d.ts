export interface LogEntry {
  id: number;
  timestamp: string;
  eventType: 'window' | 'clipboard' | 'website' | 'keystrokes';
  content: string;
  appName: string | null;
  tag: string | null;
  duration_seconds: number | null;
  page_title: string | null;
}

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

export interface ChatMessage {
  id: number;
  sessionId: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface StatsSummary {
  appTime: { appName: string; count: number }[];
  siteTime: { content: string; appName: string; count: number }[];
  totalKeystrokes: number;
  eventCounts: { eventType: string; count: number }[];
  categoryStats: { tag: string; count: number; totalSeconds: number }[];
}

declare global {
  interface Window {
    electronAPI: {
      // Timeline
      getTimeline: (limit?: number) => Promise<LogEntry[]>;
      getTimelineRange: (hours: number, limit?: number) => Promise<LogEntry[]>;
      searchTimeline: (query: string) => Promise<LogEntry[]>;
      tagActivity: (id: number, tag: string) => Promise<void>;
      getStats: (hours: number) => Promise<StatsSummary>;
      exportLogs: (format: 'csv' | 'json') => Promise<boolean>;

      // Chat
      getChatHistory: (sessionId: string) => Promise<ChatMessage[]>;
      saveChatMessage: (sessionId: string, role: string, content: string) => Promise<void>;
      clearChatSession: (sessionId: string) => Promise<void>;
      getRecentSessions: () => Promise<{ sessionId: string; startTime: string; lastTime: string; messageCount: number }[]>;

      // Daily summary
      getDailySummary: (date: string) => Promise<{ date: string; summary: string } | undefined>;
      saveDailySummary: (date: string, summary: string) => Promise<void>;

      // Settings
      getSettings: () => Promise<AppSettings>;
      updateSetting: (key: string, value: string) => Promise<void>;
      openExternal?: (url: string) => void;
      requestAccessibility?: () => Promise<boolean>;
      requestInputMonitoring?: () => Promise<void>;
    };
  }
}
