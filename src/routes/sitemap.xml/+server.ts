import type { RequestHandler } from './$types';
import pb from '$lib/pocketbase';

export const GET: RequestHandler = async ({ url }) => {
	const baseUrl = 'https://maragha.example.com'; // Replace with your actual domain
	const currentDate = new Date().toISOString();

	// Static pages that are always available
	const staticPages = [
		{
			loc: baseUrl,
			lastmod: currentDate,
			changefreq: 'weekly',
			priority: '1.0'
		},
		{
			loc: `${baseUrl}/tentang`,
			lastmod: currentDate,
			changefreq: 'monthly',
			priority: '0.8'
		}
	];

	// Generate dynamic book pages
	async function getBookPages() {
		try {
			const books = await pb.collection('buku').getFullList({
				fields: 'id, judul, updated'
			});

			return books.map((book) => ({
				loc: `${baseUrl}/buku/${book.id}`,
				lastmod: book.updated,
				changefreq: 'monthly',
				priority: '0.7'
			}));
		} catch (error) {
			console.error('Error fetching books for sitemap:', error);
			return [];
		}
	}

	// Generate book page URLs
	const bookPages = await getBookPages();

	// Combine all URLs
	const allUrls = [...staticPages, ...bookPages];

	// Generate XML sitemap
	const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
	.map(
		(page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemapXml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
		}
	});
};