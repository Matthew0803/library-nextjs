'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Plus, BookOpen, CheckCircle, XCircle, Edit, Trash2, User, Calendar } from 'lucide-react'

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
    setError(null) // Reset error state on new fetch
    try {
      const url = search 
        ? `${API_BASE}/books?search=${encodeURIComponent(search)}`
        : `${API_BASE}/books`
      const response = await fetch(url)
      const data = await response.json()
      setBooks(data.books || [])
    } catch (error) {
      console.error('Error fetching books:', error)
      setError('Failed to fetch books. Please ensure the backend server is running.')
    }
    setLoading(false)
  }

  // Fetch library statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/books/stats`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Add new book
  const addBook = async () => {
    try {
      const response = await fetch(`${API_BASE}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          publication_year: formData.publication_year ? parseInt(formData.publication_year) : null
        }),
      })
      
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
      }
    } catch (error) {
      console.error('Error adding book:', error)
    }
  }

  // Update book
  const updateBook = async () => {
    if (!selectedBook) return
    
    try {
      const response = await fetch(`${API_BASE}/books/${selectedBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          publication_year: formData.publication_year ? parseInt(formData.publication_year) : null
        }),
      })
      
      if (response.ok) {
        setIsEditDialogOpen(false)
        setSelectedBook(null)
        fetchBooks(searchTerm)
      }
    } catch (error) {
      console.error('Error updating book:', error)
    }
  }

  // Delete book
  const deleteBook = async (bookId: number) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        const response = await fetch(`${API_BASE}/books/${bookId}`, {
          method: 'DELETE',
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
    if (!selectedBook) return
    
    try {
      const response = await fetch(`${API_BASE}/books/${selectedBook.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    try {
      const response = await fetch(`${API_BASE}/books/${bookId}/checkin`, {
        method: 'POST',
      })
      
      if (response.ok) {
        fetchBooks(searchTerm)
        fetchStats()
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

  // Load initial data
  useEffect(() => {
    fetchBooks()
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Library Management System
          </h1>
          <p className="text-gray-600">Manage your library&apos;s book collection with ease</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_books || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available_books || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.checked_out_books || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue_books || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add Book */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search books by title, author, genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          
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
                  Add a new book to the library collection.
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(book)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      Edit
                    </Button>
                    
                    {book.is_checked_out ? (
                      <Button
                        size="sm"
                        onClick={() => checkinBook(book.id)}
                        className="flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Check In
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => openCheckoutDialog(book)}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        Check Out
                      </Button>
                    )}
                    
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
