"use client";

import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material";
import type * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";
const LOCAL_STORAGE_MODE_KEY = "theme-mode";

type Mode = "dark" | "light" | "system";
type Theme = "dark" | "light";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultMode?: Mode;
};

type ThemeProviderState = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  mode: "dark",
  setMode: () => null,
  theme: "dark",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const muiLightTheme = createTheme({
  palette: {
    mode: "light",
  },
});

const muiDarkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

function ThemeProvider({
  children,
  defaultMode = "dark",
  ...props
}: ThemeProviderProps) {
  const isSystemPreferDarkTheme = useMediaQuery(COLOR_SCHEME_QUERY);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [theme, setTheme] = useState<Theme>("dark");

  // Load mode from local storage
  useEffect(() => {
    const storedMode = localStorage.getItem(
      LOCAL_STORAGE_MODE_KEY,
    ) as Mode | null;
    if (storedMode) {
      setMode(storedMode);
    }
  }, []);

  // Set theme by mode
  useEffect(() => {
    // Get document root element
    const root = window.document.documentElement;

    // Reset theme classes
    root.classList.remove("light", "dark");

    // Set theme by mode
    const newTheme =
      mode === "system" ? (isSystemPreferDarkTheme ? "dark" : "light") : mode;
    root.classList.add(newTheme);
    setTheme(newTheme);

    // Save mode to local storage
    localStorage.setItem(LOCAL_STORAGE_MODE_KEY, mode);
  }, [isSystemPreferDarkTheme, mode]);

  const value = {
    mode: mode,
    setMode: (mode: Mode) => {
      setMode(mode);
    },
    theme: theme,
    setTheme: (theme: Theme) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <MuiThemeProvider theme={theme === "dark" ? muiDarkTheme : muiLightTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeProviderContext.Provider>
  );
}

const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

export { ThemeProvider, useTheme };
export type { Mode };
