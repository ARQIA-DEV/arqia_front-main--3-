'use client'

import { useTheme } from '@/components/ThemeProvider'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="text-xl px-3 py-1 rounded shadow border hover:bg-accent hover:text-white transition"
      title="Alternar tema"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}
