import { cn } from '@/shared/lib/utils';
import { COUNTRIES, normalizeCountryCode } from '@/shared/lib/countries';

interface CountryFlagProps {
  country?: string | null;
  className?: string;
}

export function CountryFlag({ country, className }: CountryFlagProps) {
  const code = normalizeCountryCode(country);
  const match = COUNTRIES.find((item) => item.code === code);

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
