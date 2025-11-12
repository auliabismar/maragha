<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { kategori, user } = data;

	const columns = [
		{ key: 'nama', label: 'Nama Kategori', sortable: true },
		{ key: 'deskripsi', label: 'Deskripsi', sortable: false },
		{ key: 'created', label: 'Dibuat', sortable: true }
	];

	let sortBy = $state('created');
	let sortDirection = $state('desc');
	let filteredKategori = $state([...kategori]);

	function handleSort(column: string) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'desc';
		}
		sortKategori();
	}

	function sortKategori() {
		filteredKategori = [...kategori].sort((a, b) => {
			let aVal = a[sortBy as keyof typeof a];
			let bVal = b[sortBy as keyof typeof b];

			if (sortBy === 'created') {
				aVal = new Date(aVal as string).getTime();
				bVal = new Date(bVal as string).getTime();
			}

			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	}

	function handleEdit(id: string) {
		goto(`/kategori/${id}/edit`);
	}

	function handleDelete(id: string) {
		if (confirm('Hapus kategori ini?')) {
			// Implement delete logic
			goto('/kategori');
		}
	}

	function handleAddNew() {
		goto('/kategori/tambah');
	}

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/meja_kerja');
		}
		sortKategori();
	});
</script>

<svelte:head>
	<title>Daftar Kategori - Maragha</title>
	<meta name="description" content="Kelola kategori buku di Maragha" />
</svelte:head>

<div class="container mx-auto px-6 py-8">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-bold text-[var(--primary)]">Kategori Buku</h1>
			<p class="text-[var(--primary-foreground)] mt-2">Kelola daftar kategori buku</p>
		</div>
		<button
			on:click={handleAddNew}
			class="bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white px-4 py-2 rounded-lg transition-colors"
		>
			Tambah Kategori
		</button>
	</div>

	{#if filteredKategori.length === 0}
		<div class="text-center py-12">
			<p class="text-[var(--primary-foreground)] text-lg">Belum ada kategori</p>
			<button
				on:click={handleAddNew}
				class="mt-4 bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white px-6 py-2 rounded-lg transition-colors"
			>
				Tambah Kategori Pertama
			</button>
		</div>
	{:else}
		<div class="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="bg-[var(--muted)] text-[var(--muted-foreground)]">
						{#each columns as column}
							<th
								class="px-6 py-3 text-left cursor-pointer hover:bg-[var(--muted-foreground)/10]"
								on:click={() => handleSort(column.key)}
							>
								<div class="flex items-center">
									{column.label}
									{#if sortBy === column.key}
										<span class="ml-1">
											{sortDirection === 'asc' ? '↑' : '↓'}
										</span>
									{/if}
								</div>
							</th>
						{/each}
						<th class="px-6 py-3 text-left">Aksi</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredKategori as item}
						<tr class="border-t border-[var(--border)] hover:bg-[var(--muted)]">
							<td class="px-6 py-4">{item.nama || 'N/A'}</td>
							<td class="px-6 py-4">{item.deskripsi || '-'}</td>
							<td class="px-6 py-4">
								{new Date(item.created).toLocaleDateString('id-ID')}
							</td>
							<td class="px-6 py-4">
								<div class="flex space-x-2">
									<button
										on:click={() => handleEdit(item.id)}
										class="text-[var(--primary)] hover:text-[var(--primary-600)] px-2 py-1 rounded"
										title="Edit"
									>
										✏️
									</button>
									<button
										on:click={() => handleDelete(item.id)}
										class="text-red-500 hover:text-red-700 px-2 py-1 rounded"
										title="Hapus"
									>
										🗑️
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<div class="mt-8 flex justify-between items-center">
		<p class="text-[var(--primary-foreground)]">
			Total: {filteredKategori.length} kategori
		</p>
		<button
			on:click={() => goto('/meja_kerja')}
			class="text-[var(--primary)] hover:text-[var(--primary-600)] underline"
		>
			Kembali ke Meja Kerja
		</button>
	</div>
</div>

<style>
	table {
		min-width: 100%;
	}

	th,
	td {
		text-align: left;
	}

	button {
		transition: all 0.2s ease-in-out;
	}
</style>