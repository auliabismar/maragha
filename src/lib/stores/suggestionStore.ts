import { writable, derived } from 'svelte/store';
import pb from '$lib/pocketbase';
import { toast } from 'svelte-sonner';

// Core stores
export const showSuggestionDialog = writable(false);
export const selectedText = writable('');
export const terjemahanBaru = writable('');
export const alasanKeterangan = writable('');
export const selectedHalamanId = writable('');
export const selectedHalamanNo = writable(0);

// Current page tracking
export const currentPageId = writable('');
export const currentBookId = writable('');

// Clear all suggestion data
export function clearAllSuggestionData() {
	selectedText.set('');
	terjemahanBaru.set('');
	alasanKeterangan.set('');
	selectedHalamanId.set('');
	selectedHalamanNo.set(0);
	showSuggestionDialog.set(false);
	window.getSelection()?.removeAllRanges();
}

// Text selection tracking
export function handleTextSelection(halamanId: string, halamanNo: number, bookId?: string) {
	const selection = window.getSelection();
	const text = selection?.toString().trim() || '';
	if (text) {
		selectedText.set(text);
		selectedHalamanId.set(halamanId);
		selectedHalamanNo.set(halamanNo);
		if (bookId) {
			currentBookId.set(bookId);
		}
	} else {
		clearSelection();
	}
}

export function openSuggestionDialog() {
	let selectedTextValue: string = '';
	const unsubscribe = selectedText.subscribe(value => selectedTextValue = value);
	if (selectedTextValue?.trim()) {
		showSuggestionDialog.set(true);
	}
	unsubscribe();
}

export function closeSuggestionDialog() {
	showSuggestionDialog.set(false);
	window.getSelection()?.removeAllRanges();
}

export async function submitSuggestion(bookId: string) {
	let selectedTextValue: string = '';
	let terjemahanBaruValue: string = '';
	let alasanKeteranganValue: string = '';
	let selectedHalamanNoValue: number = 0;

	const unsub1 = selectedText.subscribe(value => selectedTextValue = value);
	const unsub2 = terjemahanBaru.subscribe(value => terjemahanBaruValue = value);
	const unsub3 = alasanKeterangan.subscribe(value => alasanKeteranganValue = value);
	const unsub4 = selectedHalamanNo.subscribe(value => selectedHalamanNoValue = value);

	if (!selectedTextValue?.trim() || !terjemahanBaruValue?.trim() || !alasanKeteranganValue?.trim()) {
		toast.error('Semua field wajib diisi!');
		unsub1(); unsub2(); unsub3(); unsub4();
		return;
	}

	try {
		const keterangan = `Selected Text:\n${selectedTextValue}\n\nTerjemahan Baru:\n${terjemahanBaruValue}\n\nAlasan/Keterangan:\n${alasanKeteranganValue}`;

		await pb.collection('penugasan').create({
			pelapor: pb.authStore.model?.id,
			buku: bookId,
			awal_halaman: selectedHalamanNoValue,
			akhir_halaman: selectedHalamanNoValue,
			keterangan: keterangan,
			status: 'Terlapor'
		});

		toast.success('Saran review terjemahan berhasil dikirim!');
		closeSuggestionDialog();
	} catch (error) {
		console.error('Error submitting suggestion:', error);
		toast.error('Terjadi kesalahan saat mengirim saran. Silakan coba lagi.');
	} finally {
		unsub1(); unsub2(); unsub3(); unsub4();
	}
}

export function clearSelection() {
	selectedText.set('');
	selectedHalamanId.set('');
	selectedHalamanNo.set(0);
}

// Keyboard handling for Escape key
export function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		event.preventDefault();
		closeSuggestionDialog();
	}
}

// Derived stores
export const isSuggestionEnabled = derived(
	[selectedText, selectedHalamanId, currentPageId],
	([$selectedText, $selectedHalamanId, $currentPageId]) => {
		return $selectedText.trim().length > 0 && $selectedHalamanId === $currentPageId;
	}
);