<script lang="ts">
  import RouteGuard from '$lib/RouteGuard.svelte';
  import { Tabs, TabItem } from 'flowbite-svelte';
  import { 
    BookSolid, 
    FileLinesSolid, 
    LayersSolid, 
    UserSolid, 
    BuildingSolid 
  } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';
  import { roles, canView, canCreate, resources } from '$lib/auth';
  
  let { children }: { children: Snippet } = $props();

  // Determine which tabs to show based on permissions
  const navItems = [
    {
      name: 'Buku',
      href: '/app/meja_kerja/buku',
      icon: BookSolid,
      resource: resources.BUKU,
      show: canView(resources.BUKU)
    },
    {
      name: 'Halaman',
      href: '/app/meja_kerja/halaman',
      icon: FileLinesSolid,
      resource: resources.HALAMAN,
      show: canView(resources.HALAMAN)
    },
    {
      name: 'Kategori',
      href: '/app/meja_kerja/kategori',
      icon: LayersSolid,
      resource: resources.KATEGORI,
      show: canView(resources.KATEGORI)
    },
    {
      name: 'Penulis',
      href: '/app/meja_kerja/penulis',
      icon: UserSolid,
      resource: resources.PENULIS,
      show: canView(resources.PENULIS)
    },
    {
      name: 'Penerbit',
      href: '/app/meja_kerja/penerbit',
      icon: BuildingSolid,
      resource: resources.PENERBIT,
      show: canView(resources.PENERBIT)
    }
  ].filter(item => item.show);
</script>

<RouteGuard allowedRoles={[roles.EDITOR, roles.PENERJEMAH]}>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        Meja Kerja
      </h1>
      <p class="text-gray-500 dark:text-gray-400">
        Kelola konten perpustakaan Anda
      </p>
    </div>

    <!-- Navigation Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav class="flex gap-4 overflow-x-auto">
        {#each navItems as item}
          <a
            href={item.href}
            class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              hover:text-primary-600 hover:border-primary-600
              dark:hover:text-primary-500 dark:hover:border-primary-500
              text-gray-500 border-transparent
              dark:text-gray-400"
          >
            <item.icon class="w-5 h-5" />
            {item.name}
          </a>
        {/each}
      </nav>
    </div>

    <!-- Content Area -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {@render children()}
    </div>
  </div>
</RouteGuard>