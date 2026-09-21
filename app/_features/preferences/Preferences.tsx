"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { messages, type Lang, type MessageKey } from "./messages";

export type ThemePreference = "dark" | "light" | "system";

export const LANG_STORAGE_KEY = "rean_admin_lang";
export const THEME_STORAGE_KEY = "rean_admin_theme";
const CHANGE_EVENT = "rean-admin-preferences";

/**
 * Runs before first paint (inlined in the root layout) so the saved theme and
 * language apply without a flash of the wrong colours.
 */
export const preferencesBootScript = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("${THEME_STORAGE_KEY}")||"dark";if(t==="system"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}d.dataset.theme=t==="light"?"light":"dark";var l=localStorage.getItem("${LANG_STORAGE_KEY}");if(l==="km"||l==="en"){d.lang=l}}catch(e){}})();`;

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice still applies to this tab.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readLang(): Lang {
  return readStored(LANG_STORAGE_KEY) === "km" ? "km" : "en";
}

function readTheme(): ThemePreference {
  const value = readStored(THEME_STORAGE_KEY);
  return value === "light" || value === "system" ? value : "dark";
}

type PreferencesValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
  formatRelative: (date: Date, now?: number) => string;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, readLang, () => "en" as Lang);
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as ThemePreference);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme !== "system") {
      root.dataset.theme = theme;
      return;
    }
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const apply = () => {
      root.dataset.theme = query.matches ? "light" : "dark";
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [theme]);

  const setLang = useCallback((next: Lang) => writeStored(LANG_STORAGE_KEY, next), []);
  const setTheme = useCallback(
    (next: ThemePreference) => writeStored(THEME_STORAGE_KEY, next),
    [],
  );

  const value = useMemo<PreferencesValue>(() => {
    const locale = lang === "km" ? "km-KH" : "en";
    const numberFormat = new Intl.NumberFormat(locale);
    const relativeFormat = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    return {
      lang,
      setLang,
      theme,
      setTheme,
      t: (key, vars) => {
        let text: string = messages[lang][key] ?? messages.en[key] ?? key;
        if (vars) {
          for (const [name, replacement] of Object.entries(vars)) {
            text = text.replaceAll(`{${name}}`, String(replacement));
          }
        }
        return text;
      },
      formatNumber: (number) => numberFormat.format(number),
      formatRelative: (date, now = Date.now()) => {
        const seconds = Math.round((date.getTime() - now) / 1000);
        if (Math.abs(seconds) < 60) return relativeFormat.format(Math.max(-59, seconds), "second");
        const minutes = Math.round(seconds / 60);
        if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, "minute");
        return relativeFormat.format(Math.round(minutes / 60), "hour");
      },
    };
  }, [lang, setLang, theme, setTheme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

/** A per-browser UI setting (sidebar collapsed, last tab…) that survives reloads. */
export function useStoredString(key: string, fallback: string): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readStored(key) ?? fallback,
    () => fallback,
  );
  const setValue = useCallback((next: string) => writeStored(key, next), [key]);
  return [value, setValue];
}

export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside <PreferencesProvider>");
  return value;
}
