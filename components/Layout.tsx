'use client'

import { ReactNode } from 'react'
import ThemeToggle from './ThemeToggle'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-darkBg text-black dark:text-darkText transition-colors">
      <header className="w-full p-4 flex justify-end shadow bg-white dark:bg-primary">
        <ThemeToggle />
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
