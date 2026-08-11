import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Settings, Save, Database, Key, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

export const AdminSystemSettings = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Configuration
                </CardTitle>
                <CardDescription>
                    Manage global platform settings. Changes affect ALL users immediately.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <DataEngineConfigSection />
                <SupabaseConfigSection />
                <ApiKeysConfigSection />
                <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground italic">
                        Secrets are managed in the deployment environment. This page reports configuration status only.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

async function savePipelineConfig(key: string, value: string, description: string) {
    const res = await fetch('/api/admin/pipeline/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value, description }),
    });
    if (!res.ok) throw new Error('Failed to save config');
}

async function fetchPipelineConfig(key: string) {
    const res = await fetch(`/api/admin/pipeline/config/${key}`, { credentials: 'include' });
    if (res.status === 404) return { value: '' };
    if (!res.ok) throw new Error('Failed to fetch config');
    return res.json();
}

const DataEngineConfigSection = () => {
    const { data: config, isLoading } = useQuery({
        queryKey: ['/api/admin/pipeline/config/DATA_ENGINE_API_KEY'],
        queryFn: () => fetchPipelineConfig('DATA_ENGINE_API_KEY'),
    });

    return (
        <div className="space-y-4 pt-6 border-t">
            <div className="space-y-1">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Data Engine Synchronization
                </h3>
                <p className="text-sm text-muted-foreground">
                    Connect Server 1 (Data Engine) to this app. Controls inbound webhook auth and apply behaviour.
                </p>
            </div>

            <div className="grid gap-4 p-4 border rounded-lg bg-muted/10">
                {/* API Key */}
                <div className="space-y-2">
                    <Label htmlFor="api_key">Webhook API Key (x-data-engine-api-key)</Label>
                    <p className="text-xs text-muted-foreground">
                        Managed as <code>DATA_ENGINE_API_KEY</code> in the deployment environment.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Status:{' '}
                        {!isLoading && (config?.configured || config?.value)
                            ? <span className="text-green-500 font-bold">CONFIGURED</span>
                            : <span className="text-amber-500 font-bold">NOT SET</span>}
                    </p>
                </div>

                {/* Mandatory review policy */}
                <div className="flex items-center justify-between pt-2 border-t">
                    <div className="space-y-0.5">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            Operator Review Required
                            <span className="text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono">LOCKED</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Incoming data is staged as pending and cannot write to canonical tables until an authenticated administrator reviews, approves, and applies it.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SupabaseField {
    id: string;
    label: string;
    key: string;
    placeholder: string;
    hint: string;
    secret: boolean;
}

const SUPABASE_FIELDS: SupabaseField[] = [
    {
        id: 'supabase_url',
        label: 'Supabase Project URL',
        key: 'SUPABASE_URL',
        placeholder: 'https://xxxxxxxxxxx.supabase.co',
        hint: 'Found in Supabase → Project Settings → API',
        secret: false,
    },
    {
        id: 'supabase_api_key',
        label: 'Supabase Service Role Key',
        key: 'SUPABASE_API_KEY',
        placeholder: 'sb_secret_...',
        hint: 'Service role key — grants full write access. Keep secret.',
        secret: true,
    },
    {
        id: 'supabase_anon_key',
        label: 'Supabase Anon Key',
        key: 'SUPABASE_ANON_KEY',
        placeholder: 'eyJ...',
        hint: 'Public anon key for read-only operations.',
        secret: true,
    },
];

const SupabaseConfigSection = () => {
    const { toast } = useToast();
    const [values, setValues] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<Record<string, boolean>>({});

    const urlQ = useQuery({ queryKey: ['/api/admin/pipeline/config/SUPABASE_URL'], queryFn: () => fetchPipelineConfig('SUPABASE_URL') });
    const apiKeyQ = useQuery({ queryKey: ['/api/admin/pipeline/config/SUPABASE_API_KEY'], queryFn: () => fetchPipelineConfig('SUPABASE_API_KEY') });
    const anonKeyQ = useQuery({ queryKey: ['/api/admin/pipeline/config/SUPABASE_ANON_KEY'], queryFn: () => fetchPipelineConfig('SUPABASE_ANON_KEY') });

    const queryMap: Record<string, typeof urlQ> = {
        SUPABASE_URL: urlQ,
        SUPABASE_API_KEY: apiKeyQ,
        SUPABASE_ANON_KEY: anonKeyQ,
    };

    const handleSave = async (field: SupabaseField) => {
        if (field.secret) return;
        const val = values[field.key];
        if (!val) return;
        setSaving((s) => ({ ...s, [field.key]: true }));
        try {
            await savePipelineConfig(field.key, val, field.label);
            toast({ title: 'Saved', description: `${field.label} updated.` });
            setValues((v) => ({ ...v, [field.key]: '' }));
        } catch {
            toast({ title: 'Error', description: `Failed to save ${field.label}.`, variant: 'destructive' });
        } finally {
            setSaving((s) => ({ ...s, [field.key]: false }));
        }
    };

    return (
        <div className="space-y-4 pt-6 border-t">
            <div className="space-y-1">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Supabase Outbound Sync
                </h3>
                <p className="text-sm text-muted-foreground">
                    Credentials used to push fighter, event, and fight result data to the shared Supabase instance.
                </p>
            </div>

            <div className="grid gap-4 p-4 border rounded-lg bg-muted/10">
                {SUPABASE_FIELDS.map((field) => {
                    const q = queryMap[field.key];
                    const isConfigured = q.data?.configured ?? !!q.data?.value;
                    return (
                        <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.id}>{field.label}</Label>
                            {field.secret ? (
                                <p className="text-xs text-muted-foreground">
                                    Managed in the deployment environment; database writes are disabled.
                                </p>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        id={field.id}
                                        placeholder={q.isLoading ? 'Loading...' : field.placeholder}
                                        value={values[field.key] ?? ''}
                                        onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                                    />
                                    <Button
                                        onClick={() => handleSave(field)}
                                        disabled={!values[field.key] || saving[field.key]}
                                        className="bg-primary hover:bg-primary/90 shrink-0"
                                    >
                                        {saving[field.key]
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <><Save className="h-4 w-4 mr-1" />Save</>}
                                    </Button>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {field.hint} &nbsp;|&nbsp; Status:{' '}
                                {isConfigured
                                    ? <span className="text-green-500 font-bold">CONFIGURED</span>
                                    : <span className="text-amber-500 font-bold">NOT SET</span>}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

interface ApiKeyField {
    id: string;
    label: string;
    key: string;
    hint: string;
}

const API_KEY_FIELDS: ApiKeyField[] = [
    {
        id: 'anthropic_api_key',
        label: 'Anthropic (Claude) API Key',
        key: 'ANTHROPIC_API_KEY',
        hint: 'Used for AI fight analysis and chat features.',
    },
    {
        id: 'brave_search_api_key',
        label: 'Brave Search API Key',
        key: 'BRAVE_SEARCH_API_KEY',
        hint: 'Used for live MMA news and fighter search queries.',
    },
    {
        id: 'nano_banana_api_key',
        label: 'Nano Banana API Key',
        key: 'NANO_BANANA_API_KEY',
        hint: 'Used for data enrichment and fight analytics pipeline.',
    },
];

const ApiKeysConfigSection = () => {
    const anthropicQ = useQuery({ queryKey: ['/api/admin/pipeline/config/ANTHROPIC_API_KEY'], queryFn: () => fetchPipelineConfig('ANTHROPIC_API_KEY') });
    const braveQ = useQuery({ queryKey: ['/api/admin/pipeline/config/BRAVE_SEARCH_API_KEY'], queryFn: () => fetchPipelineConfig('BRAVE_SEARCH_API_KEY') });
    const nanoBananaQ = useQuery({ queryKey: ['/api/admin/pipeline/config/NANO_BANANA_API_KEY'], queryFn: () => fetchPipelineConfig('NANO_BANANA_API_KEY') });

    const queryMap: Record<string, typeof anthropicQ> = {
        ANTHROPIC_API_KEY: anthropicQ,
        BRAVE_SEARCH_API_KEY: braveQ,
        NANO_BANANA_API_KEY: nanoBananaQ,
    };

    return (
        <div className="space-y-4 pt-6 border-t">
            <div className="space-y-1">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    External API Keys
                </h3>
                <p className="text-sm text-muted-foreground">
                    API keys for AI and enrichment services are managed through the deployment environment.
                </p>
            </div>

            <div className="grid gap-4 p-4 border rounded-lg bg-muted/10">
                {API_KEY_FIELDS.map((field) => {
                    const q = queryMap[field.key];
                    const isConfigured = q.data?.configured ?? !!q.data?.value;
                    return (
                        <div key={field.key} className="space-y-2">
                            <Label htmlFor={field.id}>{field.label}</Label>
                            <p className="text-xs text-muted-foreground">
                                Managed as <code>{field.key}</code>; database writes are disabled.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {field.hint} &nbsp;|&nbsp; Status:{' '}
                                {isConfigured
                                    ? <span className="text-green-500 font-bold">CONFIGURED</span>
                                    : <span className="text-amber-500 font-bold">NOT SET</span>}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
