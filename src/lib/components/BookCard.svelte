<script lang="ts">
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase';

	let { book }: { book: any } = $props();

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

<button
	onclick={handleClick}
	class="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow text-left w-full"
>
	<div class="aspect-[5/7] bg-muted flex items-center justify-center">
		{#if book.cover}
			<img src={book.cover} alt={book.judul} class="w-full h-full object-cover" />
		{:else}
			<div class="text-muted-foreground">
				<svg class="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"
					/>
				</svg>
				<p class="text-sm">No Cover</p>
			</div>
		{/if}
	</div>
	<div class="p-4">
		<h3 class="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2">
			{book.judul}
		</h3>
		<p class="text-sm text-muted-foreground mb-1">
			Penulis: {book.penulis.join(', ')}
		</p>
		{#if book.kategori.length > 0}
			<p class="text-sm text-muted-foreground mb-1">
				Kategori: {book.kategori.join(', ')}
			</p>
		{/if}
		<p class="text-sm text-muted-foreground mb-3">
			Penerbit: {book.penerbit}
		</p>

		<!-- Progress Bar -->
		<div class="mb-3">
			<div class="flex items-center justify-between mb-1">
				<span class="text-sm text-muted-foreground">Progress Terjemahan</span>
				<span class="text-sm font-medium text-foreground">{calculateProgress(book)}%</span>
			</div>
			<div class="w-full bg-muted rounded-full h-2">
				<div
					class="bg-ribbon-500 h-2 rounded-full transition-all duration-300"
					style="width: {calculateProgress(book)}%"
				></div>
			</div>
			<p class="text-xs text-muted-foreground mt-1">
				{book.halamanSetuju} dari {book.totalHalaman} halaman
			</p>
		</div>

		<div class="flex items-center justify-between">
			{#if book.kategori.length > 0}
				<div class="flex flex-wrap gap-1">
					{#each book.kategori.slice(0, 2) as kategori}
						<span class="px-2 py-1 text-xs rounded-full bg-ribbon-100 text-ribbon-800">
							{kategori}
						</span>
					{/each}
					{#if book.kategori.length > 2}
						<span class="px-2 py-1 text-xs rounded-full bg-paper-100 text-paper-600">
							+{book.kategori.length - 2}
						</span>
					{/if}
				</div>
			{:else}
				<span class="px-2 py-1 text-xs rounded-full bg-paper-100 text-paper-600">
					Tidak ada kategori
				</span>
			{/if}
			<span class="text-ribbon-600 text-sm font-medium"> Baca → </span>
		</div>
	</div>
</button>