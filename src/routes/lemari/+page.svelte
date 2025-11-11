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
  }

  interface LemariRecord {
    id: string;
    halaman: number;
    buku: string;
    book?: Book; // Expanded book data
  }

  let lemariRecords = $state<LemariRecord[]>([]);
  let loading = $state(true);
  onMount(async () => {
    if (!pb.authStore.isValid) {
      goto('/login');
      return;
    }

    await fetchBookshelf();
    loading = false;
  });

  async function fetchBookshelf() {
    if (!pb.authStore.model) {
      goto('/login');
      return;
    }

    try {
      const records = await pb.collection('lemari_buku').getList(1, 50, {
        filter: `pengguna = "${pb.authStore.model.id}"`,
        sort: '-updated'
      });
      // Fetch associated book data for each lemari record
      const fetchPromises = records.items.map(async (record: any) => {
        const bookRecord = await pb.collection('buku').getOne(record.buku, {
          expand: 'penulis,penerbit,kategori'
        });

        return {
          id: record.id,
          halaman: record.halaman,
          buku: record.buku,
          book: {
            id: bookRecord.id,
            judul: bookRecord.judul,
            cover: bookRecord.cover
              ? pb.files.getURL(bookRecord, bookRecord.cover)
              : undefined,
            status: bookRecord.status,
            penulis: bookRecord.expand?.penulis?.map((p: any) => p.id) || [],
            penerbit: bookRecord.expand?.penerbit?.id || 'N/A',
            kategori: bookRecord.expand?.kategori?.map((k: any) => k.id) || []
          }
        };
      });
      lemariRecords = await Promise.all(fetchPromises);
    } catch (error) {
    }
  }

  async function removeFromBookshelf(lemariId: string) {
    try {
      await pb.collection('lemari_buku').delete(lemariId);
      // Refresh the bookshelf after removing
      await fetchBookshelf();
    } catch (error) {
    }
  }

  function goToHome() {
    goto('/');
  }

  function continueReading(lemariRecord: LemariRecord) {
    goto(`/buku/${lemariRecord.buku}/halaman`);
  }

  // Function to get the first few words of a category list
  function formatCategories(kategori: string[]): string {
    if (!kategori || kategori.length === 0) return '';
    if (kategori.length <= 2) return kategori.join(', ');
    return `${kategori.slice(0, 2).join(', ')}...`;
  }
</script>

<svelte:head>
  <title>Maragha - Lemari Buku Saya</title>
  <meta name="description" content="Kelola dan baca buku-buku di lemari buku digital Maragha" />
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <button
      onclick={goToHome}
      class="inline-flex items-center text-[var(--primary)] hover:text-[var(--accent)] mb-4 transition-colors"
    >
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Kembali ke Beranda
    </button>

    <h1 class="text-3xl font-heading font-bold text-[var(--foreground)]">Lemari Buku Saya</h1>
    <p class="text-[var(--muted-foreground)] mt-2">
      Daftar buku yang telah Anda baca atau sedang dibaca
    </p>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"
        ></div>
        <p class="text-[var(--muted-foreground)]">Memuat lemari buku...</p>
      </div>
    </div>
  {:else if lemariRecords.length === 0}
    <div class="text-center py-12">
      <div
        class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-paper-100)] mb-4"
      >
        <svg
          class="w-8 h-8 text-[var(--muted-foreground)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h2 class="text-xl font-semibold mb-2 text-[var(--foreground)]">
        Belum ada buku di lemari
      </h2>
      <p class="text-[var(--muted-foreground)] mb-6">
        Mulai membaca buku untuk menambahnya ke lemari buku Anda.
      </p>
      <button
        onclick={goToHome}
        class="px-4 py-2 bg-[var(--color-ribbon-600)] text-[var(--primary-foreground)] rounded-lg hover:bg-[var(--color-ribbon-700)] transition-colors"
      >
        Telusuri Buku
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {#each lemariRecords as record}
        <div
          class="bg-[var(--card)] rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
        >
          <div class="relative h-48 bg-[var(--color-paper-100)]">
            {#if record.book?.cover}
              <img
                src={record.book.cover}
                alt={record.book.judul}
                class="absolute w-full h-full object-cover"
              />
            {:else}
              <div class="flex items-center justify-center h-full bg-[var(--color-paper-100)]">
                <svg
                  class="w-16 h-16 text-[var(--muted-foreground)]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
                  />
                </svg>
              </div>
            {/if}
          </div>

          <div class="p-4">
            <h3 class="font-semibold text-lg text-[var(--muted-foreground)] truncate">
              {record.book?.judul}
            </h3>
            <div class="flex items-center justify-between mt-1 text-xs text-[var(--muted-foreground)]">
              <span>
                {record.book && record.book.penulis && record.book.penulis.length > 0
                  ? record.book.penulis.join(', ')
                  : 'Penulis tidak diketahui'}
              </span>
            </div>

            {#if record.book?.kategori && record.book.kategori.length > 0}
              <p class="mt-1 text-xs text-[var(--muted-foreground)] truncate">
                {formatCategories(record.book.kategori)}
              </p>
            {/if}

            <div class="mt-4 flex items-center justify-between">
              <div class="text-xs text-[var(--muted-foreground)]">
                <span class="inline-flex items-center">
                  <svg
                    class="w-3 h-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Halaman {record.halaman}
                </span>
              </div>
            </div>

            <div class="mt-4 flex space-x-2">
              <button
                onclick={() => continueReading(record)}
                class="flex-1 px-3 py-2 bg-[var(--color-ribbon-600)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--color-ribbon-700)] transition-colors text-sm font-medium text-center"
              >
                Lanjut Baca
              </button>

              <button
                onclick={() => removeFromBookshelf(record.id)}
                class="px-3 py-2 bg-[var(--color-paper-100)] text-[var(--color-paper-600)] rounded-md hover:bg-[var(--color-paper-200)] transition-colors text-sm font-medium"
                title="Hapus dari Lemari"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>