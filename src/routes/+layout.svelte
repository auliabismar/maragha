<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import pb from '$lib/pocketbase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Toaster } from 'svelte-sonner';
  import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
  import { theme } from '$lib/stores/theme'; // Import theme to initialize it
  import SEO from '$lib/components/SEO.svelte';

  let { children } = $props();
  let user = $state<any | null>(null);
  let avatarUrl = $state<string | null>(null);
  let userInitials = $state<string | null>(null);
  let isMobileMenuOpen = $state(false);

  // Helper function to check if a route is active
  function isActiveRoute(route: string): boolean {
    const currentPath = $page.url.pathname;
    if (route === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(route);
  }

  onMount(() => {
    updateUser();
    pb.authStore.onChange(updateUser);
  });

  function updateUser() {
    if (pb.authStore.isValid) {
      user = pb.authStore.model;
      if (user?.avatar) {
        avatarUrl = pb.files.getUrl(user, user.avatar);
      } else {
        avatarUrl = null;
        const name = user?.name || user?.email;
        if (name) {
          userInitials = name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
        } else {
          userInitials = null;
        }
      }
    } else {
      user = null;
      avatarUrl = null;
      userInitials = null;
    }
  }

  async function handleLogout() {
    pb.authStore.clear();
    goto('/login');
  }

  function goToProfile() {
    if (user) {
      goto('/profile');
    }
  }

  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }

  function closeMobileMenu() {
    isMobileMenuOpen = false;
  }
</script>

<svelte:head>
  <link rel="icon" href="/logo.svg" />
</svelte:head>

