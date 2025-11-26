import fs from 'fs';
import path from 'path';
import pb from '$lib/pocketbase';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'books-data.json');
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface BookData {
    id: string;
    judul: string;
    cover?: string;
    status: string;
    penulis: string[];
    penerbit: string;
    kategori: string[];
    totalHalaman: number;
    halamanSetuju: number;
}

interface CacheData {
    books: BookData[];
    stats: {
        totalBooks: number;
        totalTranslatedPages: number;
        uniqueAuthors: number;
    };
    availableKategoris: string[];
    timestamp: number;
}

// Ensure cache directory exists
function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
}

// Check if cache is valid
function isCacheValid(): boolean {
    try {
        if (!fs.existsSync(CACHE_FILE)) {
            return false;
        }

        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        const cache: CacheData = JSON.parse(cacheContent);

        const now = Date.now();
        const cacheAge = now - cache.timestamp;

        return cacheAge < CACHE_DURATION;
    } catch (error) {
        console.error('Error checking cache validity:', error);
        return false;
    }
}

// Read cache from file
function readCache(): CacheData | null {
    try {
        if (!fs.existsSync(CACHE_FILE)) {
            return null;
        }

        const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
        return JSON.parse(cacheContent);
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
}

// Write cache to file
function writeCache(data: CacheData) {
    try {
        ensureCacheDir();
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Cache updated successfully at', new Date().toISOString());
    } catch (error) {
        console.error('Error writing cache:', error);
    }
}

// Fetch fresh data from PocketBase
async function fetchFreshData(): Promise<CacheData> {
    console.log('Fetching fresh data from PocketBase...');

    // Get total books count
    const allBooksRes = await pb.collection('buku').getList(1, 1, { sort: '-created' });
    const totalBooks = allBooksRes.totalItems;

    // Fetch all books
    const allBukuRes = await pb.collection('buku').getFullList({
        sort: '-created',
        expand: 'penulis,penerbit,kategori'
    });

    // Fetch all halaman
    const allHalaman = await pb.collection('halaman').getFullList();

    // Group halaman by buku
    const halamanByBuku = allHalaman.reduce((acc: { [key: string]: any[] }, h: any) => {
        if (!acc[h.buku]) acc[h.buku] = [];
        acc[h.buku].push(h);
        return acc;
    }, {});

    // Process all books with computed halaman stats
    const processedBooks = allBukuRes.map((record: any) => {
        const bookHalaman = halamanByBuku[record.id] || [];
        const halamanSetuju = bookHalaman.filter((h: any) => h.status === 'Setuju').length;
        const totalHalaman = bookHalaman.length;

        return {
            id: record.id,
            judul: record.judul,
            cover: record.cover ? pb.files.getURL(record, record.cover) : undefined,
            status: record.status,
            penulis: record.expand?.penulis?.map((p: any) => p.id) || [],
            penerbit: record.expand?.penerbit?.id || 'N/A',
            kategori: record.expand?.kategori?.map((k: any) => k.id) || [],
            totalHalaman: totalHalaman,
            halamanSetuju: halamanSetuju
        };
    });

    // Global stats
    const totalTranslatedPages = allHalaman.filter((h: any) => h.status === 'Setuju').length;

    const allPenulis = allBukuRes.flatMap((b: any) => b.expand?.penulis?.map((p: any) => p.id) || []);
    const uniqueAuthors = new Set(allPenulis).size;

    const allKategoriIds = allBukuRes.flatMap((b: any) => b.expand?.kategori?.map((k: any) => k.id) || []);
    const uniqueKategoriSet = new Set(allKategoriIds);
    const availableKategoris = Array.from(uniqueKategoriSet).sort();

    return {
        books: processedBooks,
        stats: {
            totalBooks,
            totalTranslatedPages,
            uniqueAuthors
        },
        availableKategoris,
        timestamp: Date.now()
    };
}

// Main function to get cached data
export async function getCachedData(): Promise<CacheData> {
    // Check if cache is valid
    if (isCacheValid()) {
        console.log('Using cached data');
        const cache = readCache();
        if (cache) {
            return cache;
        }
    }

    // Cache is invalid or doesn't exist, fetch fresh data
    console.log('Cache invalid or missing, fetching fresh data');
    const freshData = await fetchFreshData();
    writeCache(freshData);

    return freshData;
}

// Force refresh cache (can be called manually or via cron)
export async function refreshCache(): Promise<void> {
    console.log('Force refreshing cache...');
    const freshData = await fetchFreshData();
    writeCache(freshData);
}

// Get cache age in minutes
export function getCacheAge(): number | null {
    const cache = readCache();
    if (!cache) return null;

    const ageMs = Date.now() - cache.timestamp;
    return Math.floor(ageMs / 60000); // Convert to minutes
}