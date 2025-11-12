import { writable, readable, derived } from 'svelte/store';
import pb from '$lib/pocketbase';
import { goto } from '$app/navigation';
import { toast } from 'svelte-sonner';

export interface Book {
	id: string;
	judul: string;
	cover?: string;
	status: string;
	penulis: string[];
	penerbit: string;
	kategori: string[];
	screenshot: boolean;
}

export interface Halaman {
	id: string;
	halaman: number;
	terjemah: string;
	tulisan?: string;
	image?: string;
	buku: string;
	status?: string;
}

// Cache interfaces and constants
interface CacheEntry<T> {
	data: T;
	timestamp: number;
	bookId: string;
}

const BOOK_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const PAGE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 20;

// Cache stores
const bookCache = new Map<string, CacheEntry<Book>>();
const halamanCache = new Map<string, CacheEntry<Halaman[]>>();

// Cache management functions
function cleanOldCacheEntries(cache: Map<string, any>) {
	if (cache.size <= MAX_CACHE_ENTRIES) return;
	
	const entries = Array.from(cache.entries());
	entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
	entries.slice(0, entries.length - MAX_CACHE_ENTRIES).forEach(([key]) => {
		cache.delete(key);
	});
}

function checkCacheValidity<T>(entry: CacheEntry<T> | undefined, duration: number): boolean {
	return !!(entry && (Date.now() - entry.timestamp) < duration);
}

// Core stores
export const book = writable<Book | null>(null);
export const halamanRecords = writable<Halaman[]>([]);
export const currentPage = writable(1);
export const totalPages = writable(1);
export const loading = writable(true);
export const lemariRecord = writable<any>(null);
export const showImages = writable(true);
export const jumpPageInput = writable('');

// Constants
export const itemsPerPage = writable(1);

// AbortController
let abortController: AbortController | null = null;

export async function initBookPage(bookId: string) {
	if (!pb.authStore.isValid) {
		goto('/login');
		return;
	}

	if (!bookId) {
		goto('/');
		return;
	}

	loadImagePreference();
	await Promise.all([fetchBook(bookId), fetchHalaman(bookId), syncWithBookshelf(bookId)]);
	loading.set(false);
}

function loadImagePreference() {
	const saved = localStorage.getItem('showImages');
	const showImagesValue = saved === null ? true : saved === 'true';
	showImages.set(showImagesValue);
}

export function toggleImages() {
	showImages.update(value => {
		const newValue = !value;
		localStorage.setItem('showImages', newValue.toString());
		return newValue;
	});
}

async function fetchBook(bookId: string, forceRefresh = false) {
	// Check cache first
	const cached = bookCache.get(bookId);
	const cacheIsValid = checkCacheValidity(cached, BOOK_CACHE_DURATION);
	
	if (cacheIsValid && !forceRefresh) {
		if (cached) {
			book.set(cached.data);
		}
		return;
	}

	try {
		const record = await pb.collection('buku').getOne(bookId, {
			expand: 'penulis,penerbit,kategori'
		});

		const bookData: Book = {
			id: record.id,
			judul: record.judul,
			cover: record.cover ? pb.files.getURL(record, record.cover) : undefined,
			status: record.status,
			penulis: record.expand?.penulis?.map((p: any) => p.id) || [],
			penerbit: record.expand?.penerbit?.id || 'N/A',
			kategori: record.expand?.kategori?.map((k: any) => k.id) || [],
			screenshot: record.screenshot || false
		};
		
		// Update cache
		bookCache.set(bookId, {
			data: bookData,
			timestamp: Date.now(),
			bookId
		});
		
		// Clean up old cache entries
		cleanOldCacheEntries(bookCache);
		
		book.set(bookData);
	} catch (error) {
		console.error('Error fetching book:', error);
		// Use stale cache as fallback
		if (cached) {
			book.set(cached.data);
		} else {
			goto('/');
		}
	}
}

