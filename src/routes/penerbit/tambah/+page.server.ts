import type { Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getAuthenticatedPb } from '$lib/pocketbase';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const penerbit = formData.get('penerbit') as string;

		if (!penerbit || !penerbit.trim()) {
			return {
				success: false,
				error: 'Nama penerbit wajib diisi'
			};
		}

		try {
			const authenticatedPb = await getAuthenticatedPb(cookies);
			await authenticatedPb.collection('penerbit').create({
				penerbit: penerbit.trim()
			});

			return redirect(303, '/penerbit');
		} catch (err: any) {
			console.error('Error creating penerbit:', err);

			if (err.status === 400) {
				const validationErrors = err.data || {};
				if (validationErrors.penerbit) {
					return {
						success: false,
						error: String(validationErrors.penerbit.message)
					};
				}
			}

			return {
				success: false,
				error: String(err.message || 'Gagal membuat penerbit. Silakan coba lagi.')
			};
		}
	}
};