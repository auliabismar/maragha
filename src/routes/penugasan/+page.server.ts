import { redirect } from '@sveltejs/kit';
import pb from '$lib/pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user || user.akses !== 'Editor') {
		throw redirect(302, '/meja_kerja');
	}

	try {
		const records = await pb.collection('penugasan').getFullList({
			sort: '-created'
		});
		return {
			penugasan: records,
			user
		};
	} catch (error) {
		console.error('Error fetching penugasan:', error);
		return {
			penugasan: [],
			user
		};
	}
};