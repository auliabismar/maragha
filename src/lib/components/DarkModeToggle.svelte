<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';
	import MoonIcon from './MoonIcon.svelte';
	import SunIcon from './SunIcon.svelte';

	// Resolved theme for display (will be 'light' or 'dark', never 'system')
	let resolvedTheme = $derived($theme === 'system' 
		? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
		: $theme
	);
</script>

<button
	onclick={toggleTheme}
	class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors
		   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
		   disabled:pointer-events-none disabled:opacity-50
		   hover:bg-accent hover:text-accent-foreground
		   h-10 w-10 p-0"
	aria-label="Toggle theme"
	title={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
>
	{#if resolvedTheme === 'dark'}
		<SunIcon class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
		<span class="sr-only">Switch to light theme</span>
	{:else}
		<MoonIcon class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all" />
		<span class="sr-only">Switch to dark theme</span>
	{/if}
</button>