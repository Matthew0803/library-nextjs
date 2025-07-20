# Deployment Checklist

## Pre-Deployment

### Backend Preparation
- [ ] Flask backend is deployed to a hosting service (Heroku, Railway, etc.)
- [ ] Backend URL is accessible and returns data
- [ ] CORS is configured for your frontend domain
- [ ] All API endpoints are working:
  - [ ] `GET /api/books` - Returns book list
  - [ ] `POST /api/books` - Creates new books
  - [ ] `PUT /api/books/{id}` - Updates books
  - [ ] `DELETE /api/books/{id}` - Deletes books
  - [ ] `POST /api/books/{id}/checkout` - Checks out books
  - [ ] `POST /api/books/{id}/checkin` - Checks in books
  - [ ] `GET /api/books/stats` - Returns statistics

### Frontend Preparation
- [ ] Update `.env.production` with your actual backend URL
- [ ] Test the build process: `npm run build`
- [ ] Verify all components work in production build
- [ ] Check that all environment variables are properly set

## Deployment Steps

### Vercel Deployment
- [ ] Create Vercel account
- [ ] Connect your Git repository
- [ ] Set environment variable: `NEXT_PUBLIC_API_URL`
- [ ] Deploy the project
- [ ] Test the deployed application

### Alternative Deployment
- [ ] Build the project: `npm run build`
- [ ] Upload `out` directory to your hosting service
- [ ] Configure environment variables on hosting platform
- [ ] Test the deployed application

## Post-Deployment Testing

### Basic Functionality
- [ ] Homepage loads correctly
- [ ] Statistics display properly
- [ ] Book list loads from backend
- [ ] Search functionality works
- [ ] Responsive design works on mobile

### CRUD Operations
- [ ] Can add new books
- [ ] Can edit existing books
- [ ] Can delete books (only available ones)
- [ ] Form validation works properly
- [ ] Error handling displays correctly

### Check-in/Check-out
- [ ] Can check out available books
- [ ] Can check in checked-out books
- [ ] Borrower information is captured correctly
- [ ] Due dates are calculated properly
- [ ] Status updates reflect in real-time

### Performance
- [ ] Page loads quickly
- [ ] API calls respond in reasonable time
- [ ] No console errors
- [ ] Images and icons load properly

## Troubleshooting

### If something doesn't work:
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Test API endpoints directly
4. Check CORS configuration on backend
5. Verify backend is accessible from frontend domain

## Success Criteria

✅ **Deployment is successful when:**
- Frontend loads without errors
- All CRUD operations work
- Check-in/check-out functionality works
- Statistics update in real-time
- Application is responsive on all devices
- No console errors or warnings

