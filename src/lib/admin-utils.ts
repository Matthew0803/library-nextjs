import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { UserRole } from '@/types/auth'

/**
 * Require the current user to be an admin
 * @throws {Error} If user is not authenticated or not an admin
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Authentication required')
  }

  if (session.user.role !== 'admin') {
    console.error(`Access denied for user ${session.user.email} with role ${session.user.role}. Admin role required.`)
    throw new Error('Admin access required')
  }

  return session.user
}

/**
 * Check if a user has admin role
 */
export function isAdmin(role: string | undefined): boolean {
  return role === 'admin'
}

/**
 * Check if a user has librarian or admin role
 */
export function isLibrarianOrAdmin(role: string | undefined): boolean {
  return role === 'admin' || role === 'librarian'
}

/**
 * Check if a user has the required role
 * @param userRole The user's role
 * @param requiredRole The required role
 */
export function hasRequiredRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    'member': 1,
    'librarian': 2,
    'admin': 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Get the highest role a user has
 */
export function getHighestRole(roles: UserRole[]): UserRole | null {
  if (!roles.length) return null
  
  const roleHierarchy: Record<UserRole, number> = {
    'member': 1,
    'librarian': 2,
    'admin': 3
  }
  
  return roles.reduce((highest, current) => 
    roleHierarchy[current] > (roleHierarchy[highest] || 0) ? current : highest
  , 'member' as UserRole)
}
