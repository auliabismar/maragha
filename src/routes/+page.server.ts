import type { PageServerLoad } from './$types';
import { getCachedData } from '$lib/server/cache';

export const load: PageServerLoad = async () => {
	try {
		// Get data from cache (will auto-refresh if needed)
		const cachedData = await getCachedData();

		// Return top 12 books for initial display
		const topBooks = cachedData.books.slice(0, 12);

		return {
			books: topBooks,
			stats: cachedData.stats,
			availableKategoris: cachedData.availableKategoris,
			cacheTimestamp: cachedData.timestamp
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
			availableKategoris: [],
			cacheTimestamp: Date.now()
		};
	}
};