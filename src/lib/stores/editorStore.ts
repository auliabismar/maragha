import { writable } from 'svelte/store';
import pb from '$lib/pocketbase';
import { toast } from 'svelte-sonner';

export const isEditorMode = writable(false);
export const editData = writable<{[key: string]: {terjemah: string, tulisan: string}}>({});

export function toggleEditMode() {
	isEditorMode.update(value => {
		const newValue = !value;
		if (!newValue) {
			editData.set({});
		}
		return newValue;
	});
}

export function initEditData(halamanId: string, halamanData: {terjemah: string, tulisan: string}) {
	editData.update(editData => {
		editData[halamanId] = {
			terjemah: halamanData.terjemah || '',
			tulisan: halamanData.tulisan || ''
		};
		return { ...editData };
	});
}

export function handleEditChange(halamanId: string, field: 'terjemah' | 'tulisan', value: string) {
	editData.update(editData => {
		if (!editData[halamanId]) {
			editData[halamanId] = { terjemah: '', tulisan: '' };
		}
		editData[halamanId][field] = value;
		return { ...editData };
	});
}

export async function saveChanges(halamanId: string, editDataValue: {[key: string]: {terjemah: string, tulisan: string}}) {
	const data = editDataValue[halamanId];
	if (!data) return;

	try {
		await pb.collection('halaman').update(halamanId, {
			terjemah: data.terjemah,
			tulisan: data.tulisan
		});

		// Clear the edit data for this halaman since changes are now saved
		editData.update(editDataStore => {
			if (editDataStore[halamanId]) {
				delete editDataStore[halamanId];
			}
			return { ...editDataStore };
		});

		toast.success('Perubahan berhasil disimpan!');
	} catch (error) {
		console.error('Error saving changes:', error);
		toast.error('Terjadi kesalahan saat menyimpan perubahan.');
	}
}