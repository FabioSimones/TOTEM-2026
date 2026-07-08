import { createContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * Preferência de tema é uma configuração de UI, não dado de sessão —
 * por isso vive aqui, separada de tokenStorage.ts (que guarda apenas
 * token de acesso e dados do dispositivo autenticado).
 */
const THEME_STORAGE_KEY = "totem.theme";
const DEFAULT_THEME: Theme = "dark";

const THEME_COLOR_BY_THEME: Record<Theme, string> = {
  dark: "#e63329",
  light: "#e8440a",
};

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : DEFAULT_THEME;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", THEME_COLOR_BY_THEME[theme]);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
