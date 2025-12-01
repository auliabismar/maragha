<script lang="ts">
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase';

	let { book, priority = false }: { book: any; priority?: boolean } = $props();

	const handleClick = () => {
		if (pb.authStore.isValid) {
			goto(`/buku/${book.id}/halaman`);
		} else {
			goto(`/login?redirect=/buku/${book.id}/halaman`);
		}
	};

	function calculateProgress(book: any): number {
		if (book.totalHalaman === 0) return 0;
		return Math.round((book.halamanSetuju / book.totalHalaman) * 100);
	}
</script>

<div
	class="w-full overflow-hidden rounded-lg bg-[var(--card)] text-left shadow-md transition-shadow hover:shadow-lg"
	class:cursor-pointer={book.status !== 'Draft'}
	onclick={book.status !== 'Draft' ? handleClick : undefined}
>
	<div class="bg-muted flex aspect-[5/7] items-center justify-center">
		{#if book.cover}
			<img
				src={book.cover}
				alt={book.judul}
				class="h-full w-full object-cover"
				loading={priority ? 'eager' : 'lazy'}
				fetchpriority={priority ? 'high' : 'auto'}
			/>
		{:else}
			<div class="text-[var(--muted-foreground)]">
				<svg class="mx-auto mb-2 h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
					/>
				</svg>
				<p class="text-sm">No Cover</p>
			</div>
		{/if}
	</div>
	<div class="p-4">
		<h3 class="font-heading mb-2 line-clamp-2 text-lg font-semibold text-[var(--foreground)]">
			{book.judul}
		</h3>
		<p class="mb-1 text-sm text-[var(--muted-foreground)]">
			Penulis: {book.penulis.join(', ')}
		</p>
		{#if book.penerbit && book.penerbit != 'N/A'}
			<p class="mb-3 text-sm text-[var(--muted-foreground)]">
				Penerbit: {book.penerbit}
			</p>
		{/if}

		{#if book.status !== 'Draft'}
			<!-- Progress Bar -->
			<div class="mb-3">
				<div class="mb-1 flex items-center justify-between">
					<span class="text-sm text-[var(--muted-foreground)]">Progres Penerjemahan</span>
					<span class="text-sm font-medium text-[var(--foreground)]"
						>{calculateProgress(book)}%</span
					>
				</div>
				<div class="h-2 w-full rounded-full bg-[var(--muted)]">
					<div
						class="h-2 rounded-full bg-[var(--color-ribbon-500)] transition-all duration-300"
						style="width: {calculateProgress(book)}%"
					></div>
				</div>
				<p class="mt-1 text-xs text-[var(--muted-foreground)]">
					{book.halamanSetuju} dari {book.totalHalaman} halaman
				</p>
			</div>
		{/if}

		<div class="flex items-center justify-between">
			{#if book.kategori.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each book.kategori.slice(0, 2) as kategori}
						<span
							class="rounded-full bg-[var(--color-ribbon-100)] px-2 py-1 text-xs text-[var(--color-ribbon-800)]"
						>
							{kategori}
						</span>
					{/each}
					{#if book.kategori.length > 2}
						<span
							class="rounded-full bg-[var(--color-paper-100)] px-2 py-1 text-xs text-[var(--color-paper-600)]"
						>
							+{book.kategori.length - 2}
						</span>
					{/if}
				</div>
			{:else}
				<span
					class="rounded-full bg-[var(--color-paper-100)] px-2 py-1 text-xs text-[var(--color-paper-600)]"
				>
					Tidak ada kategori
				</span>
			{/if}
			<span class="text-sm font-medium text-[var(--color-ribbon-600)]">
				{book.status === 'Draft' ? 'Segera Terbit' : 'Baca →'}
			</span>
		</div>
	</div>
</div>
