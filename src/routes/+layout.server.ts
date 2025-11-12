import type { LayoutServerLoad } from './$types';
import PocketBase from 'pocketbase';

declare global {
	namespace App {
		interface Locals {
			user: any | null;
		}
	}
}

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	// For server-side rendering, we can't access localStorage
	// The client-side will handle user state, but we need to pass user info
	// through data for SSR to work properly

	// Try to get auth from cookies first
	// Try to get auth from cookies first
	const authData = cookies.get('pb_auth');
	if (authData) {
		try {
			const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
			const pb = new PocketBase(pbUrl);
			await pb.authStore.loadFromCookie(decodeURIComponent(authData));
			if (pb.authStore.isValid) {
				locals.user = pb.authStore.model;
				return { user: pb.authStore.model };
			}
		} catch (error) {
			console.error('Failed to restore auth session:', error);
		}
	}

	locals.user = null;
	return { user: null };
};