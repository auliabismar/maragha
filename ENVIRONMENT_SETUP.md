# Environment Configuration

## Local Development
Your application is configured to use local pocketbase by default:
```
VITE_POCKETBASE_URL=http://localhost:8090
```

## Production Deployment
When deploying to production where PocketBase is on a different server:

1. Set the environment variable `VITE_POCKETBASE_URL` to your production PocketBase URL
2. For Vercel: Use the dashboard or `vercel env add`
3. For Netlify: Use the site settings or `netlify env:set`
4. For other platforms: Follow their environment variable setup

Example production configuration:
```
VITE_POCKETBASE_URL=https://pocketbase.yourdomain.com
```

## Environment Variables
- `VITE_POCKETBASE_URL`: PocketBase server URL
- Must start with `VITE_` to be accessible in client-side code
- Falls back to `http://localhost:8090` if not set