async function fetchHalaman(bookId: string, page?: number, itemsPerPage?: number, isPrefetch = false) {
	// Abort previous request if any (only for non-prefetch requests)
	if (!isPrefetch && abortController) {
		abortController.abort();
	}
	abortController = new AbortController();

	const currentPageValue = page || getCurrentPage();
	const itemsPerPageValue = itemsPerPage || getItemsPerPage();
	const cacheKey = `${bookId}-${currentPageValue}-${itemsPerPageValue}`;
	
	// Check cache first
	const cached = halamanCache.get(cacheKey);
	const cacheIsValid = checkCacheValidity(cached, PAGE_CACHE_DURATION);
	
	if (cacheIsValid && !isPrefetch && cached) {
		halamanRecords.set(cached.data);
		return;
	}

	try {
		const records = await pb.collection('halaman').getList(currentPageValue, itemsPerPageValue, {
			filter: `buku = "${bookId}"`,
			sort: 'halaman',
			expand: 'buku',
			signal: abortController.signal
		});

		const halamanData: Halaman[] = records.items.map((record) => ({
			id: record.id,
			halaman: record.halaman,
			terjemah: record.terjemah,
			tulisan: record.tulisan || '',
			image: record.image ? pb.files.getURL(record, record.image) : undefined,
			status: record.status,
			buku: record.buku
		}));

		// Update cache (only for non-prefetch or when we have fresh data)
		halamanCache.set(cacheKey, {
			data: halamanData,
			timestamp: Date.now(),
			bookId
		});
		
		// Clean up old cache entries
		cleanOldCacheEntries(halamanCache);

		// Only update stores for non-prefetch requests
		if (!isPrefetch) {
			halamanRecords.set(halamanData);
			totalPages.set(Math.ceil(records.totalItems / itemsPerPageValue));
		}
	} catch (error: any) {
		if (error.name === 'AbortError') {
			return;
		}
		console.error('Error fetching halaman:', error);
		
		// Use stale cache as fallback for non-prefetch requests
		if (!isPrefetch && cached) {
			halamanRecords.set(cached.data);
		}
	}
}

async function syncWithBookshelf(bookId: string) {
	if (!pb.authStore.model) {
		console.error('User not authenticated');
		return;
	}
	try {
		const records = await pb.collection('lemari_buku').getList(1, 1, {
			filter: `pengguna = "${pb.authStore.model.id}" && buku = "${bookId}"`
		});
		if (records.items.length > 0) {
			const record = records.items[0];
			lemariRecord.set(record);
			currentPage.set(record.halaman);
		} else {
			const newRecord = await pb.collection('lemari_buku').create({
				pengguna: pb.authStore.model.id,
				buku: bookId,
				halaman: 1
			});
			lemariRecord.set(newRecord);
			currentPage.set(1);
		}

		await fetchHalaman(bookId);
		// Start background prefetching after loading initial page
		prefetchAdjacentPages(bookId);
	} catch (error) {
		console.error('Error syncing with bookshelf:', error);
	}
}

async function updateBookshelfPage(page: number) {
	const lemariRecordValue = getLemariRecord();
	if (!lemariRecordValue) return;

	try {
		await pb.collection('lemari_buku').update(lemariRecordValue.id, {
			halaman: page
		});
	} catch (error) {
		console.error('Error updating bookshelf page:', error);
	}
}

export async function goToPage(bookId: string, page: number) {
	const totalPagesValue = getTotalPages();
	if (page >= 1 && page <= totalPagesValue) {
		currentPage.set(page);
		await updateBookshelfPage(page);
		await fetchHalaman(bookId);
		// Start background prefetching for adjacent pages
		prefetchAdjacentPages(bookId);
		// Scroll to top - this should be handled in component
	}
}

export async function jumpToPage(bookId: string, pageNumber: number) {
	const totalPagesValue = getTotalPages();
	if (pageNumber >= 1 && pageNumber <= totalPagesValue) {
		await goToPage(bookId, pageNumber);
	}
}

export async function goToPreviousPage(bookId: string) {
	const currentPageValue = getCurrentPage();
	if (currentPageValue > 1) {
		await goToPage(bookId, currentPageValue - 1);
	}
}

export async function goToNextPage(bookId: string) {
	const currentPageValue = getCurrentPage();
	const totalPagesValue = getTotalPages();
	if (currentPageValue < totalPagesValue) {
		await goToPage(bookId, currentPageValue + 1);
	}
}

