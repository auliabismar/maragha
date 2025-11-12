<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import DataTable from '$lib/components/DataTable.svelte';

	let { data } = $props();
	let { buku, user } = data;

	const columns = [
		{ key: 'judul', label: 'Judul', sortable: true },
		{ key: 'revisi', label: 'Revisi', sortable: true },
		{ key: 'status', label: 'Status', sortable: true },
		{ key: 'penerbit', label: 'Penerbit', sortable: true },
		{ key: 'penulis', label: 'Penulis', sortable: true },
		{ key: 'kategori', label: 'Kategori', sortable: true }
	];

	onMount(() => {
		if (!user || user.akses !== 'Editor') {
			goto('/meja_kerja');
		}
	});
</script>

<svelte:head>
	<title>Daftar Buku - Maragha</title>
	<meta name="description" content="Kelola daftar buku di Maragha" />
</svelte:head>

<DataTable
	data={buku}
	{columns}
	title="Daftar Buku"
	description="Kelola daftar buku"
	addButtonText="Tambah Buku"
	addRoute="/buku/tambah"
	backRoute="/meja_kerja"
	editRoute="/buku/:id/"
	emptyMessage="Belum ada buku"
	showActions={true}
/>