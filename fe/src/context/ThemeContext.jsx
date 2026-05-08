/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'velauto_theme_preference';

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getSavedPreference = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
};

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState(getSavedPreference);
  const [resolvedTheme, setResolvedTheme] = useState(() => (getSavedPreference() === 'system' ? getSystemTheme() : getSavedPreference()));

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (preference) => {
      const nextTheme = preference === 'system' ? getSystemTheme() : preference;
      setResolvedTheme(nextTheme);
      
      // Apply theme via CSS class (Tailwind dark mode)
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      
      // Also set data-theme for CSS variable support
      document.documentElement.dataset.theme = nextTheme;
      document.body.dataset.theme = nextTheme;
    };

    applyTheme(themePreference);

    const onSystemThemeChange = () => {
      if (themePreference === 'system') {
        applyTheme('system');
      }
    };

    media.addEventListener('change', onSystemThemeChange);

    try {
      localStorage.setItem(STORAGE_KEY, themePreference);
    } catch {
      // ignore
    }

    return () => {
      media.removeEventListener('change', onSystemThemeChange);
    };
  }, [themePreference]);

  const toggleTheme = () => {
    setThemePreference((prev) => {
      const currentResolved = prev === 'system' ? getSystemTheme() : prev;
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  };

  const value = useMemo(() => ({
    themePreference,
    resolvedTheme,
    setThemePreference,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  }), [themePreference, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}