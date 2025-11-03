<script lang="ts">
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';

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

  // --- State untuk Seleksi ---
  let selectedIds = $state<string[]>([]);
  let selectAll = $state(false);

  // --- Logika Turunan untuk Menampilkan Tombol ---
  // Tombol hanya muncul jika ada item yang dipilih DAN semua item yang dipilih berstatus 'Terlapor'
  const showBulkActions = $derived(() => {
    if (selectedIds.length === 0) return false;
    return selectedIds.every((id) => {
      const assignment = assignments.find((a) => a.id === id);
      return assignment?.status === 'Terlapor';
    });
  });

  // --- Sinkronisasi Checkbox "Select All" ---
  $effect(() => {
    if (filteredAssignments.length === 0) {
      selectAll = false;
      return;
    }
    // Jika jumlah terpilih = jumlah yang terlihat, centang "select all"
    if (selectedIds.length === filteredAssignments.length) {
      selectAll = true;
    } else {
      selectAll = false;
    }
  });

  // --- Fungsi untuk Checkbox "Select All" ---
  function toggleSelectAll() {
    selectAll = !selectAll;
    if (selectAll) {
      selectedIds = filteredAssignments.map((a) => a.id);
    } else {
      selectedIds = [];
    }
  }

  // --- Fungsi untuk Aksi Bulk ---
  async function handleBulkUpdate(newStatus: 'Disetujui' | 'Dibatalkan') {
    const promises = selectedIds.map((id) =>
      pb.collection('penugasan').update(id, { status: newStatus })
    );

    try {
      await Promise.all(promises);
      toast.success(`Berhasil memperbarui ${selectedIds.length} penugasan.`);
      // Reset seleksi
      selectedIds = [];
      selectAll = false;
      // Muat ulang data
      await fetchAssignments();
    } catch (error: any) {
      console.error('Error bulk updating:', error);
      toast.error('Gagal memperbarui penugasan.');
    }
  }

  onMount(() => {
    if (!pb.authStore.isValid) {
      goto('/login');
    } else {
      const user = pb.authStore.model;
      if (!user || (user.akses !== 'Editor' && user.akses !== 'Penerjemah')) {
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
      assignments = records.map((record) => ({
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
    filteredAssignments = assignments.filter((assignment) => {
      const matchesStatus =
        selectedStatus === 'all' || assignment.status === selectedStatus;
      const matchesSearch =
        assignment.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
    // Reset seleksi saat filter berubah
    selectedIds = [];
    selectAll = false;
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
  <h2 class="text-4xl font-heading font-bold text-[var(--foreground)] mb-4">
    Daftar Penugasan
  </h2>
  <p class="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
    Kelola dan lihat penugasan yang ada.
  </p>
</section>

<section class="mb-8">
  <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
    <div class="w-full md:w-1/2">
      <input
        type="text"
        placeholder="Cari penugasan atau deskripsi..."
        bind:value={searchQuery}
        oninput={filterAssignments}
        class="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)]"
      />
    </div>

    <div class="w-full md:w-auto">
      <select
        bind:value={selectedStatus}
        onchange={filterAssignments}
        class="w-full md:w-auto px-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent bg-[var(--background)] text-[var(--foreground)]"
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

{#if showBulkActions()}
  <section class="mb-4 flex items-center gap-4 p-4 bg-[var(--accent)] rounded-lg">
    <span class="text-sm text-[var(--accent-foreground)]"
      >{selectedIds.length} dipilih</span
    >
    <button
      onclick={() => handleBulkUpdate('Disetujui')}
      class="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
    >
      Setuju
    </button>
    <button
      onclick={() => handleBulkUpdate('Dibatalkan')}
      class="px-3 py-1 text-sm font-medium text-[var(--destructive-foreground)] bg-[var(--destructive)] rounded-md hover:bg-[var(--destructive)]/90 transition-colors"
    >
      Batal
    </button>
  </section>
{/if}

<section>
  {#if filteredAssignments.length > 0}
    <div class="overflow-x-auto bg-[var(--card)] rounded-lg shadow-md">
      <table class="min-w-full divide-y divide-[var(--border)]">
        <thead class="bg-[var(--muted)]">
          <tr>
            <th scope="col" class="px-6 py-3">
              <input
                type="checkbox"
                checked={selectAll}
                onchange={toggleSelectAll}
                class="rounded border-[var(--border)] bg-[var(--background)] text-[var(--primary)] focus:ring-[var(--ring)]"
              />
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
            >
              Judul
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
            >
              Deskripsi
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
            >
              Ditugaskan Kepada
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
            >
              Halaman Awal
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
            >
              Halaman Akhir
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--border)]">
          {#each filteredAssignments as assignment}
            <tr>
              <td class="px-6 py-4">
                <input
                  type="checkbox"
                  bind:group={selectedIds}
                  value={assignment.id}
                  class="rounded border-[var(--border)] bg-[var(--background)] text-[var(--primary)] focus:ring-[var(--ring)]"
                />
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--foreground)]"
              >
                {assignment.judul}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                {assignment.deskripsi}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  class="px-2 py-1 text-xs rounded-full {assignment.status ===
                  'Disetujui'
                    ? 'bg-green-100 text-green-800'
                    : assignment.status === 'Ditugaskan'
                      ? 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                      : assignment.status === 'Terlapor'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-[var(--destructive)] text-[var(--destructive-foreground)]'}"
                >
                  {assignment.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                {assignment.assignedTo}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                {assignment.awal_halaman}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted-foreground)]">
                {assignment.akhir_halaman}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-lg text-[var(--muted-foreground)]">
        {assignments.length === 0
          ? 'Belum ada penugasan yang tersedia.'
          : 'Tidak ada penugasan yang sesuai dengan filter.'}
      </p>
    </div>
  {/if}
</section>