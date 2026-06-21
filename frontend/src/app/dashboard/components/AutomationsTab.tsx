import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Plus,
  Edit3,
  Activity,
  FileText,
  RefreshCw,
  Eye,
  ArrowLeft,
  Settings,
  Sliders,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WorkflowCanvas, Node, Edge } from "./WorkflowCanvas";

interface WorkflowRule {
  id: string;
  trigger: string;
  action: string;
  isEnabled: boolean;
}

interface OutreachSequence {
  id: string;
  template: string;
  subject: string;
  status: string;
  scheduledFor: string;
  lead: {
    name: string;
    email: string;
  };
}

interface AutomationsTabProps {
  workflowRules: WorkflowRule[];
  outreachSequences: OutreachSequence[];
  handleToggleWorkflowRule: (ruleId: string, isEnabled: boolean) => Promise<void>;

  // Custom Visual Workflows props
  workflows: any[];
  workflowExecutions: any[];
  workflowMetrics: any;
  workflowLoading: boolean;
  handleSaveWorkflow: (
    id: string | null,
    name: string,
    trigger: string,
    nodes: Node[],
    edges: Edge[]
  ) => Promise<void>;
  handleToggleWorkflow: (id: string, isEnabled: boolean) => Promise<void>;
  fetchWorkflowExecutions: (workflowId: string) => Promise<void>;
}

