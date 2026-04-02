// Shared productivity category metadata used across Timeline, Dashboard, etc.

export const CATEGORY_META: Record<string, { label: string; color: string; emoji: string; productive: number }> = {
  coding:        { label: 'Coding',        color: '#14b8a6', emoji: '💻', productive:  1.0 },
  writing:       { label: 'Writing',       color: '#3b82f6', emoji: '✍️', productive:  0.9 },
  design:        { label: 'Design',        color: '#f59e0b', emoji: '🎨', productive:  0.9 },
  learning:      { label: 'Learning',      color: '#8b5cf6', emoji: '📚', productive:  0.8 },
  meeting:       { label: 'Meeting',       color: '#06b6d4', emoji: '🎙️', productive:  0.7 },
  communication: { label: 'Communication', color: '#ec4899', emoji: '💬', productive:  0.6 },
  productivity:  { label: 'Productivity',  color: '#10b981', emoji: '📋', productive:  0.7 },
  browsing:      { label: 'Browsing',      color: '#6366f1', emoji: '🌐', productive:  0.3 },
  entertainment: { label: 'Entertainment', color: '#ef4444', emoji: '🎬', productive:  0.0 },
  gaming:        { label: 'Gaming',        color: '#f97316', emoji: '🎮', productive:  0.0 },
  system:        { label: 'System',        color: '#64748b', emoji: '⚙️', productive:  0.2 },
  adult:         { label: 'Adult',         color: '#be123c', emoji: '🔞', productive: -0.5 },
};

export const DEFAULT_CATEGORY = { label: 'Uncategorized', color: '#a1a1aa', emoji: '📌', productive: 0.3 };

export function getCategoryMeta(tag: string | null | undefined) {
  return (tag && CATEGORY_META[tag]) ? CATEGORY_META[tag] : DEFAULT_CATEGORY;
}
