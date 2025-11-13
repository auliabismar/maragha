import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import pb from '$lib/pocketbase';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		try {
			await pb.collection('users').authWithPassword(email, password);
			cookies.set('pb_auth', pb.authStore.exportToCookie(), {
				path: '/',
				maxAge: 60 * 60 * 24 * 7, // 1 week
				httpOnly: true,
				secure: import.meta.env.PROD,
				sameSite: 'lax'
			});
		} catch (err: any) {
			console.error('Error logging in:', err);
			return {
				success: false,
				error: err.message || 'Invalid credentials'
			};
		}

		throw redirect(303, '/');
	}
};