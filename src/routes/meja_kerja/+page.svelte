<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let user = $state(data.user);

	const links = [
		{ href: '/buku', label: 'Buku', description: 'Kelola daftar buku' },
		{ href: '/kategori', label: 'Kategori', description: 'Kelola kategori buku' },
		{ href: '/penulis', label: 'Penulis', description: 'Kelola data penulis' },
		{ href: '/penerbit', label: 'Penerbit', description: 'Kelola data penerbit' },
		{ href: '/penugasan', label: 'Penugasan', description: 'Kelola tugas penerjemahan' }
	];

	function handleLinkClick(href: string) {
		goto(href);
	}

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/');
		}
	});
</script>

<svelte:head>
	<title>Meja Kerja - Maragha</title>
	<meta name="description" content="Dashboard Editor Maragha" />
</svelte:head>

<div class="container mx-auto px-6 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-[var(--primary)] mb-2">Meja Kerja Editor</h1>
		<p class="text-[var(--primary-foreground)]">Kelola konten dan tugas editorial Anda</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{#each links as link}
			<button
				class="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
				onclick={() => handleLinkClick(link.href)}
			>
				<h3 class="text-xl font-semibold text-[var(--primary)] mb-2">{link.label}</h3>
				<p class="text-[var(--foreground)] text-sm">{link.description}</p>
			</button>
		{/each}
	</div>
</div>

<style>
	/* Ensure proper spacing and responsive design */
	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>