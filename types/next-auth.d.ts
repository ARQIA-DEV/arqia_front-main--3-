// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    access: string
    refresh: string
    user: {
      id: string
      email: string
      name?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    access: string
    refresh: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    access: string
    refresh: string
  }
}
