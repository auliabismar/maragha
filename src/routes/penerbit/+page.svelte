<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';

	let { data } = $props();
	let { penerbit, user } = data;

	const columns = [
		{ key: 'id', label: 'Penerbit', sortable: true }
	];

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/meja_kerja');
		}
	});
</script>

<svelte:head>
	<title>Daftar Penerbit - Maragha</title>
	<meta name="description" content="Kelola penerbit buku di Maragha" />
</svelte:head>

<DataTable
	data={penerbit}
	{columns}
	title="Penerbit Buku"
	description="Kelola daftar penerbit buku"
	addButtonText="Tambah Penerbit"
	addRoute="/penerbit/tambah"
	backRoute="/meja_kerja"
	emptyMessage="Belum ada penerbit"
/>