<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';
	import HtmlEditorModal from './HtmlEditorModal.svelte';

	interface Props {
		value?: string;
		placeholder?: string;
		readonly?: boolean;
	}

	let { value = $bindable(''), placeholder = 'Mulai mengetik...', readonly = false }: Props = $props();

	const dispatch = createEventDispatcher<{
		change: { value: string };
		focus: void;
		blur: void;
	}>();

	let editorContainer: HTMLDivElement;
	let quill: any;
	let editorElement: HTMLElement; // This variable is no longer needed as quill.root will be used directly

	// State for HTML editor modal
	let showHtmlModal = $state(false);
	let htmlModalContent = $state('');

	// Toolbar configuration
	const toolbarOptions = [
		[{ header: [1, 2, 3, false] }],
		['bold', 'italic', 'underline', 'strike'],
		[{ list: 'ordered' }, { list: 'bullet' }],
		[{ script: 'sub' }, { script: 'super' }],
		[{ indent: '-1' }, { indent: '+1' }],
		[{ direction: 'rtl' }],
		[{ color: [] }, { background: [] }],
		[{ align: [] }],
		['link', 'image', 'blockquote', 'code-block'],
		['clean']
	];

	onMount(async () => {
		if (browser) {
			const { default: Quill } = await import('quill');
			import('quill/dist/quill.snow.css');

			// Initialize Quill editor
			quill = new Quill(editorContainer, {
				modules: {
					toolbar: toolbarOptions
				},
				theme: 'snow',
				placeholder: placeholder,
				readOnly: readonly
			});

			// Set initial content
			if (value && value !== '<p><br></p>') {
				quill.clipboard.dangerouslyPasteHTML(value);
			}

			// Event listeners
			quill.on('text-change', () => {
				const html = quill.root.innerHTML || ''; // Directly use quill.root
				value = html === '<p><br></p>' ? '' : html;
				dispatch('change', { value });
			});

			quill.on('selection-change', (range: any) => {
				if (range) {
					dispatch('focus');
				} else {
					dispatch('blur');
				}
			});
		}
	});

	onDestroy(() => {
		// Cleanup Quill instance
		if (quill) {
			quill = null as any;
		}
	});

	// Watch for external value changes
	$effect(() => {
		if (browser) {
			if (quill) { // Check only for quill
				const currentContent = quill.root.innerHTML || ''; // Directly use quill.root
				const newValue = value || '';
				
				// Only update if content is different
				if (currentContent !== newValue && newValue !== '<p><br></p>') {
					const selection = quill.getSelection();
					quill.clipboard.dangerouslyPasteHTML(newValue);
					if (selection) {
						quill.setSelection(selection);
					}
				}
			}
		}
	});

	// Focus the editor
	export function focus() {
		if (quill) {
			quill.focus();
		}
	}

	// Get editor content
	export function getContent(): string {
		return quill?.root.innerHTML || ''; // Directly use quill.root
	}

	// Set editor content
	export function setContent(html: string) {
		if (quill) {
			quill.clipboard.dangerouslyPasteHTML(html);
		}
	}

	// Function to show the HTML editor modal
	export function showHtmlEditor() {
		if (quill) {
			htmlModalContent = quill.root.innerHTML;
			console.log('showHtmlEditor called');
			showHtmlModal = true;
		}
	}

	// Handler for when HTML is saved from the modal
	function handleHtmlSave(event: CustomEvent<{ html: string }>) {
		if (quill) {
			quill.clipboard.dangerouslyPasteHTML(event.detail.html);
			value = event.detail.html; // Update the bindable value
			dispatch('change', { value });
		}
	}
</script>

<div class="rich-text-editor">
	<div bind:this={editorContainer} class="min-h-[400px]"></div>
</div>

<style>
	.rich-text-editor :global(.ql-editor) {
		min-height: 400px;
		font-size: 14px;
		line-height: 1.6;
		color: var(--foreground);
	}

	.rich-text-editor :global(.ql-toolbar) {
		border-top: 1px solid var(--border);
		border-left: 1px solid var(--border);
		border-right: 1px solid var(--border);
		border-bottom: none;
		background-color: var(--card);
	}

	.rich-text-editor :global(.ql-container) {
		border-bottom: 1px solid var(--border);
		border-left: 1px solid var(--border);
		border-right: 1px solid var(--border);
		border-top: none;
		background-color: var(--background);
	}

	.rich-text-editor :global(.ql-picker) {
		color: var(--foreground);
	}

	.rich-text-editor :global(.ql-stroke) {
		stroke: var(--foreground);
	}

	.rich-text-editor :global(.ql-fill) {
		fill: var(--foreground);
	}

	.rich-text-editor :global(.ql-picker-options) {
		background-color: var(--card);
		border: 1px solid var(--border);
	}

	.rich-text-editor :global(.ql-picker-item) {
		color: var(--foreground);
	}

	.rich-text-editor :global(.ql-tooltip) {
		background-color: var(--card);
		border: 1px solid var(--border);
		color: var(--foreground);
	}

	.rich-text-editor :global(.ql-tooltip input) {
		background-color: var(--background);
		border: 1px solid var(--border);
		color: var(--foreground);
	}

	.rich-text-editor :global(.ql-editor.ql-blank::before) {
		color: var(--muted-foreground);
		font-style: normal;
	}
</style>

<HtmlEditorModal bind:show={showHtmlModal} bind:htmlContent={htmlModalContent} on:save={handleHtmlSave} />