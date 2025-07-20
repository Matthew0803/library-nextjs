# Library Management System - Next.js Frontend

This is the Next.js frontend for the Library Management System, designed to work with the Flask backend API.

## Features

- Modern React-based interface using Next.js 15
- Responsive design with Tailwind CSS
- Professional UI components with shadcn/ui
- Real-time statistics dashboard
- Complete book management (CRUD operations)
- Check-in/check-out functionality
- Advanced search capabilities
- TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn package manager
- Running Flask backend API

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd library-nextjs
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local and set your API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

Build the application:
```bash
npm run build
```

This creates an optimized production build in the `out` directory.

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`: Your Flask backend URL

### Manual Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `out` directory to any static hosting service.

## Environment Variables

- `NEXT_PUBLIC_API_URL`: The base URL of your Flask backend API

## API Integration

The frontend communicates with the Flask backend through RESTful API calls. Make sure your Flask backend:

1. Is running and accessible
2. Has CORS enabled for your frontend domain
3. Implements all required endpoints:
   - `GET /api/books` - Get all books
   - `POST /api/books` - Create a book
   - `PUT /api/books/{id}` - Update a book
   - `DELETE /api/books/{id}` - Delete a book
   - `POST /api/books/{id}/checkout` - Check out a book
   - `POST /api/books/{id}/checkin` - Check in a book
   - `GET /api/books/stats` - Get library statistics

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Build Tool**: Turbopack (development)

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page component
├── components/
│   └── ui/                  # shadcn/ui components
└── lib/
    └── utils.ts             # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the Library Management System assignment.

