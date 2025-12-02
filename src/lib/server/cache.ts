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

// Fetch fresh data from PocketBase
async function fetchFreshData(): Promise<CacheData> {
    console.log('Fetching fresh data from PocketBase...');
    try {
        // Fetch all books with expanded relations
        const allBukuRes = await pb.collection('buku').getFullList({
            sort: '-created',
            expand: 'sampul_href,penulis,penerbit,kategori'
        });
        console.log(`Fetched ${allBukuRes.length} books`);

        // Fetch all pages
        const allHalaman = await pb.collection('halaman').getFullList();
        console.log(`Fetched ${allHalaman.length} pages`);

        // Group pages by book for faster lookup
        const halamanByBuku: Record<string, any[]> = {};
        allHalaman.forEach((h: any) => {
            if (h.buku) {
                if (!halamanByBuku[h.buku]) {
                    halamanByBuku[h.buku] = [];
                }
                halamanByBuku[h.buku].push(h);
            }
        });

        const processedBooks: BookData[] = allBukuRes.map((record: any) => {
            const bukuHalaman = halamanByBuku[record.id] || [];
            const totalHalaman = bukuHalaman.length;
            const halamanSetuju = bukuHalaman.filter((h: any) => h.status === 'Setuju').length;

            let coverUrl = undefined;
            // Handle cover from expanded sampul_href relation
            if (record.expand?.sampul_href) {
                const sampulRecord = record.expand.sampul_href;
                // Try to find the file field dynamically by looking for common image extensions
                const fileField = Object.keys(sampulRecord).find(key =>
                    typeof sampulRecord[key] === 'string' &&
                    /^[a-z0-9_]+\.(webp|jpg|jpeg|png|gif)$/i.test(sampulRecord[key])
                );

                if (fileField) {
                    coverUrl = pb.files.getURL(sampulRecord, sampulRecord[fileField]);
                }
            }

            // Fallback to direct cover field if no relation or relation has no file
            if (!coverUrl && record.cover) {
                coverUrl = pb.files.getURL(record, record.cover);
            }

            const penulisNames = record.expand?.penulis?.map((p: any) => p.penulis) || [];
            const penerbitName = record.expand?.penerbit?.penerbit || '';
            const kategoriNames = record.expand?.kategori?.map((k: any) => k.kategori) || [];

            return {
                id: record.id,
                judul: record.judul,
                cover: coverUrl,
                status: record.status,
                penulis: penulisNames,
                penerbit: penerbitName,
                kategori: kategoriNames,
                totalHalaman,
                halamanSetuju
            };
        });

        const totalBooks = processedBooks.length;
        const totalTranslatedPages = allHalaman.filter((h: any) => h.status === 'Setuju').length;

        const allPenulis = processedBooks.flatMap(b => b.penulis);
        const uniqueAuthors = new Set(allPenulis).size;

        const allKategoriIds = processedBooks.flatMap(b => b.kategori);
        const uniqueKategoriSet = new Set(allKategoriIds);
        const availableKategoris = Array.from(uniqueKategoriSet).sort();

        console.log('Data processing complete');

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
    } catch (error) {
        console.error('Error fetching fresh data:', error);
        throw error;
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