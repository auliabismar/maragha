<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	import type { Snippet } from 'svelte';

	type Props = HTMLAttributes<HTMLDivElement> & {
		children?: Snippet;
	};

	let { class: className, children = undefined, ...rest }: Props = $props();
</script>

<div class={cn('text-sm [&_p]:leading-relaxed', className)} {...rest}>
	{@render children?.()}
</div>