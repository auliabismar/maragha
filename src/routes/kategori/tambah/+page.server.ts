import type { Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getAuthenticatedPb } from '$lib/pocketbase';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const kategori = formData.get('kategori') as string;

		if (!kategori || !kategori.trim()) {
			return {
				success: false,
				error: 'Nama kategori wajib diisi'
			};
		}

		try {
			const authenticatedPb = await getAuthenticatedPb(cookies);
			await authenticatedPb.collection('kategori').create({
				kategori: kategori.trim()
			});

			return redirect(303, '/kategori');
		} catch (err: any) {
			console.error('Error creating kategori:', err);

			if (err.status === 400) {
				const validationErrors = err.data || {};
				if (validationErrors.kategori) {
					return {
						success: false,
						error: String(validationErrors.kategori.message)
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