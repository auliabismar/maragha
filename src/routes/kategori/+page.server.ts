import { redirect } from '@sveltejs/kit';
import pb from '$lib/pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	if (!user || user.akses !== 'Editor') {
		throw redirect(302, '/meja_kerja');
	}

	try {
		const records = await pb.collection('kategori').getFullList({
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