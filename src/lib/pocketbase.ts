import PocketBase from 'pocketbase';

// Use environment variable for PocketBase URL, fallback to localhost for development
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090');

export default pb;