import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useFighters } from '@/shared/hooks/useFighters';
import {
    Tags, Plus, Trash2, Save, Loader2, Search, User, Palette
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Fighter } from '@/shared/types/fighter';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            ...options.headers,
            'Content-Type': 'application/json',
        },
    });
}

interface TagDefinition {
    id: string;
    name: string;
    description: string | null;
    category: string;
    sortOrder: number;
}

const TAG_CATEGORIES = ['Striking', 'Grappling', 'Athleticism', 'Fight IQ', 'Intangibles'];

interface FighterTag {
    id: string;
    fighterId: string;
    tagDefinitionId: string;
    value: number;
    color: string;
}

export const AdminTagManager: React.FC = () => {
    const queryClient = useQueryClient();
    const { fighters } = useFighters();
    const [selectedFighter, setSelectedFighter] = useState<Fighter | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagDesc, setNewTagDesc] = useState('');
    const [newTagCategory, setNewTagCategory] = useState('Intangibles');

    // Fetch tag definitions
    const { data: tagDefinitions = [], isLoading: defsLoading } = useQuery<TagDefinition[]>({
        queryKey: ['/api/tags/definitions'],
    });

    // Fetch fighter's tags when selected
    const { data: fighterTags = [] } = useQuery<FighterTag[]>({
        queryKey: [`/api/tags/fighter/${selectedFighter?.id}`],
        enabled: !!selectedFighter,
    });

    // Create tag definition
    const createDefMutation = useMutation({
        mutationFn: async () => {
            const res = await fetchWithAuth('/api/tags/definitions', {
                method: 'POST',
                body: JSON.stringify({ name: newTagName, description: newTagDesc, category: newTagCategory }),
            });
            if (!res.ok) throw new Error('Failed to create tag definition');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/tags/definitions'] });
            setNewTagName('');
            setNewTagDesc('');
        },
    });

    // Delete tag definition
    const deleteDefMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetchWithAuth(`/api/tags/definitions/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/tags/definitions'] }),
    });

    // Assign tag to fighter
    const assignMutation = useMutation({
        mutationFn: async ({ tagDefinitionId, value, color }: { tagDefinitionId: string; value: number; color: string }) => {
            const res = await fetchWithAuth(`/api/tags/fighter/${selectedFighter!.id}`, {
                method: 'POST',
                body: JSON.stringify({ tagDefinitionId, value, color }),
            });
            if (!res.ok) throw new Error('Failed to assign tag');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/tags/fighter/${selectedFighter?.id}`] }),
    });

    // Remove tag from fighter
    const removeMutation = useMutation({
        mutationFn: async (tagId: string) => {
            const res = await fetchWithAuth(`/api/tags/${tagId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to remove tag');
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [`/api/tags/fighter/${selectedFighter?.id}`] }),
    });

    const filteredFighters = fighters.filter((f) => {
        if (!searchQuery) return true;
        const name = `${f.firstName} ${f.lastName}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
    });

    const getTagValue = (defId: string): FighterTag | undefined => {
        return fighterTags.find(t => t.tagDefinitionId === defId);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Tag Definitions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-primary" />
                            Tag Definitions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Create new tag def */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Tag name (e.g. Striking)"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Description"
                                    value={newTagDesc}
                                    onChange={(e) => setNewTagDesc(e.target.value)}
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={newTagCategory} onValueChange={setNewTagCategory}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TAG_CATEGORIES.map(cat => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    disabled={!newTagName.trim() || createDefMutation.isPending}
                                    onClick={() => createDefMutation.mutate()}
                                >
                                    <Plus className="h-4 w-4 mr-1" /> Add Tag
                                </Button>
                            </div>
                        </div>

                        {defsLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-2">
                                    {tagDefinitions.map((def) => (
                                        <div
                                            key={def.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                                        >
                                            <div>
                                                <span className="font-medium text-sm">{def.name}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{def.category}</span>
                                                    {def.description && (
                                                        <span className="text-xs text-muted-foreground">• {def.description}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => deleteDefMutation.mutate(def.id)}
                                                disabled={deleteDefMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                    {tagDefinitions.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                            No tag definitions yet. Create one above.
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Assign Tags to Fighter */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Assign Tags to Fighter
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Fighter search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search fighter..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {!selectedFighter ? (
                            <ScrollArea className="h-[250px]">
                                <div className="space-y-1">
                                    {filteredFighters.slice(0, 50).map((f) => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFighter(f)}
                                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-left text-sm transition-colors"
                                        >
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{f.firstName} {f.lastName}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{f.weightClass}</span>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">
                                        {selectedFighter.firstName} {selectedFighter.lastName}
                                    </span>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedFighter(null)}>
                                        Change
                                    </Button>
                                </div>

                                {/* Tag assignment for each definition */}
                                <ScrollArea className="h-[250px]">
                                    <div className="space-y-3">
                                        {tagDefinitions.map((def) => {
                                            const existing = getTagValue(def.id);
                                            return (
                                                <TagAssignRow
                                                    key={def.id}
                                                    definition={def}
                                                    existing={existing}
                                                    onAssign={(value, color) => assignMutation.mutate({ tagDefinitionId: def.id, value, color })}
                                                    onRemove={existing ? () => removeMutation.mutate(existing.id) : undefined}
                                                    isAssigning={assignMutation.isPending}
                                                />
                                            );
                                        })}
                                        {tagDefinitions.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                Create tag definitions first
                                            </p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

interface TagAssignRowProps {
    definition: TagDefinition;
    existing?: FighterTag;
    onAssign: (value: number, color: string) => void;
    onRemove?: () => void;
    isAssigning: boolean;
}

const TAG_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

const TagAssignRow: React.FC<TagAssignRowProps> = ({ definition, existing, onAssign, onRemove, isAssigning }) => {
    const [value, setValue] = useState(existing?.value || 5);
    const [color, setColor] = useState(existing?.color || '#3b82f6');

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-border">
            <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{definition.name}</span>
            </div>
            <input
                type="range"
                min={1}
                max={10}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-24"
            />
            <span className="text-xs font-mono w-6 text-center">{value}</span>
            <div className="flex gap-1">
                {TAG_COLORS.slice(0, 4).map((c) => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn(
                            "w-4 h-4 rounded-full border-2 transition-all",
                            color === c ? "border-foreground scale-125" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            <Button
                size="sm"
                variant="outline"
                disabled={isAssigning}
                onClick={() => onAssign(value, color)}
                className="h-7 px-2"
            >
                <Save className="h-3 w-3" />
            </Button>
            {onRemove && (
                <Button size="sm" variant="ghost" onClick={onRemove} className="h-7 px-2">
                    <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
            )}
        </div>
    );
};

export default AdminTagManager;
