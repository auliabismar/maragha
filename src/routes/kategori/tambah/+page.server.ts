import type { Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getAuthenticatedPb } from '$lib/pocketbase';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id || !id.trim()) {
			return {
				success: false,
				error: 'ID kategori wajib diisi'
			};
		}

		try {
			const authenticatedPb = await getAuthenticatedPb(cookies);
			await authenticatedPb.collection('kategori').create({
				id: id.trim()
			});

			return redirect(303, '/kategori');
		} catch (err: any) {
			console.error('Error creating kategori:', err);
			
			if (err.status === 303) {
				throw err; // Re-throw redirect
			}

			if (err.status === 400) {
				const validationErrors = err.data || {};
				if (validationErrors.id) {
					return {
						success: false,
						error: String(validationErrors.id.message)
					};
				}
			}

			return {
				success: false,
				error: String(err.message || 'Gagal membuat kategori. Silakan coba lagi.')
			};
		}
	}
};