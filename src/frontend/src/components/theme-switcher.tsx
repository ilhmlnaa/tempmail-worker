import { Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/context/theme-context'
import { Button } from '@/components/ui/button'

export function ThemeSwitcher() {
  const { theme, colorMode, setTheme, toggleColorMode } = useTheme()
  return <div className="theme-switcher" aria-label="Theme preferences">
    {(['legacy', 'brutal'] as Theme[]).map(value => <button key={value} type="button" className={theme === value ? 'active' : ''} onClick={() => setTheme(value)}>{value === 'legacy' ? 'Classic' : 'Brutal'}</button>)}
    <Button type="button" size="icon" variant="ghost" onClick={toggleColorMode} aria-label={`Use ${colorMode === 'dark' ? 'light' : 'dark'} mode`}>{colorMode === 'dark' ? <Sun /> : <Moon />}</Button>
  </div>
}
