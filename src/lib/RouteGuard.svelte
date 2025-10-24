<!-- src/lib/RouteGuard.svelte -->
<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { navigate } from 'sv-router/generated';
  import { onMount } from 'svelte';
  import { Alert } from 'flowbite-svelte';
  import { InfoCircleOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';
  import type { Role } from '$lib/auth';
  
  let { 
    children,
    allowedRoles = [],
    requireAuth = true,
    redirectTo = '/auth/login',
    showError = true
  }: { 
    children: Snippet;
    allowedRoles?: Role[];
    requireAuth?: boolean;
    redirectTo?: string;
    showError?: boolean;
  } = $props();

  let isAuthorized = $state(false);
  let isChecking = $state(true);
  let errorMessage = $state('');

  onMount(() => {
    checkAuthorization();
  });

  function checkAuthorization() {
    // Check if authentication is required
    if (!$currentUser && requireAuth) {
      if (showError) {
        errorMessage = 'Anda harus login untuk mengakses halaman ini.';
      } else {
        navigate(redirectTo);
      }
      isChecking = false;
      return;
    }

    // Check role-based access
    if (allowedRoles.length > 0) {
      if (!$currentUser) {
        if (showError) {
          errorMessage = 'Anda harus login untuk mengakses halaman ini.';
        } else {
          navigate(redirectTo);
        }
        isChecking = false;
        return;
      }

      if (!allowedRoles.includes($currentUser.role)) {
        if (showError) {
          errorMessage = `Akses ditolak. Halaman ini hanya dapat diakses oleh: ${allowedRoles.join(', ')}.`;
        } else {
          navigate('/app');
        }
        isChecking = false;
        return;
      }
    }

    isAuthorized = true;
    isChecking = false;
  }

  // Re-check when user changes
  $effect(() => {
    if ($currentUser !== undefined) {
      checkAuthorization();
    }
  });
</script>

{#if isChecking}
  <div class="flex justify-center items-center h-screen">
    <div class="text-lg text-gray-500 dark:text-gray-400">
      Memuat...
    </div>
  </div>
{:else if !isAuthorized && errorMessage}
  <div class="container mx-auto px-4 py-8">
    <Alert color="red" border>
      <InfoCircleOutline slot="icon" class="w-5 h-5" />
      <span class="font-medium">Akses Ditolak!</span> {errorMessage}
    </Alert>
    <div class="mt-4">
      <a href="/app" class="text-primary-600 hover:underline dark:text-primary-500">
        ← Kembali ke Beranda
      </a>
    </div>
  </div>
{:else if isAuthorized}
  {@render children()}
{/if}