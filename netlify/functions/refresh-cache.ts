import { schedule } from '@netlify/functions';
import { refreshCache } from '../../src/lib/server/cache';

// This function runs automatically every hour
const handler = async () => {
    try {
        console.log('🔄 Starting scheduled cache refresh...');
        await refreshCache();
        console.log('✅ Cache refreshed successfully');

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Cache refreshed successfully',
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('❌ Error refreshing cache:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Failed to refresh cache',
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Schedule to run every hour at minute 0
// Cron expression: "0 * * * *" means "at minute 0 of every hour"
export const config = {
    schedule: '0 * * * *' // Every hour
};

export const scheduledHandler = schedule(config.schedule, handler);