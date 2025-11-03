<script lang="ts">
  import { onMount } from 'svelte';
  import pb from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  let user = $state<any>(null);
  let userRole = $state<string>('N/A');
  let error = $state<string | null>(null);
  let message = $state<string | null>(null);
  let loading = $state<boolean>(false);

  onMount(async () => {
    if (!pb.authStore.isValid) {
      goto('/login');
      return;
    }
    user = pb.authStore.model;
    userRole = user.akses;
  });
  async function requestPasswordReset() {
    loading = true;
    error = null;
    message = null;
    try {
      if (user?.email) {
        await pb.collection('users').requestPasswordReset(user.email);
        message = 'Link reset password telah dikirim ke email Anda.';
      } else {
        error = 'Email pengguna tidak ditemukan.';
      }
    } catch (err: any) {
      error = err.message || 'Terjadi kesalahan saat meminta reset password.';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Maragha - Profil</title>
  <meta name="description" content="Profil Pengguna Maragha" />
</svelte:head>

<div class="flex items-center justify-center min-h-screen">
  <div
    class="w-full max-w-md p-8 space-y-6 bg-[var(--card)] rounded-lg shadow-lg"
  >
    <h2 class="text-3xl font-heading font-bold text-center text-[var(--foreground)]">
      Profil Pengguna
    </h2>

    {#if user}
      <div class="space-y-4">
        <div>
          <h3 class="block text-sm font-medium text-[var(--muted-foreground)]">Nama</h3>
          <p class="mt-1 text-lg text-[var(--foreground)]">
            {user.name || 'Tidak Ada Nama'}
          </p>
        </div>
        <div>
          <h3 class="block text-sm font-medium text-[var(--muted-foreground)]">Email</h3>
          <p class="mt-1 text-lg text-[var(--foreground)]">{user.email}</p>
        </div>
        <div>
          <h3 class="block text-sm font-medium text-[var(--muted-foreground)]">Role</h3>
          <p class="mt-1 text-lg text-[var(--foreground)]">{userRole}</p>
        </div>

        {#if message}
          <p class="text-sm text-green-500">{message}</p>
        {/if}
        {#if error}
          <p class="text-sm text-red-500">{error}</p>
        {/if}
{JSON.stringify(user)}
        {#if user?.oauth2_id === ''}
          <button
            onclick={requestPasswordReset}
            disabled={loading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--primary-foreground)] bg-[var(--color-ribbon-600)] hover:bg-[var(--color-ribbon-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-ribbon-500)] disabled:opacity-50"
          >
            {#if loading}
              Memuat...
            {:else}
              Minta Reset Password
            {/if}
          </button>
        {/if}
      </div>
    {:else}
      <p class="text-center text-[var(--muted-foreground)]">Memuat profil...</p>
    {/if}
  </div>
</div>