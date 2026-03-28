import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { anthropicService } from '../services/anthropicService';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPEN_AI_KEY || process.env.OPENAI_API_KEY || 'not-configured',
});

export interface AIPrediction {
    fightId: string;
    fighter1: {
        name: string;
        winProbability: number;
        predictedMethod: string | null;
    };
    fighter2: {
        name: string;
        winProbability: number;
        predictedMethod: string | null;
    };
    predictedWinner: string;
    confidence: 'low' | 'medium' | 'high';
    keyFactors: string[];
    analysis: string;
    model: string;
    generatedAt: Date;
}

export interface FightContext {
    fighter1: {
        id: string;
        name: string;
        record: { wins: number; losses: number; draws: number };
        recentFights: { opponent: string; result: string; method: string }[];
        style: string;
        reach: number | null;
        age: number | null;
        finishRate: number | null;
    };
    fighter2: {
        id: string;
        name: string;
        record: { wins: number; losses: number; draws: number };
        recentFights: { opponent: string; result: string; method: string }[];
        style: string;
        reach: number | null;
        age: number | null;
        finishRate: number | null;
    };
    event: {
        name: string;
        date: string;
        venue: string;
    };
    weightClass: string;
    isTitleFight: boolean;
}

/**
 * Generate AI prediction for a fight
 */
export async function generatePrediction(
    fightId: string,
    context: FightContext
): Promise<AIPrediction> {
    const prompt = buildPrompt(context);
    const systemPrompt = `You are an expert MMA analyst providing fight predictions. 
                Analyze the fighters' records, styles, recent performances, and physical attributes.
                Be objective and data-driven. Return your analysis in the specified JSON format.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('No response from OpenAI');

        const parsed = JSON.parse(content);
        return formatPrediction(fightId, context, parsed, 'gpt-4o-mini');

    } catch (openaiError) {
        logger.warn('OpenAI prediction failed, trying Anthropic fallback...', openaiError);

        try {
            const anthropicResponse = await anthropicService.generateMessage(systemPrompt, prompt);
            const content = (anthropicResponse.content[0] as any).text;
            if (!content) throw new Error('No response from Anthropic');

            // Anthropic doesn't support response_format: 'json_object' natively in the same way,
            // so we might need to extract JSON if it's wrapped in markers.
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);

            return formatPrediction(fightId, context, parsed, 'claude-3-5-sonnet');
        } catch (anthropicError) {
            logger.error('Both OpenAI and Anthropic predictions failed');
            throw anthropicError;
        }
    }
}

function formatPrediction(fightId: string, context: FightContext, parsed: any, model: string): AIPrediction {
    return {
        fightId,
        fighter1: {
            name: context.fighter1.name,
            winProbability: parsed.fighter1WinProb || 50,
            predictedMethod: parsed.fighter1Method || null,
        },
        fighter2: {
            name: context.fighter2.name,
            winProbability: parsed.fighter2WinProb || 50,
            predictedMethod: parsed.fighter2Method || null,
        },
        predictedWinner: parsed.predictedWinner || context.fighter1.name,
        confidence: parsed.confidence || 'medium',
        keyFactors: parsed.keyFactors || [],
        analysis: parsed.analysis || '',
        model: model,
        generatedAt: new Date(),
    };
}

function buildPrompt(context: FightContext): string {
    const f1 = context.fighter1;
    const f2 = context.fighter2;

    return `Analyze this MMA fight and provide a prediction:

## Fight Details
- Event: ${context.event.name} (${context.event.date})
- Weight Class: ${context.weightClass}
- Title Fight: ${context.isTitleFight ? 'Yes' : 'No'}

## Fighter 1: ${f1.name}
- Record: ${f1.record.wins}-${f1.record.losses}-${f1.record.draws}
- Style: ${f1.style || 'Unknown'}
- Reach: ${f1.reach || 'Unknown'} inches
- Age: ${f1.age || 'Unknown'}
- Finish Rate: ${f1.finishRate ? (f1.finishRate * 100).toFixed(0) + '%' : 'Unknown'}
- Recent Fights: ${f1.recentFights.map(f => `${f.result} vs ${f.opponent} (${f.method})`).join(', ') || 'None'}

## Fighter 2: ${f2.name}
- Record: ${f2.record.wins}-${f2.record.losses}-${f2.record.draws}
- Style: ${f2.style || 'Unknown'}
- Reach: ${f2.reach || 'Unknown'} inches
- Age: ${f2.age || 'Unknown'}
- Finish Rate: ${f2.finishRate ? (f2.finishRate * 100).toFixed(0) + '%' : 'Unknown'}
- Recent Fights: ${f2.recentFights.map(f => `${f.result} vs ${f.opponent} (${f.method})`).join(', ') || 'None'}

Respond with JSON in this exact format:
{
  "predictedWinner": "Fighter Name",
  "fighter1WinProb": 55,
  "fighter2WinProb": 45,
  "fighter1Method": "KO/TKO",
  "fighter2Method": "Decision",
  "confidence": "medium",
  "keyFactors": ["factor 1", "factor 2", "factor 3"],
  "analysis": "2-3 sentence analysis explaining the prediction"
}`;
}

export { openai };
