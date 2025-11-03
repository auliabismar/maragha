<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import pb from '$lib/pocketbase';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Toaster } from 'svelte-sonner';
  import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
  import { theme } from '$lib/stores/theme'; // Import theme to initialize it

  let { children } = $props();
  let user = $state<any | null>(null);
  let avatarUrl = $state<string | null>(null);
  let userInitials = $state<string | null>(null);
  let isMobileMenuOpen = $state(false);

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
          class="md:hidden p-2 rounded-md hover:bg-[var(--color-ribbon-500)] hover:text-[var(--primary-foreground)] transition-colors"
          onclick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
          aria-expanded={isMobileMenuOpen}
        >
          {#if isMobileMenuOpen}
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          {:else}
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <a href="/" class="hover:text-[var(--accent)] transition-colors">Beranda</a>
          {#if user}
            <a href="/lemari" class="hover:text-[var(--accent)] transition-colors"
              >Lemari Buku</a
            >
          {/if}
          {#if user && (user.akses === 'Editor' || user.akses === 'Penerjemah')}
            <a href="/penugasan" class="hover:text-[var(--accent)] transition-colors"
              >Penugasan</a
            >
          {/if}
          <DarkModeToggle />
          {#if user}
            <button
              onclick={goToProfile}
              class="flex items-center space-x-2 hover:text-[var(--accent)] transition-colors"
            >
              {#if avatarUrl}
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  class="w-8 h-8 rounded-full object-cover"
                />
              {:else if userInitials}
                <div
                  class="w-8 h-8 rounded-full bg-[var(--color-ribbon-500)] flex items-center justify-center text-[var(--primary-foreground)] font-bold"
                >
                  {userInitials}
                </div>
              {/if}
            </button>
            <button
              onclick={handleLogout}
              class="hover:text-[var(--accent)] transition-colors"
              >Keluar</button
            >
          {:else}
            <a href="/login" class="hover:text-[var(--accent)] transition-colors">Masuk</a>
          {/if}
        </nav>
      </div>

      {#if isMobileMenuOpen}
        <nav
          class="md:hidden mt-4 pt-4 border-t border-[var(--primary-foreground)]/20"
        >
          <div class="flex flex-col space-y-4">
            <a
              href="/"
              class="hover:text-[var(--accent)] transition-colors px-2 py-1"
              onclick={closeMobileMenu}>Beranda</a
            >
            {#if user}
              <a
                href="/lemari"
                class="hover:text-[var(--accent)] transition-colors px-2 py-1"
                onclick={closeMobileMenu}>Lemari Buku</a
              >
            {/if}
            {#if user && (user.akses === 'Editor' || user.akses === 'Penerjemah')}
              <a
                href="/penugasan"
                class="hover:text-[var(--accent)] transition-colors px-2 py-1"
                onclick={closeMobileMenu}>Penugasan</a
              >
            {/if}
            <div class="flex items-center justify-between pt-2">
              <DarkModeToggle />
              {#if user}
                <div class="flex items-center space-x-3">
                  <button
                    onclick={goToProfile}
                    class="flex items-center space-x-2 hover:text-[var(--accent)] transition-colors"
                  >
                    {#if avatarUrl}
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        class="w-8 h-8 rounded-full object-cover"
                      />
                    {:else if userInitials}
                      <div
                        class="w-8 h-8 rounded-full bg-[var(--color-ribbon-500)] flex items-center justify-center text-[var(--primary-foreground)] font-bold"
                      >
                        {userInitials}
                      </div>
                    {/if}
                  </button>
                  <button
                    onclick={handleLogout}
                    class="hover:text-[var(--accent)] transition-colors"
                    >Keluar</button
                  >
                </div>
              {:else}
                <a href="/login" class="hover:text-[var(--accent)] transition-colors"
                  >Masuk</a
                >
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
        &copy; 2025 Maragha. Made with ❤️ by <a href="https://almagazi.id">al-Magazi</a>.
      </p>
    </div>
  </footer>
</div>