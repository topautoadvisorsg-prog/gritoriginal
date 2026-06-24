import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tags, Plus, Save, Loader2, Edit2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
// Redefine Tag interface locally to stay self-contained
interface Tag {
    id: string;
    name: string;
    color: string;
    category: string;
    active: boolean;
    createdAt: string;
}

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

export const AdminNewsTagManager: React.FC = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    // Create form state
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#eab308'); // gold
    const [newTagCategory, setNewTagCategory] = useState<'standard' | 'intelligence'>('standard');

    // Edit state
    const [editingTag, setEditingTag] = useState<Tag | null>(null);

    const { data: tags = [], isLoading } = useQuery<Tag[]>({
        queryKey: ['/api/admin/tags'],
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await fetchWithAuth('/api/admin/tags', {
                method: 'POST',
                body: JSON.stringify({ name: newTagName, color: newTagColor, category: newTagCategory }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create tag');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/tags'] });
            setNewTagName('');
            toast({ title: 'Tag created successfully' });
        },
        onError: (err: Error) => {
            toast({ title: 'Error creating tag', description: err.message, variant: 'destructive' });
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: Partial<Tag> }) => {
            const res = await fetchWithAuth(`/api/admin/tags/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update tag');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/tags'] });
            setEditingTag(null);
            toast({ title: 'Tag updated successfully' });
        },
        onError: (err: Error) => {
            toast({ title: 'Error updating tag', description: err.message, variant: 'destructive' });
        }
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5 text-primary" />
                        News Tag Management
                    </CardTitle>
                    <CardDescription>
                        Create and manage tags used for filtering news articles and intelligence signals.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Create Form */}
                    <div className="bg-muted/30 p-4 rounded-lg border border-border space-y-4">
                        <h3 className="font-medium text-sm">Create New Tag</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Tag Name</Label>
                                <Input 
                                    placeholder="e.g. fight-announcement" 
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={newTagCategory} onValueChange={(v: string) => setNewTagCategory(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="standard">Standard News</SelectItem>
                                        <SelectItem value="intelligence">Intelligence Signal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Color Hex</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        type="color" 
                                        className="w-12 h-10 p-1 cursor-pointer"
                                        value={newTagColor}
                                        onChange={(e) => setNewTagColor(e.target.value)}
                                    />
                                    <Input 
                                        className="flex-1 font-mono uppercase"
                                        value={newTagColor}
                                        onChange={(e) => setNewTagColor(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button 
                                className="w-full"
                                disabled={!newTagName.trim() || createMutation.isPending}
                                onClick={() => createMutation.mutate()}
                            >
                                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                Create Tag
                            </Button>
                        </div>
                    </div>

                    {/* Tag List */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm">Existing Tags</h3>
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {tags.map(tag => (
                                    <div key={tag.id} className={cn(
                                        "flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border transition-colors",
                                        !tag.active ? "bg-muted/50 border-border/50 opacity-70" : "bg-card border-border shadow-sm",
                                        editingTag?.id === tag.id && "ring-2 ring-primary border-transparent"
                                    )}>
                                        {editingTag?.id === tag.id ? (
                                            // EDIT MODE
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-end w-full">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Name</Label>
                                                    <Input 
                                                        value={editingTag.name}
                                                        onChange={(e) => setEditingTag({...editingTag, name: e.target.value})}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Category</Label>
                                                    <Select 
                                                        value={editingTag.category} 
                                                        onValueChange={(v: string) => setEditingTag({...editingTag, category: v})}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="standard">Standard</SelectItem>
                                                            <SelectItem value="intelligence">Intelligence</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Color</Label>
                                                    <div className="flex gap-2">
                                                        <Input 
                                                            type="color" 
                                                            className="w-10 h-10 p-1 cursor-pointer"
                                                            value={editingTag.color || '#000000'}
                                                            onChange={(e) => setEditingTag({...editingTag, color: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => updateMutation.mutate({ id: tag.id, data: { name: editingTag.name, color: editingTag.color, category: editingTag.category } })}
                                                        disabled={updateMutation.isPending}
                                                    >
                                                        <Save className="h-4 w-4 mr-1" /> Save
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => setEditingTag(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            // VIEW MODE
                                            <>
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div 
                                                        className="w-4 h-4 rounded-full border shadow-sm"
                                                        style={{ backgroundColor: tag.color || '#ccc' }}
                                                    />
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-base">{tag.name}</span>
                                                            {!tag.active && <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">Deactivated</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border",
                                                                tag.category === 'intelligence' 
                                                                    ? "border-amber-500/30 text-amber-500 bg-amber-500/10" 
                                                                    : "border-blue-500/30 text-blue-500 bg-blue-500/10"
                                                            )}>
                                                                {tag.category}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground font-mono">{tag.color}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 mt-4 md:mt-0">
                                                    <div className="flex items-center gap-2 mr-4 border-r pr-4">
                                                        <Label htmlFor={`active-${tag.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                                            {tag.active ? 'Active' : 'Hidden'}
                                                        </Label>
                                                        <Switch 
                                                            id={`active-${tag.id}`}
                                                            checked={tag.active}
                                                            onCheckedChange={(checked) => updateMutation.mutate({ id: tag.id, data: { active: checked } })}
                                                            disabled={updateMutation.isPending}
                                                        />
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => setEditingTag(tag)}
                                                        disabled={updateMutation.isPending}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                {tags.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No tags found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminNewsTagManager;
