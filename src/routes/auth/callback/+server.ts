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
		// Exchange the authorization code for an access token with Google
		await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				code,
				client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
				client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
				redirect_uri: `${url.origin}/auth/callback`,
				grant_type: 'authorization_code',
			}),
		});

		// If we get here, the authentication was successful
		// Check if the user is authenticated with PocketBase
		if (pb.authStore.isValid) {
			// Redirect the user to the page they were on before login or to the dashboard
			if (state) {
				// Decode the state parameter which contains the original URL
				const redirectTo = decodeURIComponent(state);
				throw redirect(302, redirectTo);
			} else {
				// Default redirect to dashboard
				throw redirect(302, '/dashboard');
			}
		} else {
			// User is not authenticated, redirect to login with error
			throw redirect(302, '/login?error=oauth_failed');
		}
	} catch (error) {
		console.error('OAuth2 callback error:', error);
		// Redirect to login page with an error message
		throw redirect(302, '/login?error=oauth_failed');
	}
};