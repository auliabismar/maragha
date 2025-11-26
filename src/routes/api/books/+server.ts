import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCachedData } from '$lib/server/cache';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const page = parseInt(url.searchParams.get('page') || '1');
		const perPage = parseInt(url.searchParams.get('perPage') || '12');

		// Get all books from cache
		const cachedData = await getCachedData();

		// Paginate
		const start = (page - 1) * perPage;
		const end = start + perPage;
		const paginatedBooks = cachedData.books.slice(start, end);

		return json({
			books: paginatedBooks,
			hasMore: end < cachedData.books.length,
			total: cachedData.books.length,
			cacheTimestamp: cachedData.timestamp
		});
	} catch (error) {
		console.error('Error in /api/books:', error);
		return json({
			books: [],
			hasMore: false,
			total: 0,
			error: 'Failed to load books'
		}, { status: 500 });
	}
};