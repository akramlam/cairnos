import { useEffect } from 'react';
import { applyAccent, DEFAULT_ACCENT } from '@/lib/accent';
import { useSettings } from '@/lib/queries';

type Theme = 'dark' | 'light' | 'system';

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme: Theme) {
  const dark = theme === 'system' ? prefersDark() : theme !== 'light';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  try {
    localStorage.setItem('cairn-theme', theme);
  } catch {
    /* ignore */
  }
}

/** Applies the saved theme + accent, and keeps the theme in sync with the OS when set to "system". */
export function ThemeManager() {
  const { data } = useSettings();
  const theme = (data?.theme ?? 'dark') as Theme;
  const accent = data?.accent ?? DEFAULT_ACCENT;

  useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
  }, [accent]);

  return null;
}
