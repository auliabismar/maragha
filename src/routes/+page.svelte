<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import BookCard from '$lib/components/BookCard.svelte';
	import TelegramIcon from '$lib/components/TelegramIcon.svelte';
	import SEO from '$lib/components/SEO.svelte';

	interface Book {
		id: string;
		judul: string;
		cover?: string;
		status: string;
		penulis: string[];
		penerbit: string;
		kategori: string[];
		totalHalaman: number;
		halamanSetuju: number;
	}

	interface Stats {
		totalBooks: number;
		totalTranslatedPages: number;
		uniqueAuthors: number;
	}

	interface PageData {
		books: Book[];
		stats: Stats;
		availableKategoris: string[];
		user?: any;
	}

	let { data }: { data: PageData } = $props();

	interface Book {
		id: string;
		judul: string;
		cover?: string;
		status: string;
		penulis: string[];
		penerbit: string;
		kategori: string[];
		totalHalaman: number;
		halamanSetuju: number;
	}

	let books = $state<Book[]>(data.books);
	let selectedKategori = $state<string>('all');
	let searchQuery = $state<string>('');
	let availableKategoris = $state<string[]>(data.availableKategoris);
	let showImages = $state<boolean>(true);
	let currentBooks = $state<number>(0);
	let currentPages = $state<number>(0);
	let currentAuthors = $state<number>(0);
	let flooredPages = $derived(Math.floor(data.stats.totalTranslatedPages / 100) * 100);
	let statsSection: HTMLElement;
	let loadMoreObserver: IntersectionObserver;
	let hasMore = $state<boolean>(true);
	let currentPage = $state<number>(1);
	let perPage = 12;
	let loading = $state<boolean>(false);
	let allLoadedBooks = $state<Book[]>(data.books); // For filtering across loaded books

	// Use $derived for reactive filtering
	let filteredBooks = $derived(
		allLoadedBooks.filter((book) => {
			const matchesKategori =
				selectedKategori === 'all' || book.kategori.includes(selectedKategori);
			const matchesSearch =
				book.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
				book.penulis.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
				book.kategori.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));
			return matchesKategori && matchesSearch;
		})
	);

	const CACHE_KEY = 'maragha_home_data';
	const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

	function getCache(): any | null {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (!cached) return null;
			const { data: cachedData, timestamp } = JSON.parse(cached);
			if (Date.now() - timestamp > CACHE_EXPIRY) {
				localStorage.removeItem(CACHE_KEY);
				return null;
			}
			return cachedData;
		} catch {
			return null;
		}
	}

	function setCache(dataToCache: any) {
		try {
			localStorage.setItem(CACHE_KEY, JSON.stringify({
				data: dataToCache,
				timestamp: Date.now()
			}));
		} catch {}
	}

	function mergeBooks(newBooks: Book[]) {
		const existingIds = new Set(allLoadedBooks.map(b => b.id));
		const uniqueNew = newBooks.filter(b => !existingIds.has(b.id));
		allLoadedBooks = [...allLoadedBooks, ...uniqueNew];
		books = allLoadedBooks;
		// filteredBooks is now reactive, no need to call filterBooks()
	}

	async function loadMore() {
		if (loading || !hasMore) return;
		loading = true;
		try {
			const response = await fetch(`/api/books?page=${currentPage + 1}&perPage=${perPage}`);
			const result = await response.json();
			if (result.books.length < perPage) hasMore = false;
			mergeBooks(result.books);
			currentPage++;
			// Update cache with all loaded books and stats
			setCache({
				books: allLoadedBooks,
				stats: data.stats,
				availableKategoris
			});
		} catch (error) {
			console.error('Error loading more books:', error);
		} finally {
			loading = false;
		}
	}

	// Remove filterBooks function since we're using $derived

	function calculateProgress(book: Book): number {
		if (book.totalHalaman === 0) return 0;
		return Math.round((book.halamanSetuju / book.totalHalaman) * 100);
	}

	function cubicOut(t: number): number {
		return --t * t * t + 1;
	}

	function animateCounters(targetBooks: number, targetPages: number, targetAuthors: number) {
		const duration = 2500;
		const startTime = performance.now();
		function update(currentTime: number) {
			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const ease = cubicOut(progress);
			currentBooks = Math.floor(ease * targetBooks);
			currentPages = Math.floor(ease * targetPages);
			currentAuthors = Math.floor(ease * targetAuthors);
			if (progress < 1) {
				requestAnimationFrame(update);
			}
		}
		requestAnimationFrame(update);
	}

	onMount(() => {
		// Load from cache for instant display on reload
		const cached = getCache();
		if (cached) {
			allLoadedBooks = cached.books || data.books;
			books = allLoadedBooks;
			// filteredBooks is now reactive, no need to call filterBooks()
			// Use cached stats if available, but prefer fresh from SSR
			if (cached.stats) {
				animateCounters(cached.stats.totalBooks, Math.floor(cached.stats.totalTranslatedPages / 100) * 100, cached.stats.uniqueAuthors);
			}
		} else {
			// Cache initial SSR data
			setCache({
				books: data.books,
				stats: data.stats,
				availableKategoris
			});
		}

		// Animate counters on scroll into view
		if (statsSection) {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						animateCounters(
							data.stats.totalBooks,
							flooredPages,
							data.stats.uniqueAuthors
						);
						observer.disconnect();
					}
				});
			});
			observer.observe(statsSection);
		}

		// Infinite scroll observer
		const sentinel = document.querySelector('#load-more-sentinel');
		if (sentinel) {
			loadMoreObserver = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			});
			loadMoreObserver.observe(sentinel);
		}

		return () => {
			if (loadMoreObserver) loadMoreObserver.disconnect();
		};
	});

	// Remove the $effect since filtering is now reactive with $derived
