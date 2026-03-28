import { useState, useMemo } from 'react';
import { useFighters } from '@/shared/hooks/useFighters';
import { Fighter } from '@/shared/types/fighter';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Search, User, ArrowLeft, Trash2 } from 'lucide-react';
import { FighterEditForm } from './FighterEditForm';
import { cn } from '@/shared/lib/utils';
import { toast } from '@/shared/hooks/use-toast';

export const FighterManager = () => {
  const { fighters, removeFighter } = useFighters();
  const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [weightClassFilter, setWeightClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const organizations = useMemo(() => {
    const orgs = new Set(fighters.map(f => f.organization).filter(Boolean));
    return ['all', ...Array.from(orgs).sort()];
  }, [fighters]);

  const weightClasses = useMemo(() => {
    let filtered = fighters;
    if (orgFilter !== 'all') {
      filtered = fighters.filter(f => f.organization === orgFilter);
    }
    const classes = new Set(filtered.map(f => f.weightClass).filter(Boolean));
    return ['all', ...Array.from(classes).sort()];
  }, [fighters, orgFilter]);

  const filteredFighters = useMemo(() => {
    return fighters.filter(fighter => {
      if (orgFilter !== 'all' && fighter.organization !== orgFilter) return false;
      if (weightClassFilter !== 'all' && fighter.weightClass !== weightClassFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${fighter.firstName} ${fighter.lastName}`.toLowerCase();
        const nickname = fighter.nickname?.toLowerCase() || '';
        if (!fullName.includes(query) && !nickname.includes(query)) return false;
      }
      return true;
    });
  }, [fighters, orgFilter, weightClassFilter, searchQuery]);

  const allFilteredSelected = filteredFighters.length > 0 && filteredFighters.every(f => selectedIds.has(f.id));
  const someFilteredSelected = filteredFighters.some(f => selectedIds.has(f.id));

  const handleOrgChange = (value: string) => {
    setOrgFilter(value);
    setWeightClassFilter('all');
    setSelectedFighter(null);
  };

  const handleWeightClassChange = (value: string) => {
    setWeightClassFilter(value);
    setSelectedFighter(null);
  };

  const handleFighterUpdate = () => {
    setSelectedFighter(null);
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredFighters.forEach(f => next.delete(f.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredFighters.forEach(f => next.add(f.id));
        return next;
      });
    }
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    const ids = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        const res = await fetch(`/api/fighters/${id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) {
          removeFighter(id);
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
    setIsDeleting(false);

    if (successCount > 0) {
      toast({
        title: `${successCount} fighter${successCount !== 1 ? 's' : ''} deleted`,
        description: failCount > 0 ? `${failCount} failed to delete.` : undefined,
      });
    }
    if (failCount > 0 && successCount === 0) {
      toast({ title: 'Delete failed', description: 'Could not delete the selected fighters.', variant: 'destructive' });
    }
  };

  if (selectedFighter) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setSelectedFighter(null)}
          className="gap-2 text-muted-foreground hover:text-foreground"
          data-testid="button-back-to-list"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Fighter List
        </Button>
        <FighterEditForm fighter={selectedFighter} onUpdate={handleFighterUpdate} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Fighter Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-filter">Organization</Label>
              <Select value={orgFilter} onValueChange={handleOrgChange}>
                <SelectTrigger id="org-filter" data-testid="select-organization">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org} value={org}>
                      {org === 'all' ? 'All Organizations' : org}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-class-filter">Weight Class</Label>
              <Select value={weightClassFilter} onValueChange={handleWeightClassChange}>
                <SelectTrigger id="weight-class-filter" data-testid="select-weight-class">
                  <SelectValue placeholder="Select weight class" />
                </SelectTrigger>
                <SelectContent>
                  {weightClasses.map(wc => (
                    <SelectItem key={wc} value={wc}>
                      {wc === 'all' ? 'All Weight Classes' : wc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search Fighter</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Type name to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-fighter"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">
              {filteredFighters.length} Fighter{filteredFighters.length !== 1 ? 's' : ''} Found
              {selectedIds.size > 0 && (
                <span className="ml-2 text-foreground font-medium">· {selectedIds.size} selected</span>
              )}
            </CardTitle>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2"
                data-testid="button-delete-selected"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIds.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredFighters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No fighters match your filters. Try adjusting the search criteria.
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 pb-2 border-b border-border">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    data-testid="checkbox-select-all"
                  />
                  <span className="text-xs text-muted-foreground">
                    {allFilteredSelected ? 'Deselect all' : 'Select all'}
                  </span>
                </div>
                {filteredFighters.map(fighter => (
                  <div
                    key={fighter.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border border-border',
                      'hover:bg-accent/50 transition-colors',
                      selectedIds.has(fighter.id) && 'bg-destructive/5 border-destructive/30'
                    )}
                  >
                    <div onClick={(e) => toggleSelect(fighter.id, e)}>
                      <Checkbox
                        checked={selectedIds.has(fighter.id)}
                        aria-label={`Select ${fighter.firstName} ${fighter.lastName}`}
                        data-testid={`checkbox-fighter-${fighter.id}`}
                      />
                    </div>
                    <button
                      onClick={() => setSelectedFighter(fighter)}
                      className="flex flex-1 items-center gap-3 text-left min-w-0"
                      data-testid={`button-select-fighter-${fighter.id}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {fighter.imageUrl && !fighter.imageUrl.includes('placeholder') ? (
                          <img
                            src={fighter.imageUrl}
                            alt={`${fighter.firstName} ${fighter.lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {fighter.firstName} {fighter.lastName}
                          {fighter.nickname && (
                            <span className="text-muted-foreground ml-2">"{fighter.nickname}"</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {fighter.weightClass} | {fighter.record.wins}-{fighter.record.losses}-{fighter.record.draws}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">
                        {fighter.organization}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} fighter{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size === 1 ? 'this fighter' : `all ${selectedIds.size} selected fighters`} and their fight history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size} fighter${selectedIds.size !== 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
