// Caching Test and Demo
// This file demonstrates the caching functionality implemented in bookPageStore

import {
	getCacheStats,
	clearBookCache,
	clearHalamanCache,
	clearAllCache
} from './stores/bookPageStore';

/**
 * Demo function to test caching functionality
 */
export async function testCachingFunctionality() {
	console.log('🧪 Testing Caching Functionality...');
	
	// Check initial cache state
	console.log('\n📊 Initial Cache Stats:');
	const initialStats = getCacheStats();
	console.log(`- Book Cache: ${initialStats.bookCacheSize} entries`);
	console.log(`- Halaman Cache: ${initialStats.halamanCacheSize} entries`);
	console.log(`- Total Cache: ${initialStats.totalCacheSize} entries`);
	
	// Test cache management functions
	console.log('\n🧹 Testing Cache Management...');
	
	// Clear specific book cache
	console.log('Clearing book cache...');
	clearBookCache();
	
	// Clear halaman cache for specific book
	console.log('Clearing halaman cache...');
	clearHalamanCache('test-book-id');
	
	// Clear all cache
	console.log('Clearing all cache...');
	clearAllCache();
	
	// Check final cache state
	const finalStats = getCacheStats();
	console.log(`\n📊 Final Cache Stats: ${finalStats.totalCacheSize} entries`);
	
	// Test cache entry structure
	console.log('\n🔍 Cache Entry Structure:');
	const exampleBookEntry = {
		bookId: 'example-book-id',
		timestamp: Date.now(),
		data: {
			id: 'example-book-id',
			judul: 'Example Book',
			status: 'active',
			penulis: [],
			penerbit: 'N/A',
			kategori: [],
			screenshot: false
		}
	};
	
	const exampleHalamanEntry = {
		bookId: 'example-book-id',
		timestamp: Date.now(),
		data: [
			{
				id: 'example-halaman-id',
				halaman: 1,
				terjemah: 'Example translation',
				tulisan: '',
				image: undefined,
				status: 'active',
				buku: 'example-book-id'
			}
		]
	};
	
	console.log('Book Cache Entry:', exampleBookEntry);
	console.log('Halaman Cache Entry:', exampleHalamanEntry);
	
	console.log('\n✅ Caching functionality test completed!');
}

/**
 * Performance monitoring function
 */
export function monitorCachePerformance() {
	let requestCount = 0;
	let cacheHitCount = 0;
	
	return {
		recordRequest: (isCacheHit: boolean) => {
			requestCount++;
			if (isCacheHit) cacheHitCount++;
		},
		getStats: () => ({
			totalRequests: requestCount,
			cacheHits: cacheHitCount,
			cacheHitRate: requestCount > 0 ? (cacheHitCount / requestCount) * 100 : 0
		}),
		reset: () => {
			requestCount = 0;
			cacheHitCount = 0;
		}
	};
}

// Performance monitor instance
export const cachePerformanceMonitor = monitorCachePerformance();

/**
 * Clear cache when user logs out
 */
export function clearCacheOnLogout() {
	console.log('👋 User logged out, clearing cache...');
	clearAllCache();
	console.log('✅ Cache cleared on logout');
}

/**
 * Get cache performance insights
 */
export function getCachePerformanceInsights() {
	const perfStats = cachePerformanceMonitor.getStats();
	const cacheStats = getCacheStats();
	
	return {
		performance: perfStats,
		cache: cacheStats,
		recommendations: [
			perfStats.cacheHitRate < 80 ? 'Consider increasing cache duration' : 'Cache hit rate is good',
			cacheStats.bookCacheSize > 50 ? 'Consider clearing old book cache entries' : 'Book cache size is optimal',
			cacheStats.halamanCacheSize > 100 ? 'Consider reducing halaman cache entries' : 'Halaman cache size is optimal'
		]
	};
}