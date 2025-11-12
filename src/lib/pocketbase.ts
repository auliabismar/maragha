import PocketBase from 'pocketbase';

// Use environment variable for PocketBase URL, fallback to 127.0.0.1 for server-side compatibility
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

export default pb;

export async function getAuthenticatedPb(cookies: any) {
	const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
	const queryPb = new PocketBase(pbUrl);
	const authData = cookies.get('pb_auth');
	if (authData) {
		try {
			await queryPb.authStore.loadFromCookie(decodeURIComponent(authData));
		} catch (error) {
			console.error('Failed to load auth from cookie:', error);
		}
	}
	return queryPb;
}