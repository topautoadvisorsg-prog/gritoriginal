
import React from 'react';
import { cn } from '@/shared/lib/utils';
import { BarChart3 } from 'lucide-react';

interface ComingSoonProps {
    icon?: React.ElementType;
    title: string;
    description: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ icon: Icon = BarChart3, title, description }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
            <div className="relative p-6 bg-card border border-border rounded-2xl">
                <Icon className="h-12 w-12 text-primary" />
            </div>
        </div>
        <h2 className="text-2xl font-display tracking-wide text-foreground uppercase mb-2">
            {title}
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
            {description}
        </p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-sm text-muted-foreground">Coming Soon</span>
        </div>
    </div>
);
