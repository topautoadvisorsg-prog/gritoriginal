import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger';

const anthropicApiKey = process.env.ANTHROPIC_API_KEY || '';

if (!anthropicApiKey) {
    logger.warn('ANTHROPIC_API_KEY is not set. Anthropic functionality will be disabled.');
}

const anthropic = anthropicApiKey ? new Anthropic({
    apiKey: anthropicApiKey,
}) : null;

export const anthropicService = {
    /**
     * Generates a message using the Anthropic API.
     * @param systemPrompt The system prompt to guide the AI behavior.
     * @param userMessage The user message or question.
     * @param model Assistant model (default: 'claude-3-5-sonnet-20240620').
     */
    async generateMessage(systemPrompt: string, userMessage: string, model: string = 'claude-3-5-sonnet-20240620') {
        if (!anthropic) {
            throw new Error('Anthropic service is not configured');
        }

        try {
            const response = await anthropic.messages.create({
                model,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }],
            });

            return response;
        } catch (error) {
            logger.error('Error generating message with Anthropic:', error);
            throw error;
        }
    },

    /**
     * Generates a streaming message using the Anthropic API.
     */
    async generateMessageStream(systemPrompt: string, userMessage: string, model: string = 'claude-3-5-sonnet-20240620') {
        if (!anthropic) {
            throw new Error('Anthropic service is not configured');
        }

        return anthropic.messages.stream({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        });
    },
};

export default anthropic;
