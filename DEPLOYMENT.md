# Deployment Guide for BlackWeek Poster App

## Vercel Deployment (Recommended)

### Setup Instructions:

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Set Environment Variables in Vercel**:
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add: `VITE_REPLICATE_API_KEY` with your Replicate API key

3. **Deploy**:
   ```bash
   vercel --prod
   ```
   Or push to GitHub and let Vercel auto-deploy

### How it Works:

- Frontend is served as a static site
- Backend API endpoints are converted to serverless functions in `/api`
- No CORS issues since API and frontend are on same domain
- Automatic HTTPS
- Works perfectly on mobile devices

### API Endpoints:

- `/api/health` - Health check
- `/api/transform-image` - Main image processing
- `/api/transform-image-fallback` - Fallback processing

## Alternative Deployment Methods

### Issue: Replicate API not working on mobile devices in production

This is typically caused by one of these issues:

1. **Mixed Content Error**: Frontend served over HTTPS trying to access backend over HTTP
2. **Backend not accessible**: Backend server not running or not accessible from mobile
3. **CORS issues**: Backend not configured to accept requests from production domain

### Solutions for Non-Vercel Deployments:

#### 1. Configure Backend URL for Production

Edit `.env.production` and set the correct backend URL:

```bash
# If backend is on same domain with HTTPS
VITE_BACKEND_URL=https://your-domain.com:3001

# If backend is on a subdomain
VITE_BACKEND_URL=https://api.your-domain.com

# If backend is hosted separately
VITE_BACKEND_URL=https://your-backend-service.com
```

#### 2. Deploy Backend with HTTPS

Options:

**Option A: Use a reverse proxy (Recommended)**
- Deploy backend behind nginx/Apache with SSL
- Configure proxy to forward requests to Node.js backend

**Option B: Use a platform that provides HTTPS**
- Deploy to Heroku, Railway, Render, etc.
- These platforms provide HTTPS by default

**Option C: Use Node.js with HTTPS directly**
```javascript
// In backend/server.js
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
  console.log(`HTTPS Server running on port ${PORT}`);
});
```

#### 3. Ensure Backend is Accessible

1. **Check firewall rules**: Port 3001 must be open
2. **Check hosting provider**: Some providers block non-standard ports
3. **Use standard ports**: Consider using port 443 for HTTPS

#### 4. Update CORS for Production

In `backend/server.js`, update CORS configuration:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-production-domain.com',
    // Add any other domains that need access
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Testing on Mobile

1. **Check browser console**: 
   - On iOS: Use Safari Web Inspector
   - On Android: Use Chrome DevTools remote debugging

2. **Look for errors**:
   - Mixed content warnings
   - CORS errors
   - Network timeouts

3. **Verify backend URL**:
   - Open browser console
   - Check the logged "Backend URL" value
   - Try accessing `[backend-url]/health` directly

### Quick Deployment Checklist

- [ ] Backend deployed with HTTPS support
- [ ] `.env.production` configured with correct `VITE_BACKEND_URL`
- [ ] CORS configured to allow production domain
- [ ] Firewall/security groups allow backend port
- [ ] Backend server is running and accessible
- [ ] API keys are set in production environment

### Alternative: Serverless Deployment

Consider deploying the backend as serverless functions (Vercel, Netlify Functions) to avoid HTTPS/CORS issues entirely.