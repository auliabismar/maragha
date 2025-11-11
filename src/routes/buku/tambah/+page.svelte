<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import pb from '$lib/pocketbase';
	import type { PageData } from './$types';
	// Define types for PocketBase records - generate these with PocketBase CLI
	interface PenerbitRecord {
		id: string;
		nama: string;
		created: string;
		updated: string;
	}

	interface PenulisRecord {
		id: string;
		nama: string;
		created: string;
		updated: string;
	}

	interface KategoriRecord {
		id: string;
		nama: string;
		created: string;
		updated: string;
	}

	const { data } = $props();
	let penerbit = $state(data.penerbit || []);
	let penulis = $state(data.penulis || []);
	let kategori = $state(data.kategori || []);
	console.log('Penerbit:', penerbit);
	console.log('Penulis:', penulis);
	console.log('Kategori:', kategori);


	let judul = $state('');
	let selectedPenerbit = $state<string | null>(null);
	let selectedPenulis = $state<string[]>([]);
	let selectedKategori = $state<string[]>([]);
	let coverFile = $state<File | null>(null);
	let isSubmitting = $state(false);
	let errors = $state<Record<string, string>>({});

	// Form validation
	function validateForm(): boolean {
		errors = {};
		let isValid = true;

		if (!judul.trim()) {
			errors.judul = 'Judul buku wajib diisi';
			isValid = false;
		}

		if (selectedPenulis.length === 0) {
			errors.penulis = 'Pilih minimal satu penulis';
			isValid = false;
		}

		if (selectedKategori.length === 0) {
			errors.kategori = 'Pilih minimal satu kategori';
			isValid = false;
		}

		if (coverFile && !['image/png', 'image/jpeg', 'image/webp'].includes(coverFile.type)) {
			errors.cover = 'Format cover harus PNG, JPEG, atau WebP';
			isValid = false;
		}

		return isValid;
	}

	// Handle form submission
	async function handleSubmit() {
		if (!validateForm()) {
			return;
		}

		isSubmitting = true;
		errors = {};

		try {
			const formData = new FormData();
			formData.append('judul', judul.trim());
			formData.append('revisi', '1');
			formData.append('status', 'Draft');

			if (selectedPenerbit) {
				formData.append('penerbit', selectedPenerbit);
			}

			selectedPenulis.forEach(id => formData.append('penulis', id));
			selectedKategori.forEach(id => formData.append('kategori', id));

			if (coverFile) {
				formData.append('cover', coverFile);
			}

			const newBuku = await pb.collection('buku').create(formData, {
				expand: 'penerbit,penulis,kategori'
			});

			// Success - redirect to new buku detail page
			await goto(`/buku/${newBuku.id}`);
			invalidateAll(); // Refresh data across the app

		} catch (error: any) {
			console.error('Error creating buku:', error);
			
			if (error.status === 400) {
				// Validation errors from PocketBase
				const validationErrors = error.data || {};
				if (validationErrors.judul) {
					errors.judul = validationErrors.judul.message;
				}
				if (validationErrors.penulis) {
					errors.penulis = validationErrors.penulis.message;
				}
				if (validationErrors.kategori) {
					errors.kategori = validationErrors.kategori.message;
				}
				if (validationErrors.cover) {
					errors.cover = validationErrors.cover.message;
				}
			} else if (error.status === 403) {
				errors.general = 'Akses ditolak. Anda tidak memiliki izin untuk membuat buku.';
			} else {
				errors.general = 'Gagal membuat buku. Silakan coba lagi.';
			}
		} finally {
			isSubmitting = false;
		}
	}

	// Handle file input change
	function handleCoverChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			coverFile = target.files[0];
			if (!validateForm()) {
				// Re-validate if file type is invalid
				const fileInput = target;
				fileInput.value = '';
				coverFile = null;
			}
		} else {
			coverFile = null;
		}
	}

	// Reset form
	function resetForm() {
		judul = '';
		selectedPenerbit = null;
		selectedPenulis = [];
		selectedKategori = [];
		coverFile = null;
		errors = {};
		isSubmitting = false;
	}

	onMount(() => {
		// Check authentication and authorization (same as profile page)
		if (!pb.authStore.isValid) {
			goto('/login');
			return;
		}

		const user = pb.authStore.model;
		if (user?.akses !== 'Editor') {
			goto('/');
			return;
		}
	});
</script>