<div class="min-h-screen" style="background-color: var(--background)">
  <SEO />
  <header
    class="bg-[var(--color-ribbon-600)] text-[var(--primary-foreground)] shadow-lg"
  >
    <div class="container mx-auto px-4 sm:px-6 py-4">
      <div class="flex items-center justify-between">
        <a href="/" class="flex items-center space-x-2">
          <img src="/logo.svg" alt="Maragha Logo" class="h-8 w-8" />
          <h1 class="text-2xl sm:text-3xl font-heading font-bold">Maragha</h1>
        </a>

        <button
          class="md:hidden p-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:bg-[var(--color-ribbon-500)] hover:text-[var(--primary-foreground)]"
          onclick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          {#if isMobileMenuOpen}
            <svg
              class="w-6 h-6 transition-transform duration-300 ease-in-out"
              class:rotate-90={isMobileMenuOpen}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          {:else}
            <svg
              class="w-6 h-6 transition-transform duration-300 ease-in-out"
              class:rotate-0={!isMobileMenuOpen}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          {/if}
        </button>

        <nav class="hidden md:flex space-x-6 items-center">
          <a
            href="/"
            class="relative px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg group"
            class:!text-[var(--accent)]={isActiveRoute('/')}
            class:text-[var(--primary-foreground)]={!isActiveRoute('/')}
          >
            <span class="relative z-10">Beranda</span>
            {#if isActiveRoute('/')}
              <div class="absolute inset-0 bg-[var(--color-ribbon-400)] rounded-md opacity-20 transition-all duration-300"></div>
            {:else}
              <div class="absolute inset-0 bg-[var(--accent)] rounded-md opacity-0 group-hover:opacity-10 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>
            {/if}
          </a>
          {#if user}
            <a
              href="/lemari"
              class="relative px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg group"
              class:!text-[var(--accent)]={isActiveRoute('/lemari')}
              class:text-[var(--primary-foreground)]={!isActiveRoute('/lemari')}
            >
              <span class="relative z-10">Lemari Buku</span>
              {#if isActiveRoute('/lemari')}
                <div class="absolute inset-0 bg-[var(--color-ribbon-400)] rounded-md opacity-20 transition-all duration-300"></div>
              {:else}
                <div class="absolute inset-0 bg-[var(--accent)] rounded-md opacity-0 group-hover:opacity-10 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>
              {/if}
            </a>
          {/if}
          {#if user && (user.akses === 'Editor' || user.akses === 'Penerjemah')}
            <a
              href="/penugasan"
              class="relative px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg group"
              class:!text-[var(--accent)]={isActiveRoute('/penugasan')}
              class:text-[var(--primary-foreground)]={!isActiveRoute('/penugasan')}
            >
              <span class="relative z-10">Penugasan</span>
              {#if isActiveRoute('/penugasan')}
                <div class="absolute inset-0 bg-[var(--color-ribbon-400)] rounded-md opacity-20 transition-all duration-300"></div>
              {:else}
                <div class="absolute inset-0 bg-[var(--accent)] rounded-md opacity-0 group-hover:opacity-10 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>
              {/if}
            </a>
          {/if}
          <DarkModeToggle />
          {#if user}
            <button
              onclick={goToProfile}
              class="flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:!text-[var(--accent)]"
              class:!text-[var(--accent)]={isActiveRoute('/profile')}
            >
              {#if avatarUrl}
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  class="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-[var(--accent)] transition-all duration-300"
                />
              {:else if userInitials}
                <div
                  class="w-8 h-8 rounded-full bg-[var(--color-ribbon-500)] flex items-center justify-center text-[var(--primary-foreground)] font-bold ring-2 ring-transparent hover:ring-[var(--accent)] transition-all duration-300"
                >
                  {userInitials}
                </div>
              {/if}
            </button>
            <button
              onclick={handleLogout}
              class="px-3 py-2 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:!text-[var(--accent)]"
            >
              Keluar
            </button>
          {:else}
            <a href="/login" class="hover:text-[var(--accent)] transition-colors">Masuk</a>
          {/if}
        </nav>
      </div>

      {#if isMobileMenuOpen}
        <nav
          class="md:hidden mt-4 pt-4 border-t border-[var(--primary-foreground)]/20 transition-all duration-500 ease-in-out"
          class:opacity-100={isMobileMenuOpen}
          class:opacity-0={!isMobileMenuOpen}
          class:translate-y-0={isMobileMenuOpen}
          class:-translate-y-2={!isMobileMenuOpen}
        >
          <div class="flex flex-col space-y-3">
            <a
              href="/"
              class="relative px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg group"
              class:!text-[var(--accent)]={isActiveRoute('/')}
              class:bg-[var(--color-ribbon-400)]={isActiveRoute('/')}
              class:bg-opacity-20={isActiveRoute('/')}
              class:text-[var(--primary-foreground)]={!isActiveRoute('/')}
              onclick={closeMobileMenu}
            >
              <span class="relative z-10">Beranda</span>
              {#if !isActiveRoute('/')}
                <div class="absolute inset-0 bg-[var(--accent)] rounded-lg opacity-0 group-hover:opacity-10 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>
              {/if}
            </a>
            {#if user}
              <a
                href="/lemari"
                class="relative px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg group"
                class:!text-[var(--accent)]={isActiveRoute('/lemari')}
                class:bg-[var(--color-ribbon-400)]={isActiveRoute('/lemari')}
                class:bg-opacity-20={isActiveRoute('/lemari')}
                class:text-[var(--primary-foreground)]={!isActiveRoute('/lemari')}
                onclick={closeMobileMenu}
              >
                <span class="relative z-10">Lemari Buku</span>
                {#if !isActiveRoute('/lemari')}
                  <div class="absolute inset-0 bg-[var(--accent)] rounded-lg opacity-0 group-hover:opacity-10 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>
                {/if}
              </a>
            {/if}
            {#if user && (user.akses === 'Editor' || user.akses === 'Penerjemah')}
              <a
                href="/penugasan"
                class="relative px-4 py-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg group"
                class:!text-[var(--accent)]={isActiveRoute('/penugasan')}
                class:bg-[var(--color-ribbon-400)]={isActiveRoute('/penugasan')}
                class:bg-opacity-20={isActiveRoute('/penugasan')}
                class:text-[var(--primary-foreground)]={!isActiveRoute('/penugasan')}
                onclick={closeMobileMenu}
              >
                <span class="relative z-10">Penugasan</span>
                {#if !isActiveRoute('/penugasan')}
                  <div class="absolute inset-0 bg-[var(--accent)] rounded-lg opacity-0 group-hover:opacity-10 transition-all duration-300 transform scale-95 group-hover:scale-100"></div>
                {/if}
              </a>
            {/if}
            <div class="flex items-center justify-between pt-4 border-t border-[var(--primary-foreground)]/20">
              <DarkModeToggle />
              {#if user}
                <div class="flex items-center space-x-3">
                  <button
                    onclick={goToProfile}
                    class="flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:!text-[var(--accent)]"
                    class:!text-[var(--accent)]={isActiveRoute('/profile')}
                  >
                    {#if avatarUrl}
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        class="w-8 h-8 rounded-full object-cover ring-2 ring-transparent hover:ring-[var(--accent)] transition-all duration-300"
                      />
                    {:else if userInitials}
                      <div
                        class="w-8 h-8 rounded-full bg-[var(--color-ribbon-500)] flex items-center justify-center text-[var(--primary-foreground)] font-bold ring-2 ring-transparent hover:ring-[var(--accent)] transition-all duration-300"
                      >
                        {userInitials}
                      </div>
                    {/if}
                  </button>
                  <button
                    onclick={handleLogout}
                    class="px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:!text-[var(--accent)]"
                  >
                    Keluar
                  </button>
                </div>
              {:else}
                <a
                  href="/login"
                  class="px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:!text-[var(--accent)]"
                  class:!text-[var(--accent)]={isActiveRoute('/login')}
                  onclick={closeMobileMenu}
                >
                  Masuk
                </a>
              {/if}
            </div>
          </div>
        </nav>
      {/if}
    </div>
  </header>

  <main class="container mx-auto px-6 py-8">
    {@render children?.()}
  </main>
  <Toaster />

  <footer
    class="bg-[var(--color-ribbon-600)] text-[var(--primary-foreground)] py-8 mt-16"
  >
    <div class="container mx-auto px-6 text-center">
      <p>
        &copy; 2025 Maragha. Made with <a href="/tentang">❤️</a> by <a href="https://almagazi.id">al-Magazi</a>.
      </p>
    </div>
  </footer>
</div>