<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';

	let { data } = $props();
	let { kategori, user } = data;

	const columns = [
		{ key: 'id', label: 'Kategori', sortable: true }
	];

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/meja_kerja');
		}
	});
</script>

<svelte:head>
	<title>Daftar Kategori - Maragha</title>
	<meta name="description" content="Kelola kategori buku di Maragha" />
</svelte:head>

<DataTable
	data={kategori}
	{columns}
	title="Kategori Buku"
	description="Kelola daftar kategori buku"
	addButtonText="Tambah Kategori"
	addRoute="/kategori/tambah"
	backRoute="/meja_kerja"
	emptyMessage="Belum ada kategori"
/>