<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase';
	import BookCard from '$lib/components/BookCard.svelte';

	interface Book {
		id: string;
		judul: string;
		cover?: string;
		status: string;
		penulis: string[];
		penerbit: string;
		kategori: string[];
		totalHalaman: number;
		halamanSetuju: number;
	}

	let books = $state<Book[]>([]);
	let filteredBooks = $state<Book[]>([]);
	let selectedKategori = $state<string>('all');
	let searchQuery = $state<string>('');
	let userEmail = $state<string | null>(null);
	let availableKategoris = $state<string[]>([]);

	onMount(() => {
		if (!pb.authStore.isValid) {
			goto('/login');
		} else {
			userEmail = pb.authStore.model?.email;
			// Fetch books from PocketBase
			fetchBooks();
		}
	});

	async function fetchBooks() {
		try {
			const records = await pb.collection('buku').getFullList({
				sort: '-created',
				expand: 'penulis,penerbit,kategori'
			});

			// Get all halaman for all books
			const allHalaman = await pb.collection('halaman').getFullList();
			
			// Group halaman by buku
			const halamanByBuku = allHalaman.reduce((acc: any, halaman: any) => {
				const bukuId = halaman.buku;
				if (!acc[bukuId]) {
					acc[bukuId] = [];
				}
				acc[bukuId].push(halaman);
				return acc;
			}, {});

			books = records.map(record => {
				const bookHalaman = halamanByBuku[record.id] || [];
				const halamanSetuju = bookHalaman.filter((h: any) => h.status === 'Setuju').length;
				const totalHalaman = bookHalaman.length;

				return {
					id: record.id,
					judul: record.judul,
					cover: record.cover ? pb.files.getURL(record, record.cover) : undefined,
					status: record.status,
					penulis: record.expand?.penulis?.map((p: any) => p.id) || [],
					penerbit: record.expand?.penerbit?.id || 'N/A',
					kategori: record.expand?.kategori?.map((k: any) => k.id) || [],
					totalHalaman: totalHalaman,
					halamanSetuju: halamanSetuju
				};
			});

			// Extract unique kategoris
			const kategoriSet = new Set<string>();
			books.forEach(book => {
				book.kategori.forEach(k => kategoriSet.add(k));
			});
			availableKategoris = Array.from(kategoriSet).sort();

			filterBooks();
		} catch (error) {
			console.error('Error fetching books:', error);
		}
	}

	function filterBooks() {
		filteredBooks = books.filter(book => {
			const matchesKategori = selectedKategori === 'all' || book.kategori.includes(selectedKategori);
			const matchesSearch = book.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
				book.penulis.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
				book.kategori.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
			return matchesKategori && matchesSearch;
		});
	}

	function calculateProgress(book: Book): number {
		if (book.totalHalaman === 0) return 0;
		return Math.round((book.halamanSetuju / book.totalHalaman) * 100);
	}

	async function handleLogout() {
		pb.authStore.clear();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Maragha - Dashboard</title>
	<meta name="description" content="Dashboard Perpustakaan Digital Maragha" />
</svelte:head>

<section class="text-center mb-12">
	<h2 class="text-4xl font-heading font-bold text-foreground mb-4">Dashboard</h2>
	<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
		Kelola koleksi buku digital Anda.
	</p>
</section>

<!-- Search and Filter Section -->
<section class="mb-8">
	<div class="flex flex-col md:flex-row gap-4 items-center justify-between">
		<!-- Search Input -->
		<div class="w-full md:w-1/2">
			<input
				type="text"
				placeholder="Cari buku, penulis, atau kategori..."
				bind:value={searchQuery}
				oninput={filterBooks}
				class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
			/>
		</div>

		<!-- Kategori Filter -->
		<div class="w-full md:w-auto">
			<select
				bind:value={selectedKategori}
				onchange={filterBooks}
				class="w-full md:w-auto px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
			>
				<option value="all">Semua Kategori</option>
				{#each availableKategoris as kategori}
					<option value={kategori}>{kategori}</option>
				{/each}
			</select>
		</div>
	</div>
</section>

<!-- Books Grid -->
<section>
	{#if filteredBooks.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each filteredBooks as book}
				<BookCard book={book} />
			{/each}
		</div>
	{:else}
		<div class="text-center py-12">
			<p class="text-lg text-muted-foreground">
				{books.length === 0 ? 'Belum ada buku yang tersedia.' : 'Tidak ada buku yang sesuai dengan filter.'}
			</p>
		</div>
	{/if}
</section>