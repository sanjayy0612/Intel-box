/** Theme resolution. The toggle stamps `data-theme` on the root element so CSS
 *  never has to guess: `prefers-color-scheme` decides only the initial value,
 *  and an explicit choice always wins over it. */

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "intelbox.theme";
const PREFERENCES = ["system", "light", "dark"];

const darkQuery = () =>
  typeof window === "undefined" ? null : window.matchMedia("(prefers-color-scheme: dark)");

/** The user's stored choice: "system", "light", or "dark". */
export function getPreference() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return PREFERENCES.includes(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

/** The theme actually in effect once "system" is resolved against the OS. */
export function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") return preference;
  return darkQuery()?.matches ? "dark" : "light";
}

export function applyPreference(preference) {
  document.documentElement.dataset.theme = resolveTheme(preference);
  document.documentElement.style.colorScheme = resolveTheme(preference);
}

/** Called once before the first render so the page never paints the wrong theme. */
export function initTheme() {
  applyPreference(getPreference());
}

export function useTheme() {
  const [preference, setPreference] = useState(getPreference);
  const [theme, setTheme] = useState(() => resolveTheme(getPreference()));

  useEffect(() => {
    applyPreference(preference);
    setTheme(resolveTheme(preference));
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* Private browsing or a locked-down profile. The theme still applies. */
    }
  }, [preference]);

  // Follow the OS only while the user hasn't made an explicit choice.
  useEffect(() => {
    if (preference !== "system") return undefined;
    const query = darkQuery();
    if (!query) return undefined;
    const onChange = () => {
      applyPreference("system");
      setTheme(resolveTheme("system"));
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference]);

  const toggle = useCallback(() => {
    setPreference(resolveTheme(getPreference()) === "dark" ? "light" : "dark");
  }, []);

  return { theme, preference, setPreference, toggle };
}
