<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	type Variant = 'default' | 'destructive';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: Variant;
		children?: Snippet;
	}

	let { variant = 'default', class: className, children, ...rest }: Props = $props();

	const variantClasses = {
		default: 'bg-background text-foreground',
		destructive: 'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive'
	};
</script>

<div
	role="alert"
	class={cn(
		'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
		variantClasses[variant],
		className
	)}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>