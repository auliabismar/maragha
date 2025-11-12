<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { penerbit, user } = data;

	const columns = [
		{ key: 'nama', label: 'Nama Penerbit', sortable: true },
		{ key: 'alamat', label: 'Alamat', sortable: false },
		{ key: 'kontak', label: 'Kontak', sortable: false },
		{ key: 'created', label: 'Dibuat', sortable: true }
	];

	let sortBy = $state('created');
	let sortDirection = $state('desc');
	let filteredPenerbit = $state([...penerbit]);

	function handleSort(column: string) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'desc';
		}
		sortPenerbit();
	}

	function sortPenerbit() {
		filteredPenerbit = [...penerbit].sort((a, b) => {
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
		goto(`/penerbit/${id}/edit`);
	}

	function handleDelete(id: string) {
		if (confirm('Hapus penerbit ini?')) {
			// Implement delete logic
			goto('/penerbit');
		}
	}

	function handleAddNew() {
		goto('/penerbit/tambah');
	}

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/meja_kerja');
		}
		sortPenerbit();
	});
</script>

<svelte:head>
	<title>Daftar Penerbit - Maragha</title>
	<meta name="description" content="Kelola data penerbit di Maragha" />
</svelte:head>

<div class="container mx-auto px-6 py-8">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-bold text-[var(--primary)]">Data Penerbit</h1>
			<p class="text-[var(--primary-foreground)] mt-2">Kelola daftar penerbit buku</p>
		</div>
		<button
			on:click={handleAddNew}
			class="bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white px-4 py-2 rounded-lg transition-colors"
		>
			Tambah Penerbit
		</button>
	</div>

	{#if filteredPenerbit.length === 0}
		<div class="text-center py-12">
			<p class="text-[var(--primary-foreground)] text-lg">Belum ada penerbit</p>
			<button
				on:click={handleAddNew}
				class="mt-4 bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white px-6 py-2 rounded-lg transition-colors"
			>
				Tambah Penerbit Pertama
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
					{#each filteredPenerbit as item}
						<tr class="border-t border-[var(--border)] hover:bg-[var(--muted)]">
							<td class="px-6 py-4">{item.nama || 'N/A'}</td>
							<td class="px-6 py-4 max-w-xs truncate">
								{item.alamat ? item.alamat.substring(0, 50) + '...' : '-'}
							</td>
							<td class="px-6 py-4 max-w-xs truncate">
								{item.kontak ? item.kontak.substring(0, 30) + '...' : '-'}
							</td>
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
			Total: {filteredPenerbit.length} penerbit
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

	truncate {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>