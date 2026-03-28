import React from 'react';
import { FileText, AlertTriangle, User, Shield } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { FighterNote } from '@/shared/types/fighter';

interface FighterNotesProps {
  notes?: FighterNote[];
  className?: string;
}

export const FighterNotes: React.FC<FighterNotesProps> = ({ notes = [], className }) => {
  const getIcon = (type: FighterNote['type']) => {
    switch (type) {
      case 'admin':
        return Shield;
      case 'risk':
        return AlertTriangle;
      case 'user':
        return User;
      default:
        return FileText;
    }
  };

  const getTypeStyles = (type: FighterNote['type']) => {
    switch (type) {
      case 'admin':
        return 'border-primary/30 bg-primary/5';
      case 'risk':
        return 'border-accent/30 bg-accent/5';
      case 'user':
        return 'border-border/50 bg-muted/30';
      default:
        return 'border-border/30 bg-muted/20';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Empty state - block exists but is empty-ready
  if (notes.length === 0) {
    return (
      <div className={cn('glass-card rounded-xl p-6', className)}>
        <h3 className="section-header mb-4">Notes & Context</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No notes available</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Notes will appear here when added
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('glass-card rounded-xl p-6', className)}>
      <h3 className="section-header mb-4">Notes & Context</h3>
      
      <div className="space-y-3">
        {notes.map((note) => {
          const Icon = getIcon(note.type);
          return (
            <div
              key={note.id}
              className={cn(
                'rounded-lg border p-3 transition-colors duration-200',
                getTypeStyles(note.type)
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn(
                  'h-4 w-4 mt-0.5 flex-shrink-0',
                  note.type === 'admin' && 'text-primary',
                  note.type === 'risk' && 'text-accent',
                  note.type === 'user' && 'text-muted-foreground',
                  note.type === 'system' && 'text-muted-foreground'
                )} />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{note.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                    <span className="uppercase tracking-wider font-medium">
                      {note.type}
                    </span>
                    {note.author && (
                      <>
                        <span>•</span>
                        <span>{note.author}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
