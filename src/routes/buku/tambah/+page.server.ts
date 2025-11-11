import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import pb from '$lib/pocketbase';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		// Fetch relation options - using 'id' field as the display name since that's the only field
		const [penerbitList, penulisList, kategoriList] = await Promise.all([
			pb.collection('penerbit').getFullList({
				sort: 'id',
				$autoCancel: false
			}),
			pb.collection('penulis').getFullList({
				sort: 'id',
				$autoCancel: false
			}),
			pb.collection('kategori').getFullList({
				sort: 'id',
				$autoCancel: false
			})
		]);

		return {
			penerbit: penerbitList,
			penulis: penulisList,
			kategori: kategoriList
		};
	} catch (err) {
		console.error('Error loading relation data:', err);
		throw error(500, 'Gagal memuat data untuk form buku.');
	}
};