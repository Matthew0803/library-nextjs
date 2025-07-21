'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, BookOpen, CheckCircle, XCircle, Edit, Trash2, User, Calendar } from 'lucide-react'
import { AuthHeader } from './components/AuthHeader'
import { LibrarianOrAdmin, AdminOnly, AuthenticatedOnly } from './components/PermissionWrapper'
// Import admin helpers for development
import '@/lib/admin-helpers'

// API configuration - will be updated for production
const API_BASE = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_URL || 'https://librarymanagement-backend-production.up.railway.app/api'
  : 'https://librarymanagement-backend-production.up.railway.app/api' // Use deployed backend for local development

interface Book {
  id: number
  title: string
  author: string
  genre?: string
  publication_year?: number
  isbn?: string
  description?: string
  is_checked_out: boolean
  borrower_name?: string
  borrower_email?: string
  checkout_date?: string
  due_date?: string
  created_at: string
  updated_at: string
}

interface Stats {
  total_books: number
  available_books: number
  checked_out_books: number
  overdue_books: number
}

interface FormData {
  title: string
  author: string
  genre: string
  publication_year: string
  isbn: string
  description: string
}

interface CheckoutData {
  borrower_name: string
  borrower_email: string
  days: number
}

export default function LibraryManagement() {
  const { data: session, status } = useSession()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState<Stats>({
    total_books: 0,
    available_books: 0,
    checked_out_books: 0,
    overdue_books: 0
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    author: '',
    genre: '',
    publication_year: '',
    isbn: '',
    description: ''
  })
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    borrower_name: '',
    borrower_email: '',
    days: 14
  })

  // Fetch books from API
  const fetchBooks = async (search = '') => {
    setLoading(true)
    setError(null)
    try {
      const url = search 
        ? `${API_BASE}/books?search=${encodeURIComponent(search)}`
        : `${API_BASE}/books`
      
      console.log('Fetching books from:', url)
      const response = await fetch(url)
      console.log('Books response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Books data received:', data)
      
      // Handle both array and object with books property for backward compatibility
      const booksData = Array.isArray(data) ? data : (data.books || [])
      setBooks(booksData)
      
      // If we have books, also update the stats based on the books data
      if (booksData.length > 0) {
        const stats = calculateStatsFromBooks(booksData)
        console.log('Calculated stats from books:', stats)
        setStats(stats)
      }
    } catch (error) {
      console.error('Error in fetchBooks:', error)
      setError('Failed to fetch books. Please check your connection and try again.')
      setBooks([])
    } finally {
      setLoading(false)
    }
  }
  
  // Calculate stats from books data
  const calculateStatsFromBooks = (books: Book[]) => {
    const now = new Date()
    return {
      total_books: books.length,
      available_books: books.filter(book => !book.is_checked_out).length,
      checked_out_books: books.filter(book => book.is_checked_out).length,
      overdue_books: books.filter(book => {
        if (!book.due_date) return false
        const dueDate = new Date(book.due_date)
        return book.is_checked_out && dueDate < now
      }).length
    }
  }

  // Fetch library statistics
  const fetchStats = async () => {
    console.log('Fetching stats from:', `${API_BASE}/books/stats`)
    
    // Check if user is authenticated
    if (!session?.user) {
      console.log('No session available for stats fetch')
      return
    }
    
    try {
      // Get the access token from the session
      const accessToken = session.accessToken || ''
      
      // Debug: Log session and token info
      console.log('Session object:', session)
      console.log('Access token:', accessToken)
      console.log('Token length:', accessToken.length)
      
      // First, exchange Google token for Flask JWT tokens
      const authResponse = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: accessToken
        })
      })
      
      if (!authResponse.ok) {
        console.error('Authentication failed:', await authResponse.text())
        return
      }
      
      const authData = await authResponse.json()
      const flaskJWT = authData.access_token
      
      console.log('Flask JWT received:', flaskJWT ? 'Yes' : 'No')
      console.log('Flask JWT length:', flaskJWT?.length || 0)
      
      // Now use Flask JWT for the actual API call
      console.log('Making API call to:', `${API_BASE}/books/stats`)
      const response = await fetch(`${API_BASE}/books/stats`, {
        headers: {
          'Authorization': `Bearer ${flaskJWT}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      console.log('Stats response status:', response.status)
      console.log('Stats response ok:', response.ok)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, ${errorText}`)
      }
      
      const data = await response.json()
      console.log('Stats data received:', data)
      
      // Ensure we have valid data before setting state
      if (data && (data.total_books !== undefined || data.available_books !== undefined)) {
        setStats({
          total_books: data.total_books || 0,
          available_books: data.available_books || 0,
          checked_out_books: data.checked_out_books || 0,
          overdue_books: data.overdue_books || 0
        })
      } else {
        console.error('Invalid stats data format:', data)
        setStats({
          total_books: 0,
          available_books: 0,
          checked_out_books: 0,
          overdue_books: 0
        })
      }
    } catch (error) {
      console.error('Error in fetchStats:', error)
      // Set default values on error
      setStats({
        total_books: 0,
        available_books: 0,
        checked_out_books: 0,
        overdue_books: 0
      })
    }
  }

  // Add new book
  const addBook = async () => {
    if (!session) {
      console.error('No active session')
      alert('You must be logged in to add a book')
      return
    }
    
    try {
      const requestData = {
        ...formData,
        publication_year: formData.publication_year ? parseInt(formData.publication_year) : null
      }
      
      // Debug: Log the data being sent
      console.log('Sending book data:', requestData)
      console.log('Session:', session)
      
      // Get the Google access token from the session
      const googleToken = session.accessToken || ''
      
      if (!googleToken) {
        console.error('No Google access token available in session')
        alert('Authentication error: Please sign in again')
        return
      }
      
      console.log('Using Google token for authentication')
      console.log('Google token (first 50 chars):', googleToken.substring(0, 50) + '...')
      console.log('Google token length:', googleToken.length)
      
      // First, exchange Google token for Flask JWT tokens
      const authResponse = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleToken
        })
      })
      
      console.log('Auth response status:', authResponse.status)
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.error('Authentication failed with status:', authResponse.status)
        console.error('Error response:', errorText)
        alert(`Authentication failed: ${errorText}. Please sign in again.`)
        return
      }
      
      const authData = await authResponse.json()
      const flaskJWT = authData.access_token
      
      console.log('Flask JWT received:', flaskJWT ? 'Yes' : 'No')
      console.log('Flask JWT length:', flaskJWT?.length || 0)
      
      // Now use Flask JWT for the actual API call
      console.log('Making API call to:', `${API_BASE}/books`)
      const response = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${flaskJWT}`,
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      })
      
      console.log('API response status:', response.status)
      console.log('API response ok:', response.ok)
      
      if (response.ok) {
        setIsAddDialogOpen(false)
        setFormData({
          title: '',
          author: '',
          genre: '',
          publication_year: '',
          isbn: '',
          description: ''
        })
        fetchBooks(searchTerm)
        fetchStats()
      } else {
        // Handle API errors
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('API Error:', response.status, errorData)
        console.error('Request data that caused error:', requestData)
        alert(`Failed to add book: ${errorData.message || `HTTP ${response.status}`}`)
      }
    } catch (error) {
      console.error('Error adding book:', error)
      alert('Failed to add book. Please check your connection and try again.')
    }
  }

  // Update book
  const updateBook = async () => {
    if (!selectedBook || !session) {
      console.error('No book selected or no active session')
      alert('You must be logged in to update a book')
      return
    }
    
    try {
      // Get the Google access token from the session
      const googleToken = session.accessToken || ''
      
      if (!googleToken) {
        console.error('No Google access token available in session')
        alert('Authentication error: Please sign in again')
        return
      }
      
      // First, exchange Google token for Flask JWT tokens
      const authResponse = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleToken
        })
      })
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.error('Authentication failed with status:', authResponse.status)
        alert(`Authentication failed: ${errorText}. Please sign in again.`)
        return
      }
      
      const authData = await authResponse.json()
      const flaskJWT = authData.access_token
      
      // Now use Flask JWT for the actual API call
      const response = await fetch(`${API_BASE}/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${flaskJWT}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          publication_year: formData.publication_year ? parseInt(formData.publication_year) : null
        }),
      })
      
      if (response.ok) {
        setIsEditDialogOpen(false)
        setSelectedBook(null)
        fetchBooks(searchTerm)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to update book:', response.status, errorData)
        alert(`Failed to update book: ${errorData.message || `HTTP ${response.status}`}`)
      }
    } catch (error) {
      console.error('Error updating book:', error)
    }
  }

  // Delete book
  const deleteBook = async (bookId: number) => {
    if (!session) return
    
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        // Get the Google access token from the session
        const googleToken = session.accessToken || ''
        
        if (!googleToken) {
          console.error('No Google access token available in session')
          alert('Authentication error: Please sign in again')
          return
        }
        
        // First, exchange Google token for Flask JWT tokens
        const authResponse = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: googleToken
          })
        })
        
        if (!authResponse.ok) {
          const errorText = await authResponse.text()
          console.error('Authentication failed with status:', authResponse.status)
          alert(`Authentication failed: ${errorText}. Please sign in again.`)
          return
        }
        
        const authData = await authResponse.json()
        const flaskJWT = authData.access_token
        
        // Now use Flask JWT for the actual API call
        const response = await fetch(`${API_BASE}/books/${bookId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${flaskJWT}`,
          },
        })
        
        if (response.ok) {
          fetchBooks(searchTerm)
          fetchStats()
        }
      } catch (error) {
        console.error('Error deleting book:', error)
      }
    }
  }

  // Checkout book
  const checkoutBook = async () => {
    if (!selectedBook || !session) return
    
    try {
      // Get the Google access token from the session
      const googleToken = session.accessToken || ''
      
      if (!googleToken) {
        console.error('No Google access token available in session')
        alert('Authentication error: Please sign in again')
        return
      }
      
      // First, exchange Google token for Flask JWT tokens
      const authResponse = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleToken
        })
      })
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.error('Authentication failed with status:', authResponse.status)
        alert(`Authentication failed: ${errorText}. Please sign in again.`)
        return
      }
      
      const authData = await authResponse.json()
      const flaskJWT = authData.access_token
      
      // Now use Flask JWT for the actual API call
      const response = await fetch(`${API_BASE}/books/${selectedBook.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${flaskJWT}`,
        },
        body: JSON.stringify(checkoutData),
      })
      
      if (response.ok) {
        setIsCheckoutDialogOpen(false)
        setSelectedBook(null)
        setCheckoutData({
          borrower_name: '',
          borrower_email: '',
          days: 14
        })
        fetchBooks(searchTerm)
        fetchStats()
      }
    } catch (error) {
      console.error('Error checking out book:', error)
    }
  }

  // Checkin book
  const checkinBook = async (bookId: number) => {
    if (!session) {
      console.error('No active session')
      alert('You must be logged in to check in a book')
      return
    }
    
    try {
      // Get the Google access token from the session
      const googleToken = session.accessToken || ''
      
      if (!googleToken) {
        console.error('No Google access token available in session')
        alert('Authentication error: Please sign in again')
        return
      }
      
      // First, exchange Google token for Flask JWT tokens
      const authResponse = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: googleToken
        })
      })
      
      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        console.error('Authentication failed with status:', authResponse.status)
        alert(`Authentication failed: ${errorText}. Please sign in again.`)
        return
      }
      
      const authData = await authResponse.json()
      const flaskJWT = authData.access_token
      
      // Now use Flask JWT for the actual API call
      const response = await fetch(`${API_BASE}/books/${bookId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${flaskJWT}`,
        },
        credentials: 'include',
      })
      
      if (response.ok) {
        fetchBooks(searchTerm)
        fetchStats()
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to check in book:', response.status, errorData)
        alert(`Failed to check in book: ${errorData.message || `HTTP ${response.status}`}`)
      }
    } catch (error) {
      console.error('Error checking in book:', error)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBooks(searchTerm)
  }

  // Open edit dialog
  const openEditDialog = (book: Book) => {
    setSelectedBook(book)
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre || '',
      publication_year: book.publication_year?.toString() || '',
      isbn: book.isbn || '',
      description: book.description || ''
    })
    setIsEditDialogOpen(true)
  }

  // Open checkout dialog
  const openCheckoutDialog = (book: Book) => {
    setSelectedBook(book)
    setIsCheckoutDialogOpen(true)
  }

  // Load initial data when component mounts and user is authenticated
  useEffect(() => {
    // Always fetch books and stats regardless of session
    // since the backend API is public for GET requests
    fetchBooks()
    fetchStats()
    
    // Debug: Log the current session and role
    if (session) {
      console.log('Current session:', session)
      console.log('User role:', session.user?.role)
    }
  }, []) // Empty dependency array means this runs once on mount

  // Show authentication loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt for unauthenticated users
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AuthHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-blue-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Welcome to Library Management</h2>
            <p className="text-gray-600 mb-6">Please sign in to access the library system</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_books}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available_books}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.checked_out_books}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue_books}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add Book Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <Input
              type="text"
              placeholder="Search books by title or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          
          <LibrarianOrAdmin>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Book</DialogTitle>
                  <DialogDescription>
                    Enter the details of the new book to add to the library.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({...formData, author: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="genre">Genre</Label>
                      <Input
                        id="genre"
                        value={formData.genre}
                        onChange={(e) => setFormData({...formData, genre: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.publication_year}
                        onChange={(e) => setFormData({...formData, publication_year: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addBook}>Add Book</Button>
                </div>
              </DialogContent>
            </Dialog>
          </LibrarianOrAdmin>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="text-center py-8">Loading books...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Card key={book.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{book.title}</CardTitle>
                      <CardDescription className="text-sm">by {book.author}</CardDescription>
                    </div>
                    <Badge variant={book.is_checked_out ? "destructive" : "default"}>
                      {book.is_checked_out ? "Checked Out" : "Available"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {book.genre && (
                      <div><strong>Genre:</strong> {book.genre}</div>
                    )}
                    {book.publication_year && (
                      <div><strong>Year:</strong> {book.publication_year}</div>
                    )}
                    {book.isbn && (
                      <div><strong>ISBN:</strong> {book.isbn}</div>
                    )}
                    {book.description && (
                      <div><strong>Description:</strong> {book.description}</div>
                    )}
                    
                    {book.is_checked_out && book.borrower_name && book.due_date && (
                      <div className="mt-3 p-2 bg-red-50 rounded border-l-4 border-red-400">
                        <div className="flex items-center gap-1 text-red-700">
                          <User className="h-4 w-4" />
                          <strong>Borrower:</strong> {book.borrower_name}
                        </div>
                        <div className="flex items-center gap-1 text-red-700">
                          <Calendar className="h-4 w-4" />
                          <strong>Due:</strong> {new Date(book.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <LibrarianOrAdmin>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(book)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </LibrarianOrAdmin>
                    
                    {book.is_checked_out ? (
                      <LibrarianOrAdmin>
                        <Button
                          size="sm"
                          onClick={() => checkinBook(book.id)}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Check In
                        </Button>
                      </LibrarianOrAdmin>
                    ) : (
                      <AuthenticatedOnly>
                        <Button
                          size="sm"
                          onClick={() => openCheckoutDialog(book)}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-3 w-3" />
                          Check Out
                        </Button>
                      </AuthenticatedOnly>
                    )}
                    
                    <AdminOnly>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBook(book.id)}
                        disabled={book.is_checked_out}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </AdminOnly>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No books found. {searchTerm ? 'Try a different search term.' : 'Add your first book to get started!'}
          </div>
        )}

        {/* Edit Book Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Book</DialogTitle>
              <DialogDescription>
                Update the book information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-author">Author *</Label>
                <Input
                  id="edit-author"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-genre">Genre</Label>
                  <Input
                    id="edit-genre"
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-year">Year</Label>
                  <Input
                    id="edit-year"
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({...formData, publication_year: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-isbn">ISBN</Label>
                <Input
                  id="edit-isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateBook}>Update Book</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Checkout Dialog */}
        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Check Out Book</DialogTitle>
              <DialogDescription>
                Enter borrower information to check out &quot;{selectedBook?.title}&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="borrower-name">Borrower Name *</Label>
                <Input
                  id="borrower-name"
                  value={checkoutData.borrower_name}
                  onChange={(e) => setCheckoutData({...checkoutData, borrower_name: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="borrower-email">Borrower Email *</Label>
                <Input
                  id="borrower-email"
                  type="email"
                  value={checkoutData.borrower_email}
                  onChange={(e) => setCheckoutData({...checkoutData, borrower_email: e.target.value})}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loan-days">Loan Period (days)</Label>
                <Input
                  id="loan-days"
                  type="number"
                  value={checkoutData.days}
                  onChange={(e) => setCheckoutData({...checkoutData, days: parseInt(e.target.value)})}
                  min="1"
                  max="90"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCheckoutDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={checkoutBook}>Check Out</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
