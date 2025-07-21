'use client'

import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'
import { UserRole } from '@/types/auth'
import { hasRequiredRole } from '@/lib/admin-utils'

interface PermissionWrapperProps {
  children: ReactNode
  /** Minimum required role to access the content */
  requiredRole?: UserRole
  /** Specific roles that are allowed (overrides requiredRole if both are provided) */
  allowedRoles?: UserRole[]
  /** Content to show when permission is denied */
  fallback?: ReactNode
  /** Show loading state while checking permissions */
  showLoading?: boolean
  /** Whether authentication is required (default: true) */
  requireAuth?: boolean
  /** Custom error message to show when permission is denied */
  errorMessage?: string
}

/**
 * A component that conditionally renders its children based on the user's role
 * and authentication status.
 */
export function PermissionWrapper({ 
  children, 
  requiredRole = 'member',
  allowedRoles,
  fallback = null,
  showLoading = true,
  requireAuth = true,
  errorMessage
}: PermissionWrapperProps) {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  // Show loading state
  if (isLoading && showLoading) {
    return (
      <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-md p-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    )
  }

  // Check if authentication is required
  if (requireAuth && !session?.user) {
    return fallback || (
      <div className="p-4 text-center text-gray-600 dark:text-gray-400">
        Please sign in to access this content.
      </div>
    )
  }

  // Check if user has required role
  const userRole = session?.user?.role as UserRole | undefined
  const roles = allowedRoles || [requiredRole]
  const hasAccess = roles.some(role => hasRequiredRole(userRole, role))

  if (!hasAccess) {
    return fallback || (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
        <p className="text-yellow-700 dark:text-yellow-400 font-medium">
          {errorMessage || 'Access Denied'}
        </p>
        <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
          You don't have permission to view this content. Required role: {roles.join(' or ')}
        </p>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience components for common permission checks
type PermissionProps = {
  children: ReactNode
  fallback?: ReactNode
  errorMessage?: string
}

export function AdminOnly({ children, fallback, errorMessage }: PermissionProps) {
  return (
    <PermissionWrapper 
      requiredRole="admin" 
      fallback={fallback}
      errorMessage={errorMessage || 'Admin access required'}
    >
      {children}
    </PermissionWrapper>
  )
}

export function LibrarianOrAdmin({ children, fallback, errorMessage }: PermissionProps) {
  return (
    <PermissionWrapper 
      requiredRole="librarian"
      fallback={fallback}
      errorMessage={errorMessage || 'Librarian or admin access required'}
    >
      {children}
    </PermissionWrapper>
  )
}

export function MemberOnly({ children, fallback, errorMessage }: PermissionProps) {
  return (
    <PermissionWrapper 
      requiredRole="member"
      fallback={fallback}
      errorMessage={errorMessage || 'Member access required'}
    >
      {children}
    </PermissionWrapper>
  )
}

export function AuthenticatedOnly({ 
  children, 
  fallback,
  errorMessage 
}: PermissionProps) {
  return (
    <PermissionWrapper 
      requiredRole="member"
      fallback={fallback}
      errorMessage={errorMessage || 'Authentication required'}
    >
      {children}
    </PermissionWrapper>
  )
}
