import { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Library Management System - Admin Dashboard',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  // Redirect to sign-in if not authenticated
  if (!session) {
    redirect('/auth/signin?callbackUrl=/admin')
  }
  
  // Redirect to home if not an admin
  if (session.user?.role !== 'admin') {
    redirect('/?error=unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        <div className="bg-white shadow rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
