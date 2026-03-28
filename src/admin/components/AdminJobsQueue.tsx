import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FailedJob {
  id: string;
  name: string;
  data: any;
  state: string;
  createdOn: string;
  retryCount: number;
}

export const AdminJobsQueue: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading, isError } = useQuery<FailedJob[]>({
    queryKey: ['/api/admin/jobs/failed'],
    queryFn: async () => {
      const res = await fetch('/api/admin/jobs/failed');
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10s
  });

  const retryMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await fetch(`/api/admin/jobs/${jobId}/retry`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Retry failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs/failed'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <Activity className="w-6 h-6" /> Dead Letter Queue
        </h2>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/jobs/failed'] })}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold">Failed Background Jobs</h3>
            <p className="text-sm text-muted-foreground">
              These jobs (like outbound syncs) failed permanently after exhausting all automatic retries.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-destructive font-medium">Failed to load dead letter queue.</div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl">
            <CheckCircle2 className="w-12 h-12 text-green-500/50 mb-3" />
            <p className="text-muted-foreground font-medium">The queue is perfectly clear.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div key={job.id} className="flex flex-col md:flex-row gap-4 p-4 border border-border bg-background rounded-lg items-start md:items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded uppercase">{job.state}</span>
                    <span className="font-mono text-sm font-bold truncate">{job.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>ID: {job.id.substring(0, 8)}...</span>
                    <span>Created: {new Date(job.createdOn).toLocaleString()}</span>
                    <span>Retries: {job.retryCount}</span>
                  </div>
                  <details className="mt-2 text-xs font-mono bg-muted/50 p-2 rounded max-h-32 overflow-auto">
                    <summary className="cursor-pointer font-bold text-muted-foreground hover:text-foreground">View Payload</summary>
                    <pre className="mt-2 text-primary/70">{JSON.stringify(job.data, null, 2)}</pre>
                  </details>
                </div>
                <button
                  onClick={() => retryMutation.mutate(job.id)}
                  disabled={retryMutation.isPending}
                  className="shrink-0 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50"
                >
                  {retryMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Retry Job
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
