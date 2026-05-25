export function pointsAwardedToNetUnits(pointsAwarded: number | null | undefined): number {
    return Number(pointsAwarded || 0) / 100;
}

export function pointsAwardedToMoney(pointsAwarded: number | null | undefined, unitSize: number): number {
    return pointsAwardedToNetUnits(pointsAwarded) * unitSize;
}
