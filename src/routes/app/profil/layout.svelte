<script lang="ts">
  import RouteGuard from '$lib/RouteGuard.svelte';
  import type { Snippet } from 'svelte';
  
  let { children }: { children: Snippet } = $props();
</script>

<RouteGuard requireAuth={true}>
  {@render children()}
</RouteGuard>