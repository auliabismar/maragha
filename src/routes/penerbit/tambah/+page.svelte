<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import pb from '$lib/pocketbase';

	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	onMount(() => {
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
	<title>Maragha - Tambah Penerbit Baru</title>
	<meta name="description" content="Buat penerbit baru untuk perpustakaan digital Maragha" />
</svelte:head>

<div class="container mx-auto max-w-2xl px-4 py-8">
	<div
		class="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg dark:bg-[var(--card)]"
	>
		<div class="mb-6">
			<h1 class="mb-2 text-3xl font-bold text-[var(--foreground)]">Tambah Penerbit Baru</h1>
			<p class="text-[var(--muted-foreground)]">
				Buat penerbit baru untuk perpustakaan digital Maragha
			</p>
		</div>

		{#if error}
			<div
				class="mb-4 rounded-md border border-[var(--destructive)]/20 bg-[var(--destructive)]/5 p-4 dark:bg-[var(--destructive)]/10"
			>
				<p class="text-[var(--destructive-foreground)]">{error}</p>
			</div>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				error = null;
				return async ({ result }) => {
					isSubmitting = false;
					if (result?.type === 'success') {
						await goto('/penerbit');
					} else if (result?.type === 'error') {
						error = result.error?.message || 'Terjadi kesalahan';
					} else if (result?.type === 'failure' && result.data?.error) {
						error = String(result.data.error);
					}
				};
			}}
			class="space-y-6"
		>
			<!-- Nama Penerbit -->
			<div>
				<label for="penerbit" class="mb-2 block text-sm font-medium text-[var(--foreground)]">
					Nama Penerbit <span class="text-[var(--destructive)]">*</span>
				</label>
				<input
					id="penerbit"
					name="penerbit"
					type="text"
					class="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:border-[var(--ring)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none dark:bg-[var(--card)]"
					placeholder="Masukkan nama penerbit"
					required
					maxlength="255"
				/>
			</div>

			<!-- Form Actions -->
			<div class="flex flex-col gap-3 pt-4 sm:flex-row">
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex-1 rounded-md bg-[var(--primary)] px-4 py-2 font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--primary)]/90 focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isSubmitting}
						<span class="flex items-center justify-center">
							<svg class="mr-2 -ml-1 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
							Membuat penerbit...
						</span>
					{:else}
						Buat Penerbit Baru
					{/if}
				</button>

				<button
					type="button"
					on:click={() => goto('/penerbit')}
					disabled={isSubmitting}
					class="flex-1 rounded-md bg-[var(--muted)] px-4 py-2 font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)]/90 focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					Batal
				</button>
			</div>
		</form>
	</div>

	<!-- Back to penerbit list link -->
	<div class="mt-8 text-center">
		<a
			href="/penerbit"
			class="inline-flex items-center text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/80 dark:text-[var(--primary)] dark:hover:text-[var(--primary)]/80"
		>
			← Kembali ke Daftar Penerbit
		</a>
	</div>
</div>

<style>
	/* Ensure form elements don't exceed 110 characters */
	input {
		font-family: inherit;
	}
</style>
