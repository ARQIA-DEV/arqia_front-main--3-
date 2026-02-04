'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'

export default function Navbar() {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()

  if (status === 'loading') return null

  return (
    <header className="bg-white dark:bg-[#0C1528] border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center text-sm">
      <h1 className="text-xl font-bold text-black dark:text-white">ARQIA</h1>

      {session?.access && (
        <nav className="flex items-center space-x-4">
          <Link href="/upload" className="hover:underline text-black dark:text-white">
            Upload
          </Link>
          <Link href="/results" className="hover:underline text-black dark:text-white">
            Resultados
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="hover:underline text-black dark:text-white">
            Sair
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="border border-gray-400 rounded px-2 py-0.5 text-xs text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
        </nav>
      )}
    </header>
  )
}
