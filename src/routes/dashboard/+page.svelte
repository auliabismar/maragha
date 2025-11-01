<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase';

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
				<button
					class="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow text-left w-full"
					onclick={() => goto(`/buku/${book.id}/halaman`)}
				>
					<div class="aspect-[5/7] bg-muted flex items-center justify-center">
						{#if book.cover}
							<img src={book.cover} alt={book.judul} class="w-full h-full object-cover" />
						{:else}
							<div class="text-muted-foreground">
								<svg class="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
									<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
								</svg>
								<p class="text-sm">No Cover</p>
							</div>
						{/if}
					</div>
					<div class="p-4">
						<h3 class="font-heading font-semibold text-lg text-foreground mb-2 line-clamp-2">
							{book.judul}
						</h3>
						<p class="text-sm text-muted-foreground mb-1">
							Penulis: {book.penulis.join(', ')}
						</p>
						{#if book.kategori.length > 0}
							<p class="text-sm text-muted-foreground mb-1">
								Kategori: {book.kategori.join(', ')}
							</p>
						{/if}
						<p class="text-sm text-muted-foreground mb-3">
							Penerbit: {book.penerbit}
						</p>
						
						<!-- Progress Bar -->
						<div class="mb-3">
							<div class="flex items-center justify-between mb-1">
								<span class="text-sm text-muted-foreground">Progress Terjemahan</span>
								<span class="text-sm font-medium text-foreground">{calculateProgress(book)}%</span>
							</div>
							<div class="w-full bg-muted rounded-full h-2">
								<div
									class="bg-green-600 h-2 rounded-full transition-all duration-300"
									style="width: {calculateProgress(book)}%"
								></div>
							</div>
							<p class="text-xs text-muted-foreground mt-1">
								{book.halamanSetuju} dari {book.totalHalaman} halaman
							</p>
						</div>
						
						<div class="flex items-center justify-between">
							{#if book.kategori.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each book.kategori.slice(0, 2) as kategori}
										<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
											{kategori}
										</span>
									{/each}
									{#if book.kategori.length > 2}
										<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
											+{book.kategori.length - 2}
										</span>
									{/if}
								</div>
							{:else}
								<span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
									Tidak ada kategori
								</span>
							{/if}
							<span class="text-primary text-sm font-medium">
								Baca →
							</span>
						</div>
					</div>
				</button>
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