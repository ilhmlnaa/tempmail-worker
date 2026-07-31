import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react'

export type Theme = 'legacy' | 'brutal'
type ColorMode = 'dark' | 'light'

interface ThemeContextValue { theme: Theme; colorMode: ColorMode; setTheme: (theme: Theme) => void; toggleColorMode: () => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'legacy')
  const [colorMode, setColorMode] = useState<ColorMode>(() => (localStorage.getItem('color-mode') as ColorMode) || 'dark')
  useLayoutEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.classList.toggle('dark', colorMode === 'dark'); localStorage.setItem('theme', theme); localStorage.setItem('color-mode', colorMode) }, [theme, colorMode])
  return <ThemeContext.Provider value={{ theme, colorMode, setTheme, toggleColorMode: () => setColorMode(value => value === 'dark' ? 'light' : 'dark') }}>{children}</ThemeContext.Provider>
}

export function useTheme() { const context = useContext(ThemeContext); if (!context) throw new Error('useTheme must be used within ThemeProvider'); return context }
