"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

type Ctx = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<Ctx | null>(null)

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
  } catch {
    // ignore
  }
  return null
}

function getResolvedTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme()
}

function subscribeToTheme(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange()
  }

  mq.addEventListener("change", onStoreChange)
  window.addEventListener("storage", onStorage)

  return () => {
    mq.removeEventListener("change", onStoreChange)
    window.removeEventListener("storage", onStorage)
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
  root.style.colorScheme = theme

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0b0e11" : "#f5f7fa")
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const storedTheme = useSyncExternalStore(
    subscribeToTheme,
    getResolvedTheme,
    () => "light" as Theme,
  )
  const [override, setOverride] = useState<Theme | null>(null)
  const theme = override ?? storedTheme

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setOverride(t)
    applyTheme(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      // ignore
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setOverride((prev) => {
      const current = prev ?? getResolvedTheme()
      const next: Theme = current === "dark" ? "light" : "dark"
      applyTheme(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
