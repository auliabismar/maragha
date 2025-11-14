<script lang="ts">
	import DataTable from '$lib/components/DataTable.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import pb from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let editing = $state(false);
	let publishers = $state<any[]>([]);
	let authors = $state<any[]>([]);
	let categories = $state<any[]>([]);
	let selectedPublisher = $state<any>(null);
	let selectedAuthors = $state<any[]>([]);
	let selectedCategories = $state<any[]>([]);

	let book = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	interface SelectionEventDetail {
		selected: any[];
	}

	const bookId = $derived($page.params.id!);

	
	onMount(async () => {
		if (!bookId) {
			error = 'ID buku tidak valid.';
			loading = false;
			return;
		}

		if (!pb.authStore.isValid) {
			goto('/login');
			return;
		}

		try {
			const record = await pb.collection('buku').getOne(bookId, {
				expand: 'penerbit,penulis,kategori'
			});

			book = record;
			loading = false;

			// Load publishers, authors, and categories for all books
			// Load publishers
			const publisherRecords = await pb.collection('penerbit').getFullList({
				sort: '-created'
			});
			publishers = publisherRecords;

			// Load authors
			const authorRecords = await pb.collection('penulis').getFullList({
				sort: '-created'
			});
			authors = authorRecords;

			// Load categories
			const categoryRecords = await pb.collection('kategori').getFullList({
				sort: '-created'
			});
			categories = categoryRecords;

			// Set current selections for display
			if (book.expand?.penerbit) {
				selectedPublisher = book.expand.penerbit.id;
			}
			if (book.expand?.penulis) {
				const currentAuthors = Array.isArray(book.expand.penulis) ? book.expand.penulis : [book.expand.penulis];
				selectedAuthors = currentAuthors.map((author: any) => authors.find(a => a.id === author.id) || author);
			}
			if (book.expand?.kategori) {
				const currentCategories = Array.isArray(book.expand.kategori) ? book.expand.kategori : [book.expand.kategori];
				selectedCategories = currentCategories.map((category: any) => categories.find(c => c.id === category.id) || category);
			}
		} catch (err: any) {
			if (err.status === 404) {
				error = 'Buku tidak ditemukan.';
			} else {
				error = 'Gagal memuat data buku.';
			}
			loading = false;
		}
	});

	async function saveMetadata() {
		if (!selectedPublisher || selectedAuthors.length === 0 || selectedCategories.length === 0) {
			alert('Harap pilih penerbit, penulis, dan kategori.');
			return;
		}

		try {
			const updateData = {
				penerbit: selectedPublisher,
				penulis: selectedAuthors.map((author: any) => author.id || author),
				kategori: selectedCategories.map((category: any) => category.id || category)
			};

			const updatedBook = await pb.collection('buku').update(bookId, updateData, {
				expand: 'penerbit,penulis,kategori'
			});

			book = updatedBook;
			editing = false;
			alert('Metadata berhasil disimpan!');
		} catch (err) {
			console.error('Error saving metadata:', err);
			alert('Gagal menyimpan metadata.');
		}
	}
</script>

