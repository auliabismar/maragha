<script lang="ts">
	import { onMount } from 'svelte';
	import pb from '$lib/pocketbase';
	import { goto } from '$app/navigation';

	interface Assignment {
		id: string;
		judul: string;
		deskripsi: string;
		status: string;
		assignedTo: string;
		awal_halaman: number;
		akhir_halaman: number;
	}

	let assignments = $state<Assignment[]>([]);
	let filteredAssignments = $state<Assignment[]>([]);
	let selectedStatus = $state<string>('all');
	let searchQuery = $state<string>('');
	let userEmail = $state<string | null>(null);

	onMount(() => {
		if (!pb.authStore.isValid) {
			goto('/login');
		} else {
			const user = pb.authStore.model;
			if (!user || (user.role !== 'Editor' && user.role !== 'Penerjemah')) {
				// Redirect to dashboard if user doesn't have proper role
				goto('/');
				return;
			}
			userEmail = user.email;
			fetchAssignments();
		}
	});

	async function fetchAssignments() {
		try {
			const records = await pb.collection('penugasan').getFullList({
				sort: '-created',
				expand: 'tertugas,buku'
			});
			assignments = records.map(record => ({
				id: record.id,
				judul: record.expand?.buku?.judul || record.buku || 'N/A',
				deskripsi: record.keterangan || 'N/A',
				status: record.status,
				assignedTo: record.expand?.tertugas?.email || record.tertugas || 'N/A',
				awal_halaman: record.awal_halaman,
				akhir_halaman: record.akhir_halaman
			}));
			filterAssignments();
		} catch (error) {
			console.error('Error fetching assignments:', error);
		}
	}

	function filterAssignments() {
		filteredAssignments = assignments.filter(assignment => {
			const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;
			const matchesSearch = assignment.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
				assignment.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
				assignment.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesStatus && matchesSearch;
		});
	}

	async function handleLogout() {
		pb.authStore.clear();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Maragha - Penugasan</title>
	<meta name="description" content="Daftar Penugasan Maragha" />
</svelte:head>

<section class="text-center mb-12">
	<h2 class="text-4xl font-heading font-bold text-foreground mb-4">Daftar Penugasan</h2>
	<p class="text-lg text-muted-foreground max-w-2xl mx-auto">
		Kelola dan lihat penugasan yang ada.
	</p>
</section>

<!-- Search and Filter Section -->
<section class="mb-8">
	<div class="flex flex-col md:flex-row gap-4 items-center justify-between">
		<!-- Search Input -->
		<div class="w-full md:w-1/2">
			<input
				type="text"
				placeholder="Cari penugasan atau deskripsi..."
				bind:value={searchQuery}
				oninput={filterAssignments}
				class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
			/>
		</div>

		<!-- Status Filter -->
		<div class="w-full md:w-auto">
			<select
				bind:value={selectedStatus}
				onchange={filterAssignments}
				class="w-full md:w-auto px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
			>
				<option value="all">Semua Status</option>
				<option value="Terlapor">Terlapor</option>
				<option value="Ditugaskan">Ditugaskan</option>
				<option value="Disetujui">Disetujui</option>
				<option value="Dibatalkan">Dibatalkan</option>
			</select>
		</div>
	</div>
</section>

<!-- Assignments Table -->
<section>
	{#if filteredAssignments.length > 0}
		<div class="overflow-x-auto bg-card rounded-lg shadow-md">
			<table class="min-w-full divide-y divide-border">
				<thead class="bg-muted">
					<tr>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Judul
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Deskripsi
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Status
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Ditugaskan Kepada
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Halaman Awal
						</th>
						<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Halaman Akhir
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each filteredAssignments as assignment}
						<tr>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
								{assignment.judul}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
								{assignment.deskripsi}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<span class="px-2 py-1 text-xs rounded-full
									{assignment.status === 'Disetujui' ? 'bg-green-100 text-green-800' :
									 assignment.status === 'Ditugaskan' ? 'bg-yellow-100 text-yellow-800' :
									 assignment.status === 'Terlapor' ? 'bg-blue-100 text-blue-800' :
									 'bg-red-100 text-red-800'}">
									{assignment.status}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
								{assignment.assignedTo}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
								{assignment.awal_halaman}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
								{assignment.akhir_halaman}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="text-center py-12">
			<p class="text-lg text-muted-foreground">
				{assignments.length === 0 ? 'Belum ada penugasan yang tersedia.' : 'Tidak ada penugasan yang sesuai dengan filter.'}
			</p>
		</div>
	{/if}
</section>