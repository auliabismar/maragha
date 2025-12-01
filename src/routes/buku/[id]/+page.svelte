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
				expand: 'penerbit,penulis,kategori,sampul_href'
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
				const currentAuthors = Array.isArray(book.expand.penulis)
					? book.expand.penulis
					: [book.expand.penulis];
				selectedAuthors = currentAuthors.map(
					(author: any) => authors.find((a) => a.id === author.id) || author
				);
			}
			if (book.expand?.kategori) {
				const currentCategories = Array.isArray(book.expand.kategori)
					? book.expand.kategori
					: [book.expand.kategori];
				selectedCategories = currentCategories.map(
					(category: any) => categories.find((c) => c.id === category.id) || category
				);
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
				expand: 'penerbit,penulis,kategori,sampul_href'
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

<div class="container mx-auto max-w-4xl px-4 py-8">
	{#if loading}
		<div class="flex h-64 items-center justify-center">
			<div class="text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--primary)]"
				></div>
				<p class="text-[var(--muted-foreground)]">Memuat detail buku...</p>
			</div>
		</div>
	{:else if error}
		<div
			class="rounded-lg border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 p-6 text-center dark:bg-[var(--destructive)]/10"
		>
			<h2
				class="mb-2 text-2xl font-bold text-[var(--destructive-foreground)] dark:text-[var(--destructive-foreground)]"
			>
				Buku Tidak Ditemukan
			</h2>
			<p
				class="mb-4 text-[var(--destructive-foreground)] dark:text-[var(--destructive-foreground)]"
			>
				{error}
			</p>
			<a
				href="/buku"
				class="inline-flex items-center font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/80 dark:text-[var(--primary)] dark:hover:text-[var(--primary)]/80"
			>
				← Kembali ke Daftar Buku
			</a>
		</div>
	{:else if book}
		<div
			class="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg dark:bg-[var(--card)]"
		>
			<!-- Book Header -->
			<div
				class="bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/80 p-6 text-[var(--primary-foreground)]"
			>
				<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 class="mb-2 text-3xl font-bold">{book.judul}</h1>
						<p class="text-[var(--primary-foreground)] opacity-90">
							Revisi {book.revisi} • {book.status}
						</p>
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
			<div class="grid grid-cols-1 gap-8 p-6 md:grid-cols-3">
				<!-- Cover Image -->
				<div class="md:col-span-1">
					{#if book.expand?.sampul_href?.sampul}
						<div class="relative">
							<img
								src={pb.files.getUrl(book.expand.sampul_href, book.expand.sampul_href.sampul)}
								alt={book.judul}
								class="mx-auto w-full max-w-sm rounded-lg border border-[var(--border)] object-cover shadow-md"
								style="aspect-ratio: 2/3;"
							/>
							<div
								class="bg-opacity-0 hover:bg-opacity-20 absolute inset-0 flex items-center justify-center rounded-lg bg-black opacity-0 transition-all duration-300 hover:opacity-100"
							>
								<span class="text-sm font-medium text-white">Klik untuk memperbesar</span>
							</div>
						</div>
					{:else}
						<div
							class="mx-auto flex w-full max-w-sm items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--muted)]"
							style="aspect-ratio: 2/3;"
						>
							<span class="text-sm text-[var(--muted-foreground)]">Tidak ada cover</span>
						</div>
					{/if}
				</div>

				<!-- Book Details -->
				<div class="space-y-6 md:col-span-2">
					<!-- Authors -->
					{#if book.expand?.penulis && book.expand.penulis.length > 0}
						<div>
							<h3 class="mb-2 text-lg font-semibold text-[var(--foreground)]">Penulis</h3>
							<div class="flex flex-wrap gap-2">
								{#each book.expand.penulis as author}
									<span
										class="inline-block rounded-full border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-3 py-1 text-sm text-[var(--primary)] dark:bg-[var(--primary)]/20"
									>
										{author.id}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Categories -->
					{#if book.expand?.kategori && book.expand.kategori.length > 0}
						<div>
							<h3 class="mb-2 text-lg font-semibold text-[var(--foreground)]">Kategori</h3>
							<div class="flex flex-wrap gap-2">
								{#each book.expand.kategori as category}
									<span
										class="inline-block rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-3 py-1 text-sm text-[var(--accent-foreground)] dark:bg-[var(--accent)]/20"
									>
										{category.id}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Status and Actions -->
					<div
						class="flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-4 sm:flex-row"
					>
						<div class="flex items-center gap-4">
							<span
								class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
								{book.status === 'Draft'
									? 'border border-[var(--accent)]/20 bg-[var(--accent)]/10 text-[var(--accent-foreground)] dark:bg-[var(--accent)]/20'
									: book.status === 'Published'
										? 'border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary-foreground)] dark:bg-[var(--primary)]/20'
										: 'border border-[var(--muted)]/20 bg-[var(--muted)]/10 text-[var(--muted-foreground)] dark:bg-[var(--muted)]/20'}"
							>
								{book.status}
							</span>
							<span class="text-sm text-[var(--muted-foreground)]">
								Dibuat: {new Date(book.created).toLocaleDateString('id-ID')}
							</span>
						</div>

						<div class="flex gap-2">
							{#if book.status === 'Draft' && !editing}
								<button
									onclick={() => (editing = true)}
									class="rounded-md border border-[var(--primary)]/20 bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90"
								>
									Edit Metadata
								</button>
							{/if}
							<a
								href="/buku"
								class="rounded-md border border-[var(--muted)]/20 bg-[var(--muted)] px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]/90"
							>
								Kembali ke Daftar
							</a>
						</div>
					</div>
				</div>
			</div>

			<!-- Edit Metadata Modal -->
			{#if editing}
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div
						class="max-h-[95vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-2xl"
					>
						<div class="p-6">
							<div class="mb-6 flex items-center justify-between">
								<h3 class="text-2xl font-semibold text-[var(--foreground)]">Edit Metadata Buku</h3>
								<button
									onclick={() => (editing = false)}
									class="rounded-full p-2 text-3xl font-bold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
								>
									&times;
								</button>
							</div>

							<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
								<!-- Publisher Section -->
								<div class="space-y-4 lg:col-span-1">
									<select
										bind:value={selectedPublisher}
										class="w-full rounded-md border border-[var(--border)] bg-[var(--background)] p-3 text-[var(--foreground)] focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
									>
										<option value={null}>Pilih Penerbit</option>
										{#each publishers as publisher}
											<option value={publisher.id}>{publisher.id}</option>
										{/each}
									</select>
								</div>

								<!-- Authors Section -->
								<div class="space-y-4 lg:col-span-1">
									<div
										class="max-h-64 overflow-y-auto rounded-md border border-[var(--border)] p-3"
									>
										{#each authors as author}
											<label
												class="flex cursor-pointer items-center space-x-3 rounded border-b border-[var(--border)] p-3 last:border-b-0 hover:bg-[var(--muted)]/50"
											>
												<input
													type="checkbox"
													value={author}
													bind:group={selectedAuthors}
													class="h-4 w-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
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
								<div class="space-y-4 lg:col-span-1">
									<div
										class="max-h-64 overflow-y-auto rounded-md border border-[var(--border)] p-3"
									>
										{#each categories as category}
											<label
												class="flex cursor-pointer items-center space-x-3 rounded border-b border-[var(--border)] p-3 last:border-b-0 hover:bg-[var(--muted)]/50"
											>
												<input
													type="checkbox"
													value={category}
													bind:group={selectedCategories}
													class="h-4 w-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
												/>
												<div>
													<div class="font-medium text-[var(--foreground)]">{category.id}</div>
												</div>
											</label>
										{/each}
									</div>
								</div>
							</div>

							<div class="mt-6 flex gap-3 border-t border-[var(--border)] pt-6">
								<button
									onclick={saveMetadata}
									disabled={!selectedPublisher ||
										selectedAuthors.length === 0 ||
										selectedCategories.length === 0}
									class="flex-1 rounded-md bg-[var(--primary)] px-6 py-3 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-50"
								>
									Simpan Perubahan
								</button>
								<button
									onclick={() => (editing = false)}
									class="rounded-md border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--accent)]"
								>
									Batal
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Book Content Placeholder -->
			<div class="border-t border-[var(--border)] p-6">
				<h3 class="mb-4 text-xl font-semibold text-[var(--foreground)]">Isi Buku</h3>
				<div
					class="rounded-lg border border-[var(--border)] bg-[var(--muted)]/5 p-6 text-center text-[var(--muted-foreground)] dark:bg-[var(--muted)]/10"
				>
					<p>Halaman-halaman buku akan ditambahkan di sini setelah buku dibuat.</p>
					{#if book.status === 'Draft'}
						<button
							class="mt-4 rounded-md border border-[var(--success)]/20 bg-[var(--success)] px-4 py-2 text-sm font-medium text-[var(--success-foreground)] transition-colors hover:bg-[var(--success)]/90"
						>
							Tambah Halaman Pertama
						</button>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="py-12 text-center">
			<h2 class="mb-4 text-2xl font-bold text-[var(--foreground)]">Buku Tidak Ditemukan</h2>
			<p class="mb-6 text-[var(--muted-foreground)]">Buku yang Anda cari tidak tersedia.</p>
			<a
				href="/buku"
				class="inline-flex items-center font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/80 dark:text-[var(--primary)] dark:hover:text-[var(--primary)]/80"
			>
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
