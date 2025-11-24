import { json } from '@sveltejs/kit';
import pb from '$lib/pocketbase';

export async function GET({ url }) {
	try {
		const page = parseInt(url.searchParams.get('page') || '1');
		const perPage = parseInt(url.searchParams.get('perPage') || '12');

		// Fetch paginated books
		const booksRes = await pb.collection('buku').getList(page, perPage, {
			sort: '-created',
			expand: 'penulis,penerbit,kategori'
		});
		const books = booksRes.items;

		// Fetch halaman only for these books
		const bookIds = books.map(b => b.id);
		let halamanForPage: any[] = [];
		if (bookIds.length > 0) {
			const filter = `buku IN ("${bookIds.join('","')}")`;
			halamanForPage = await pb.collection('halaman').getFullList({
				filter
			});
		}

		// Group halaman by buku
		const halamanByBuku = halamanForPage.reduce((acc: { [key: string]: any[] }, h: any) => {
			if (!acc[h.buku]) acc[h.buku] = [];
			acc[h.buku].push(h);
			return acc;
		}, {});

		// Process books with computed halaman stats
		const processedBooks = books.map((record: any) => {
			const bookHalaman = halamanByBuku[record.id] || [];
			const halamanSetuju = bookHalaman.filter((h: any) => h.status === 'Setuju').length;
			const totalHalaman = bookHalaman.length;

			return {
				id: record.id,
				judul: record.judul,
				cover: record.cover ? pb.files.getURL(record, record.cover) : undefined,
				status: record.status,
				penulis: record.expand?.penulis?.map((p: any) => p.nama || p.id) || [],
				penerbit: record.expand?.penerbit?.nama || record.expand?.penerbit?.id || 'N/A',
				kategori: record.expand?.kategori?.map((k: any) => k.nama) || [],
				totalHalaman: totalHalaman,
				halamanSetuju: halamanSetuju
			};
		});

		return json({
			books: processedBooks,
			page,
			perPage,
			totalPages: Math.ceil(booksRes.totalItems / perPage),
			totalItems: booksRes.totalItems
		});
	} catch (error) {
		console.error('Error fetching paginated books:', error);
		return json({ books: [], page: 1, perPage: 12, totalPages: 0, totalItems: 0 }, { status: 500 });
	}
}