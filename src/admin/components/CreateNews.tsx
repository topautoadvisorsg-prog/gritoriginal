import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/hooks/use-toast';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Loader2, Plus, Trash2, Save, X, Newspaper, Edit, Calendar } from 'lucide-react';
import { NewsArticle } from '@/shared/types/fighter';
import { format } from 'date-fns';

interface NewsFormData {
  title: string;
  subtitle: string;
  excerpt: string;
  content: string;
  author: string;
  imageUrl: string;
  tags: string[];
  eventReference: string;
  fighterReference: string;
  readTime: string;
  isPublished: boolean;
  publishedAt: string;
}

const initialFormData: NewsFormData = {
  title: '',
  subtitle: '',
  excerpt: '',
  content: '',
  author: 'GRIT Staff',
  imageUrl: '',
  tags: [],
  eventReference: '',
  fighterReference: '',
  readTime: '5 min read',
  isPublished: true,
  publishedAt: new Date().toISOString(),
};

export const CreateNews = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<NewsFormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: articles = [], isLoading } = useQuery<NewsArticle[]>({
    queryKey: ['/api/admin/news'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewsFormData) => {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create article');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Article created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/news'] });
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewsFormData> }) => {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update article');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Article updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/news'] });
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete article');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Article deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/news'] });
      queryClient.invalidateQueries({ queryKey: ['/api/news'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingArticle(null);
    setShowForm(false);
    setTagInput('');
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      subtitle: article.subtitle || '',
      excerpt: article.excerpt,
      content: article.content,
      author: article.author,
      imageUrl: article.imageUrl || '',
      tags: article.tags as string[],
      eventReference: article.eventReference || '',
      fighterReference: article.fighterReference || '',
      readTime: article.readTime || '',
      isPublished: article.isPublished,
      publishedAt: article.publishedAt,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      toast({ title: 'Error', description: 'Title, excerpt, and content are required', variant: 'destructive' });
      return;
    }

    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-display tracking-wide text-foreground">
            Manage News
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage news articles for the platform
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2" data-testid="button-create-article">
            <Plus className="h-4 w-4" />
            New Article
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm} data-testid="button-cancel-form">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Article title"
                    data-testid="input-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    placeholder="Optional subtitle"
                    data-testid="input-subtitle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary shown in article cards"
                  rows={2}
                  data-testid="input-excerpt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Full article content. Use ## for headings, ### for subheadings"
                  rows={10}
                  data-testid="input-content"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    data-testid="input-author"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="readTime">Read Time</Label>
                  <Input
                    id="readTime"
                    value={formData.readTime}
                    onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                    placeholder="5 min read"
                    data-testid="input-read-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                    data-testid="input-image-url"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventReference">Event Reference</Label>
                  <Input
                    id="eventReference"
                    value={formData.eventReference}
                    onChange={(e) => setFormData({ ...formData, eventReference: e.target.value })}
                    placeholder="UFC 300"
                    data-testid="input-event-reference"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fighterReference">Fighter Reference</Label>
                  <Input
                    id="fighterReference"
                    value={formData.fighterReference}
                    onChange={(e) => setFormData({ ...formData, fighterReference: e.target.value })}
                    placeholder="Conor McGregor"
                    data-testid="input-fighter-reference"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    data-testid="input-tag"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag} data-testid="button-add-tag">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  data-testid="switch-published"
                />
                <Label htmlFor="isPublished">Published</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isPending} className="gap-2" data-testid="button-save-article">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {editingArticle ? 'Update Article' : 'Create Article'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Articles ({articles.length})</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No articles yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Create your first article to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {articles.map((article) => (
              <Card key={article.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{article.title}</h3>
                        {!article.isPublished && (
                          <Badge variant="outline" className="text-xs">Draft</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(article.publishedAt), 'MMM d, yyyy')}
                        </span>
                        <span>{article.author}</span>
                        {article.tags.length > 0 && (
                          <span className="flex gap-1">
                            {(article.tags as string[]).slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(article)}
                        data-testid={`button-edit-${article.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => deleteMutation.mutate(article.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${article.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