<svelte:head>
	<title>Maragha - {book ? book.judul : 'Buku'}</title>
	<meta name="description" content={book ? `Detail buku: ${book.judul}` : 'Lihat detail buku'} />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-4xl">
	{#if loading}
		<div class="flex justify-center items-center h-64">
			<div class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
				<p class="text-[var(--muted-foreground)]">Memuat detail buku...</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-[var(--destructive)]/5 dark:bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg p-6 text-center">
			<h2 class="text-2xl font-bold text-[var(--destructive-foreground)] dark:text-[var(--destructive-foreground)] mb-2">Buku Tidak Ditemukan</h2>
			<p class="text-[var(--destructive-foreground)] dark:text-[var(--destructive-foreground)] mb-4">{error}</p>
			<a href="/buku" class="inline-flex items-center text-[var(--primary)] hover:text-[var(--primary)]/80 dark:text-[var(--primary)] dark:hover:text-[var(--primary)]/80 font-medium transition-colors">
				← Kembali ke Daftar Buku
			</a>
		</div>
	{:else if book}
		<div class="bg-[var(--card)] dark:bg-[var(--card)] rounded-lg shadow-lg overflow-hidden border border-[var(--border)]">
			<!-- Book Header -->
			<div class="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 text-[var(--primary-foreground)] p-6">
				<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h1 class="text-3xl font-bold mb-2">{book.judul}</h1>
						<p class="text-[var(--primary-foreground)] opacity-90">Revisi {book.revisi} • {book.status}</p>
					</div>
					{#if book.expand?.penerbit}
						<div class="text-right">
							<p class="text-sm text-[var(--primary-foreground)] opacity-80">Penerbit:</p>
							<p class="font-medium">{book.expand.penerbit.id}</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Book Cover and Basic Info -->
			<div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Cover Image -->
				<div class="md:col-span-1">
					{#if book.cover}
						<div class="relative">
							<img
								src={pb.files.getUrl(book, book.cover)}
								alt={book.judul}
								class="w-full max-w-sm mx-auto rounded-lg shadow-md object-cover border border-[var(--border)]"
								style="aspect-ratio: 2/3;"
							/>
							<div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-lg transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
								<span class="text-white text-sm font-medium">Klik untuk memperbesar</span>
							</div>
						</div>
					{:else}
						<div class="w-full max-w-sm mx-auto bg-[var(--muted)] rounded-lg flex items-center justify-center border border-[var(--border)]" style="aspect-ratio: 2/3;">
							<span class="text-[var(--muted-foreground)] text-sm">Tidak ada cover</span>
						</div>
					{/if}
				</div>

				<!-- Book Details -->
				<div class="md:col-span-2 space-y-6">
					<!-- Authors -->
					{#if book.expand?.penulis && book.expand.penulis.length > 0}
						<div>
							<h3 class="text-lg font-semibold text-[var(--foreground)] mb-2">Penulis</h3>
							<div class="flex flex-wrap gap-2">
								{#each book.expand.penulis as author}
									<span class="inline-block bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 text-[var(--primary)] px-3 py-1 rounded-full text-sm border border-[var(--primary)]/20">
										{author.id}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Categories -->
					{#if book.expand?.kategori && book.expand.kategori.length > 0}
						<div>
							<h3 class="text-lg font-semibold text-[var(--foreground)] mb-2">Kategori</h3>
							<div class="flex flex-wrap gap-2">
								{#each book.expand.kategori as category}
									<span class="inline-block bg-[var(--accent)]/10 dark:bg-[var(--accent)]/20 text-[var(--accent-foreground)] px-3 py-1 rounded-full text-sm border border-[var(--accent)]/20">
										{category.id}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Status and Actions -->
					<div class="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t border-[var(--border)]">
						<div class="flex items-center gap-4">
							<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
								{book.status === 'Draft'
									? 'bg-[var(--accent)]/10 text-[var(--accent-foreground)] dark:bg-[var(--accent)]/20 border border-[var(--accent)]/20'
									: book.status === 'Published'
										? 'bg-[var(--primary)]/10 text-[var(--primary-foreground)] dark:bg-[var(--primary)]/20 border border-[var(--primary)]/20'
										: 'bg-[var(--muted)]/10 text-[var(--muted-foreground)] dark:bg-[var(--muted)]/20 border border-[var(--muted)]/20'
								}">
								{book.status}
							</span>
							<span class="text-sm text-[var(--muted-foreground)]">
								Dibuat: {new Date(book.created).toLocaleDateString('id-ID')}
							</span>
						</div>

						<div class="flex gap-2">
							{#if book.status === 'Draft' && !editing}
								<button
									onclick={() => editing = true}
									class="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] rounded-md text-sm font-medium transition-colors border border-[var(--primary)]/20"
								>
									Edit Metadata
								</button>
							{/if}
							<a href="/buku" class="px-4 py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/90 text-[var(--muted-foreground)] rounded-md text-sm font-medium transition-colors border border-[var(--muted)]/20">
								Kembali ke Daftar
							</a>
						</div>
					</div>
				</div>
			</div>

			<!-- Edit Metadata Modal -->
			{#if editing}
			<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
				<div class="bg-[var(--background)] rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto border border-[var(--border)] shadow-2xl">
					<div class="p-6">
						<div class="flex justify-between items-center mb-6">
							<h3 class="text-2xl font-semibold text-[var(--foreground)]">Edit Metadata Buku</h3>
							<button
								onclick={() => editing = false}
								class="text-[var(--muted-foreground)] hover:text-[var(--foreground)] text-3xl font-bold p-2 rounded-full hover:bg-[var(--muted)] transition-colors"
							>
								&times;
							</button>
						</div>

						<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<!-- Publisher Section -->
							<div class="lg:col-span-1 space-y-4">

								<select
									bind:value={selectedPublisher}
									class="w-full p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
								>
									<option value={null}>Pilih Penerbit</option>
									{#each publishers as publisher}
										<option value={publisher.id}>{publisher.id}</option>
									{/each}
								</select>
							</div>

							<!-- Authors Section -->
							<div class="lg:col-span-1 space-y-4">
								

								<div class="border border-[var(--border)] rounded-md p-3 max-h-64 overflow-y-auto">
									{#each authors as author}
										<label class="flex items-center space-x-3 p-3 hover:bg-[var(--muted)]/50 rounded cursor-pointer border-b border-[var(--border)] last:border-b-0">
											<input
												type="checkbox"
												value={author}
												bind:group={selectedAuthors}
												class="rounded text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
											/>
											<div>
												<div class="font-medium text-[var(--foreground)]">{author.id}</div>
												<div class="text-sm text-[var(--muted-foreground)]">{author.email}</div>
											</div>
										</label>
									{/each}
								</div>
							</div>

							<!-- Categories Section -->
							<div class="lg:col-span-1 space-y-4">

								<div class="border border-[var(--border)] rounded-md p-3 max-h-64 overflow-y-auto">
									{#each categories as category}
										<label class="flex items-center space-x-3 p-3 hover:bg-[var(--muted)]/50 rounded cursor-pointer border-b border-[var(--border)] last:border-b-0">
											<input
												type="checkbox"
												value={category}
												bind:group={selectedCategories}
												class="rounded text-[var(--primary)] focus:ring-[var(--primary)] h-4 w-4"
											/>
											<div>
												<div class="font-medium text-[var(--foreground)]">{category.id}</div>
											</div>
										</label>
									{/each}
								</div>
							</div>
						</div>

						<div class="flex gap-3 pt-6 border-t border-[var(--border)] mt-6">
							<button
								onclick={saveMetadata}
								disabled={!selectedPublisher || selectedAuthors.length === 0 || selectedCategories.length === 0}
								class="flex-1 px-6 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Simpan Perubahan
							</button>
							<button
								onclick={() => editing = false}
								class="px-6 py-3 border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--accent)] rounded-md text-sm font-medium transition-colors"
							>
								Batal
							</button>
						</div>
					</div>
				</div>
			</div>
			{/if}

			<!-- Book Content Placeholder -->
			<div class="p-6 border-t border-[var(--border)]">
				<h3 class="text-xl font-semibold text-[var(--foreground)] mb-4">Isi Buku</h3>
				<div class="bg-[var(--muted)]/5 dark:bg-[var(--muted)]/10 rounded-lg p-6 text-center text-[var(--muted-foreground)] border border-[var(--border)]">
					<p>Halaman-halaman buku akan ditambahkan di sini setelah buku dibuat.</p>
					{#if book.status === 'Draft'}
						<button class="mt-4 px-4 py-2 bg-[var(--success)] hover:bg-[var(--success)]/90 text-[var(--success-foreground)] rounded-md text-sm font-medium transition-colors border border-[var(--success)]/20">
							Tambah Halaman Pertama
						</button>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="text-center py-12">
			<h2 class="text-2xl font-bold text-[var(--foreground)] mb-4">Buku Tidak Ditemukan</h2>
			<p class="text-[var(--muted-foreground)] mb-6">Buku yang Anda cari tidak tersedia.</p>
			<a href="/buku" class="inline-flex items-center text-[var(--primary)] hover:text-[var(--primary)]/80 dark:text-[var(--primary)] dark:hover:text-[var(--primary)]/80 font-medium transition-colors">
				← Kembali ke Daftar Buku
			</a>
		</div>
	{/if}
</div>

<style>
	/* Custom styles for book detail page */
	img:hover {
		transform: scale(1.02);
		transition: transform 0.2s ease-in-out;
	}
</style>