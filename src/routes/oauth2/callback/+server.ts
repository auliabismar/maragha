import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import pb from '$lib/pocketbase';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const provider = cookies.get('provider');
	const codeVerifier = cookies.get('codeVerifier');

	if (!provider || !codeVerifier) {
		throw redirect(303, '/login?error=missing_oauth2_cookie');
	}

	try {
		await pb
			.collection('users')
			.authWithOAuth2(provider, code || '', codeVerifier, `${url.origin}/oauth2/callback`);

		// Set the cookie upon successful authentication
		const authCookie = pb.authStore.exportToCookie({ httpOnly: true, secure: true });
		cookies.set('pb_auth', authCookie, { path: '/' });
	} catch (err) {
		console.error('OAuth2 callback error:', err);
		throw redirect(303, '/login?error=oauth_failed');
	}

	throw redirect(303, '/');
};