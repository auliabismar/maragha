<script lang="ts">
	import {
		currentPage,
		totalPages,
		pageNumbers,
		jumpPageInput,
		goToPreviousPage,
		goToNextPage,
		goToPage,
		jumpToPage
	} from '$lib/stores/bookPageStore';

	interface Props {
		bookId: string;
	}

	let { bookId }: Props = $props();

	// Derived values
	let currentPageValue = $derived($currentPage);
	let totalPagesValue = $derived($totalPages);
	let pageNumbersValue = $derived($pageNumbers);
	let jumpPageInputValue = $derived($jumpPageInput);

	function handlePreviousPage() {
		goToPreviousPage(bookId);
	}

	function handleNextPage() {
		goToNextPage(bookId);
	}

	function handlePageClick(page: number) {
		goToPage(bookId, page);
	}

	function handleJumpToPage() {
		const pageNumber = parseInt(jumpPageInputValue);
		if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPagesValue) {
			jumpToPage(bookId, pageNumber);
			// Clear the input
			jumpPageInput.set('');
		}
	}

	function handleJumpInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleJumpToPage();
		}
	}

	function handleJumpInputBlur() {
		const pageNumber = parseInt(jumpPageInputValue);
		if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPagesValue) {
			jumpPageInput.set('');
		}
	}
</script>

<div class="flex flex-col items-center space-y-4">
	<!-- Main pagination controls -->
	<div class="flex items-center space-x-2">
		<!-- Previous button -->
		<button
			onclick={handlePreviousPage}
			disabled={currentPageValue <= 1}
			class="inline-flex items-center px-3 py-2 text-sm border border-[var(--border)] rounded-md text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors"
		>
			<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Sebelumnya
		</button>

		<!-- Page numbers -->
		<div class="flex items-center space-x-1">
			{#each pageNumbersValue as page}
				{#if page === '...'}
					<span class="px-2 py-2 text-[var(--muted-foreground)]">...</span>
				{:else}
					<button
						onclick={() => handlePageClick(page as number)}
						class="w-10 h-10 text-sm rounded-md transition-colors {
							page === currentPageValue
								? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
								: 'text-[var(--foreground)] hover:bg-[var(--accent)]'
						}"
					>
						{page}
					</button>
				{/if}
			{/each}
		</div>

		<!-- Next button -->
		<button
			onclick={handleNextPage}
			disabled={currentPageValue >= totalPagesValue}
			class="inline-flex items-center px-3 py-2 text-sm border border-[var(--border)] rounded-md text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent)] transition-colors"
		>
			Selanjutnya
			<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
			</svg>
		</button>
	</div>

	<!-- Jump to page and page info -->
	<div class="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
		<div class="text-sm text-[var(--muted-foreground)]">
			Halaman <span class="font-semibold text-[var(--foreground)]">{currentPageValue}</span> dari <span class="font-semibold text-[var(--foreground)]">{totalPagesValue}</span>
		</div>
		
		<div class="flex items-center space-x-2">
			<label for="jump-to-page" class="text-sm text-[var(--muted-foreground)]">Lompat ke:</label>
			<input
				id="jump-to-page"
				bind:value={$jumpPageInput}
				onkeydown={handleJumpInputKeydown}
				onblur={handleJumpInputBlur}
				type="number"
				min="1"
				max={totalPagesValue}
				placeholder="No. halaman"
				class="w-20 px-2 py-1 text-sm border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
			/>
			<button
				onclick={handleJumpToPage}
				disabled={!jumpPageInputValue || parseInt(jumpPageInputValue) < 1 || parseInt(jumpPageInputValue) > totalPagesValue}
				class="px-3 py-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Go
			</button>
		</div>
	</div>

	<!-- Page size selector (if needed in the future) -->
	{#if totalPagesValue > 10}
		<div class="text-xs text-[var(--muted-foreground)] text-center">
			Gunakan keyboard: ← → untuk navigasi halaman
		</div>
	{/if}
</div>