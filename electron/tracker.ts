/* eslint-disable @typescript-eslint/no-explicit-any */
import { clipboard } from 'electron';
import activeWin from 'active-win';
import { logActivity, getSettings } from './db.js';
import { uIOhook, UiohookKey } from 'uiohook-napi';

let lastWindowTitle = '';
let lastUrl = '';
let lastClipboardText = '';
let keystrokeBuffer = '';
let keystrokeTimer: NodeJS.Timeout | null = null;

// Time-spent tracking
let windowStartTime: number = Date.now();
let lastWindowAppName = '';
let lastWindowContent = '';
let lastWindowTag: string | undefined;

// Password masking: if active window suggests a password field, redact the buffer
const PASSWORD_KEYWORDS = ['password', 'passwort', 'passphrase', 'login', 'sign in', 'authenticate', '1password', 'keychain', 'bitwarden'];
let currentWindowTitle = '';

function isLikelySensitiveContext(): boolean {
  const lower = currentWindowTitle.toLowerCase();
  return PASSWORD_KEYWORDS.some(kw => lower.includes(kw));
}

// Productivity categories and their rules
const CATEGORY_RULES: { category: string; pattern: RegExp }[] = [
  // Adult — checked first so it always wins over entertainment/browsing
  { category: 'adult', pattern: /pornhub|xvideos|xnxx|xhamster|redtube|youporn|brazzers|onlyfans|chaturbate|cam4|livejasmin|myfreecams|stripchat|bongacams|fapello|eporner|tnaflix|porntube|tube8|beeg|spankbang|porntrex|hentaihaven|nhentai|rule34|gelbooru/ },
  // Deep Work — Coding
  { category: 'coding', pattern: /vscode|visual studio code|vs code|code\.exe|cursor|zed|nvim|neovim|vim|emacs|intellij|webstorm|pycharm|android studio|xcode|eclipse|sublime text|atom|terminal|iterm|warp|kitty|hyper|ghostty|github|gitlab|bitbucket|stackoverflow|codepen|codesandbox|replit|jsfiddle|vercel|netlify|railway|heroku|aws|gcp|azure|docker|kubernetes|postman|insomnia|httpie|ssh|git |npm |yarn |cargo |rustup|brew |pip |python |node |deno|bun |go run|k8s|helm/ },

  // Writing & Docs
  { category: 'writing', pattern: /notion|obsidian|bear|ulysses|onenote|evernote|roam|logseq|typora|mark text|google docs|word|pages|keynote|powerpoint|google slides|libreoffice|quip|confluence|gitbook|mdx|latex|overleaf|craft|scrivener/ },
  // Design & Creative
  { category: 'design', pattern: /figma|sketch|adobe xd|invision|axure|marvel|zeplin|framer|canva|affinity designer|affinity photo|adobe photoshop|adobe illustrator|adobe indesign|adobe premiere|adobe after effects|final cut|davinci resolve|procreate|pixelmator|luminar|lightroom|capture one|blender|cinema 4d|maya|unity|unreal|godot/ },
  // Communication
  { category: 'communication', pattern: /slack|discord|teams|microsoft teams|telegram|signal|whatsapp|messages|imessage|facetime|skype|hangouts|snapchat|instagram|twitter|x\.com|facebook|linkedin|gmail|google mail|apple mail|outlook|spark|airmail|superhuman|hey\.com|basecamp|asana|jira|linear|trello|monday\.com|clickup|notion\.so\/team/ },
  // Meetings & Calls
  { category: 'meeting', pattern: /zoom|google meet|meet\.google|webex|whereby|around\.co|loom|mmhmm|descript|squadcast|riverside\.fm|streamyard/ },
  // Learning & Research
  { category: 'learning', pattern: /coursera|udemy|udacity|pluralsight|egghead|frontendmasters|skillshare|masterclass|khanacademy|edx|mit\.edu|stanford\.edu|arxiv|medium\.com|substack|dev\.to|hashnode|read\.cv|goodreads|kindle|apple books|o'reilly|manning|wikipedia|mdn web|developer\.mozilla|docs\.|documentation|tutorial|youtube.*learn|youtube.*course|youtube.*lecture/ },
  // Entertainment
  { category: 'entertainment', pattern: /youtube(?!.*learn|.*course|.*lecture)|netflix|hulu|disney\+|disney plus|hbo|prime video|apple tv|peacock|paramount|spotify|apple music|tidal|soundcloud|twitch|kick\.com|steam|epicgames|battle\.net|gog|itch\.io|game.*bar|reddit(?!.*code|.*programming)/ },
  // Finance & Productivity Tools
  { category: 'productivity', pattern: /calendar|google calendar|fantastical|apple calendar|reminders|todoist|things|omnifocus|ticktick|2do|any\.do|habitica|timing|toggl|harvest|clockify|rescuetime|finance|bank|trading|coinbase|binance|robinhood|quickbooks|freshbooks|xero/ },
  // System & Utilities
  { category: 'system', pattern: /finder|explorer|system preference|system setting|activity monitor|task manager|disk utility|console\.app|terminal|keychain|automator|shortcuts|raycast|alfred|spotlight|1password|bitwarden|dashlane|lastpass|vpn|mullvad|tailscale|adguard|little snitch|cleanmymac/ },
  // Gaming
  { category: 'gaming', pattern: /steam|epicgames|battle\.net|minecraft|fortnite|valorant|league of legends|counterstrike|cs2|overwatch|apex legends|genshin|roblox|among us|chess\.com|lichess/ },
];

function getAutoTag(appName: string, url?: string): string {
  const src = `${appName} ${url || ''}`.toLowerCase();
  for (const { category, pattern } of CATEGORY_RULES) {
    if (pattern.test(src)) return category;
  }
  // Fallback: if it's a URL and nothing matched, it's browsing
  if (url) return 'browsing';
  return 'system';
}


function isExcluded(name: string, excludeList: string): boolean {
  if (!excludeList.trim()) return false;
  return excludeList.split(',').map(s => s.trim().toLowerCase()).some(ex => ex && name.toLowerCase().includes(ex));
}

function getKeyChar(keycode: number): string {
  const keyMap: any = {
    [UiohookKey.A as any]: 'a', [UiohookKey.B as any]: 'b', [UiohookKey.C as any]: 'c', [UiohookKey.D as any]: 'd',
    [UiohookKey.E as any]: 'e', [UiohookKey.F as any]: 'f', [UiohookKey.G as any]: 'g', [UiohookKey.H as any]: 'h',
    [UiohookKey.I as any]: 'i', [UiohookKey.J as any]: 'j', [UiohookKey.K as any]: 'k', [UiohookKey.L as any]: 'l',
    [UiohookKey.M as any]: 'm', [UiohookKey.N as any]: 'n', [UiohookKey.O as any]: 'o', [UiohookKey.P as any]: 'p',
    [UiohookKey.Q as any]: 'q', [UiohookKey.R as any]: 'r', [UiohookKey.S as any]: 's', [UiohookKey.T as any]: 't',
    [UiohookKey.U as any]: 'u', [UiohookKey.V as any]: 'v', [UiohookKey.W as any]: 'w', [UiohookKey.X as any]: 'x',
    [UiohookKey.Y as any]: 'y', [UiohookKey.Z as any]: 'z',
    [UiohookKey.Space as any]: ' ', [UiohookKey.Enter as any]: '\n', [UiohookKey.Backspace as any]: 'BACKSPACE',
    [UiohookKey.Comma as any]: ',', [UiohookKey.Period as any]: '.', [UiohookKey.Slash as any]: '/',
    [UiohookKey['0'] as any]: '0', [UiohookKey['1'] as any]: '1', [UiohookKey['2'] as any]: '2', [UiohookKey['3'] as any]: '3',
    [UiohookKey['4'] as any]: '4', [UiohookKey['5'] as any]: '5', [UiohookKey['6'] as any]: '6', [UiohookKey['7'] as any]: '7',
    [UiohookKey['8'] as any]: '8', [UiohookKey['9'] as any]: '9',
  };
  return keyMap[keycode] || '';
}

export function startTracking() {
  uIOhook.on('keydown', (e) => {
    const settings = getSettings();
    if (settings.trackKeystrokes !== 'true') return;

    const char = getKeyChar(e.keycode);
    if (!char) return;

    if (isLikelySensitiveContext()) return; // Skip password fields

    if (char === 'BACKSPACE') {
      keystrokeBuffer = keystrokeBuffer.slice(0, -1);
    } else {
      keystrokeBuffer += char;
    }

    if (keystrokeTimer) clearTimeout(keystrokeTimer);
    keystrokeTimer = setTimeout(() => {
      if (keystrokeBuffer.trim().length > 0) {
        logActivity('keystrokes', keystrokeBuffer.trim(), 'Keyboard');
        keystrokeBuffer = '';
      }
    }, 5000);
  });

  try {
    uIOhook.start();
  } catch (err) {
    try { console.error('Failed to start uiohook', err); } catch { /* no-op */ }
  }

  setInterval(async () => {
    try {
      const settings = getSettings();
      const excludeList = settings.excludeList || '';

      const win = await activeWin();
      if (win) {
        currentWindowTitle = win.title || '';

        const url = (win as any).url;
        if (url && settings.trackWebsite === 'true' && url !== lastUrl) {
          lastUrl = url;
          if (!isExcluded(url, excludeList) && !isExcluded(win.owner?.name || '', excludeList)) {
            const durationSeconds = Math.round((Date.now() - windowStartTime) / 1000);
            // Strip browser name suffix from title (e.g. "Article - Google Chrome" → "Article")
            const rawTitle = win.title || '';
            const browserNames = ['Google Chrome', 'Safari', 'Firefox', 'Arc', 'Brave', 'Microsoft Edge', 'Opera'];
            const pageTitle = browserNames.reduce((t, b) => t.replace(new RegExp(`\\s*[-–|]\\s*${b}$`), ''), rawTitle).trim();
            logActivity('website', url, win.owner?.name || 'Browser', getAutoTag(win.owner?.name || '', url), durationSeconds > 0 ? durationSeconds : undefined, pageTitle || undefined);
            windowStartTime = Date.now();
          }
        }

        const titleContext = `${win.title} (${win.owner?.name || 'Unknown'})`;
        if (titleContext !== lastWindowTitle && win.title && win.owner?.name) {
          // Flush the previous window with its duration
          if (lastWindowContent && lastWindowAppName) {
            const durationSeconds = Math.round((Date.now() - windowStartTime) / 1000);
            if (durationSeconds > 1) {
              // Update the last logged window entry with its measured duration
              logActivity('window', lastWindowContent, lastWindowAppName, lastWindowTag, durationSeconds);
            }
          }

          // Reset timer and store new window info
          windowStartTime = Date.now();
          lastWindowTitle = titleContext;
          lastWindowContent = win.title;
          lastWindowAppName = win.owner.name;
          lastWindowTag = getAutoTag(win.owner.name);

          if (!isExcluded(win.owner.name, excludeList)) {
            // Log the new window (duration will be added when it changes next time)
            logActivity('window', win.title, win.owner.name, getAutoTag(win.owner.name));
          }
        }
      }


      if (settings.trackClipboard === 'true') {
        const text = clipboard.readText();
        if (text && text !== lastClipboardText && text.trim().length > 0) {
          lastClipboardText = text;
          const truncated = text.length > 1000 ? text.substring(0, 1000) + '...' : text;
          logActivity('clipboard', truncated, 'Clipboard');
        }
      }
    } catch (e) {
      try { console.error('Tracking Error', e); } catch { /* no-op */ }
    }
  }, 5000);
}
