<script lang="ts">
	import {
		showSuggestionDialog,
		selectedText,
		terjemahanBaru,
		alasanKeterangan,
		submitSuggestion,
		closeSuggestionDialog
	} from '$lib/stores/suggestionStore';

	interface Props {
		bookId: string;
	}

	let { bookId }: Props = $props();

	// Derived values
	let showDialog = $derived($showSuggestionDialog);
	let selectedTextValue = $derived($selectedText);
	let terjemahanBaruValue = $derived($terjemahanBaru);
	let alasanKeteranganValue = $derived($alasanKeterangan);

	function handleClose() {
		closeSuggestionDialog();
	}

	function handleSubmit() {
		submitSuggestion(bookId);
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		}
	}
</script>

{#if showDialog}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="0"
	>
		<div class="bg-[var(--card)] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-[var(--border)]">
				<h2 class="text-xl font-semibold text-[var(--foreground)]">
					Saran Terjemahan
				</h2>
				<button
					onclick={handleClose}
					aria-label="Tutup dialog"
					class="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-md hover:bg-[var(--accent)] transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
				<!-- Selected text -->
				<div>
					<label for="selected-text" class="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
						Teks yang Dipilih
					</label>
					<div
						id="selected-text"
						class="w-full min-h-[80px] p-3 border border-[var(--border)] rounded-md bg-[var(--muted)] text-[var(--foreground)]"
					>
						{selectedTextValue}
					</div>
				</div>

				<!-- New translation suggestion -->
				<div>
					<label for="terjemahan-baru" class="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
						Terjemahan Baru <span class="text-red-500">*</span>
					</label>
					<textarea
						id="terjemahan-baru"
						bind:value={$terjemahanBaru}
						placeholder="Masukkan terjemahan yang lebih baik..."
						class="w-full min-h-[100px] p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
						required
					></textarea>
				</div>

				<!-- Reason/explanation -->
				<div>
					<label for="alasan-keterangan" class="block text-sm font-medium text-[var(--muted-foreground)] mb-2">
						Alasan/Keterangan <span class="text-red-500">*</span>
					</label>
					<textarea
						id="alasan-keterangan"
						bind:value={$alasanKeterangan}
						placeholder="Jelaskan mengapa terjemahan ini lebih baik atau apa yang perlu diperbaiki..."
						class="w-full min-h-[80px] p-3 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
						required
					></textarea>
				</div>

				<!-- Help text -->
				<div class="bg-[var(--muted)] p-3 rounded-md">
					<p class="text-sm text-[var(--muted-foreground)]">
						<strong>Catatan:</strong> Saran review Anda akan ditinjau oleh tim editor. Pastikan terjemahan baru lebih akurat dan sesuai dengan konteks.
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex justify-end space-x-3 p-6 border-t border-[var(--border)]">
				<button
					onclick={handleClose}
					class="px-4 py-2 text-sm border border-[var(--border)] text-[var(--foreground)] rounded-md hover:bg-[var(--accent)] transition-colors"
				>
					Batal
				</button>
				<button
					onclick={handleSubmit}
					disabled={!terjemahanBaruValue.trim() || !alasanKeteranganValue.trim()}
					class="px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Kirim Saran
				</button>
			</div>
		</div>
	</div>
{/if}