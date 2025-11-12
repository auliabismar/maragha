<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { penugasan, user } = data;

	const columns = [
		{ key: 'judul', label: 'Judul Tugas', sortable: true },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'penerjemah', label: 'Penerjemah', sortable: false },
		{ key: 'created', label: 'Dibuat', sortable: true }
	];

	let sortBy = $state('created');
	let sortDirection = $state('desc');
	let filteredPenugasan = $state([...penugasan]);

	function handleSort(column: string) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'desc';
		}
		sortPenugasan();
	}

	function sortPenugasan() {
		filteredPenugasan = [...penugasan].sort((a, b) => {
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
		goto(`/penugasan/${id}/edit`);
	}

	function handleDelete(id: string) {
		if (confirm('Hapus penugasan ini?')) {
			// Implement delete logic
			goto('/penugasan');
		}
	}

	function handleAddNew() {
		goto('/penugasan/tambah');
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending': return 'bg-yellow-100 text-yellow-800';
			case 'progress': return 'bg-blue-100 text-blue-800';
			case 'completed': return 'bg-green-100 text-green-800';
			case 'cancelled': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/meja_kerja');
		}
		sortPenugasan();
	});
</script>

<svelte:head>
	<title>Daftar Penugasan - Maragha</title>
	<meta name="description" content="Kelola tugas penerjemahan di Maragha" />
</svelte:head>

<div class="container mx-auto px-6 py-8">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-bold text-[var(--primary)]">Penugasan Penerjemahan</h1>
			<p class="text-[var(--primary-foreground)] mt-2">Kelola tugas-tugas penerjemahan</p>
		</div>
		<button
			onclick={handleAddNew}
			class="bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white px-4 py-2 rounded-lg transition-colors"
		>
			Tambah Penugasan
		</button>
	</div>

	{#if filteredPenugasan.length === 0}
		<div class="text-center py-12">
			<p class="text-[var(--primary-foreground)] text-lg">Belum ada penugasan</p>
			<button
				onclick={handleAddNew}
				class="mt-4 bg-[var(--primary)] hover:bg-[var(--primary-600)] text-white px-6 py-2 rounded-lg transition-colors"
			>
				Tambah Penugasan Pertama
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
								onclick={() => handleSort(column.key)}
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
					{#each filteredPenugasan as item}
						<tr class="border-t border-[var(--border)] hover:bg-[var(--muted)]">
							<td class="px-6 py-4 font-medium">{item.judul || 'N/A'}</td>
							<td class="px-6 py-4">
								<span class="px-2 py-1 rounded-full text-xs font-medium {getStatusColor(item.status || 'pending')}">
									{item.status || 'pending'}
								</span>
							</td>
							<td class="px-6 py-4">{item.penerjemah?.name || 'Belum ditugaskan'}</td>
							<td class="px-6 py-4">
								{new Date(item.created).toLocaleDateString('id-ID')}
							</td>
							<td class="px-6 py-4">
								<div class="flex space-x-2">
									<button
										onclick={() => handleEdit(item.id)}
										class="text-[var(--primary)] hover:text-[var(--primary-600)] px-2 py-1 rounded"
										title="Edit"
									>
										✏️
									</button>
									<button
										onclick={() => handleDelete(item.id)}
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
			Total: {filteredPenugasan.length} penugasan
		</p>
		<button
			onclick={() => goto('/meja_kerja')}
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