<script lang="ts">
	import { onMount } from 'svelte';
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
	let availableKategoris = $state<string[]>([]);
	let showImages = $state<boolean>(true);

	onMount(() => {
		fetchBooks();
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
</script>

<svelte:head>
	<title>Maragha - Merawat Warisan Intelektual Islam</title>
	<meta name="description" content="Maragha: Platform perpustakaan digital untuk buku-buku klasik Arab yang telah diterjemahkan dan crowd sourcing terjemahan untuk melestarikan khazanah intelektual Islam." />
</svelte:head>

<main class="container mx-auto px-6 py-8">
		<!-- Hero Section -->
		<section class="relative bg-gradient-to-br from-[#F3EFE0] to-[#E8E4D0] py-16 px-6 rounded-2xl mb-12 border border-[#D4A856]/20">
			<!-- Background Pattern -->
			<div class="absolute inset-0 opacity-5">
				<svg class="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<pattern id="islamic-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
							<circle cx="10" cy="10" r="2" fill="#29477B"/>
							<path d="M10 5 L10 15 M5 10 L15 10" stroke="#29477B" stroke-width="0.5"/>
						</pattern>
					</defs>
					<rect width="100%" height="100%" fill="url(#islamic-pattern)"/>
				</svg>
			</div>

			<div class="relative z-10 text-center max-w-4xl mx-auto">
				<!-- Main Heading -->
				<h1 class="text-5xl md:text-6xl font-heading font-bold text-[#29477B] mb-6 leading-tight">
					Merawat Warisan<br/>
					<span class="text-[#64463C]">Intelektual Islam</span>
				</h1>

				<!-- Subheading -->
				<p class="text-xl md:text-2xl text-[#64463C] mb-8 font-medium leading-relaxed">
					Platform perpustakaan digital untuk<br/>
					<span class="text-[#29477B] font-semibold">buku-buku klasik Arab</span> yang telah diterjemahkan<br/>
					dengan semangat <span class="text-[#D4A856] font-semibold">gotong royong literasi</span>
				</p>

				<!-- Description -->
				<p class="text-lg text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
					Bergabunglah dalam misi melestarikan dan menyemarakkan khazanah intelektual Islam
					melalui terjemahan kolaboratif naskah-naskah berharga yang telah mendekati keilmuan
					selama berabad-abad.
				</p>

				<!-- Call to Action Buttons -->
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
					<a
						href="/register"
						class="bg-[#29477B] text-white px-8 py-4 rounded-xl font-semibold text-lg
							   hover:bg-[#1e3658] transition-all duration-300 shadow-lg hover:shadow-xl
							   transform hover:-translate-y-1"
					>
						🚀 Mulai Menerjemahkan
					</a>
					<a
						href="/buku"
						class="bg-transparent border-2 border-[#D4A856] text-[#D4A856] px-8 py-4
							   rounded-xl font-semibold text-lg hover:bg-[#D4A856] hover:text-white
							   transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
					>
						📚 Jelajahi Koleksi
					</a>
				</div>

				<!-- Stats/Features -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-[#D4A856]/30">
					<div class="text-center">
						<div class="text-3xl font-bold text-[#29477B] mb-2">500+</div>
						<div class="text-[#64463C] font-medium">Buku Klasik</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-[#D4A856] mb-2">1000+</div>
						<div class="text-[#64463C] font-medium">Penerjemah Aktif</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-bold text-[#64463C] mb-2">50+</div>
						<div class="text-[#64463C] font-medium">Editor Profesional</div>
					</div>
				</div>
			</div>

			<!-- Decorative Elements -->
			<div class="absolute top-4 right-4 text-[#D4A856] opacity-20">
				<svg class="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
				</svg>
			</div>
			<div class="absolute bottom-4 left-4 text-[#A1A2A6] opacity-20">
				<svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
					<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
				</svg>
			</div>
		</section>

		<!-- Search and Filter Section -->
		<section class="mb-8">
			<div class="flex flex-col md:flex-row gap-4 items-center justify-between">
				<div class="flex flex-col sm:flex-row gap-4 w-full">
					<!-- Search Input -->
					<div class="w-full md:w-2/3">
						<input
							type="text"
							placeholder="Cari buku, penulis, atau kategori..."
							bind:value={searchQuery}
							oninput={filterBooks}
							class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
						/>
					</div>

					<!-- Kategori Filter -->
					<div class="w-full md:w-auto md:flex-1">
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
	</main>
