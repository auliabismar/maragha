<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { navigate } from 'sv-router/generated';
  import { onMount } from 'svelte';
  import { Alert } from 'flowbite-svelte';
  import { InfoCircleOutline } from 'flowbite-svelte-icons';
  import type { Snippet } from 'svelte';
  import { canAccess, getRoleDisplayName, type Resource, type Permission } from '$lib/auth';
  
  let { 
    children,
    resource,
    permission = 'view',
    redirectTo = '/app/meja_kerja',
    showError = true
  }: { 
    children: Snippet;
    resource: Resource;
    permission?: Permission;
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
    if (!$currentUser) {
      if (showError) {
        errorMessage = 'Anda harus login untuk mengakses resource ini.';
      } else {
        navigate('/auth/login');
      }
      isChecking = false;
      return;
    }

    const hasAccess = canAccess(resource, permission);

    if (!hasAccess) {
      if (showError) {
        const permissionText = {
          view: 'melihat',
          create: 'membuat',
          edit: 'mengedit',
          delete: 'menghapus'
        }[permission];

        errorMessage = `Akses ditolak. Role "${getRoleDisplayName($currentUser.role)}" tidak memiliki izin untuk ${permissionText} ${resource}.`;
      } else {
        navigate(redirectTo);
      }
      isChecking = false;
      return;
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
  <div class="flex justify-center items-center min-h-[400px]">
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
      <a href={redirectTo} class="text-primary-600 hover:underline dark:text-primary-500">
        ← Kembali
      </a>
    </div>
  </div>
{:else if isAuthorized}
  {@render children()}
{/if}