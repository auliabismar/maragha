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
				penulis: [],
				user
			};
		}
		console.log('Query PB auth valid for penulis:', queryPb.authStore.isValid);
		console.log('Query user ID for penulis:', queryPb.authStore.model?.id);
		const records = await queryPb.collection('penulis').getFullList({
			sort: '-created'
		});
		console.log('Fetched penulis records:', records.length);
		return {
			penulis: records,
			user
		};
	} catch (error) {
		console.error('Error fetching penulis:', error);
		return {
			penulis: [],
			user
		};
	}
};