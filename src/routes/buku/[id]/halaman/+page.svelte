<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
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

	interface Halaman {
		id: string;
		halaman: number;
		terjemah: string;
		image?: string;
		buku: string;
	}

	let book = $state<Book | null>(null);
	let halamanRecords = $state<Halaman[]>([]);
	let currentPage = $state(1);
	let itemsPerPage = $state(1); // Fixed to 1 record per screen
	let totalPages = $state(1);
	let loading = $state(true);
	let lemariRecord = $state<any>(null);

	// Get book ID from route params
	const bookId = $derived($page.params.id);

	onMount(async () => {
		if (!pb.authStore.isValid) {
			goto('/login');
			return;
		}

		if (!bookId) {
			goto('/dashboard');
			return;
		}

		await Promise.all([fetchBook(), fetchHalaman(), syncWithBookshelf()]);
		loading = false;

		// Add keyboard navigation for pagination
		function handleKeydown(event: KeyboardEvent) {
			// Only handle arrow keys when not in an input field
			if (event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement) {
				return;
			}

			switch (event.key) {
				case 'ArrowLeft':
					event.preventDefault();
					goToPreviousPage();
					break;
				case 'ArrowRight':
					event.preventDefault();
					goToNextPage();
					break;
			}
		}

		document.addEventListener('keydown', handleKeydown);

		// Store cleanup function
		cleanup = () => {
			document.removeEventListener('keydown', handleKeydown);
		};
	});

	async function fetchBook() {
		if (!bookId) return;
		
		try {
			const record = await pb.collection('buku').getOne(bookId, {
				expand: 'penulis,penerbit,kategori'
			});

			book = {
				id: record.id,
				judul: record.judul,
				cover: record.cover ? pb.files.getURL(record, record.cover) : undefined,
				status: record.status,
				penulis: record.expand?.penulis?.map((p: any) => p.id) || [],
				penerbit: record.expand?.penerbit?.id || 'N/A',
				kategori: record.expand?.kategori?.map((k: any) => k.id) || []
			};
		} catch (error) {
			console.error('Error fetching book:', error);
			goto('/dashboard');
		}
	}

	async function fetchHalaman() {
		if (!bookId) return;
		
		try {
			const records = await pb.collection('halaman').getList(currentPage, itemsPerPage, {
				filter: `buku = "${bookId}"`,
				sort: 'halaman',
				expand: 'buku'
			});

			halamanRecords = records.items.map(record => ({
				id: record.id,
				halaman: record.halaman,
				terjemah: record.terjemah,
				image: record.image ? pb.files.getURL(record, record.image) : undefined,
				buku: record.buku
			}));

			totalPages = Math.ceil(records.totalItems / itemsPerPage);
		} catch (error) {
			console.error('Error fetching halaman:', error);
		}
	}

	async function syncWithBookshelf() {
		if (!pb.authStore.model) {
			console.error('User not authenticated');
			return;
		}
		try {
			const records = await pb.collection('lemari_buku').getList(1, 1, {
				filter: `pengguna = "${pb.authStore.model.id}" && buku = "${bookId}"`
			});

			if (records.items.length > 0) {
				lemariRecord = records.items[0];
				currentPage = lemariRecord.halaman;
			} else {
				const newRecord = await pb.collection('lemari_buku').create({
					pengguna: pb.authStore.model.id,
					buku: bookId,
					halaman: 1
				});
				lemariRecord = newRecord;
				currentPage = 1;
			}

			// Fetch halaman for the updated currentPage
			fetchHalaman();
		} catch (error) {
			console.error('Error syncing with bookshelf:', error);
		}
	}

	async function updateBookshelfPage(page: number) {
		if (!lemariRecord) {
			return;
		}

		try {
			await pb.collection('lemari_buku').update(lemariRecord.id, {
				halaman: page
			});
		} catch (error) {
			console.error('Error updating bookshelf page:', error);
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			updateBookshelfPage(page); // Track page in bookshelf
			fetchHalaman();
			// Scroll to top of page
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function getPageNumbers(): (number | string)[] {
		const pages: (number | string)[] = [];
		const maxVisible = 5;
		const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		const end = Math.min(totalPages, start + maxVisible - 1);
		
		// Add first page if not visible
		if (start > 1) {
			pages.push(1);
			if (start > 2) {
				pages.push('...');
			}
		}
		
		// Add regular page numbers
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		
		// Add last 10 multiples of 10 and highest page numbers
		if (totalPages > 10) {
			// Add ellipsis before high numbers if needed
			const highestNumbersStart = Math.max(end + 1, totalPages - 19);
			if (highestNumbersStart > end + 1) {
				pages.push('...');
			}
			
			// Add highest numbers (last 10 pages)
			const highestNumbers: number[] = [];
			for (let i = Math.max(totalPages - 9, totalPages - 9); i < totalPages; i++) {
				if (i > end && i !== totalPages) {
					highestNumbers.push(i);
				}
			}
		}
		
		// Add last page if not visible
		if (end < totalPages) {
			if (!pages.includes(totalPages)) {
				pages.push(totalPages);
			}
		}
		
		return pages;
	}

	function goBack() {
		goto('/dashboard');
	}

	// Cleanup function for event listeners
	let cleanup: (() => void) | undefined;

	function goToPreviousPage() {
		if (currentPage > 1) {
			goToPage(currentPage - 1);
		}
	}

	function goToNextPage() {
		if (currentPage < totalPages) {
			goToPage(currentPage + 1);
		}
	}

	// Cleanup on component destroy
	$effect(() => {
		return () => {
			if (cleanup) {
				cleanup();
			}
		};
	});

	// Reactive statements
	$effect(() => {
		if (bookId && !loading) {
			fetchHalaman();
		}
	});
</script>

<svelte:head>
	<title>Maragha - {book?.judul || 'Halaman Buku'}</title>
	<meta name="description" content="Baca halaman buku digital Maragha" />
</svelte:head>

{#if loading}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
			<p class="text-muted-foreground">Memuat halaman...</p>
		</div>
	</div>
{:else if book}
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<button 
				onclick={goBack}
				class="inline-flex items-center text-primary hover:text-accent mb-4 transition-colors"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Kembali ke Dashboard
			</button>
			
			<div class="flex flex-col md:flex-row md:items-center md:justify-between">
				<div>
					<h1 class="text-3xl font-heading font-bold text-foreground mb-2">{book.judul}</h1>
					<p class="text-muted-foreground">
						Penulis: {book.penulis.join(', ')} | Penerbit: {book.penerbit}
					</p>
					{#if book.kategori.length > 0}
						<p class="text-muted-foreground mt-1">
							Kategori: {book.kategori.join(', ')}
						</p>
					{/if}
				</div>
				
				<div class="mt-4 md:mt-0">
					{#if book.cover}
						<img src={book.cover} alt={book.judul} class="w-24 h-32 object-cover rounded-lg shadow-md" />
					{/if}
				</div>
			</div>
		</div>

		<!-- Halaman Records -->
		{#if halamanRecords.length > 0}
			<div class="space-y-6">
				{#each halamanRecords as halaman}
					<div class="bg-card rounded-lg shadow-md overflow-hidden">
						<div class="p-6">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-lg font-semibold text-foreground">
									Halaman {halaman.halaman}
								</h3>
							</div>
							
							<!-- Desktop Layout: Split Screen -->
							<div class="hidden lg:grid lg:grid-cols-2 gap-6">
								<!-- Left Panel: Text (Terjemah) -->
								<div class="bg-muted/30 rounded-lg p-4">
									<h4 class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
										Terjemah
									</h4>
									<div class="prose prose-sm max-w-none text-foreground leading-relaxed">
										{@html halaman.terjemah}
									</div>
								</div>
								
								<!-- Right Panel: Image -->
								<div class="bg-muted/30 rounded-lg p-4">
									<h4 class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
										Gambar
									</h4>
									{#if halaman.image}
										<img
											src={halaman.image}
											alt="Halaman {halaman.halaman}"
											class="w-full h-auto rounded-lg shadow-sm object-contain"
											style="aspect-ratio: auto;"
										/>
									{:else}
										<div class="flex items-center justify-center h-48 bg-muted rounded-lg">
											<div class="text-center text-muted-foreground">
												<svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
													<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
												</svg>
												<p class="text-sm">Tidak ada gambar</p>
											</div>
										</div>
									{/if}
								</div>
							</div>
							
							<!-- Mobile/Tablet Layout: Stacked -->
							<div class="lg:hidden space-y-4">
								<!-- Text Panel -->
								<div class="bg-muted/30 rounded-lg p-4">
									<h4 class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
										Terjemah
									</h4>
									<div class="prose prose-sm max-w-none text-foreground leading-relaxed">
										{@html halaman.terjemah}
									</div>
								</div>
								
								<!-- Image Panel -->
								<div class="bg-muted/30 rounded-lg p-4">
									<h4 class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
										Gambar
									</h4>
									{#if halaman.image}
										<img
											src={halaman.image}
											alt="Halaman {halaman.halaman}"
											class="w-full h-auto rounded-lg shadow-sm object-contain"
											style="aspect-ratio: auto;"
										/>
									{:else}
										<div class="flex items-center justify-center h-48 bg-muted rounded-lg">
											<div class="text-center text-muted-foreground">
												<svg class="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
													<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
												</svg>
												<p class="text-sm">Tidak ada gambar</p>
											</div>
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-8 space-y-4">
					<!-- Keyboard Navigation Hint -->
					<div class="text-center">
						<p class="text-xs text-muted-foreground mb-4">
							Gunakan ← dan → untuk navigasi halaman
						</p>
						
						
					</div>
					
					<!-- Standard Pagination -->
					<nav class="flex items-center justify-center space-x-2">
						<!-- First Page Button -->
						<button
							onclick={() => goToPage(1)}
							disabled={currentPage === 1}
							aria-label="Halaman pertama"
							class="px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{'<<'}
						</button>

						<!-- Previous Page Button -->
						<button
							onclick={() => goToPage(currentPage - 1)}
							disabled={currentPage === 1}
							aria-label="Halaman sebelumnya"
							class="px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{'<'}
						</button>

						<!-- Page Numbers -->
						{#each getPageNumbers() as page}
							{#if page === '...'}
								<span class="px-3 py-2 text-sm text-muted-foreground">...</span>
							{:else}
								<button
									onclick={() => goToPage(page as number)}
									class="px-3 py-2 text-sm font-medium rounded-lg transition-colors
										{currentPage === page
											? 'bg-primary text-primary-foreground'
											: 'text-muted-foreground bg-card border border-border hover:bg-muted'}"
								>
									{page}
								</button>
							{/if}
						{/each}

						<!-- Next Page Button -->
						<button
							onclick={() => goToPage(currentPage + 1)}
							disabled={currentPage === totalPages}
							aria-label="Halaman berikutnya"
							class="px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{'>'}
						</button>

						<!-- Last Page Button -->
						<button
							onclick={() => goToPage(totalPages)}
							disabled={currentPage === totalPages}
							aria-label="Halaman terakhir"
							class="px-3 py-2 text-sm font-medium text-muted-foreground bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{'>'}
						</button>
					</nav>
				</div>
			{/if}
		{:else}
			<div class="text-center py-12">
				<p class="text-lg text-muted-foreground">
					Belum ada halaman yang tersedia untuk buku ini.
				</p>
			</div>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center min-h-screen">
		<p class="text-lg text-muted-foreground">Buku tidak ditemukan.</p>
	</div>
{/if}