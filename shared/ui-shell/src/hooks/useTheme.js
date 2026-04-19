/**
 * useTheme — SAWS AquaCore shared theme hook
 *
 * Applies data-theme="light"|"dark" to <html>.
 * Priority: localStorage → system preference → light.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'saws-theme';

function getSystemPreference() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    const stored = getStoredTheme();
    return stored ?? getSystemPreference();
  });

  // Apply on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sync with system preference changes (respects manual override)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!getStoredTheme()) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function toggleTheme() {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function setTheme(t) {
    setThemeState(t);
  }

  return { theme, toggleTheme, setTheme, isDark: theme === 'dark' };
}
