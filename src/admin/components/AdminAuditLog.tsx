import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/components/ui/table';
import { Badge } from '@/shared/components/ui/badge';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { ClipboardList, Loader2, User, Settings, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
interface AuditLog {
    id: string;
    adminId: string;
    adminUsername?: string;
    action: string;
    targetType: string;
    targetId: string;
    details: any;
    ipAddress: string;
    createdAt: string;
}

async function fetchWithAuth(url: string) {
    return fetch(url, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export const AdminAuditLog = () => {
    const { data: logs = [], isLoading } = useQuery<AuditLog[]>({
        queryKey: ['/api/admin/audit-logs'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/admin/audit-logs');
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            return res.json();
        },
        refetchInterval: 10000 // Refresh every 10s
    });

    const getActionBadge = (action: string) => {
        if (action.includes('BAN')) return <Badge variant="destructive">{action}</Badge>;
        if (action.includes('ROLE')) return <Badge className="bg-purple-500">{action}</Badge>;
        if (action.includes('SETTINGS')) return <Badge variant="outline">{action}</Badge>;
        return <Badge variant="secondary">{action}</Badge>;
    };

    const getIcon = (targetType: string) => {
        if (targetType === 'USER') return <User className="h-4 w-4" />;
        if (targetType === 'SYSTEM') return <Settings className="h-4 w-4" />;
        return <ShieldAlert className="h-4 w-4" />;
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Admin Audit Log
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <ScrollArea className="h-[600px] border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Admin</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {log.adminUsername || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                            {getActionBadge(log.action)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getIcon(log.targetType)}
                                                <span className="text-xs font-mono">{log.targetId ? log.targetId.substring(0, 8) + '...' : 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate">
                                            {JSON.stringify(log.details)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
};
