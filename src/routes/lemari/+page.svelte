<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase';
	interface Book {
		id: string;
		judul: string;
		cover?: string;
		status: string;
		penulis: string[];
		penerbit: string;
		kategori: string[];
	}

	interface LemariRecord {
		id: string;
		halaman: number;
		buku: string;
		book?: Book; // Expanded book data
	}

	let lemariRecords = $state<LemariRecord[]>([]);
	let loading = $state(true);

	const CACHE_KEY_PREFIX = 'maragha_lemari_';
	const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour

	function getCache(userId: string): any | null {
		try {
			const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
			const cached = localStorage.getItem(cacheKey);
			if (!cached) return null;
			const { data: cachedData, timestamp } = JSON.parse(cached);
			if (Date.now() - timestamp > CACHE_EXPIRY) {
				localStorage.removeItem(cacheKey);
				return null;
			}
			return cachedData;
		} catch {
			return null;
		}
	}

	function setCache(userId: string, dataToCache: any) {
		try {
			const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
			localStorage.setItem(
				cacheKey,
				JSON.stringify({
					data: dataToCache,
					timestamp: Date.now()
				})
			);
		} catch {}
	}

	onMount(async () => {
		if (!pb.authStore.isValid) {
			goto('/login');
			return;
		}

		const userId = pb.authStore.model?.id;
		if (!userId) {
			goto('/login');
			return;
		}

		// Try to load from cache first
		const cached = getCache(userId);
		if (cached && cached.lemariRecords) {
			lemariRecords = cached.lemariRecords;
			loading = false;
		}

		// Always fetch fresh data in background
		await fetchBookshelf();

		// Update cache with fresh data
		setCache(userId, { lemariRecords });
		loading = false;
	});

	async function fetchBookshelf() {
		if (!pb.authStore.model) {
			goto('/login');
			return;
		}

		try {
			const records = await pb.collection('lemari_buku').getList(1, 50, {
				filter: `pengguna = "${pb.authStore.model.id}"`,
				sort: '-updated'
			});
			// Fetch associated book data for each lemari record
			const fetchPromises = records.items.map(async (record: any) => {
				const bookRecord = await pb.collection('buku').getOne(record.buku, {
					expand: 'penulis,penerbit,kategori,sampul_href'
				});

				let coverUrl = undefined;
				// Handle cover from expanded sampul_href relation
				if (bookRecord.expand?.sampul_href) {
					const sampulRecord = bookRecord.expand.sampul_href;
					// Try to find the file field dynamically by looking for common image extensions
					const fileField = Object.keys(sampulRecord).find(
						(key) =>
							typeof sampulRecord[key] === 'string' &&
							/^[a-z0-9_]+\.(webp|jpg|jpeg|png|gif)$/i.test(sampulRecord[key])
					);

					if (fileField) {
						coverUrl = pb.files.getURL(sampulRecord, sampulRecord[fileField]);
					}
				}

				// Fallback to direct cover field if no relation or relation has no file
				if (!coverUrl && bookRecord.cover) {
					coverUrl = pb.files.getURL(bookRecord, bookRecord.cover);
				}

				return {
					id: record.id,
					halaman: record.halaman,
					buku: record.buku,
					book: {
						id: bookRecord.id,
						judul: bookRecord.judul,
						cover: coverUrl,
						status: bookRecord.status,
						penulis: bookRecord.expand?.penulis?.map((p: any) => p.id) || [],
						penerbit: bookRecord.expand?.penerbit?.id || 'N/A',
						kategori: bookRecord.expand?.kategori?.map((k: any) => k.id) || []
					}
				};
			});
			lemariRecords = await Promise.all(fetchPromises);
			// Cache will be updated in onMount after fetch completes
		} catch (error) {
			console.error('Error fetching bookshelf:', error);
		}
	}

	async function removeFromBookshelf(lemariId: string) {
		try {
			await pb.collection('lemari_buku').delete(lemariId);
			// Refresh the bookshelf after removing
			await fetchBookshelf();
		} catch (error) {}
	}

	function goToHome() {
		goto('/');
	}

	function continueReading(lemariRecord: LemariRecord) {
		goto(`/buku/${lemariRecord.buku}/halaman`);
	}

	// Function to get the first few words of a category list
	function formatCategories(kategori: string[]): string {
		if (!kategori || kategori.length === 0) return '';
		if (kategori.length <= 2) return kategori.join(', ');
		return `${kategori.slice(0, 2).join(', ')}...`;
	}
