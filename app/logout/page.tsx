'use client'

import { useEffect } from 'react'
import { signOut } from 'next-auth/react'

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/login' })
  }, [])

  return <p className="p-8">Saindo...</p>
}
