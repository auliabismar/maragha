<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { createEventDispatcher } from 'svelte';

	// Import stores
	import {
		book,
		halamanRecords,
		loading,
		hasScreenshots,
		totalPages,
		initBookPage,
		cleanup,
		toggleImages
	} from '$lib/stores/bookPageStore';

	// Import components
	import HalamanViewer from '$lib/components/halaman/HalamanViewer.svelte';
	import PaginationControls from '$lib/components/halaman/PaginationControls.svelte';
	import SuggestionDialog from '$lib/components/halaman/SuggestionDialog.svelte';

	// Get book ID from route params
	const bookId = $derived($page.params.id ?? '');

	// Derived values
	let bookValue = $derived($book);
	let halamanRecordsValue = $derived($halamanRecords);
	let loadingValue = $derived($loading);
	let hasScreenshotsValue = $derived($hasScreenshots);
	let totalPagesValue = $derived($totalPages);

	onMount(() => {
		async function initializePage() {
			if (bookId) {
				try {
					await initBookPage(bookId);
				} catch (error) {
				}
			}
		}

		initializePage();

		// Add keyboard navigation for pagination
		function handleKeydown(event: KeyboardEvent) {
			// Only handle arrow keys when not in an input field
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				event.target instanceof HTMLSelectElement ||
				(event.target as Element)?.closest?.('[contenteditable="true"]')
			) {
				return;
			}

			switch (event.key) {
				case 'ArrowLeft':
					event.preventDefault();
					// Go to previous page
					if (bookId) {
						import('$lib/stores/bookPageStore').then(({ goToPreviousPage }) => {
							goToPreviousPage(bookId);
						});
					}
					break;
				case 'ArrowRight':
					event.preventDefault();
					// Go to next page
					if (bookId) {
						import('$lib/stores/bookPageStore').then(({ goToNextPage }) => {
							goToNextPage(bookId);
						});
					}
					break;
			}
		}

		document.addEventListener('keydown', handleKeydown);

		// Store cleanup function
		return () => {
			document.removeEventListener('keydown', handleKeydown);
			cleanup();
		};
	});

	function goBack() {
		goto('/lemari');
	}
</script>

<svelte:head>
	<title>Maragha - {bookValue?.judul || 'Halaman Buku'}</title>
	<meta name="description" content="Baca halaman buku digital Maragha" />
</svelte:head>

{#if loadingValue}
	<div class="flex items-center justify-center min-h-screen">
		<div class="text-center">
			<div
				class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"
			></div>
			<p class="text-[var(--muted-foreground)]">Memuat halaman...</p>
		</div>
	</div>
{:else if bookValue}
	<div class="container mx-auto px-4 py-8">
		<div class="mb-8">
			<button
				onclick={goBack}
				class="inline-flex items-center text-[var(--primary)] hover:text-[var(--accent)] mb-4 transition-colors"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Kembali ke lemari buku
			</button>

			<div class="flex flex-col md:flex-row md:items-center md:justify-between">
				<div class="flex-1">
					<h1 class="text-3xl font-heading font-bold text-[var(--foreground)] mb-2">
						{bookValue.judul}
					</h1>
					<p class="text-[var(--muted-foreground)]">
						Penulis: {bookValue.penulis.join(', ')} | Penerbit: {bookValue.penerbit}
					</p>
					{#if bookValue.kategori.length > 0}
						<p class="text-[var(--muted-foreground)] mt-1">
							Kategori: {bookValue.kategori.join(', ')}
						</p>
					{/if}
				</div>

				<div class="mt-4 md:mt-0 flex items-center gap-4">
					{#if hasScreenshotsValue}
						<button
							onclick={toggleImages}
							class="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-[var(--muted-foreground)] border border-[var(--border)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
								/>
							</svg>
							Sembunyikan Gambar
						</button>
					{/if}

					{#if bookValue.cover}
						<img
							src={bookValue.cover}
							alt={bookValue.judul}
							class="w-24 h-32 object-cover rounded-lg shadow-md"
						/>
					{/if}
				</div>
			</div>
		</div>

		{#if halamanRecordsValue.length > 0}
			<div class="space-y-8">
				<!-- Main Content Area -->
				<div class="space-y-6">
					{#each halamanRecordsValue as halaman}
						<div class="bg-[var(--card)] rounded-lg shadow-md overflow-hidden">
							<div class="p-6">
								<HalamanViewer
									halaman={halaman}
									bookId={bookId}
								/>
							</div>
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				{#if $totalPages > 1}
					<div class="mt-8">
						<PaginationControls bookId={bookId} />
					</div>
				{/if}
			</div>
		{:else}
			<div class="text-center py-12">
				<p class="text-lg text-[var(--muted-foreground)]">
					Belum ada halaman yang tersedia untuk buku ini.
				</p>
			</div>
		{/if}
	</div>

	<!-- Suggestion Dialog -->
	<SuggestionDialog bookId={bookId} />
{:else}
	<div class="flex items-center justify-center min-h-screen">
		<p class="text-lg text-[var(--muted-foreground)]">Buku tidak ditemukan.</p>
	</div>
{/if}