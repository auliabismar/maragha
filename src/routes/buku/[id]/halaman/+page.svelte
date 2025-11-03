<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase';
import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui';
import { toast } from 'svelte-sonner';

	interface Book {
		id: string;
		judul: string;
		cover?: string;
		status: string;
		penulis: string[];
		penerbit: string;
		kategori: string[];
		screenshot: boolean;
	}

	interface Halaman {
		id: string;
		halaman: number;
		terjemah: string;
		image?: string;
		buku: string;
		status?: string;
	}

	let book = $state<Book | null>(null);
	let halamanRecords = $state<Halaman[]>([]);
	let currentPage = $state(1);
	let itemsPerPage = $state(1);
	let totalPages = $state(1);
	let loading = $state(true);
	let lemariRecord = $state<any>(null);
	let jumpPageInput = $state('');
	let showImages = $state<boolean>(true);

	// Translation suggestion dialog state
	let showSuggestionDialog = $state(false);
	let selectedText = $state('');
	let terjemahanBaru = $state('');
	let alasanKeterangan = $state('');
	let selectedHalamanId = $state<string>('');
	let selectedHalamanNo = $state<number>(0);
	let cleanup: (() => void) | undefined;

	// AbortController for fetchHalaman requests
	let abortController: AbortController | null = null;

	// Get book ID from route params
	const bookId = $derived($page.params.id);

	onMount(async () => {
		if (!pb.authStore.isValid) {
			goto('/login');
			return;
		}

		if (!bookId) {
			goto('/');
			return;
		}

		loadImagePreference();
		await Promise.all([fetchBook(), fetchHalaman(), syncWithBookshelf()]);
		loading = false;

		// Add keyboard navigation for pagination
		function handleKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape' && showSuggestionDialog) {
				event.preventDefault();
				closeSuggestionDialog();
				return;
			}

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
			abortController?.abort();
		};
	});

	function loadImagePreference() {
		const saved = localStorage.getItem('showImages');
		showImages = saved === null ? true : saved === 'true';
	}

	function toggleImages() {
		showImages = !showImages;
		localStorage.setItem('showImages', showImages.toString());
	}

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
				kategori: record.expand?.kategori?.map((k: any) => k.id) || [],
				screenshot: record.screenshot || false
			};
		} catch (error) {
			console.error('Error fetching book:', error);
			goto('/');
		}
	}

	async function fetchHalaman() {
		if (!bookId) return;

		// Abort previous request if any
		if (abortController) {
			abortController.abort();
		}
		abortController = new AbortController();
		
		try {
			const records = await pb.collection('halaman').getList(currentPage, itemsPerPage, {
				filter: `buku = "${bookId}" && status != "Draft"`,
				sort: 'halaman',
				expand: 'buku',
				signal: abortController.signal
			});

			halamanRecords = records.items.map(record => ({
				id: record.id,
				halaman: record.halaman,
				terjemah: record.terjemah,
				image: record.image ? pb.files.getURL(record, record.image) : undefined,
				status: record.status,
				buku: record.buku
			}));

			totalPages = Math.ceil(records.totalItems / itemsPerPage);
		} catch (error: any) {
			if (error.name === 'AbortError') {
				return;
			}
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
			updateBookshelfPage(page);
			fetchHalaman();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function jumpToPage() {
		const pageNumber = parseInt(jumpPageInput);
		
		if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
			goToPage(pageNumber);
			jumpPageInput = '';
		}
	}

	function handleJumpInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			jumpToPage();
		}
	}

	function handleJumpInputBlur() {
		const pageNumber = parseInt(jumpPageInput);
		if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
			jumpPageInput = '';
		}
	}

	function getPageNumbers(): (number | string)[] {
		const pages: (number | string)[] = [];
		const maxVisible = 5;
		const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
		const end = Math.min(totalPages, start + maxVisible - 1);
		
		if (start > 1) {
			pages.push(1);
			if (start > 2) {
				pages.push('...');
			}
		}
		
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		
		if (totalPages > 10) {
			const highestNumbersStart = Math.max(end + 1, totalPages - 19);
			if (highestNumbersStart > end + 1) {
				pages.push('...');
			}
			
			const highestNumbers: number[] = [];
			for (let i = Math.max(totalPages - 9, totalPages - 9); i < totalPages; i++) {
				if (i > end && i !== totalPages) {
					highestNumbers.push(i);
				}
			}
		}
		
		if (end < totalPages) {
			if (!pages.includes(totalPages)) {
				pages.push(totalPages);
			}
		}
		
		return pages;
	}

	function goBack() {
		goto('/lemari');
	}

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

	// Text selection tracking
	function handleTextSelection(halaman: Halaman) {
		const selection = window.getSelection();
		const text = selection?.toString().trim() || '';

		if (text) {
			selectedText = text;
			selectedHalamanId = halaman.id;
			selectedHalamanNo = halaman.halaman;
		} else {
			selectedText = '';
			selectedHalamanId = '';
			selectedHalamanNo = 0;
		}
	}

	function openSuggestionDialog() {
		if (selectedText.trim()) {
			showSuggestionDialog = true;
		}
	}

	function closeSuggestionDialog() {
		showSuggestionDialog = false;
		selectedText = '';
		terjemahanBaru = '';
		alasanKeterangan = '';
		selectedHalamanId = '';
		selectedHalamanNo = 0;
		window.getSelection()?.removeAllRanges();
	}

	async function submitSuggestion() {
		if (!selectedText.trim() || !terjemahanBaru.trim() || !alasanKeterangan.trim()) {
			toast.error('Semua field wajib diisi!');
			return;
		}

		try {
			const keterangan = `Selected Text:\n${selectedText}\n\nTerjemahan Baru:\n${terjemahanBaru}\n\nAlasan/Keterangan:\n${alasanKeterangan}`;

			await pb.collection('penugasan').create({
				pelapor: pb.authStore.model?.id,
				buku: bookId,
				awal_halaman: selectedHalamanNo,
				akhir_halaman: selectedHalamanNo,
				keterangan: keterangan,
				status: 'Terlapor'
			});

			toast.success('Saran review terjemahan berhasil dikirim!');
			closeSuggestionDialog();
		} catch (error) {
			console.error('Error submitting suggestion:', error);
			toast.error('Terjadi kesalahan saat mengirim saran. Silakan coba lagi.');
		}
	}

	// Check if screenshots are enabled for this book
	const hasScreenshots = $derived(book?.screenshot === true);

	// Check if button should be enabled
	const isSuggestionEnabled = $derived(selectedText.trim().length > 0);

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
				Kembali ke lemari buku
			</button>
			
			<div class="flex flex-col md:flex-row md:items-center md:justify-between">
				<div class="flex-1">
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
				
				<div class="mt-4 md:mt-0 flex items-center gap-4">
					{#if hasScreenshots}
						<!-- Image Display Toggle Button -->
						<button
							onclick={toggleImages}
							class="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
						>
							{#if showImages}
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
								</svg>
								Sembunyikan Gambar
							{:else}
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
									<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
								</svg>
								Tampilkan Gambar
							{/if}
						</button>
					{/if}

					{#if book.cover && showImages}
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
								<button
									onclick={openSuggestionDialog}
									disabled={!isSuggestionEnabled}
									class="px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
								>
									Sarankan Review Terjemahan
								</button>
							</div>
							
							<!-- Desktop Layout: Split Screen -->
							<div class="hidden lg:grid gap-6 {(showImages && hasScreenshots) ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}">
								<!-- Left Panel: Text (Terjemah) -->
								<div
									class="bg-muted/30 rounded-lg p-4 select-text"
									onmouseup={() => handleTextSelection(halaman)}
									ontouchend={() => handleTextSelection(halaman)}
									role="textbox"
									tabindex="0"
								>
									<h4 class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
										Terjemah
									</h4>
									<div class="prose prose-sm max-w-none text-foreground leading-relaxed">
										{@html halaman.terjemah}
									</div>
								</div>
								
								{#if hasScreenshots && showImages}
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
								{/if}
							</div>
							
							<!-- Mobile/Tablet Layout: Stacked -->
							<div class="lg:hidden space-y-4">
								<!-- Text Panel -->
								<div
									class="bg-muted/30 rounded-lg p-4 select-text"
									onmouseup={() => handleTextSelection(halaman)}
									ontouchend={() => handleTextSelection(halaman)}
									role="textbox"
									tabindex="0"
								>
									<h4 class="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
										Terjemah
									</h4>
									<div class="prose prose-sm max-w-none text-foreground leading-relaxed">
										{@html halaman.terjemah}
									</div>
								</div>
								
								{#if hasScreenshots && showImages}
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
								{/if}
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

					<!-- Jump to Page Input -->
					<div class="flex items-center justify-center space-x-2 mb-4">
						<label for="jump-page" class="text-sm text-muted-foreground whitespace-nowrap">
							Loncat ke halaman:
						</label>
						<input
							id="jump-page"
							type="number"
							min="1"
							max={totalPages}
							bind:value={jumpPageInput}
							onkeydown={handleJumpInputKeydown}
							onblur={handleJumpInputBlur}
							placeholder="1-{totalPages}"
							class="w-20 px-2 py-1 text-sm text-center border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
						/>
						<button
							onclick={jumpToPage}
							disabled={!jumpPageInput || isNaN(parseInt(jumpPageInput)) || parseInt(jumpPageInput) < 1 || parseInt(jumpPageInput) > totalPages}
							class="px-3 py-1 text-xs font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							GO
						</button>
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
							{'>>'}
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

	<!-- Translation Suggestion Dialog -->
	{#if showSuggestionDialog}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onclick={closeSuggestionDialog}>
			<div class="bg-card rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onclick={(e) => e.stopPropagation()}>
				<div class="p-6">
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-xl font-semibold text-foreground">Sarankan Review Terjemahan</h2>
						<button
							onclick={closeSuggestionDialog}
							class="text-muted-foreground hover:text-foreground transition-colors"
							aria-label="Tutup dialog"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
							</svg>
						</button>
					</div>

					<form onsubmit={(e) => { e.preventDefault(); submitSuggestion(); }} class="space-y-4">
						<!-- Selected Text (Read Only) -->
						<div>
							<label for="selectedText" class="block text-sm font-medium text-foreground mb-2">
								Teks yang Dipilih <span class="text-red-500">*</span>
							</label>
							<textarea
								id="selectedText"
								name="selectedText"
								value={selectedText}
								readonly
								required
								rows="3"
								class="w-full px-3 py-2 text-sm border border-border rounded-md bg-muted cursor-not-allowed"
							></textarea>
							<p class="text-xs text-muted-foreground mt-1">Teks ini diambil dari bagian yang Anda pilih</p>
						</div>

						<!-- Terjemahan Baru -->
						<div>
							<label for="terjemahanBaru" class="block text-sm font-medium text-foreground mb-2">
								Terjemahan Baru <span class="text-red-500">*</span>
							</label>
							<textarea
								id="terjemahanBaru"
								name="terjemahanBaru"
								bind:value={terjemahanBaru}
								required
								rows="4"
								placeholder="Masukkan terjemahan baru yang Anda sarankan..."
								class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							></textarea>
						</div>

						<!-- Alasan/Keterangan -->
						<div>
							<label for="alasanKeterangan" class="block text-sm font-medium text-foreground mb-2">
								Alasan/Keterangan <span class="text-red-500">*</span>
							</label>
							<textarea
								id="alasanKeterangan"
								name="alasanKeterangan"
								bind:value={alasanKeterangan}
								required
								rows="3"
								placeholder="Jelaskan alasan atau keterangan untuk saran ini..."
								class="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
							></textarea>
						</div>

						<!-- Form Actions -->
						<div class="flex items-center justify-end space-x-3 pt-4 border-t border-border">
							<button
								type="button"
								onclick={closeSuggestionDialog}
								class="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-md hover:bg-muted/80 transition-colors"
							>
								Batal
							</button>
							<button
								type="submit"
								disabled={!selectedText.trim() || !terjemahanBaru.trim() || !alasanKeterangan.trim()}
								class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Kirim Saran
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="flex items-center justify-center min-h-screen">
		<p class="text-lg text-muted-foreground">Buku tidak ditemukan.</p>
	</div>
{/if}