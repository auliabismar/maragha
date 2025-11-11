<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import pb from '$lib/pocketbase';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let book = $state<any>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	const bookId = $derived($page.params.id);

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
		} catch (err: any) {
			if (err.status === 404) {
				error = 'Buku tidak ditemukan.';
			} else {
				error = 'Gagal memuat data buku.';
			}
		} finally {
			loading = false;
		}
	});
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
							{#if book.status === 'Draft'}
								<button class="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] rounded-md text-sm font-medium transition-colors border border-[var(--primary)]/20">
									Edit Buku
								</button>
							{/if}
							<a href="/buku" class="px-4 py-2 bg-[var(--muted)] hover:bg-[var(--muted)]/90 text-[var(--muted-foreground)] rounded-md text-sm font-medium transition-colors border border-[var(--muted)]/20">
								Kembali ke Daftar
							</a>
						</div>
					</div>
				</div>
			</div>

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