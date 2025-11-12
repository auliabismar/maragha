<script lang="ts">
	import { goto } from '$app/navigation';
	import { theme } from '$lib/stores/theme';

	let resolvedTheme = $derived(
		$theme === 'system'
			? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: $theme
	);

	interface Column {
		key: string;
		label: string;
		sortable: boolean;
	}

	interface Props {
		data: any[];
		columns: Column[];
		title: string;
		description: string;
		addButtonText: string;
		addRoute: string;
		backRoute: string;
		emptyMessage?: string;
		showActions?: boolean;
		editRoute?: string;
		onDelete?: (id: string) => void | Promise<void>;
	}

	let {
		data,
		columns,
		title,
		description,
		addButtonText,
		addRoute,
		backRoute,
		emptyMessage = 'Belum ada data',
		showActions = false,
		editRoute = '',
		onDelete
	}: Props = $props();

	let sortBy = $state(columns[0]?.key || 'id');
	let sortDirection = $state<'asc' | 'desc'>('asc');
	let filteredData = $state([...data]);

	function handleSort(column: string) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'asc';
		}
		sortData();
	}

	function sortData() {
		filteredData = [...data].sort((a, b) => {
			let aVal = a[sortBy as keyof typeof a];
			let bVal = b[sortBy as keyof typeof b];

			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});
	}

	function getRecordValue(item: any, key: string): string {
		return item[key] || 'N/A';
	}

	function getRecordId(item: any): string {
		return item.id || item._id || item.collectionId || item.recordId || 'N/A';
	}

	function handleAddNew() {
		goto(addRoute);
	}

	function handleEdit(id: string) {
		if (editRoute) {
			goto(editRoute.replace(':id', id));
		}
	}

	async function handleDelete(id: string) {
		if (confirm('Hapus data ini?')) {
			if (onDelete) {
				await onDelete(id);
			}
		}
	}

	// Sort data on mount and when data changes
	$effect(() => {
		filteredData = [...data];
		sortData();
	});
</script>

<div class="container mx-auto px-6 py-8">
	<div class="flex justify-between items-center mb-8">
		<div>
			<h1 class="text-3xl font-bold text-[var(--primary)]">{title}</h1>
			<p class="text-[var(--muted-foreground)] mt-2">{description}</p>
		</div>
		<button
			onclick={handleAddNew}
			class="bg-[var(--primary)] hover:bg-[var(--destructive)] text-[var(--primary-foreground)] px-4 py-2 rounded-lg transition-colors"
		>
			{addButtonText}
		</button>
	</div>

	{#if filteredData.length === 0}
		<div class="text-center py-12">
			<p class="text-[var(--primary-foreground)] text-lg">{emptyMessage}</p>
			<button
				onclick={handleAddNew}
				class="mt-4 bg-[var(--primary)] hover:bg-[var(--destructive)] text-[var(--primary-foreground)] px-6 py-2 rounded-lg transition-colors"
			>
				{addButtonText}
			</button>
		</div>
	{:else}
		<div class="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
			<table class="w-full">
				<thead>
					<tr class="bg-[var(--muted)] text-[var(--muted-foreground)]">
						{#each columns as column}
							<th
								class="px-6 py-3 text-left {column.sortable ? 'cursor-pointer hover:bg-[var(--muted-foreground)/10]' : ''}"
								onclick={() => column.sortable && handleSort(column.key)}
							>
								<div class="flex items-center">
									{column.label}
									{#if column.sortable && sortBy === column.key}
										<span class="ml-1">
											{sortDirection === 'asc' ? '↑' : '↓'}
										</span>
									{/if}
								</div>
							</th>
						{/each}
						{#if showActions}
							<th class="px-6 py-3 text-left">Aksi</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each filteredData as item}
						<tr class="border-t border-[var(--border)] hover:bg-[var(--muted)] text-[var(--muted-foreground)]">
							{#each columns as column}
								<td class="px-6 py-4 {column.key === 'id' ? 'font-mono text-sm' : ''}">
									{getRecordValue(item, column.key)}
								</td>
							{/each}
							{#if showActions}
								<td class="px-6 py-4">
									<div class="flex space-x-2">
										{#if editRoute}
											<button
												onclick={() => handleEdit(getRecordId(item))}
												class="text-[var(--primary)] hover:text-[var(--primary-600)] px-2 py-1 rounded"
												title="Edit"
											>
												✏️
											</button>
										{/if}
										{#if onDelete}
											<button
												onclick={() => handleDelete(getRecordId(item))}
												class="text-red-500 hover:text-red-700 px-2 py-1 rounded"
												title="Hapus"
											>
												🗑️
											</button>
										{/if}
									</div>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	<div class="mt-8 flex justify-between items-center">
		<p class="text-[var(--muted-foreground)]">
			Total: {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'}
		</p>
		<button
			onclick={() => goto(backRoute)}
			class="text-[var(--primary)] hover:text-[var(--destructive)] underline"
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