export function getPageNumbers(): (number | string)[] {
	const currentPageValue = getCurrentPage();
	const totalPagesValue = getTotalPages();
	const pages: (number | string)[] = [];
	const maxVisible = 5;
	const start = Math.max(1, currentPageValue - Math.floor(maxVisible / 2));
	const end = Math.min(totalPagesValue, start + maxVisible - 1);
	if (start > 1) {
		pages.push(1);
		if (start > 2) {
			pages.push('...');
		}
	}

	for (let i = start; i <= end; i++) {
		pages.push(i);
	}

	if (totalPagesValue > 10) {
		const highestNumbersStart = Math.max(end + 1, totalPagesValue - 19);
		if (highestNumbersStart > end + 1) {
			pages.push('...');
		}

		const highestNumbers: number[] = [];
		for (let i = highestNumbersStart; i < totalPagesValue; i++) {
			if (i > end && i !== totalPagesValue) {
				highestNumbers.push(i);
			}
		}
		pages.push(...highestNumbers);
	}

	if (end < totalPagesValue) {
		if (!pages.includes(totalPagesValue)) {
			pages.push(totalPagesValue);
		}
	}

	return pages;
}

// Make page numbers reactive using derived store
export const pageNumbers = derived([currentPage, totalPages], ([$currentPage, $totalPages]) => {
	const pages: (number | string)[] = [];
	
	// Handle simple cases
	if ($totalPages <= 1) {
		return [1];
	}
	
	// Always show first page
	pages.push(1);
	
	// Calculate key milestone pages
	// X-2, X-1, X, X+1, X+2
	const xMinus2 = Math.max(2, $currentPage - 2);
	const xMinus1 = Math.max(2, $currentPage - 1);
	const x = $currentPage;
	const xPlus1 = Math.min($totalPages, $currentPage + 1);
	const xPlus2 = Math.min($totalPages, $currentPage + 2);
	
	// Find biggest multiple of 10 before X-2 (only if current page is far enough from start)
	let biggestMultipleBefore = 0;
	if ($currentPage >= 15) {
		biggestMultipleBefore = Math.floor((xMinus2 - 1) / 10) * 10;
		if (biggestMultipleBefore < 10) {
			biggestMultipleBefore = 0; // Don't show if it's too small
		}
	}
	
	// Find least multiple of 10 after X+2 (only if current page is far enough from end)
	let leastMultipleAfter = 0;
	if (($totalPages - $currentPage) >= 15) {
		leastMultipleAfter = Math.ceil((xPlus2 + 1) / 10) * 10;
		if (leastMultipleAfter > $totalPages) {
			leastMultipleAfter = 0; // Don't show if it's beyond total pages
		}
	}
	
	// Add ellipsis and biggest multiple of 10 before X-2 (if meaningful)
	if (biggestMultipleBefore > 1 && biggestMultipleBefore < xMinus2) {
		pages.push('...');
		pages.push(biggestMultipleBefore);
	}
	
	// Add centered range around current page
	// Show X-2 only if current page >= 4
	if ($currentPage >= 4 && xMinus2 >= 2 && xMinus2 <= $totalPages) {
		pages.push(xMinus2);
	}
	// Show X-1 only if current page >= 3
	if ($currentPage >= 3 && xMinus1 >= 2 && xMinus1 <= $totalPages) {
		pages.push(xMinus1);
	}
	// Always show current page
	if (x >= 1 && x <= $totalPages) {
		pages.push(x);
	}
	// Show X+1 only if not too close to end
	if (($totalPages - $currentPage) >= 3 && xPlus1 >= 1 && xPlus1 <= $totalPages) {
		pages.push(xPlus1);
	}
	// Show X+2 only if not too close to end
	if (($totalPages - $currentPage) >= 4 && xPlus2 >= 1 && xPlus2 <= $totalPages) {
		pages.push(xPlus2);
	}
	
	// Add ellipsis and least multiple of 10 after X+2 (if meaningful)
	if (leastMultipleAfter > 0 && leastMultipleAfter > xPlus2 && leastMultipleAfter < $totalPages) {
		pages.push('...');
		pages.push(leastMultipleAfter);
	}
	
	// Always show last page
	if (!pages.includes($totalPages)) {
		pages.push($totalPages);
	}
	
	return pages;
});

