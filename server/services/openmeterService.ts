import { OpenMeter } from '@openmeter/sdk';
import { logger } from '../utils/logger';

const openmeterApiKey = process.env.OPENMETER_API_KEY || '';

if (!openmeterApiKey) {
    logger.warn('OPENMETER_API_KEY is not set. Usage tracking will be disabled.');
}

const client = openmeterApiKey ? new OpenMeter({
    baseUrl: process.env.OPENMETER_BASE_URL || 'https://openmeter.cloud',
    apiKey: openmeterApiKey,
}) : null;

export const openmeterService = {
    /**
     * Tracks usage of a specific feature for a user.
     * @param userId The ID of the user.
     * @param feature The feature identifier (e.g., 'ai_prediction').
     * @param amount The numerical amount of usage (default: 1).
     */
    async trackUsage(userId: string, feature: string, amount: number = 1) {
        if (!client) return;

        try {
            await client.events.ingest({
                specversion: '1.0',
                type: feature,
                source: 'grit-api',
                subject: userId,
                data: {
                    amount,
                },
            });
            logger.info(`Tracked usage: ${feature} for user ${userId}`);
        } catch (error) {
            logger.error('Error tracking usage with OpenMeter:', error);
        }
    },
};

export default client;
