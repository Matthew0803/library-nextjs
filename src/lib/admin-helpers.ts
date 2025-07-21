/**
 * Admin helper functions for managing user roles
 * These functions are for development/admin use only
 */

const API_BASE = 'https://librarymanagement-backend-production.up.railway.app/api'
const SECRET_KEY = 'b48ea1482a3a56d66ad495596b4caf832a7ad146f900691d9f6238b13a6d55a5'

export async function setUserRole(email: string, role: 'admin' | 'librarian' | 'member') {
  try {
    const response = await fetch(`${API_BASE}/auth/set-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        role: role,
        secret_key: SECRET_KEY
      })
    })
    
    const data = await response.json()
    if (response.ok) {
      console.log(`✅ ${email} is now a ${role}`)
      return data
    } else {
      console.error('❌ Error:', data.error)
      return null
    }
  } catch (error) {
    console.error('❌ Failed to set role:', error)
    return null
  }
}

// Convenience functions
export const makeAdmin = (email: string) => setUserRole(email, 'admin')
export const makeLibrarian = (email: string) => setUserRole(email, 'librarian')
export const makeMember = (email: string) => setUserRole(email, 'member')

// Make functions available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  ;(window as any).setUserRole = setUserRole
  ;(window as any).makeAdmin = makeAdmin
  ;(window as any).makeLibrarian = makeLibrarian
  ;(window as any).makeMember = makeMember
}
