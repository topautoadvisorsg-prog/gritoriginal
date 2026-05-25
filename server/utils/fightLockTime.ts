const LEGACY_TIMEZONE_OFFSETS: Record<string, string> = {
  UTC: "+00:00",
  GMT: "+00:00",
  EST: "-05:00",
  EDT: "-04:00",
  CST: "-06:00",
  CDT: "-05:00",
  MST: "-07:00",
  MDT: "-06:00",
  PST: "-08:00",
  PDT: "-07:00",
};

function normalizeEventDate(eventDate: string | Date): string {
  if (eventDate instanceof Date) {
    return eventDate.toISOString().slice(0, 10);
  }

  return String(eventDate).slice(0, 10);
}

function parseTimeParts(scheduledTime: string): { hours: number; minutes: number } | null {
  const match = scheduledTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\b/i);
  if (!match) return null;

  let hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return { hours, minutes };
}

function extractTimezoneOffset(scheduledTime: string, fallbackOffset = "+00:00"): string | null {
  const normalized = scheduledTime.trim().toUpperCase();
  const explicitOffset = normalized.match(/(?:UTC|GMT)?\s*([+-]\d{2}:?\d{2})$/);
  if (explicitOffset) {
    const raw = explicitOffset[1];
    return raw.includes(":") ? raw : `${raw.slice(0, 3)}:${raw.slice(3)}`;
  }

  const abbreviation = normalized.match(/\b([A-Z]{2,4})$/)?.[1];
  if (abbreviation && LEGACY_TIMEZONE_OFFSETS[abbreviation]) {
    return LEGACY_TIMEZONE_OFFSETS[abbreviation];
  }

  return fallbackOffset;
}

/**
 * Parses a fight's display time into the UTC instant where picks lock.
 *
 * Preferred input is an event-level UTC lockTime. For legacy scheduled fight
 * strings, this supports "7:00 PM UTC", explicit offsets like "7:00 PM -05:00",
 * and known US abbreviations emitted by the current admin UI.
 */
export function parseFightLockTime(
  eventDate: string | Date,
  scheduledTime: string,
  lockBeforeMinutes: number,
  fallbackOffset = "+00:00",
): Date | null {
  try {
    const timeParts = parseTimeParts(scheduledTime);
    if (!timeParts) return null;

    const offset = extractTimezoneOffset(scheduledTime, fallbackOffset);
    if (!offset) return null;

    const pad = (n: number) => String(n).padStart(2, "0");
    const isoString = `${normalizeEventDate(eventDate)}T${pad(timeParts.hours)}:${pad(timeParts.minutes)}:00${offset}`;
    const fightStart = new Date(isoString);

    if (Number.isNaN(fightStart.getTime())) return null;

    return new Date(fightStart.getTime() - lockBeforeMinutes * 60 * 1000);
  } catch {
    return null;
  }
}
