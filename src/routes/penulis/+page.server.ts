import { redirect } from '@sveltejs/kit';
import pb from '$lib/pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { user: layoutUser } = await parent();
	const user = locals.user || layoutUser;
	if (!user || user.akses !== 'Editor') {
		throw redirect(302, '/meja_kerja');
	}

	try {
		const records = await pb.collection('penulis').getFullList({
			sort: '-created'
		});
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