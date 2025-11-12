<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';

	let { data } = $props();
	let { penulis, user } = data;

	const columns = [
		{ key: 'id', label: 'Penulis', sortable: true }
	];

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/meja_kerja');
		}
	});
</script>

<svelte:head>
	<title>Daftar Penulis - Maragha</title>
	<meta name="description" content="Kelola Penulis buku di Maragha" />
</svelte:head>

<DataTable
	data={penulis}
	{columns}
	title="Penulis Buku"
	description="Kelola daftar penulis buku"
	addButtonText="Tambah Penulis"
	addRoute="/penulis/tambah"
	backRoute="/meja_kerja"
	emptyMessage="Belum ada penulis"
/>