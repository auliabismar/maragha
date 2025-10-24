<script lang="ts">
  import Header from '$lib/Header.svelte';
  import Hero from '$lib/Hero.svelte';
  import Footer from '$lib/Footer.svelte';
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>
<Header />
<Hero />

<div class="wrapper">
	{@render children()}
</div>

<Footer />
