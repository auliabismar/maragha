<script lang="ts">
	import { onMount } from 'svelte';
	import pb from '$lib/pocketbase';

	interface Book {
		id: string;
		judul: string;
		cover?: string;
		status: string;
		penulis: string[];
		penerbit: string;
	}

	let books = $state<Book[]>([]);
	let filteredBooks = $state<Book[]>([]);
	let selectedStatus = $state<string>('all');
	let searchQuery = $state<string>('');

	onMount(() => {
		fetchBooks();
	});

	async function fetchBooks() {
		try {
			const records = await pb.collection('buku').getFullList({
				sort: '-created',
				expand: 'penulis,penerbit,kategori'
			});

			books = records.map(record => ({
				id: record.id,
				judul: record.judul,
				cover: record.cover ? pb.files.getUrl(record, record.cover) : undefined,
				status: record.status,
				penulis: record.expand?.penulis?.map((p: any) => p.nama) || [],
				penerbit: record.expand?.penerbit?.nama || 'N/A'
			}));
			filterBooks();
		} catch (error) {
			console.error('Error fetching books:', error);
		}
	}

	function filterBooks() {
		filteredBooks = books.filter(book => {
			const matchesStatus = selectedStatus === 'all' || book.status === selectedStatus;
			const matchesSearch = book.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
				book.penulis.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
			return matchesStatus && matchesSearch;
		});
	}
</script>

<svelte:head>
	<title>Maragha - Perpustakaan Digital</title>
	<meta name="description" content="Maragha - Perpustakaan digital untuk koleksi buku-buku bersejarah dan naskah kuno" />
</svelte:head>

<main class="container mx-auto px-6 py-8">
		<!-- Welcome Section -->
		<section class="text-center mb-12">
			<h2 class="text-4xl font-heading font-bold text-foreground mb-4">
				Selamat Datang di Perpustakaan Maragha
			</h2>
			<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
				Koleksi digital naskah kuno dan buku-buku bersejarah untuk penelitian dan pembelajaran.
			</p>
		</section>

		<!-- Search and Filter Section -->
		<section class="mb-8">
			<div class="flex flex-col md:flex-row gap-4 items-center justify-between">
				<!-- Search Input -->
				<div class="w-full md:w-1/2">
					<input
						type="text"
						placeholder="Cari buku atau penulis..."
						bind:value={searchQuery}
						oninput={filterBooks}
						class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
					/>
				</div>

				<!-- Status Filter -->
				<div class="w-full md:w-auto">
					<select
						bind:value={selectedStatus}
						onchange={filterBooks}
						class="w-full md:w-auto px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
					>
						<option value="all">Semua Status</option>
						<option value="Draft">Draft</option>
						<option value="Terbit">Terbit</option>
						<option value="Batal">Batal</option>
					</select>
				</div>
			</div>
		</section>

		<!-- Books Grid -->
		<section>
			{#if filteredBooks.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{#each filteredBooks as book}
						<div class="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
								<p class="text-sm text-muted-foreground mb-3">
									Penerbit: {book.penerbit}
								</p>
								<div class="flex items-center justify-between">
									<span class="px-2 py-1 text-xs rounded-full
										{book.status === 'Terbit' ? 'bg-green-100 text-green-800' :
										 book.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
										 'bg-red-100 text-red-800'}">
										{book.status}
									</span>
									<button class="text-primary hover:text-accent text-sm font-medium">
										Lihat Detail
									</button>
								</div>
							</div>
						</div>
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
	</main>
