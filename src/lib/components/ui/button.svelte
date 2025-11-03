<script lang="ts">
	import { cn } from '$lib/utils';
	import { cva, type VariantProps } from 'class-variance-authority';

	const buttonVariants = cva(
		'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
			'ring-offset-background transition-colors focus-visible:outline-none ' +
			'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
			'disabled:pointer-events-none disabled:opacity-50',
		{
			variants: {
				variant: {
					default: 'bg-ribbon-600 text-white hover:bg-ribbon-700',
					destructive: 'bg-ribbon-800 text-white hover:bg-ribbon-900',
					outline: 'border border-paper-300 bg-paper-50 hover:bg-paper-100 hover:text-ribbon-800',
					secondary: 'bg-paper-100 text-paper-800 hover:bg-paper-200',
					ghost: 'hover:bg-paper-100 hover:text-ribbon-700',
					link: 'text-ribbon-600 underline-offset-4 hover:underline'
				},
				size: {
					default: 'h-10 px-4 py-2',
					sm: 'h-9 rounded-md px-3',
					lg: 'h-11 rounded-md px-8',
					icon: 'h-10 w-10'
				}
			},
			defaultVariants: {
				variant: 'default',
				size: 'default'
			}
		}
	);

	type ButtonProps = VariantProps<typeof buttonVariants> & {
		class?: string;
		href?: string;
		children?: () => any;
		[key: string]: any; // Allow arbitrary props, including on:click
	};

	let {
		variant,
		size,
		class: className,
		href,
		children,
		...rest
	}: ButtonProps = $props();
</script>

{#if href}
	<a href={href} class={cn(buttonVariants({ variant, size }), className)} {...rest}>
		{@render children?.()}
	</a>
{:else}
	<button class={cn(buttonVariants({ variant, size }), className)} {...rest}>
		{@render children?.()}
	</button>
{/if}