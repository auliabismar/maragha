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
				buku: [],
				user
			};
		}
		const records = await queryPb.collection('buku').getFullList({
			sort: '-created',
			expand: 'penerbit,penulis,kategori'
		});

		const processedRecords = records.map((record: any) => ({
			...record,
			penerbit: record.expand?.penerbit?.penerbit || 'N/A',
			penulis: record.expand?.penulis?.map((p: any) => p.penulis).join(', ') || '',
			kategori: record.expand?.kategori?.map((k: any) => k.kategori).join(', ') || ''
		}));

		return {
			buku: processedRecords,
			user
		};
	} catch (error) {
		console.error('Error fetching buku:', error);
		return {
			buku: [],
			user
		};
	}
};