import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
import type { UserRole } from '@/types/auth'

// Extend the built-in session and user types
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

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile',
        },
      },
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add role to the token
      if (user) {
        // Default role assignment - you can customize this logic
        token.role = assignUserRole(user.email!)
      }
      
      // Store Google's ID token - Flask backend expects this for user verification
      if (account?.id_token) {
        token.accessToken = account.id_token
        console.log('[NextAuth] Stored Google ID token for user:', user?.email)
      } else if (account?.access_token) {
        // Fallback to access token if ID token not available
        token.accessToken = account.access_token
        console.log('[NextAuth] Stored Google access token (fallback) for user:', user?.email)
      }
      
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.role = token.role as UserRole
        session.user.id = token.sub || session.user.email || ''
        session.accessToken = token.accessToken
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

// Role assignment logic - customize based on your needs
function assignUserRole(email: string): UserRole {
  if (!email) return 'member'
  
  try {
    // Get admin emails from environment variable for easier configuration
    const adminEmails = process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
      : []
    
    // Get librarian emails from environment variable
    const librarianEmails = process.env.LIBRARIAN_EMAILS
      ? process.env.LIBRARIAN_EMAILS.split(',').map(e => e.trim().toLowerCase())
      : []
    
    const normalizedEmail = email.toLowerCase()
    
    // Check if the email is in the admin list
    if (adminEmails.includes(normalizedEmail)) {
      console.log(`[Auth] Assigning admin role to ${normalizedEmail}`)
      return 'admin'
    }
    
    // Check if the email is in the librarian list
    if (librarianEmails.includes(normalizedEmail)) {
      console.log(`[Auth] Assigning librarian role to ${normalizedEmail}`)
      return 'librarian'
    }
    
    // Default role for all other users
    console.log(`[Auth] Assigning member role to ${normalizedEmail}`)
    return 'member'
  } catch (error) {
    console.error('[Auth] Error assigning user role:', error)
    return 'member' // Default to member role on error
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
