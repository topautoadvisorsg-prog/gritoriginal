import { useState, useRef, useEffect } from 'react';
import { Input } from './input';

interface ComboInputProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
  className?: string;
  'data-testid'?: string;
}

export function ComboInput({ value, onChange, options, placeholder, id, className, ...props }: ComboInputProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes((filter || value).toLowerCase()));

  return (
    <div className="relative" ref={ref}>
      <Input
        id={id}
        className={className}
        data-testid={props['data-testid']}
        placeholder={placeholder}
        value={value}
        onChange={e => { onChange(e.target.value); setFilter(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onMouseDown={e => { e.preventDefault(); onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
