import NextAuth from 'next-auth'

export type UserRole = 'admin' | 'librarian' | 'member'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
    }
    accessToken?: string
  }

  interface User {
    role: UserRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    accessToken?: string
  }
}

export interface AuthUser {
  id: string
  name: string
  email: string
  image?: string
  role: UserRole
}