</script>

<SEO
	title="Maragha - Merawat Warisan Intelektual Islam"
	description="Maragha: Platform perpustakaan digital untuk buku-buku klasik Arab yang telah diterjemahkan dan crowd sourcing terjemahan untuk melestarikan khazanah intelektual Islam."
	keywords="perpustakaan digital, buku klasik Arab, terjemahan, intelektual Islam, crowd sourcing, maragha, literatur Islam, naskah klasik"
	type="website"
	image="/logo.svg"
/>

<main class="container mx-auto px-6 py-8">
	<section
		class="relative bg-gradient-to-br from-[var(--maragha-background)] to-[color-mix(in_srgb,_var(--maragha-background)_85%,_black)] py-16 px-6 rounded-2xl mb-12 border border-[var(--maragha-gold)]/20"
	>
		<div class="absolute inset-0 opacity-5">
			<svg class="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<pattern
						id="islamic-pattern"
						x="0"
						y="0"
						width="20"
						height="20"
						patternUnits="userSpaceOnUse"
					>
						<circle cx="10" cy="10" r="2" fill="#29477B" />
						<path d="M10 5 L10 15 M5 10 L15 10" stroke="#29477B" stroke-width="0.5" />
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#islamic-pattern)" />
			</svg>
		</div>

		<div class="relative z-10 text-center max-w-4xl mx-auto">
			<h1
				class="text-5xl md:text-6xl font-heading font-bold text-[#29477B] mb-6 leading-tight"
			>
				Merawat Warisan<br />
				<span class="text-[#64463C]">Intelektual Islam</span>
			</h1>

			<p class="text-xl md:text-2xl text-[#64463C] mb-8 font-medium leading-relaxed">
				Platform perpustakaan digital untuk<br />
				<span class="text-[#29477B] font-semibold">buku-buku klasik Arab</span> yang telah
				diterjemahkan<br />
				dengan semangat <span class="text-[#D4A856] font-semibold"
					>gotong royong literasi</span
				>
			</p>

			<p class="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
				Bergabunglah dalam misi melestarikan dan menyemarakkan khazanah intelektual Islam
				melalui terjemahan kolaboratif naskah-naskah berharga yang telah mendekati keilmuan
				selama berabad-abad.
			</p>

			<div class="inline-flex sm:flex-row gap-4 justify-center items-center mb-8">
				<a
					href="https://t.me/+I0dP61OBmSEyZTk1"
					class="inline-flex items-center bg-[#29477B] text-white px-8 py-4 rounded-xl font-semibold text-lg
					hover:bg-[#1e3658] transition-all duration-300 shadow-lg hover:shadow-xl
					transform hover:-translate-y-1"
				>
					<TelegramIcon classNames="mr-2" size="20" /> Mulai Kontribusi
				</a>
			</div>

			<div bind:this={statsSection}
				class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-[#D4A856]/30"
			>
				<div class="text-center hover:scale-105 transition-transform duration-300">
					<div class="text-3xl font-bold text-[#29477B] mb-2">{currentBooks}</div>
					<div class="text-[#64463C] font-medium">Buku Klasik</div>
				</div>
				<div class="text-center hover:scale-105 transition-transform duration-300">
					<div class="text-3xl font-bold text-[#D4A856] mb-2">{currentPages}+</div>
					<div class="text-[#64463C] font-medium">Halaman Diterjemahkan</div>
				</div>
				<div class="text-center hover:scale-105 transition-transform duration-300">
					<div class="text-3xl font-bold text-[#64463C] mb-2">{currentAuthors}</div>
					<div class="text-[#64463C] font-medium">Penulis Klasik</div>
				</div>
			</div>
		</div>

		<div class="absolute top-4 right-4 text-[#D4A856] opacity-20">
			<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
				/>
			</svg>
		</div>
		<div class="absolute bottom-4 left-4 text-[#A1A2A6] opacity-20">
			<svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
				/>
			</svg>
		</div>
	</section>

	<section class="mb-8">
		<div class="flex flex-col md:flex-row gap-4 items-center justify-between">
			<div class="flex flex-col sm:flex-row gap-4 w-full">
				<div class="w-full md:w-2/3">
					<input
						type="text"
						placeholder="Cari buku, penulis, atau kategori..."
						bind:value={searchQuery}
						class="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)]"
					/>
				</div>

				<div class="w-full md:w-auto md:flex-1">
					<select
						bind:value={selectedKategori}
						class="w-full md:w-auto px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)]"
					>
						<option value="all">Semua Kategori</option>
						{#each availableKategoris as kategori}
							<option value={kategori}>{kategori}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</section>

	<section>
		{#if loading}
			<div class="text-center py-4">Loading more books...</div>
		{/if}
		{#if filteredBooks.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each filteredBooks as book}
					<BookCard {book} />
				{/each}
			</div>
			{#if hasMore}
				<div id="load-more-sentinel" class="h-10"></div>
			{/if}
		{:else}
			<div class="text-center py-12">
				<p class="text-lg text-[var(--muted-foreground)]">
					{allLoadedBooks.length === 0
					? 'Belum ada buku yang tersedia.'
					: 'Tidak ada buku yang sesuai dengan filter. Coba muat lebih banyak buku.'}
				</p>
			</div>
		{/if}
	</section>
</main>