import { cn } from '@/shared/lib/utils';
import { COUNTRIES } from '@/shared/lib/countries';

interface CountryFlagProps {
  country?: string | null;
  className?: string;
}

export function CountryFlag({ country, className }: CountryFlagProps) {
  const normalized = country?.trim();
  if (!normalized) return null;

  const match = COUNTRIES.find((item) =>
    item.code.toLowerCase() === normalized.toLowerCase()
    || item.name.toLowerCase() === normalized.toLowerCase()
  );

  if (!match) return null;

  return (
    <span
      className={cn('fi', `fi-${match.code.toLowerCase()}`, className)}
      title={match.name}
      role="img"
      aria-label={`${match.name} flag`}
    />
  );
}
