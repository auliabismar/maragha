import type { Actions } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { getAuthenticatedPb } from '$lib/pocketbase';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const penulis = formData.get('penulis') as string;

		if (!penulis || !penulis.trim()) {
			return {
				success: false,
				error: 'Nama penulis wajib diisi'
			};
		}

		try {
			const authenticatedPb = await getAuthenticatedPb(cookies);
			await authenticatedPb.collection('penulis').create({
				penulis: penulis.trim()
			});

			return redirect(303, '/penulis');
		} catch (err: any) {
			console.error('Error creating penulis:', err);

			if (err.status === 400) {
				const validationErrors = err.data || {};
				if (validationErrors.penulis) {
					return {
						success: false,
						error: String(validationErrors.penulis.message)
					};
				}
			}

			return {
				success: false,
				error: String(err.message || 'Gagal membuat penulis. Silakan coba lagi.')
			};
		}
	}
};