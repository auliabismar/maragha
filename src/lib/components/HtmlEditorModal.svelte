<!-- src/lib/components/HtmlEditorModal.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	let { show = $bindable(false), htmlContent = $bindable('') }: { show: boolean; htmlContent: string } = $props();

	const dispatch = createEventDispatcher<{
		save: { html: string };
		close: void;
	}>();

	function saveHtml() {
		dispatch('save', { html: htmlContent });
		show = false;
	}

	function close() {
		show = false;
		dispatch('close');
	}
</script>

{#if show}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="bg-[var(--card)] rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
			<div class="flex justify-between items-center p-4 border-b border-[var(--border)]">
				<h2 class="text-lg font-semibold text-[var(--foreground)]">Edit HTML Source</h2>
				<button onclick={close} class="text-[var(--muted-foreground)] hover:text-[var(--foreground)]" aria-label="Close modal">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>
			<div class="flex-grow p-4 overflow-y-auto">
				<textarea
					bind:value={htmlContent}
					class="w-full h-full min-h-[500px] p-4 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] font-mono text-sm resize-none"
					placeholder="Enter HTML here..."
				></textarea>
			</div>
			<div class="flex justify-end p-4 border-t border-[var(--border)]">
				<button
					onclick={close}
					class="mr-2 px-4 py-2 text-sm font-medium rounded-md transition-colors bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80"
				>
					Cancel
				</button>
				<button
					onclick={saveHtml}
					class="px-4 py-2 text-sm font-medium rounded-md transition-colors bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
				>
					Save Changes
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* No specific styles needed here if TailwindCSS is configured correctly */
</style>