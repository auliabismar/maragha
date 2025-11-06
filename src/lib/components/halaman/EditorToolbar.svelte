<script lang="ts">
	import {
		isEditorMode,
		toggleEditMode
	} from '$lib/stores/editorStore';
	import type RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let isEditorModeValue = $derived($isEditorMode);

	let { editor }: { editor: RichTextEditor } = $props();
</script>

<div class="bg-[var(--card)] rounded-lg p-4 border border-[var(--border)]">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-semibold text-[var(--foreground)] mb-1">Mode Editor</h3>
			<p class="text-sm text-[var(--muted-foreground)]">
				{isEditorModeValue
					? ' Anda dapat mengedit terjemahan dan tulisan asli halaman.'
					: 'Aktifkan mode edit untuk mengedit konten halaman.'}
			</p>
		</div>
		<div class="flex items-center space-x-2">
			<button
				class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--secondary)]/90"
				onclick={() => editor.showHtmlEditor()}
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
				</svg>
				Source Code
			</button>
			<button
				onclick={toggleEditMode}
				class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors {
					isEditorModeValue
						? 'bg-red-100 text-red-700 hover:bg-red-200'
						: 'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90'
				}"
			>
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if isEditorModeValue}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					{/if}
				</svg>
				{isEditorModeValue ? 'Keluar Edit' : 'Masuk Edit'}
			</button>
		</div>
	</div>

	{#if isEditorModeValue}
		<div class="mt-4 p-3 bg-[var(--muted)] rounded-md">
			<div class="flex items-center text-sm text-[var(--muted-foreground)]">
				<svg class="w-4 h-4 mr-2 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<strong>Tips:</strong> Edit akan tersimpan secara otomatis saat Anda mengklik tombol "Simpan Perubahan".
			</div>
		</div>
	{/if}
</div>