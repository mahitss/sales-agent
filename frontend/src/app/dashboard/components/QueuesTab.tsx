import React from "react";
import { Zap, RefreshCw, AlertOctagon, CheckCircle2, Play, Flame } from "lucide-react";

interface FailureLog {
  id: string;
  queueName: string;
  jobId: string;
  jobName: string;
  status: string;
  error: string | null;
  duration: number;
  createdAt: string;
}

interface QueuesTabProps {
  queueMetrics: Record<string, {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
    totalRunsSuccess: number;
    totalRunsFailed: number;
  }> | null;
  queueFailures: FailureLog[];
  queuesLoading: boolean;
  handleRetryJob: (queueName: string, jobId: string) => Promise<void>;
  handleRetryAllJobs: (queueName: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

export function QueuesTab({
  queueMetrics,
  queueFailures,
  queuesLoading,
  handleRetryJob,
  handleRetryAllJobs,
  refreshData,
}: QueuesTabProps) {
  const [retryingJobId, setRetryingJobId] = React.useState<string | null>(null);
  const [retryingQueue, setRetryingQueue] = React.useState<string | null>(null);

  const onRetry = async (queueName: string, jobId: string) => {
    setRetryingJobId(jobId);
    try {
      await handleRetryJob(queueName, jobId);
    } finally {
      setRetryingJobId(null);
    }
  };

  const onRetryAll = async (queueName: string) => {
    setRetryingQueue(queueName);
    try {
      await handleRetryAllJobs(queueName);
    } finally {
      setRetryingQueue(null);
    }
  };

  const queueDisplayNames: Record<string, string> = {
    "ai-research": "AI Research Scraper",
    "lead-enrichment": "Lead Enrichment Scoring",
    "email-sending": "Email SMTP Mailer",
    "report-generation": "Report Exports compiler",
    "workflow-automation": "Workflow Triggers Engine",
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Info */}
      <div className="flex items-center justify-between border-b border-card-border pb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Distributed Queue Monitor</h3>
          <p className="text-xs text-muted-text mt-1">Supervise background workers, dead letter queues, execution history, and promote retries.</p>
        </div>
        <button
          onClick={refreshData}
          disabled={queuesLoading}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-accent-primary border border-accent-primary/20 bg-accent-primary/5 hover:bg-accent-primary/10 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${queuesLoading ? "animate-spin" : ""}`} />
          Reload Queues
        </button>
      </div>

      {/* Queues Statistics Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {queueMetrics &&
          Object.entries(queueMetrics).map(([name, stats]) => (
            <div
              key={name}
              className="rounded-2xl border border-card-border bg-card/25 p-5 flex flex-col justify-between hover:border-slate-800 transition-all relative overflow-hidden"
            >
              <div>
                {/* Title */}
                <h4 className="text-xs font-bold text-white truncate">{queueDisplayNames[name] || name}</h4>
                <p className="text-[10px] text-muted-text font-mono mt-0.5 truncate">{name}</p>

                {/* Main Stats metrics */}
                <div className="grid grid-cols-2 gap-3 mt-4 border-b border-card-border/40 pb-4">
                  <div>
                    <span className="text-[9px] text-muted-text font-bold block uppercase tracking-wider">Active</span>
                    <span className="text-sm font-extrabold text-blue-400 mt-1 block">{stats.active}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-text font-bold block uppercase tracking-wider">Waiting</span>
                    <span className="text-sm font-extrabold text-amber-400 mt-1 block">{stats.waiting}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-[10px]">
                  <div>
                    <span className="text-muted-text block font-medium">Delayed</span>
                    <span className="font-bold text-indigo-400 mt-0.5 block">{stats.delayed}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block font-medium">Success</span>
                    <span className="font-bold text-emerald-400 mt-0.5 block">{stats.totalRunsSuccess}</span>
                  </div>
                  <div>
                    <span className="text-muted-text block font-medium">Failed</span>
                    <span className="font-bold text-rose-500 mt-0.5 block">{stats.totalRunsFailed}</span>
                  </div>
                </div>
              </div>

              {/* Action Retry All */}
              {stats.totalRunsFailed > 0 && (
                <div className="mt-5 pt-3 border-t border-card-border/40">
                  <button
                    onClick={() => onRetryAll(name)}
                    disabled={retryingQueue === name}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold rounded-lg text-rose-400 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Flame className={`h-3 w-3 ${retryingQueue === name ? "animate-spin" : ""}`} />
                    Retry {stats.totalRunsFailed} Failures
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {/* failure logs list */}
      <div className="rounded-3xl border border-card-border bg-card/10 overflow-hidden">
        <div className="p-6 border-b border-card-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertOctagon className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Queue Failure Logs (Dead Letter Queue)</h4>
              <p className="text-[10px] text-muted-text mt-0.5">Persistent records of failed background tasks, trace exceptions, and action items.</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {queueFailures.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400/80 mb-3" />
              <h5 className="text-xs font-bold text-white">All queues operating smoothly</h5>
              <p className="text-[10px] text-muted-text mt-1">There are no failed background job logs registered for your business.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-card-border bg-slate-950/20 text-muted-text font-bold">
                  <th className="p-4 pl-6">Queue / Task ID</th>
                  <th className="p-4">Failed Job</th>
                  <th className="p-4">Error Log Details</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 pr-6 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                {queueFailures.map((log) => (
                  <tr key={log.id} className="hover:bg-card/5 text-slate-300">
                    {/* Queue Name */}
                    <td className="p-4 pl-6 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/10 font-bold block w-fit mb-1">
                        {log.queueName}
                      </span>
                      <span className="text-slate-500 text-[9px] block">ID: {log.jobId.substring(0, 12)}...</span>
                    </td>
                    {/* Job Name */}
                    <td className="p-4 font-bold text-white">
                      {log.jobName}
                    </td>
                    {/* Error Stack */}
                    <td className="p-4 max-w-sm">
                      <div className="line-clamp-2 text-rose-300/90 font-mono text-[10px] bg-rose-950/10 p-2 rounded-lg border border-rose-500/5">
                        {log.error || "No error details reported."}
                      </div>
                    </td>
                    {/* Duration */}
                    <td className="p-4 font-mono text-[10px] text-slate-400">
                      {log.duration}ms
                    </td>
                    {/* Timestamp */}
                    <td className="p-4 text-slate-400 text-[10px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    {/* Action button */}
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => onRetry(log.queueName, log.jobId)}
                        disabled={retryingJobId === log.jobId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-accent-primary text-white hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Play className={`h-3 w-3 ${retryingJobId === log.jobId ? "animate-spin" : ""}`} />
                        Retry Job
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
