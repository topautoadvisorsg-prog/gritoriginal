import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Loader2, Upload, Clock, CheckCircle2, XCircle, Trash2, ImagePlus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

interface Slip {
    id: string;
    imageUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    daysRemaining: number;
    rejectionMessage?: string | null;
    createdAt: string;
}

const STATUS_CONFIG = {
    pending: { label: 'Pending Review', icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    approved: { label: 'Approved', icon: CheckCircle2, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    rejected: { label: 'Rejected', icon: XCircle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
};

const SLIP_STATUSES: Slip['status'][] = ['pending', 'approved', 'rejected'];

export function MySlipsTab() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const { data: slips = [], isLoading } = useQuery<Slip[]>({
        queryKey: ['/api/slips/mine'],
        queryFn: () => fetch('/api/slips/mine', { credentials: 'include' }).then(r => r.json()),
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const form = new FormData();
            form.append('slip', file);
            const res = await fetch('/api/slips/upload', {
                method: 'POST',
                credentials: 'include',
                body: form,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Upload failed' }));
                throw new Error(err.error || 'Upload failed');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/slips/mine'] });
            setUploadPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast({ title: 'Slip uploaded!', description: 'Your slip is pending admin review.' });
        },
        onError: (err: Error) => {
            toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/slips/${id}`, { method: 'DELETE', credentials: 'include' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Delete failed' }));
                throw new Error(err.error || 'Delete failed');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/slips/mine'] });
            toast({ title: 'Slip deleted' });
        },
        onError: (err: Error) => {
            toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
        },
    });

    const handleFile = (file: File) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast({ title: 'Invalid file type', description: 'Only JPG, PNG, and WebP are allowed.', variant: 'destructive' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setUploadPreview(e.target?.result as string);
        reader.readAsDataURL(file);
        uploadMutation.mutate(file);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const grouped = SLIP_STATUSES.reduce((acc, status) => {
        acc[status] = slips.filter(s => s.status === status);
        return acc;
    }, {} as Record<string, Slip[]>);

    return (
        <div className="space-y-5">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ImagePlus className="w-5 h-5 text-yellow-500" />
                        Upload a Betting Slip
                    </CardTitle>
                    <CardDescription>Share your biggest wins with the community</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                        style={{
                            borderColor: dragOver ? 'rgba(232,160,32,0.6)' : 'rgba(255,255,255,0.1)',
                            background: dragOver ? 'rgba(232,160,32,0.04)' : 'rgba(255,255,255,0.02)',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        {uploadMutation.isPending ? (
                            <>
                                <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                                <p className="text-sm text-muted-foreground">Uploading…</p>
                            </>
                        ) : uploadPreview ? (
                            <img src={uploadPreview} alt="Preview" className="max-h-40 rounded-lg object-contain" />
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-white/30" />
                                <div className="text-center">
                                    <p className="text-sm font-medium text-white/70">Click or drag to upload</p>
                                    <p className="text-xs text-white/30 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
                                </div>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleInputChange}
                            disabled={uploadMutation.isPending}
                        />
                    </div>

                    <div
                        className="flex items-start gap-2.5 p-3 rounded-lg border"
                        style={{ background: 'rgba(232,160,32,0.06)', borderColor: 'rgba(232,160,32,0.2)' }}
                    >
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-200/70 leading-relaxed">
                            Your slip will be available for <strong className="text-yellow-400">7 days</strong> and then permanently deleted. Bragging rights have an expiry.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-5 h-5 animate-spin text-yellow-500 mr-2" />
                    <span className="text-muted-foreground text-sm">Loading your slips…</span>
                </div>
            ) : slips.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                    No slips uploaded yet. Upload your first big win above.
                </div>
            ) : (
                SLIP_STATUSES.map(status => {
                    const group = grouped[status];
                    if (group.length === 0) return null;
                    const cfg = STATUS_CONFIG[status];
                    const Icon = cfg.icon;
                    return (
                        <div key={status}>
                            <div className="flex items-center gap-2 mb-3">
                                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
                                <h3 className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</h3>
                                <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                                    {group.length}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                                {group.map(slip => (
                                    <div
                                        key={slip.id}
                                        className="relative rounded-xl overflow-hidden border group"
                                        style={{ borderColor: cfg.border, background: cfg.bg }}
                                    >
                                        <div className="aspect-[4/3] relative overflow-hidden">
                                            <img
                                                src={slip.imageUrl}
                                                alt="Bet slip"
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <div
                                                className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase"
                                                style={{ background: cfg.color, color: status === 'approved' ? '#052e16' : status === 'pending' ? '#1c1400' : '#fff' }}
                                            >
                                                {slip.daysRemaining}d left
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            {status === 'rejected' && (
                                                <p className="text-[10px] text-red-400/80 mb-1">Slip not approved for posting.</p>
                                            )}
                                            {(status === 'pending' || status === 'rejected') && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="w-full h-7 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
                                                    disabled={deleteMutation.isPending}
                                                    onClick={() => deleteMutation.mutate(slip.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