export const AutomationsTab: React.FC<AutomationsTabProps> = ({
  workflowRules,
  outreachSequences,
  handleToggleWorkflowRule,
  workflows = [],
  workflowExecutions = [],
  workflowMetrics = null,
  workflowLoading = false,
  handleSaveWorkflow,
  handleToggleWorkflow,
  fetchWorkflowExecutions,
}) => {
  const [showCanvas, setShowCanvas] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<{
    id: string | null;
    name: string;
    trigger: string;
    nodes: Node[];
    edges: Edge[];
  } | null>(null);

  // States for viewing execution logs
  const [selectedWorkflowForLogs, setSelectedWorkflowForLogs] = useState<any | null>(null);
  const [expandedExecutionId, setExpandedExecutionId] = useState<string | null>(null);

  // Helper to parse JSON fields safely
  const parseJsonField = (field: any): any[] => {
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch {
        return [];
      }
    }
    return field || [];
  };

  // Auto-refresh execution logs if we are viewing history for a workflow
  useEffect(() => {
    if (selectedWorkflowForLogs) {
      fetchWorkflowExecutions(selectedWorkflowForLogs.id);
    }
  }, [selectedWorkflowForLogs]);

  const handleOpenCreateCanvas = () => {
    setActiveWorkflow(null); // triggers default state in canvas
    setShowCanvas(true);
  };

  const handleOpenEditCanvas = (workflow: any) => {
    setActiveWorkflow({
      id: workflow.id,
      name: workflow.name,
      trigger: workflow.trigger,
      nodes: parseJsonField(workflow.nodes) as Node[],
      edges: parseJsonField(workflow.edges) as Edge[],
    });
    setShowCanvas(true);
  };

  const handleSaveAndClose = async (
    id: string | null,
    name: string,
    trigger: string,
    nodes: Node[],
    edges: Edge[]
  ) => {
    await handleSaveWorkflow(id, name, trigger, nodes, edges);
    setShowCanvas(false);
    setActiveWorkflow(null);
    if (selectedWorkflowForLogs && selectedWorkflowForLogs.id === id) {
      // Refresh current workflow details if edited
      setSelectedWorkflowForLogs((prev: any) => ({ ...prev, name, trigger }));
    }
  };

  // Metrics details (fallback values)
  const metrics = workflowMetrics || {
    totalExecutions: 0,
    completedExecutions: 0,
    failedExecutions: 0,
    failureRate: 0,
    averageStepDurationMs: 0,
  };

  const successRate = metrics.totalExecutions > 0 
    ? Math.round(100 - metrics.failureRate) 
    : 100;

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Header & Quick Analytics Dashboard */}
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold text-white">Visual Automations Console</h3>
          <p className="text-xs text-muted-text mt-1">
            Build, deploy, and audit complex DAG sales flows to automate your pipeline processes.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-card-border bg-card/5 rounded-2xl p-5 hover:border-slate-800 transition">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Workflows</span>
            <div className="text-2xl font-black text-white mt-1.5 flex items-baseline gap-2">
              {workflows.filter(w => w.isEnabled).length}
              <span className="text-xs font-normal text-muted-text">/ {workflows.length} total</span>
            </div>
          </div>

          <div className="border border-card-border bg-card/5 rounded-2xl p-5 hover:border-slate-800 transition">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Run executions</span>
            <div className="text-2xl font-black text-white mt-1.5 flex items-baseline gap-2">
              {metrics.totalExecutions}
              <span className="text-xs text-teal-400 font-semibold shrink-0">Runs</span>
            </div>
          </div>

          <div className="border border-card-border bg-card/5 rounded-2xl p-5 hover:border-slate-800 transition">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Engine Success Rate</span>
            <div className={`text-2xl font-black mt-1.5 ${successRate > 90 ? 'text-emerald-400' : successRate > 75 ? 'text-amber-400' : 'text-rose-400'}`}>
              {successRate}%
            </div>
          </div>

          <div className="border border-card-border bg-card/5 rounded-2xl p-5 hover:border-slate-800 transition">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Step Latency</span>
            <div className="text-2xl font-black text-white mt-1.5">
              {metrics.averageStepDurationMs || 0} <span className="text-xs font-normal text-muted-text">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Custom Visual Workflow Builder Section */}
      <AnimatePresence mode="wait">
        {!selectedWorkflowForLogs ? (
          <motion.div
            key="workflows-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-accent-primary" />
                Visual Custom DAG Flows
              </h4>
              <button
                onClick={handleOpenCreateCanvas}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl transition shadow shadow-teal-950"
              >
                <Plus className="h-4.5 w-4.5" />
                Create Custom Flow
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {workflowLoading && workflows.length === 0 ? (
                <div className="col-span-2 text-center py-12 border border-dashed border-card-border rounded-2xl text-xs text-muted-text">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-500" />
                  Loading workflow definitions...
                </div>
              ) : workflows.length === 0 ? (
                <div className="col-span-2 text-center py-12 border border-dashed border-card-border rounded-2xl text-xs text-muted-text">
                  No custom visual workflows configured yet. Click "Create Custom Flow" to build your first automation.
                </div>
              ) : (
                workflows.map((wf) => {
                  const nodeCount = parseJsonField(wf.nodes).length;
                  const edgeCount = parseJsonField(wf.edges).length;
                  return (
                    <div
                      key={wf.id}
                      className={`border bg-card/10 rounded-2xl p-5 hover:border-slate-800 transition flex flex-col justify-between gap-4 relative overflow-hidden ${
                        wf.isEnabled 
                          ? "border-card-border/80 border-l-4 border-l-teal-500" 
                          : "border-card-border/40 border-l-4 border-l-slate-700 bg-slate-900/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 max-w-[70%]">
                          <h5 className="font-bold text-sm text-white truncate">{wf.name}</h5>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              Trigger
                            </span>
                            <span className="text-xs text-teal-400 font-extrabold font-mono">
                              {wf.trigger.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>

                        {/* Toggle switch */}
                        <button
                          onClick={() => handleToggleWorkflow(wf.id, !wf.isEnabled)}
                          className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-all duration-200 focus:outline-none flex items-center ${
                            wf.isEnabled ? "bg-teal-600 justify-end" : "bg-slate-800 justify-start border border-slate-700"
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-slate-950 shadow" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-card-border/40 pt-4 mt-2">
                        <div className="text-[10px] text-muted-text flex items-center gap-3">
                          <span>{nodeCount} Nodes</span>
                          <span className="text-slate-700">•</span>
                          <span>{edgeCount} Links</span>
                          <span className="text-slate-700">•</span>
                          <span className="font-mono text-slate-600">{new Date(wf.updatedAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditCanvas(wf)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition font-medium cursor-pointer"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Canvas
                          </button>
                          <button
                            onClick={() => setSelectedWorkflowForLogs(wf)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-[11px] text-teal-400 hover:text-teal-300 transition font-medium cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Run History
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          /* Execution History Detail Pane */
          <motion.div
            key="executions-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-card-border/40 pb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedWorkflowForLogs(null);
                    setExpandedExecutionId(null);
                  }}
                  className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-slate-400" />
                    Execution logs for: {selectedWorkflowForLogs.name}
                  </h4>
                  <p className="text-[10px] text-muted-text mt-0.5">
                    Trigger: <span className="font-mono text-teal-400">{selectedWorkflowForLogs.trigger}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => fetchWorkflowExecutions(selectedWorkflowForLogs.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${workflowLoading ? 'animate-spin' : ''}`} />
                Refresh Logs
              </button>
            </div>

            {/* Logs List Container */}
            <div className="space-y-3">
              {workflowLoading && workflowExecutions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-card-border rounded-2xl text-xs text-muted-text">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-slate-500" />
                  Fetching execution trails...
                </div>
              ) : workflowExecutions.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-card-border rounded-2xl text-xs text-muted-text">
                  This workflow has not been triggered yet.
                </div>
              ) : (
                workflowExecutions.map((exec) => {
                  const isExpanded = expandedExecutionId === exec.id;
                  const durationSum = exec.logs.reduce((acc: number, l: any) => acc + l.duration, 0);

                  return (
                    <div
                      key={exec.id}
                      className="border border-card-border/60 rounded-2xl bg-card/5 overflow-hidden transition-all hover:border-slate-800"
                    >
                      {/* Accordion Header */}
                      <div
                        onClick={() => setExpandedExecutionId(isExpanded ? null : exec.id)}
                        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/10 select-none"
                      >
                        <div className="flex items-center gap-3">
                          {exec.status === "COMPLETED" && (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                          )}
                          {exec.status === "FAILED" && (
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                          )}
                          {exec.status === "RUNNING" && (
                            <RefreshCw className="h-5 w-5 text-cyan-400 shrink-0 animate-spin" />
                          )}
                          {exec.status === "PENDING" && (
                            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-300">
                                Run {exec.id.substring(0, 8)}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                exec.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                exec.status === "FAILED" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                                exec.status === "RUNNING" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse" :
                                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}>
                                {exec.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-text mt-1 flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span>{new Date(exec.createdAt).toLocaleString()}</span>
                              <span>•</span>
                              <Clock className="h-3 w-3 text-slate-500" />
                              <span>{durationSum > 0 ? `${durationSum}ms` : `${exec.logs.length} steps`}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Snippet payload */}
                          <div className="hidden md:block max-w-xs truncate text-[10px] font-mono text-slate-500">
                            {JSON.stringify(exec.triggerPayload)}
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4.5 w-4.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Expanded Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-card-border/40 bg-slate-950/20"
                          >
                            <div className="p-5 space-y-4">
                              {/* Trigger Payload context */}
                              <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-xl space-y-1">
                                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Trigger Payload Metadata</span>
                                <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-36">
                                  {JSON.stringify(exec.triggerPayload, null, 2)}
                                </pre>
                              </div>

                              {/* Error log trace if failure */}
                              {exec.error && (
                                <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                                  <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Execution failure trace
                                  </span>
                                  <p className="text-[10px] text-rose-300 font-mono whitespace-pre-wrap">{exec.error}</p>
                                </div>
                              )}

                              {/* Step Log Sequence Trace */}
                              <div className="space-y-3">
                                <h6 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Execution Step Log timeline</h6>
                                <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-4">
                                  {exec.logs.map((log: any, index: number) => {
                                    // Lookup user-friendly node label from workflow layout if possible
                                    const flowNodes = parseJsonField(selectedWorkflowForLogs.nodes);
                                    const matchedNode = flowNodes.find((n: any) => n.id === log.nodeId);
                                    const nodeLabel = matchedNode?.data?.label || `${log.nodeType} (${log.nodeId.substring(0, 8)})`;

                                    return (
                                      <div key={log.id} className="relative">
                                        {/* Timestamp dot indicator */}
                                        <div className={`absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full border border-slate-950 ${
                                          log.status === "COMPLETED" ? "bg-emerald-500" :
                                          log.status === "FAILED" ? "bg-rose-500" : "bg-cyan-500 animate-pulse"
                                        }`} />

                                        <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-850 transition">
                                          <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-white">{nodeLabel}</span>
                                              <span className="text-[9px] font-mono text-slate-500 uppercase px-1.5 py-0.2 bg-slate-900 border border-slate-800/80 rounded">
                                                {log.nodeType}
                                              </span>
                                            </div>
                                            <div className="text-[10px] font-mono text-muted-text flex items-center gap-2">
                                              <span>{log.duration}ms</span>
                                              <span>•</span>
                                              <span className={log.status === "COMPLETED" ? "text-emerald-400" : "text-rose-400"}>
                                                {log.status}
                                              </span>
                                            </div>
                                          </div>

                                          {/* Step output JSON */}
                                          {log.output && Object.keys(log.output).length > 0 && (
                                            <details className="mt-2 text-[10px] text-slate-400 font-mono">
                                              <summary className="cursor-pointer text-[9px] font-extrabold text-slate-500 hover:text-slate-300 transition-colors uppercase">
                                                View Step Output Output Logs ({Object.keys(log.output).length} keys)
                                              </summary>
                                              <pre className="mt-1 p-2 bg-slate-950 rounded border border-slate-900 overflow-x-auto whitespace-pre">
                                                {JSON.stringify(log.output, null, 2)}
                                              </pre>
                                            </details>
                                          )}

                                          {/* Step specific error */}
                                          {log.error && (
                                            <div className="mt-2 p-2 bg-rose-500/5 rounded border border-rose-500/10 text-[10px] font-mono text-rose-300">
                                              {log.error}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <hr className="border-card-border/40" />

      {/* 3. Rules block (Legacy trigger rules) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent-primary" />
            Simple Automation Rules
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">Configure basic quick-fire single trigger rules.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflowRules.length === 0 ? (
            <div className="col-span-2 text-center py-6 border border-dashed border-card-border rounded-2xl text-xs text-muted-text">
              No single-rule automations available.
            </div>
          ) : (
            workflowRules.map((rule) => (
              <div
                key={rule.id}
                className="border border-card-border bg-card/10 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-slate-800 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                      Trigger
                    </span>
                    <span className="text-xs text-white font-extrabold font-mono">
                      {rule.trigger.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-accent-primary/10 border border-accent-primary/20 text-accent-primary">
                      Action
                    </span>
                    <span className="text-xs text-slate-300">
                      {rule.action.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => handleToggleWorkflowRule(rule.id, !rule.isEnabled)}
                  className={`w-11 h-6 rounded-full p-1 cursor-pointer transition-all duration-200 focus:outline-none flex items-center ${
                    rule.isEnabled ? "bg-accent-primary justify-end" : "bg-slate-800 justify-start border border-slate-700"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-950 shadow" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Campaigns log outbox */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent-primary" />
            Outreach Sequence Outbox
          </h4>
          <p className="text-[10px] text-slate-500 mt-1">Audit scheduled template outreaches before dispatch.</p>
        </div>

        <div className="overflow-x-auto border border-card-border rounded-2xl bg-card/10 shadow-sm">
          <table className="w-full border-collapse text-left text-sm min-w-[700px]">
            <thead className="bg-card border-b border-card-border text-xs font-semibold uppercase text-muted-text">
              <tr>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Sequence Template</th>
                <th className="px-6 py-4">Email Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Send Date Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/60">
              {outreachSequences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-text">
                    No outbound emails scheduled currently. Open a Lead dossier details drawer to schedule campaigns.
                  </td>
                </tr>
              ) : (
                outreachSequences.map((seq) => (
                  <tr key={seq.id} className="hover:bg-card/25 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-200 text-xs">{seq.lead.name}</p>
                      <p className="text-[10px] text-muted-text">{seq.lead.email}</p>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {seq.template}
                    </td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {seq.subject}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                        {seq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-text whitespace-nowrap">
                      {new Date(seq.scheduledFor).toLocaleTimeString()} ({new Date(seq.scheduledFor).toLocaleDateString()})
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Fullscreen Overlay Workflow Canvas Modal */}
      {showCanvas && (
        <WorkflowCanvas
          initialWorkflow={activeWorkflow}
          onSave={handleSaveAndClose}
          onClose={() => {
            setShowCanvas(false);
            setActiveWorkflow(null);
          }}
        />
      )}
    </div>
  );
};
