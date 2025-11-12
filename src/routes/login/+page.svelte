<script lang="ts">
  import { goto } from '$app/navigation';
  import pb from '$lib/pocketbase';
  import GoogleLoginButton from '$lib/components/GoogleLoginButton.svelte';
  import GithubLoginButton from '$lib/components/GithubLoginButton.svelte';

  let email = $state<string>('');
  let password = $state<string>('');
  let error = $state<string | null>(null);
  let loading = $state<boolean>(false);

  async function handleLogin() {
  	loading = true;
  	error = null;
  	try {
  		const authData = await pb.collection('users').authWithPassword(email, password);

  		// Set cookie on the client after successful login
  		const authCookie = pb.authStore.exportToCookie();
  		document.cookie = `pb_auth=${encodeURIComponent(authCookie)}; path=/; max-age=86400; SameSite=Lax; Secure`;

  		// Force full page reload to ensure server-side auth works
  		window.location.href = '/';
  	} catch (err: any) {
  		error = err.message || 'An unknown error occurred during login.';
  	} finally {
  		loading = false;
  	}
  }
</script>

<svelte:head>
  <title>Maragha - Masuk</title>
  <meta name="description" content="Masuk ke akun Maragha Anda" />
</svelte:head>

<div class="flex items-center justify-center min-h-screen">
  <div
    class="w-full max-w-md p-8 space-y-6 bg-[var(--color-paper-50)] rounded-lg shadow-lg"
  >
    <div class="flex justify-center">
      <img src="/logo.svg" alt="Maragha Logo" class="h-16 w-16" />
    </div>
    <div class="space-y-4">
      <GoogleLoginButton />
      <GithubLoginButton />
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-[var(--muted)]"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="bg-[var(--color-paper-50)] px-2 text-[var(--color-paper-600)]"
            >atau</span
          >
        </div>
      </div>
    </div>
    <h2 class="text-3xl font-heading font-bold text-center text-[var(--muted-foreground)]">
      Masuk
    </h2>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
      class="space-y-4"
    >
      <div>
        <label
          for="email"
          class="block text-sm font-medium text-[var(--muted-foreground)]">Email</label
        >
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          class="mt-1 block w-full px-3 py-2 border border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
        />
      </div>
      <div>
        <label
          for="password"
          class="block text-sm font-medium text-[var(--muted-foreground)]"
          >Password</label
        >
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          class="mt-1 block w-full px-3 py-2 border border-[var(--border)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
        />
      </div>

      {#if error}
        <p class="text-sm text-red-500">{error}</p>
      {/if}

      <button
        type="submit"
        disabled={loading}
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-ribbon-600)] hover:bg-[var(--color-ribbon-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-ribbon-500)] disabled:opacity-50"
      >
        {#if loading}
          Memuat...
        {:else}
          Masuk
        {/if}
      </button>
    </form>
    <p class="text-center text-sm text-[var(--muted-foreground)]">
      Belum punya akun?
      <a
        href="/register"
        class="font-medium text-[var(--primary)] hover:text-[var(--accent)]">Daftar</a
      >
    </p>
  </div>
</div>