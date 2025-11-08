<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	interface SEOProps {
		title?: string;
		description?: string;
		keywords?: string;
		image?: string;
		type?: 'website' | 'article';
		publishedTime?: string;
		modifiedTime?: string;
		author?: string;
		section?: string;
		tags?: string[];
		noindex?: boolean;
		nofollow?: boolean;
		canonical?: string;
		children?: Snippet;
	}

	const {
		title = 'Maragha - Platform Buku Digital',
		description = 'Maragha adalah platform digital untuk membaca dan mengelola buku-buku pilihan.',
		keywords = 'buku, digital, membaca, platform, maragha, online, perpustakaan',
		image = '/logo.svg',
		type = 'website',
		publishedTime,
		modifiedTime,
		author = 'al-Magazi',
		section,
		tags = [],
		noindex = false,
		nofollow = false,
		canonical,
		children
	}: SEOProps = $props();

	const siteUrl = 'https://maragha.example.com';
	const fullTitle = title === 'Maragha' ? title : `${title} | Maragha`;
	const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
	const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;
	const canonicalUrl = canonical || `${siteUrl}${canonical || $page.url.pathname}`;

	// JSON-LD structured data for the website
	const websiteSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Maragha',
		url: siteUrl,
		description: description,
		publisher: {
			'@type': 'Organization',
			name: 'al-Magazi',
			url: 'https://almagazi.id'
		}
	};

	// JSON-LD structured data for articles
	const getArticleSchema = () => {
		if (type !== 'article') return null;
		
		return {
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: title,
			description: description,
			image: imageUrl,
			datePublished: publishedTime,
			dateModified: modifiedTime,
			author: {
				'@type': 'Person',
				name: author
			},
			publisher: {
				'@type': 'Organization',
				name: 'al-Magazi',
				logo: {
					'@type': 'ImageObject',
					url: `${siteUrl}/logo.svg`
				}
			},
			mainEntityOfPage: {
				'@type': 'WebPage',
				'@id': canonicalUrl
			}
		};
	};
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />
	<meta name="robots" content={robotsContent} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content="Maragha" />
	<meta property="fb:app_id" content="" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:title" content={title} />
	<meta property="twitter:description" content={description} />
	<meta property="twitter:image" content={imageUrl} />

	<!-- Article specific meta tags -->
	{#if type === 'article'}
		{#if publishedTime}
			<meta property="article:published_time" content={publishedTime} />
		{/if}
		{#if modifiedTime}
			<meta property="article:modified_time" content={modifiedTime} />
		{/if}
		{#if author}
			<meta property="article:author" content={author} />
		{/if}
		{#if section}
			<meta property="article:section" content={section} />
		{/if}
		{#each tags as tag}
			<meta property="article:tag" content={tag} />
		{/each}
	{/if}

	<!-- Additional SEO meta tags -->
	<meta name="author" content={author} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<meta name="theme-color" content="#3b82f6" />
	<meta name="msapplication-TileColor" content="#3b82f6" />

	<!-- JSON-LD structured data -->
	<script type="application/ld+json">
		{JSON.stringify(websiteSchema)}
	</script>
	{#if getArticleSchema()}
		<script type="application/ld+json">
			{JSON.stringify(getArticleSchema())}
		</script>
	{/if}

	<!-- Render any additional head content passed as children -->
	{@render children?.()}
</svelte:head>