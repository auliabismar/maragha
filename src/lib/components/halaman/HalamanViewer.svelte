<script lang="ts">
	import {
		showImages,
		hasScreenshots,
		isEditor,
		refreshHalamanData
	} from '$lib/stores/bookPageStore';
	import {
		selectedText,
		isSuggestionEnabled,
		openSuggestionDialog,
		handleTextSelection
	} from '$lib/stores/suggestionStore';
	import {
		isEditorMode,
		editData,
		toggleEditMode,
		handleEditChange,
		initEditData,
		saveChanges
	} from '$lib/stores/editorStore';
	import type { Halaman } from '$lib/stores/bookPageStore';

	interface Props {
		halaman: Halaman;
		bookId: string;
	}

	let { halaman, bookId }: Props = $props();

	// Derived values
	let showImagesValue = $derived($showImages);
	let isEditorModeValue = $derived($isEditorMode);
	let isSuggestionEnabledValue = $derived($isSuggestionEnabled);
	
	// Current edit data values for binding
	let currentTerjemah = $state('');
	let currentTulisan = $state('');

	// Update local state when store changes
	$effect(() => {
		const editDataValue = $editData[halaman.id];
		if (editDataValue) {
			currentTerjemah = editDataValue.terjemah ?? '';
			currentTulisan = editDataValue.tulisan ?? '';
		}
	});

	// Initialize edit data when entering edit mode
	$effect(() => {
		if ($isEditorMode && !$editData[halaman.id]) {
			// Initialize with original data from halaman
			initEditData(halaman.id, {
				terjemah: halaman.terjemah || '',
				tulisan: halaman.tulisan || ''
			});
		}
	});

	// Update store when local state changes
	function updateTerjemah(value: string) {
		currentTerjemah = value;
		handleEditChangeField('terjemah', value);
	}

	function updateTulisan(value: string) {
		currentTulisan = value;
		handleEditChangeField('tulisan', value);
	}

	// Image height measurement
	let imageRef: HTMLImageElement | null = $state(null);
	let imageHeight = $state(0);

	function handleTextSelectionClick() {
		handleTextSelection(halaman.id, halaman.halaman);
	}

	function openSuggestionDialogClick() {
		openSuggestionDialog();
	}

	function handleEditChangeField(field: 'terjemah' | 'tulisan', value: string) {
		handleEditChange(halaman.id, field, value);
	}

	async function saveChangesClick() {
		try {
			await saveChanges(halaman.id, $editData);
			// Refresh the halaman data after successful save
			await refreshHalamanData(bookId, halaman.id);
		} catch (error) {
			console.error('Error saving changes:', error);
		}
	}

	$effect(() => {
		if (imageRef && showImagesValue && $hasScreenshots) {
			const observer = new ResizeObserver((entries) => {
				for (let entry of entries) {
					if (entry.target === imageRef) {
						imageHeight = entry.contentRect.height;
					}
				}
			});
			observer.observe(imageRef);

			return () => {
				observer.disconnect();
			};
		} else {
			imageHeight = 0;
		}
	});
</script>

<div class="relative">
	<div class="flex flex-col lg:flex-row gap-6">
		{#if showImagesValue && $hasScreenshots && halaman.image}
			<div class="lg:w-1/2">
				<div class="sticky top-4">
					<img
						bind:this={imageRef}
						src={halaman.image}
						alt="Halaman {halaman.halaman}"
						class="w-full rounded-lg shadow-lg"
						loading="lazy"
					/>
				</div>
			</div>
		{/if}

		<div class="{showImagesValue && $hasScreenshots && halaman.image ? 'lg:w-1/2' : 'w-full'}">
			<div
				class="bg-[var(--card)] rounded-lg p-6 shadow-sm border border-[var(--border)]"
				role="textbox"
				tabindex="0"
				onmouseup={handleTextSelectionClick}
				onselect={handleTextSelectionClick}
			>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-xl font-semibold text-[var(--foreground)]">
						Halaman {halaman.halaman}
					</h2>
					
					<div class="flex items-center gap-2">
						{#if isSuggestionEnabledValue && !isEditorModeValue}
							<button
								onclick={openSuggestionDialogClick}
								class="inline-flex items-center px-3 py-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 transition-colors"
							>
								<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/>
								</svg>
								Saran Terjemahan
							</button>
						{/if}
	
						{#if $isEditor}
							<button
								onclick={toggleEditMode}
								class="inline-flex items-center px-3 py-1 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-md hover:bg-[var(--accent)] transition-colors"
							>
								{isEditorModeValue ? 'Keluar Edit' : 'Mode Edit'}
							</button>
						{/if}
	
						{#if isEditorModeValue}
							<button
								onclick={saveChangesClick}
								class="inline-flex items-center px-3 py-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 transition-colors"
							>
								<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									/>
								</svg>
								Simpan
							</button>
						{/if}
					</div>
				</div>
				<div class="space-y-6">
					{#if isEditorModeValue && !halaman.image}
						<!-- Side by side layout for desktop, stacked on mobile -->
						<div class="flex flex-col lg:flex-row gap-6">
							<!-- Terjemahan textarea -->
							<div class="flex-1">
								<h3 class="text-sm font-medium text-[var(--muted-foreground)] mb-2">Terjemahan</h3>
								<textarea
									bind:value={currentTerjemah}
									oninput={(e) => updateTerjemah((e.currentTarget as HTMLTextAreaElement).value)}
									class="w-full min-h-[400px] lg:min-h-screen p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] resize-y"
									placeholder="Edit terjemahan..."
								></textarea>
							</div>
							
							<!-- Tulisan Asli read-only display -->
							<div class="flex-1">
								<h3 class="text-sm font-medium text-[var(--muted-foreground)] mb-2">Tulisan Asli</h3>
								<div class="w-full min-h-[400px] lg:min-h-screen p-3 border border-[var(--border)] rounded-md bg-[var(--muted)] text-[var(--foreground)] opacity-75">
									<div class="prose prose-sm max-w-none text-[var(--foreground)] leading-relaxed font-arabic">
										{@html currentTulisan}
									</div>
								</div>
							</div>
						</div>
					{:else}
						<!-- Original layout for non-editor mode or when image exists -->
						<div>
							<h3 class="text-sm font-medium text-[var(--muted-foreground)] mb-2">Terjemahan</h3>
							{#if isEditorModeValue}
								<textarea
									bind:value={currentTerjemah}
									oninput={(e) => updateTerjemah((e.currentTarget as HTMLTextAreaElement).value)}
									class="w-full min-h-screen p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] resize-y"
									placeholder="Edit terjemahan..."
								></textarea>
							{:else}
								<div class="prose prose-sm max-w-none text-[var(--foreground)] leading-relaxed terjemah-content">
									{@html halaman.terjemah}
								</div>
							{/if}
						</div>

						{#if !halaman.image}
							<div>
								<h3 class="text-sm font-medium text-[var(--muted-foreground)] mb-2">Tulisan Asli</h3>
								{#if isEditorModeValue}
									<textarea
										bind:value={currentTulisan}
										oninput={(e) => updateTulisan((e.currentTarget as HTMLTextAreaElement).value)}
										class="w-full min-h-[150px] p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] resize-y"
										placeholder="Edit tulisan asli..."
									></textarea>
								
								{/if}
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>