import PocketBase from 'pocketbase';

// Use environment variable for PocketBase URL, fallback to 127.0.0.1 for server-side compatibility
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

export default pb;