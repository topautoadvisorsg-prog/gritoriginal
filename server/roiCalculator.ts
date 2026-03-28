/**
 * ROI Calculator — American Odds format
 * 
 * Negative odds (favorite): profit = (units / absOdds) * 100
 * Positive odds (underdog): profit = (units * odds) / 100
 * Default: 1 unit per pick
 */

export function calculateProfit(odds: string, units: number = 1): number {
    const numOdds = parseFloat(odds.replace('+', ''));
    if (isNaN(numOdds) || numOdds === 0) return 0;

    if (numOdds > 0) {
        // Underdog: +200 means $100 bet wins $200
        return (units * numOdds) / 100;
    } else {
        // Favorite: -150 means $150 bet wins $100
        return (units * 100) / Math.abs(numOdds);
    }
}

/**
 * Calculate implied probability from American odds
 */
export function impliedProbability(odds: string): number {
    const numOdds = parseFloat(odds.replace('+', ''));
    if (isNaN(numOdds) || numOdds === 0) return 0;

    if (numOdds > 0) {
        return 100 / (numOdds + 100);
    } else {
        return Math.abs(numOdds) / (Math.abs(numOdds) + 100);
    }
}

/**
 * Format profit for display: +1.50 or -0.67
 */
export function formatProfit(profit: number): string {
    const sign = profit >= 0 ? '+' : '';
    return `${sign}${profit.toFixed(2)}u`;
}
