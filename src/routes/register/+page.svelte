<script lang="ts">
  import { goto } from '$app/navigation';
  import pb from '$lib/pocketbase';
  import GoogleLoginButton from '$lib/components/GoogleLoginButton.svelte';

  let email = $state<string>('');
  let password = $state<string>('');
  let passwordConfirm = $state<string>('');
  let error = $state<string | null>(null);
  let loading = $state<boolean>(false);
  async function handleRegister() {
    loading = true;
    error = null;
    try {
      if (password !== passwordConfirm) {
        throw new Error('Password dan Konfirmasi Password tidak sesuai.');
      } else if (password.length < 8) {
        throw new Error('Password terlalu pendek. Harap gunakan minimal 8 karakter.');
      }

      await pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        akses: 'Pembaca'
      });

      // Optionally, log in the user immediately after registration
      await pb.collection('users').authWithPassword(email, password);
      // Redirect to dashboard or home page on successful registration and login
      goto('/');
    } catch (err: any) {
      let errorMessage = '';
      console.log(err);
      if (err?.data?.data?.email?.message && err?.data?.data?.email?.message.includes('Value must be unique.')) {
        errorMessage = 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.';
      } else if (err?.data?.data?.password?.message && err?.data?.data?.password?.message.includes('must be at least')) {
        errorMessage = 'Password terlalu pendek. Harap gunakan minimal 8 karakter.';
      } else if (err?.data?.data?.password?.message && err?.data?.data?.password?.message.includes('do not match')) {
        errorMessage = 'Password dan Konfirmasi Password tidak sesuai.';
      } else {
        errorMessage = err?.message;// || err?.data?.data?.password?.message || err?.data?.data?.email?.message || err?.message || 'An unknown error occurred during registration.';
      }
      error = errorMessage || 'An unknown error occurred during registration.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Maragha - Daftar</title>
  <meta name="description" content="Daftar akun baru di Maragha" />
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
      Daftar
    </h2>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleRegister();
      }}
      class="space-y-4"
    >
      <div>
        <label for="email" class="block text-sm font-medium text-[var(--muted-foreground)]"
          >Email</label
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
      <div>
        <label
          for="passwordConfirm"
          class="block text-sm font-medium text-[var(--muted-foreground)]"
          >Konfirmasi Password</label
        >
        <input
          type="password"
          id="passwordConfirm"
          bind:value={passwordConfirm}
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
          Daftar
        {/if}
      </button>
    </form>
    <p class="text-center text-sm text-[var(--muted-foreground)]">
      Sudah punya akun?
      <a href="/login" class="font-medium text-[var(--primary)] hover:text-[var(--accent)]"
        >Masuk</a
      >
    </p>
  </div>
</div>