// Helper functions to get current store values
function getCurrentPage(): number {
	let value: number = 1;
	const unsubscribe = currentPage.subscribe(v => value = v);
	unsubscribe();
	return value;
}

function getTotalPages(): number {
	let value: number = 1;
	const unsubscribe = totalPages.subscribe(v => value = v);
	unsubscribe();
	return value;
}

function getItemsPerPage(): number {
	let value: number = 1;
	const unsubscribe = itemsPerPage.subscribe(v => value = v);
	unsubscribe();
	return value;
}

function getLemariRecord(): any {
	let value: any = null;
	const unsubscribe = lemariRecord.subscribe(v => value = v);
	unsubscribe();
	return value;
}

export async function refreshHalamanData(bookId: string, halamanId: string, forceRefresh = true) {
	try {
		const record = await pb.collection('halaman').getOne(halamanId);
		
		const updatedHalaman: Halaman = {
			id: record.id,
			halaman: record.halaman,
			terjemah: record.terjemah,
			tulisan: record.tulisan || '',
			image: record.image ? pb.files.getURL(record, record.image) : undefined,
			status: record.status,
			buku: record.buku
		};

		// Update the local halamanRecords store
		halamanRecords.update(records => {
			const index = records.findIndex(r => r.id === halamanId);
			if (index !== -1) {
				records[index] = updatedHalaman;
				return [...records];
			}
			return records;
		});

		// Update cache if the halaman is cached
		const currentPageValue = getCurrentPage();
		const itemsPerPageValue = getItemsPerPage();
		const cacheKey = `${bookId}-${currentPageValue}-${itemsPerPageValue}`;
		const cached = halamanCache.get(cacheKey);
		
		if (cached) {
			const updatedCacheData = cached.data.map(halaman =>
				halaman.id === halamanId ? updatedHalaman : halaman
			);
			halamanCache.set(cacheKey, {
				data: updatedCacheData,
				timestamp: Date.now(),
				bookId
			});
		}
	} catch (error) {
		console.error('Error refreshing halaman data:', error);
	}
}

// Derived stores
export const hasScreenshots = derived(book, ($book) => $book?.screenshot === true);
export const isEditor = derived([book], ([$book]) => pb.authStore.model?.akses === 'Editor');

export function cleanup() {
	abortController?.abort();
}

// Background prefetching functionality
export async function prefetchAdjacentPages(bookId: string) {
	const currentPageValue = getCurrentPage();
	const totalPagesValue = getTotalPages();
	
	// Prefetch next page
	if (currentPageValue < totalPagesValue) {
		setTimeout(() => {
			fetchHalaman(bookId, currentPageValue + 1, getItemsPerPage(), true);
		}, 100);
	}
	
	// Prefetch previous page
	if (currentPageValue > 1) {
		setTimeout(() => {
			fetchHalaman(bookId, currentPageValue - 1, getItemsPerPage(), true);
		}, 200);
	}
}

// Cache management functions
export function clearBookCache(bookId?: string) {
	if (bookId) {
		bookCache.delete(bookId);
	} else {
		bookCache.clear();
	}
}

export function clearHalamanCache(bookId?: string) {
	if (bookId) {
		Array.from(halamanCache.keys())
			.filter(key => key.startsWith(bookId))
			.forEach(key => halamanCache.delete(key));
	} else {
		halamanCache.clear();
	}
}

export function clearAllCache() {
	bookCache.clear();
	halamanCache.clear();
}

export function getCacheStats() {
	const bookCacheEntries = Array.from(bookCache.values()).map(entry => ({
		bookId: entry.bookId,
		age: Date.now() - entry.timestamp,
		dataSize: JSON.stringify(entry.data).length
	}));
	
	const halamanCacheEntries = Array.from(halamanCache.entries()).map(([key, entry]) => ({
		cacheKey: key,
		bookId: entry.bookId,
		age: Date.now() - entry.timestamp,
		dataSize: JSON.stringify(entry.data).length
	}));
	
	return {
		bookCacheSize: bookCache.size,
		halamanCacheSize: halamanCache.size,
		bookCacheEntries,
		halamanCacheEntries,
		totalCacheSize: bookCache.size + halamanCache.size
	};
}