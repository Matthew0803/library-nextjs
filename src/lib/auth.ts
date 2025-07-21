import GoogleProvider from 'next-auth/providers/google'
import type { NextAuthOptions } from 'next-auth'
import type { UserRole } from '@/types/auth'

// Role assignment logic - customize based on your needs
function assignUserRole(email: string): UserRole {
  // Admin emails from environment variable
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
  
  // Librarian emails from environment variable
  const librarianEmails = process.env.LIBRARIAN_EMAILS?.split(',').map(email => email.trim()) || []
  
  // Check if user is admin
  if (adminEmails.includes(email)) {
    return 'admin'
  }
  
  // Check if user is librarian
  if (librarianEmails.includes(email)) {
    return 'librarian'
  }
  
  // Default role is member
  return 'member'
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Store the Google ID token when user first signs in
      if (account && account.provider === 'google') {
        console.log('JWT Callback - Storing Google ID token')
        token.accessToken = account.id_token || account.access_token
        console.log('JWT Callback - Token stored, length:', token.accessToken?.length)
      }
      
      // Assign role on first sign in
      if (user && user.email) {
        token.role = assignUserRole(user.email)
        console.log(`JWT Callback - Assigned role ${token.role} to ${user.email}`)
      }
      
      return token
    },
    async session({ session, token }) {
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
}
