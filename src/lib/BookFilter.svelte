<script>
  import { Input, Button, Label } from 'flowbite-svelte';
  import { SearchOutline, CloseOutline } from 'flowbite-svelte-icons';
  import { pb } from '$lib/pocketbase';

  // This component takes a callback function to apply the filters
  let { onApply } = $props();

  let judul = $state('');
  let penulis = $state('');

  function applyFilters() {
    const filters = [];

    // Add title filter
    if (judul) {
      filters.push(`judul~"${judul}"`);
    }

    // Add author filter
    if (penulis) {
      filters.push(`penulis~"${penulis}"`);
    }

    // Join all filters with '&&' (AND)
    onApply(filters.join(' && '));
  }

  function clearFilters() {
    judul = '';
    penulis = '';
    onApply(''); // Requery with empty filters
  }
</script>

<div class="flex flex-col md:flex-row gap-4 p-4 bg-primary-50 dark:bg-primary-900 dark:bg-gray-800 rounded-lg">
  <!-- Judul (Title) Input -->
  <div class="flex-1">
    <Label for="judul" class="mb-2">Judul Buku</Label>
    <Input
      id="judul"
      type="text"
      placeholder="Rawai' Al Awqaf..."
      bind:value={judul}
    >
      <SearchOutline
        slot="left"
        class="w-5 h-5 text-gray-500 dark:text-gray-400"
      />
    </Input>
  </div>

  <!-- Penulis (Author) Input -->
  <div class="flex-1">
    <Label for="penulis" class="mb-2">Penulis</Label>
    <Input
      id="penulis"
      type="text"
      placeholder="Raghib As Sirjani..."
      bind:value={penulis}
    >
      <SearchOutline
        slot="left"
        class="w-5 h-5 text-gray-500 dark:text-gray-400"
      />
    </Input>
  </div>

  <!-- Apply Button -->
  <div class="flex-none self-end flex gap-2">
    <Button onclick={applyFilters}>
      <SearchOutline class="w-5 h-5 mr-2" />
      Apply
    </Button>
    <Button onclick={clearFilters}>
      <CloseOutline class="w-5 h-5 mr-2" />
      Clear
    </Button>
  </div>
</div>