import type { PageServerLoad } from './$types';
import pb from '$lib/pocketbase';

export const load: PageServerLoad = async () => {
	try {
		// Get total books count
		const allBooksRes = await pb.collection('buku').getList(1, 1, { sort: '-created' });
		const totalBooks = allBooksRes.totalItems;

		// Fetch all books and take top 12
		const allBukuRes = await pb.collection('buku').getFullList({
			sort: '-created',
			expand: 'penulis,penerbit,kategori'
		});
		const topBooks = allBukuRes.slice(0, 12);

		// Fetch halaman only for these top books to compute per-book stats
		const bookIds = topBooks.map(b => b.id);
		const allHalaman = await pb.collection('halaman').getFullList();
		const allHalamanForTop = allHalaman.filter((h: any) => bookIds.includes(h.buku));

		// Group halaman by buku for top books
		const halamanByBuku = allHalamanForTop.reduce((acc: { [key: string]: any[] }, h: any) => {
			if (!acc[h.buku]) acc[h.buku] = [];
			acc[h.buku].push(h);
			return acc;
		}, {});

		// Process top books with computed halaman stats
		const processedTopBooks = topBooks.map((record: any) => {
			const bookHalaman = halamanByBuku[record.id] || [];
			const halamanSetuju = bookHalaman.filter((h: any) => h.status === 'Setuju').length;
			const totalHalaman = bookHalaman.length;

			return {
				id: record.id,
				judul: record.judul,
				cover: record.cover ? pb.files.getURL(record, record.cover) : undefined,
				status: record.status,
				penulis: record.expand?.penulis?.map((p: any) => p.id) || [],
				penerbit: record.expand?.penerbit?.id || 'N/A',
				kategori: record.expand?.kategori?.map((k: any) => k.id) || [],
				totalHalaman: totalHalaman,
				halamanSetuju: halamanSetuju
			};
		});

		// Global stats
		// Total translated pages: count all 'Setuju' halaman
		const totalTranslatedPages = allHalaman.filter((h: any) => h.status === 'Setuju').length;

		// Unique authors and kategoris: use allBukuRes from above
		const allBooks = allBukuRes;
		const allPenulis = allBooks.flatMap((b: any) => b.expand?.penulis?.map((p: any) => p.id) || []);
		const uniqueAuthors = new Set(allPenulis).size;

		const allKategoriIds = allBooks.flatMap((b: any) => b.expand?.kategori?.map((k: any) => k.id) || []);
		const uniqueKategoriSet = new Set(allKategoriIds);
		const availableKategoris = Array.from(uniqueKategoriSet).sort();

		return {
			books: processedTopBooks,
			stats: {
				totalBooks,
				totalTranslatedPages,
				uniqueAuthors
			},
			availableKategoris
		};
	} catch (error) {
		console.error('Error loading home data:', error);
		return {
			books: [],
			stats: {
				totalBooks: 0,
				totalTranslatedPages: 0,
				uniqueAuthors: 0
			},
			availableKategoris: []
		};
	}
};