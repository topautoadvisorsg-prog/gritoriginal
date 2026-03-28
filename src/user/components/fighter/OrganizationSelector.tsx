import React from 'react';
import { Organization } from '@/shared/types/fighter';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';

interface OrganizationSelectorProps {
  selected: Organization;
  onChange: (org: Organization) => void;
}

const organizations: { id: Organization; label: string; available: boolean }[] = [
  { id: 'UFC', label: 'UFC', available: true },
  { id: 'ONE', label: 'ONE', available: false },
  { id: 'PFL', label: 'PFL', available: false },
  { id: 'Bellator', label: 'Bellator', available: false },
];

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  selected,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted/30 rounded-lg border border-border/50">
      {organizations.map((org) => (
        <Button
          key={org.id}
          variant="ghost"
          size="sm"
          disabled={!org.available}
          onClick={() => org.available && onChange(org.id)}
          className={cn(
            'relative px-4 py-2 rounded-md transition-all duration-200',
            'font-display tracking-wide uppercase text-sm',
            selected === org.id && org.available
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
              : 'text-muted-foreground hover:text-foreground',
            !org.available && 'opacity-40 cursor-not-allowed'
          )}
        >
          {org.label}
          {!org.available && (
            <span className="absolute -top-1 -right-1 text-[8px] bg-accent/80 text-accent-foreground px-1 rounded">
              Soon
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};
