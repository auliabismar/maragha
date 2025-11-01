import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import pb from '$lib/pocketbase';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code) {
		throw redirect(302, '/login');
	}

	try {
		// Use PocketBase to handle the OAuth2 callback from Google
		// This will automatically exchange the code for an access token and authenticate the user
		await pb.collection('users').authWithOAuth2Code('google', code, '', `${url.origin}/oauth2/callback`);

		// If we get here, authentication was successful
		// Redirect the user to the page they were on before login or to the dashboard
		if (state) {
			// Decode the state parameter which contains the original URL
			const redirectTo = decodeURIComponent(state);
			throw redirect(302, redirectTo);
		} else {
			// Default redirect to dashboard
			throw redirect(302, '/dashboard');
		}
	} catch (error) {
		console.error('OAuth2 callback error:', error);
		// Redirect to login page with an error message
		throw redirect(302, '/login?error=oauth_failed');
	}
};