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
		console.log('Query PB auth valid for kategori:', queryPb.authStore.isValid);
		console.log('Query user ID for kategori:', queryPb.authStore.model?.id);
		const records = await queryPb.collection('kategori').getFullList({
			sort: '-created'
		});
		console.log('Fetched kategori records:', records.length);
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