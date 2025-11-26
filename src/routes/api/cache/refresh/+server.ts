import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { refreshCache, getCacheAge } from '$lib/server/cache';

export const POST: RequestHandler = async ({ request }) => {
    try {
        // Optional: Add authentication here to prevent unauthorized cache refresh
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CACHE_REFRESH_TOKEN}`) {
        //   return json({ error: 'Unauthorized' }, { status: 401 });
        // }

        await refreshCache();

        return json({
            success: true,
            message: 'Cache refreshed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error refreshing cache:', error);
        return json({
            success: false,
            error: 'Failed to refresh cache'
        }, { status: 500 });
    }
};

export const GET: RequestHandler = async () => {
    try {
        const cacheAge = getCacheAge();

        return json({
            cacheAge: cacheAge ? `${cacheAge} minutes old` : 'No cache available',
            cacheAgeMinutes: cacheAge
        });
    } catch (error) {
        console.error('Error getting cache status:', error);
        return json({
            error: 'Failed to get cache status'
        }, { status: 500 });
    }
};