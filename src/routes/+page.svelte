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
		totalAvailableBooks: number;
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
			localStorage.setItem(
				CACHE_KEY,
				JSON.stringify({
					data: dataToCache,
					timestamp: Date.now()
				})
			);
		} catch {}
	}

	function mergeBooks(newBooks: Book[]) {
		const existingIds = new Set(allLoadedBooks.map((b) => b.id));
		const uniqueNew = newBooks.filter((b) => !existingIds.has(b.id));
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
				animateCounters(
					cached.stats.totalBooks,
					Math.floor(cached.stats.totalTranslatedPages / 100) * 100,
					cached.stats.uniqueAuthors
				);
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
						animateCounters(data.stats.totalBooks, flooredPages, data.stats.uniqueAuthors);
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
		class="relative mb-12 rounded-2xl border border-[var(--maragha-gold)]/20 bg-gradient-to-br from-[var(--maragha-background)] to-[color-mix(in_srgb,_var(--maragha-background)_85%,_black)] px-6 py-16"
	>
		<div class="absolute inset-0 opacity-5">
			<svg class="h-full w-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
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

		<div class="relative z-10 mx-auto max-w-4xl text-center">
			<h1 class="font-heading mb-6 text-5xl leading-tight font-bold text-[#29477B] md:text-6xl">
				Merawat Warisan<br />
				<span class="text-[#64463C]">Intelektual Islam</span>
			</h1>

			<p class="mb-8 text-xl leading-relaxed font-medium text-[#64463C] md:text-2xl">
				Platform perpustakaan digital untuk<br />
				<span class="font-semibold text-[#29477B]">buku-buku klasik Arab</span> yang telah
				diterjemahkan<br />
				dengan semangat <span class="font-semibold text-[#D4A856]">gotong royong literasi</span>
			</p>

			<p class="text-muted-foreground mx-auto mb-10 max-w-3xl text-lg leading-relaxed">
				Bergabunglah dalam misi melestarikan dan menyemarakkan khazanah intelektual Islam melalui
				terjemahan kolaboratif naskah-naskah berharga yang telah mendekati keilmuan selama
				berabad-abad.
			</p>

			<div class="mb-8 inline-flex items-center justify-center gap-4 sm:flex-row">
				<a
					href="https://t.me/+I0dP61OBmSEyZTk1"
					class="inline-flex transform items-center rounded-xl bg-[#29477B] px-8 py-4 text-lg font-semibold
					text-white shadow-lg transition-all duration-300 hover:-translate-y-1
					hover:bg-[#1e3658] hover:shadow-xl"
				>
					<TelegramIcon classNames="mr-2" size="20" /> Mulai Kontribusi
				</a>
			</div>

			<div
				bind:this={statsSection}
				class="mt-12 grid grid-cols-1 gap-8 border-t border-[#D4A856]/30 pt-8 md:grid-cols-3"
			>
				<div class="text-center transition-transform duration-300 hover:scale-105">
					<div class="mb-2 text-3xl font-bold text-[#29477B]">{currentBooks}</div>
					<div class="font-medium text-[#64463C]">Buku Klasik</div>
				</div>
				<div class="text-center transition-transform duration-300 hover:scale-105">
					<div class="mb-2 text-3xl font-bold text-[#D4A856]">{currentPages}+</div>
					<div class="font-medium text-[#64463C]">Halaman Diterjemahkan</div>
				</div>
				<div class="text-center transition-transform duration-300 hover:scale-105">
					<div class="mb-2 text-3xl font-bold text-[#64463C]">{currentAuthors}</div>
					<div class="font-medium text-[#64463C]">Penulis Klasik</div>
				</div>
			</div>
		</div>

		<div class="absolute top-4 right-4 text-[#D4A856] opacity-20">
			<svg class="h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
				/>
			</svg>
		</div>
		<div class="absolute bottom-4 left-4 text-[#A1A2A6] opacity-20">
			<svg class="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
				<path
					d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
				/>
			</svg>
		</div>
	</section>

	<section class="mb-8">
		<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
			<div class="flex w-full flex-col gap-4 sm:flex-row">
				<div class="w-full md:w-2/3">
					<input
						type="text"
						placeholder="Cari buku, penulis, atau kategori..."
						bind:value={searchQuery}
						class="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)]"
					/>
				</div>

				<div class="w-full md:w-auto md:flex-1">
					<select
						bind:value={selectedKategori}
						class="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-[var(--foreground)] focus:border-transparent focus:ring-2 focus:ring-[var(--ring)] md:w-auto"
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
			<div class="py-4 text-center">Loading more books...</div>
		{/if}
		{#if filteredBooks.length > 0}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each filteredBooks as book}
					<BookCard {book} />
				{/each}
			</div>
			{#if hasMore}
				<div id="load-more-sentinel" class="h-10"></div>
			{/if}
		{:else}
			<div class="py-12 text-center">
				<p class="text-lg text-[var(--muted-foreground)]">
					{allLoadedBooks.length === 0
						? 'Belum ada buku yang tersedia.'
						: 'Tidak ada buku yang sesuai dengan filter. Coba muat lebih banyak buku.'}
				</p>
			</div>
		{/if}
	</section>
</main>
