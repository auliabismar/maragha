<script lang="ts">
  import Header from '$lib/Header.svelte';
  import Footer from '$lib/Footer.svelte';
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>
<Header />

<div class="wrapper bg-secondary-50 dark:bg-secondary-900">
	{@render children()}
</div>

<Footer />