</script>

<svelte:head>
	<title>Maragha - Lemari Buku Saya</title>
	<meta name="description" content="Kelola dan baca buku-buku di lemari buku digital Maragha" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<button
			onclick={goToHome}
			class="mb-4 inline-flex items-center text-[var(--primary)] transition-colors hover:text-[var(--accent)]"
		>
			<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Kembali ke Beranda
		</button>

		<h1 class="font-heading text-3xl font-bold text-[var(--foreground)]">Lemari Buku Saya</h1>
		<p class="mt-2 text-[var(--muted-foreground)]">
			Daftar buku yang telah Anda baca atau sedang dibaca
		</p>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--primary)]"
				></div>
				<p class="text-[var(--muted-foreground)]">Memuat lemari buku...</p>
			</div>
		</div>
	{:else if lemariRecords.length === 0}
		<div class="py-12 text-center">
			<div
				class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-paper-100)]"
			>
				<svg
					class="h-8 w-8 text-[var(--muted-foreground)]"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
					/>
				</svg>
			</div>
			<h2 class="mb-2 text-xl font-semibold text-[var(--foreground)]">Belum ada buku di lemari</h2>
			<p class="mb-6 text-[var(--muted-foreground)]">
				Mulai membaca buku untuk menambahnya ke lemari buku Anda.
			</p>
			<button
				onclick={goToHome}
				class="rounded-lg bg-[var(--color-ribbon-600)] px-4 py-2 text-[var(--primary-foreground)] transition-colors hover:bg-[var(--color-ribbon-700)]"
			>
				Telusuri Buku
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each lemariRecords as record}
				<div
					class="overflow-hidden rounded-lg bg-[var(--card)] shadow-md transition-all hover:shadow-lg"
				>
					<div class="relative h-48 bg-[var(--color-paper-100)]">
						{#if record.book?.cover}
							<img
								src={record.book.cover}
								alt={record.book.judul}
								class="absolute h-full w-full object-cover"
							/>
						{:else}
							<div class="flex h-full items-center justify-center bg-[var(--color-paper-100)]">
								<svg
									class="h-16 w-16 text-[var(--muted-foreground)]"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
									/>
								</svg>
							</div>
						{/if}
					</div>

					<div class="p-4">
						<h3 class="truncate text-lg font-semibold text-[var(--muted-foreground)]">
							{record.book?.judul}
						</h3>
						<div
							class="mt-1 flex items-center justify-between text-xs text-[var(--muted-foreground)]"
						>
							<span>
								{record.book && record.book.penulis && record.book.penulis.length > 0
									? record.book.penulis.join(', ')
									: 'Penulis tidak diketahui'}
							</span>
						</div>

						{#if record.book?.kategori && record.book.kategori.length > 0}
							<p class="mt-1 truncate text-xs text-[var(--muted-foreground)]">
								{formatCategories(record.book.kategori)}
							</p>
						{/if}

						<div class="mt-4 flex items-center justify-between">
							<div class="text-xs text-[var(--muted-foreground)]">
								<span class="inline-flex items-center">
									<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>
									Halaman {record.halaman}
								</span>
							</div>
						</div>

						<div class="mt-4 flex space-x-2">
							<button
								onclick={() => continueReading(record)}
								class="flex-1 rounded-md bg-[var(--color-ribbon-600)] px-3 py-2 text-center text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--color-ribbon-700)]"
							>
								Lanjut Baca
							</button>

							<button
								onclick={() => removeFromBookshelf(record.id)}
								class="rounded-md bg-[var(--color-paper-100)] px-3 py-2 text-sm font-medium text-[var(--color-paper-600)] transition-colors hover:bg-[var(--color-paper-200)]"
								title="Hapus dari Lemari"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
