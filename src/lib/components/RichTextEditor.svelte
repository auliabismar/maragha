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

	// State for HTML editor modal
	let showHtmlModal = $state(false);
	let htmlModalContent = $state('');

	// Toolbar configuration
	const toolbarOptions = [
		[{ header: [1, 2, 3, false] }],
		['bold', 'italic', 'underline', 'strike'],
		[{ list: 'ordered' }, { list: 'bullet' }],
		[{ script: 'sub' }, { script: 'super' }],
		[{ indent: '+1' }, { indent: '-1' }],  // +1 for indent, -1 for outdent
		[{ direction: 'rtl' }],
		[{ color: [] }, { background: [] }],
		[{ align: [] }],
		['link', 'image', 'blockquote', 'code-block'],
		['clean']
	];

	// Tooltip function using console log (for debug) + native browser titles
	function showTooltip(format: string) {
		// Native browser tooltips are set post-init below
	}

	onMount(async () => {
		if (browser) {
			const { default: Quill } = await import('quill');
			import('quill/dist/quill.snow.css');

			// Initialize Quill editor
			quill = new Quill(editorContainer, {
				modules: {
					toolbar: {
						container: toolbarOptions,
						handlers: {
							bold: function() {
								showTooltip('Bold');
								if (quill && quill.getSelection()) {
									const range = quill.getSelection();
									const format = quill.getFormat(range);
									const isBold = format.bold === true;
									quill.format('bold', !isBold);
								}
							},
							italic: function() {
								showTooltip('Italic');
								if (quill && quill.getSelection()) {
									const range = quill.getSelection();
									const format = quill.getFormat(range);
									const isItalic = format.italic === true;
									quill.format('italic', !isItalic);
								}
							},
							underline: function() {
								showTooltip('Underline');
								if (quill && quill.getSelection()) {
									const range = quill.getSelection();
									const format = quill.getFormat(range);
									const isUnderline = format.underline === true;
									quill.format('underline', !isUnderline);
								}
							},
							strike: function() {
								showTooltip('Strikethrough');
								if (quill && quill.getSelection()) {
									const range = quill.getSelection();
									const format = quill.getFormat(range);
									const isStrike = format.strike === true;
									quill.format('strike', !isStrike);
								}
							},
							'list:ordered': function() {
								showTooltip('Ordered List');
								if (quill) {
									const current = quill.getFormat().list;
									quill.format('list', current === 'ordered' ? false : 'ordered');
								}
							},
							'list:bullet': function() {
								showTooltip('Bullet List');
								if (quill) {
									const current = quill.getFormat().list;
									quill.format('list', current === 'bullet' ? false : 'bullet');
								}
							},
							// Single indent handler for both +1 and -1 buttons
							indent: function(value: string) {
								const action = value === '+1' ? 'indent' : 'outdent';
								showTooltip(action.charAt(0).toUpperCase() + action.slice(1));
								if (quill && quill.getSelection()) {
									quill.format('indent', value);
								}
							},
							direction: function() {
								showTooltip('Text Direction');
								if (quill) {
									const current = quill.getFormat().direction;
									quill.format('direction', current ? false : 'rtl');
								}
							},
							// Native handlers for pickers - minimal interference
							color: function() {
								showTooltip('Text Color');
							},
							background: function() {
								showTooltip('Background Color');
							},
							// Remove custom align handler - let Quill handle native picker fully
							link: function() {
								showTooltip('Insert Link');
							},
							image: function() {
								showTooltip('Insert Image');
							},
							blockquote: function() {
								showTooltip('Blockquote');
								if (quill) {
									const current = quill.getFormat().blockquote;
									quill.format('blockquote', !current);
								}
							},
							'code-block': function() {
								showTooltip('Code Block');
								if (quill) {
									const current = quill.getFormat()['code-block'];
									quill.format('code-block', !current);
								}
							},
							clean: function() {
								showTooltip('Clear Formatting');
								if (quill && quill.getSelection()) {
									quill.removeFormat(quill.getSelection());
								}
							}
						}
					}
				},
				theme: 'snow',
				placeholder: placeholder,
				readOnly: readonly
			});

			// Add native browser tooltips to buttons post-init
			setTimeout(() => {
				const buttons = editorContainer.querySelectorAll('.ql-toolbar button') as NodeListOf<HTMLElement>;
				buttons.forEach((btn) => {
					const format = btn.className.match(/ql-(\w+)/)?.[1];
					if (format) {
						const displayName = format.charAt(0).toUpperCase() + format.slice(1);
						btn.title = `Format: ${displayName}`;
					}
				});
			}, 500);

			// Set initial content
			if (value && value !== '<p><br></p>') {
				quill.clipboard.dangerouslyPasteHTML(value);
			}

			// Event listeners
			quill.on('text-change', () => {
				const html = quill.root.innerHTML || '';
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
		if (browser && quill) {
			const currentContent = quill.root.innerHTML || '';
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
	});

	// Focus the editor
	export function focus() {
		if (quill) {
			quill.focus();
		}
	}

	// Get editor content
	export function getContent(): string {
		return quill?.root.innerHTML || '';
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