<svelte:head>
	<title>Maragha - Tambah Buku Baru</title>
	<meta name="description" content="Buat buku baru untuk perpustakaan digital Maragha" />
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-2xl">
	<div class="bg-[var(--card)] dark:bg-[var(--card)] rounded-lg shadow-lg p-6 border border-[var(--border)]">
		<div class="mb-6">
			<h1 class="text-3xl font-bold text-[var(--foreground)] mb-2">Tambah Buku Baru</h1>
			<p class="text-[var(--muted-foreground)]">
				Buat entri buku baru untuk perpustakaan digital Maragha
			</p>
		</div>

		{#if errors.general}
			<div class="mb-4 p-4 bg-[var(--destructive)]/5 dark:bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-md">
				<p class="text-[var(--destructive-foreground)]">{errors.general}</p>
			</div>
		{/if}

		<form on:submit|preventDefault={handleSubmit} class="space-y-6">
			<!-- Judul -->
			<div>
				<label for="judul" class="block text-sm font-medium text-[var(--foreground)] mb-2">
					Judul Buku <span class="text-[var(--destructive)]">*</span>
				</label>
				<input
					id="judul"
					type="text"
					bind:value={judul}
					class="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] dark:bg-[var(--card)]"
					placeholder="Masukkan judul buku"
					required
					maxlength="255"
				/>
				{#if errors.judul}
					<p class="mt-1 text-sm text-[var(--destructive-foreground)]">{errors.judul}</p>
				{/if}
			</div>

			<!-- Penerbit -->
			<div>
				<label for="penerbit" class="block text-sm font-medium text-[var(--foreground)] mb-2">
					Penerbit
				</label>
				<select
					id="penerbit"
					bind:value={selectedPenerbit}
					class="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] dark:bg-[var(--card)]"
				>
					<option value="">Pilih penerbit</option>
					{#each penerbit as penerbitItem (penerbitItem.id)}
						<option value={penerbitItem.id}>{penerbitItem.id}</option>
					{/each}
				</select>
			</div>

			<!-- Penulis -->
			<div>
				<label for="penulis" class="block text-sm font-medium text-[var(--foreground)] mb-2">
					Penulis <span class="text-[var(--destructive)]">*</span>
				</label>
				<select
					id="penulis"
					multiple
					bind:value={selectedPenulis}
					class="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] h-32 dark:bg-[var(--card)]"
					required
				>
					{#each penulis as penulisItem (penulisItem.id)}
						<option value={penulisItem.id}>{penulisItem.id}</option>
					{/each}
				</select>
				{#if errors.penulis}
					<p class="mt-1 text-sm text-[var(--destructive-foreground)]">{errors.penulis}</p>
				{/if}
				<p class="mt-1 text-xs text-[var(--muted-foreground)]">
					Pilih satu atau lebih penulis dengan menekan Ctrl (atau Cmd di Mac) sambil mengklik
				</p>
			</div>

			<!-- Kategori -->
			<div>
				<label for="kategori" class="block text-sm font-medium text-[var(--foreground)] mb-2">
					Kategori <span class="text-[var(--destructive)]">*</span>
				</label>
				<select
					id="kategori"
					multiple
					bind:value={selectedKategori}
					class="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] h-32 dark:bg-[var(--card)]"
					required
				>
					{#each kategori as kategoriItem (kategoriItem.id)}
						<option value={kategoriItem.id}>{kategoriItem.id}</option>
					{/each}
				</select>
				{#if errors.kategori}
					<p class="mt-1 text-sm text-[var(--destructive-foreground)]">{errors.kategori}</p>
				{/if}
				<p class="mt-1 text-xs text-[var(--muted-foreground)]">
					Pilih satu atau lebih kategori dengan menekan Ctrl (atau Cmd di Mac) sambil mengklik
				</p>
			</div>

			<!-- Cover -->
			<div>
				<label for="cover" class="block text-sm font-medium text-[var(--foreground)] mb-2">
					Cover Buku
				</label>
				<input
					id="cover"
					type="file"
					accept="image/png,image/jpeg,image/webp"
					on:change={handleCoverChange}
					class="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--muted)] dark:file:bg-[var(--muted)]/50 file:text-[var(--foreground)] hover:file:bg-[var(--muted)]/70 dark:bg-[var(--card)]"
				/>
				{#if coverFile}
					<p class="mt-1 text-sm text-[var(--muted-foreground)]">
						Selected: {coverFile.name} ({(coverFile.size / 1024).toFixed(1)} KB)
					</p>
				{/if}
				{#if errors.cover}
					<p class="mt-1 text-sm text-[var(--destructive-foreground)]">{errors.cover}</p>
				{/if}
				<p class="mt-1 text-xs text-[var(--muted-foreground)]">
					Upload gambar cover (PNG, JPEG, WebP). Ukuran disarankan 400x600px.
				</p>
			</div>

			<!-- Form Actions -->
			<div class="flex flex-col sm:flex-row gap-3 pt-4">
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isSubmitting}
						<span class="flex items-center justify-center">
							<svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							Membuat buku...
						</span>
					{:else}
						Buat Buku Baru
					{/if}
				</button>

				<button
					type="button"
					on:click={resetForm}
					disabled={isSubmitting}
					class="flex-1 bg-[var(--muted)] hover:bg-[var(--muted)]/90 text-[var(--muted-foreground)] font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Reset Form
				</button>
			</div>
		</form>
	</div>

	<!-- Back to home link -->
	<div class="mt-8 text-center">
		<a
			href="/"
			class="inline-flex items-center text-[var(--primary)] hover:text-[var(--primary)]/80 dark:text-[var(--primary)] dark:hover:text-[var(--primary)]/80 text-sm font-medium transition-colors"
		>
			← Kembali ke Beranda
		</a>
	</div>
</div>

<style>
	/* Ensure form elements don't exceed 110 characters */
	input, select {
		font-family: inherit;
	}
</style>