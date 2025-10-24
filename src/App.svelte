<script lang="ts">
  import { Router } from 'sv-router';
  import 'sv-router/generated';
  import { onMount } from 'svelte';
  import { pb } from '$lib/pocketbase';

  let isLoading = true;

  onMount(async () => {
    if (pb.authStore.token) {
      try {
        await pb.collection('users').authRefresh();
      } catch (_) {
        pb.authStore.clear();
      }
    }
    isLoading = false;
  });
</script>

{#if isLoading}
  <div>Loading...</div>
{:else}
  <Router />
{/if}