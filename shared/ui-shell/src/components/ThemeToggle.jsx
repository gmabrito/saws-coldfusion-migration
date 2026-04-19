/**
 * ThemeToggle — SAWS AquaCore shared dark/light mode toggle
 *
 * Renders a Sun/Moon button. Pass useTheme() output as props,
 * or use the self-contained version (imports its own hook).
 *
 * Usage in Layout.jsx:
 *   import { ThemeToggle } from '@saws/ui-shell';
 *   // inside header .user-info:
 *   <ThemeToggle />
 */
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
