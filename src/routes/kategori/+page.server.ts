import { redirect } from '@sveltejs/kit';
import { getAuthenticatedPb } from '$lib/pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, cookies }) => {
	const { user: layoutUser } = await parent();
	const user = locals.user || layoutUser;
	if (!user || user.akses !== 'Editor') {
		throw redirect(302, '/meja_kerja');
	}

	try {
		const queryPb = await getAuthenticatedPb(cookies);
		if (!queryPb.authStore.isValid) {
			console.error('Auth not valid for query');
			return {
				kategori: [],
				user
			};
		}
		const records = await queryPb.collection('kategori').getFullList({
			sort: '-created'
		});
		return {
			kategori: records,
			user
		};
	} catch (error) {
		console.error('Error fetching kategori:', error);
		return {
			kategori: [],
			user
		};
	}
};