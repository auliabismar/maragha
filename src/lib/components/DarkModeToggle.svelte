<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/theme';
	import MoonIcon from './MoonIcon.svelte';
	import SunIcon from './SunIcon.svelte';
	import { Button } from '$lib/components/ui';
</script>

<Button on:click={toggleTheme} variant="ghost" size="icon">
	{#if $theme === 'dark'}
		<SunIcon class="h-[1.2rem] w-[1.2rem]" />
		<span class="sr-only">Switch to light theme</span>
	{:else}
		<MoonIcon class="h-[1.2rem] w-[1.2rem]" />
		<span class="sr-only">Switch to dark theme</span>
	{/if}
</Button>