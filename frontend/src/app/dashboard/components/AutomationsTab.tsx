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
  History,
  Trash2,
  Mail,
  UserCheck,
  ListPlus,
  Info
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

  // Email Templates and Sequences Props
  emailTemplates: any[];
  emailSequences: any[];
  emailLoading: boolean;
  handleSaveEmailTemplate: (id: string | null, name: string, subject: string, body: string) => Promise<void>;
  handleDeleteEmailTemplate: (id: string) => Promise<void>;
  handleSaveEmailSequence: (id: string | null, name: string, steps: any[]) => Promise<void>;
  handleDeleteEmailSequence: (id: string) => Promise<void>;
  handleEnrollLeadInSequence: (sequenceId: string, leadIds: string[]) => Promise<void>;
  handleDisenrollLeadFromSequence: (sequenceId: string, leadIds: string[]) => Promise<void>;
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
  emailTemplates = [],
  emailSequences = [],
  emailLoading = false,
  handleSaveEmailTemplate,
  handleDeleteEmailTemplate,
  handleSaveEmailSequence,
  handleDeleteEmailSequence,
  handleEnrollLeadInSequence,
  handleDisenrollLeadFromSequence,
}) => {
  // Navigation tabs within automations
  const [subTab, setSubTab] = useState<"workflows" | "sequences" | "templates" | "rules" | "outbox">("workflows");

  // Workflow Builder Canvas Overlay states
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

  // Template Form Editor states
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  // Sequence Form Editor states
  const [editingSequence, setEditingSequence] = useState<any | null>(null);
  const [sequenceName, setSequenceName] = useState("");
  const [sequenceSteps, setSequenceSteps] = useState<Array<{ delayDays: number; templateId: string }>>([]);
  const [showSequenceForm, setShowSequenceForm] = useState(false);

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
    setActiveWorkflow(null);
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
      setSelectedWorkflowForLogs((prev: any) => ({ ...prev, name, trigger }));
    }
  };

  // Templates CRUD Actions
  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setTemplateSubject("");
    setTemplateBody("");
    setShowTemplateForm(true);
  };

  const handleOpenEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    setTemplateBody(template.body);
    setShowTemplateForm(true);
  };

  const handleSaveTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName || !templateSubject || !templateBody) return;
    await handleSaveEmailTemplate(editingTemplate?.id || null, templateName, templateSubject, templateBody);
    setShowTemplateForm(false);
    setEditingTemplate(null);
  };

  // Sequences CRUD Actions
  const handleOpenCreateSequence = () => {
    setEditingSequence(null);
    setSequenceName("");
    setSequenceSteps([{ delayDays: 0, templateId: emailTemplates[0]?.id || "" }]);
    setShowSequenceForm(true);
  };

  const handleOpenEditSequence = (seq: any) => {
    setEditingSequence(seq);
    setSequenceName(seq.name);
    setSequenceSteps(parseJsonField(seq.steps));
    setShowSequenceForm(true);
  };

  const handleAddStepToSequence = () => {
    setSequenceSteps((prev) => [...prev, { delayDays: 1, templateId: emailTemplates[0]?.id || "" }]);
  };

  const handleRemoveStepFromSequence = (idx: number) => {
    setSequenceSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleStepChange = (idx: number, field: "delayDays" | "templateId", value: any) => {
    setSequenceSteps((prev) =>
      prev.map((step, i) => (i === idx ? { ...step, [field]: value } : step))
    );
  };

  const handleSaveSequenceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sequenceName || sequenceSteps.length === 0) return;
    await handleSaveEmailSequence(editingSequence?.id || null, sequenceName, sequenceSteps);
    setShowSequenceForm(false);
    setEditingSequence(null);
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
    <div className="space-y-8 pb-16">
      {/* 1. Header & Quick Analytics Dashboard */}
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold text-white">Visual Automations & Sequence Drips</h3>
          <p className="text-xs text-muted-text mt-1">
            Build triggers pipelines, drip sequences, and reusable templates to orchestrate your pipeline.
          </p>
        </div>

        {/* Sub-tab Navigation Header */}
        <div className="flex items-center gap-1.5 border-b border-card-border/60 pb-3">
          {[
            { id: "workflows", label: "Visual Custom DAGs", icon: Sliders },
            { id: "sequences", label: "Outreach Sequences", icon: ListPlus },
            { id: "templates", label: "Email Templates", icon: Mail },
            { id: "rules", label: "Simple Rules", icon: Zap },
            { id: "outbox", label: "Campaign Outbox", icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSubTab(tab.id as any);
                  setSelectedWorkflowForLogs(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
                  isActive 
                    ? "bg-accent-primary/10 text-accent-primary border-accent-primary/20" 
                    : "text-muted-text hover:text-white border-transparent hover:bg-slate-900/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Sub-views viewports */}
      <div className="space-y-6">
        
        {/* SUBTAB 1: Visual Workflows */}
        {subTab === "workflows" && (
          <AnimatePresence mode="wait">
            {!selectedWorkflowForLogs ? (
              <motion.div
                key="workflows-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-accent-primary" />
                    Orchestrated DAG Flow pipelines
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
                  {workflows.length === 0 ? (
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
                                History
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
              /* Workflow Executions Log accordion view */
              <motion.div
                key="executions-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {workflowExecutions.map((exec) => {
                    const isExpanded = expandedExecutionId === exec.id;
                    const durationSum = exec.logs.reduce((acc: number, l: any) => acc + l.duration, 0);

                    return (
                      <div key={exec.id} className="border border-card-border/60 rounded-2xl bg-card/5 overflow-hidden">
                        <div
                          onClick={() => setExpandedExecutionId(isExpanded ? null : exec.id)}
                          className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/10"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              exec.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                              {exec.status}
                            </span>
                            <span className="font-mono text-xs text-slate-300">Run {exec.id.substring(0, 8)}</span>
                            <span className="text-[10px] text-muted-text">{new Date(exec.createdAt).toLocaleString()}</span>
                          </div>
                          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>

                        {isExpanded && (
                          <div className="p-4 border-t border-card-border/40 bg-slate-950/20 space-y-4">
                            <pre className="text-[10px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-900 overflow-x-auto">
                              {JSON.stringify(exec.triggerPayload, null, 2)}
                            </pre>
                            {exec.logs.map((log: any) => (
                              <div key={log.id} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between text-xs text-slate-300">
                                <span>Step: {log.nodeType}</span>
                                <span>Duration: {log.duration}ms ({log.status})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* SUBTAB 2: Email Sequences */}
        {subTab === "sequences" && (
          <div className="space-y-4">
            {!showSequenceForm ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
                    <ListPlus className="h-4 w-4 text-accent-primary" />
                    Automated drip campaign sequences
                  </h4>
                  <button
                    onClick={handleOpenCreateSequence}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Create Sequence
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {emailSequences.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-card-border rounded-xl text-xs text-muted-text">
                      No outreach sequences configured yet. Click above to create one.
                    </div>
                  ) : (
                    emailSequences.map((seq) => {
                      const steps = parseJsonField(seq.steps);
                      const activeEnrollments = seq.enrollments?.filter((e: any) => e.status === "ACTIVE").length || 0;
                      return (
                        <div
                          key={seq.id}
                          className="border border-card-border bg-card/10 rounded-2xl p-5 hover:border-slate-800 transition flex items-center justify-between gap-4"
                        >
                          <div className="space-y-2">
                            <h5 className="font-bold text-sm text-white">{seq.name}</h5>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span>{steps.length} Steps</span>
                              <span>•</span>
                              <span>{activeEnrollments} Leads Enrolled</span>
                            </div>
                            {/* Steps summary pills */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {steps.map((st, idx) => {
                                const template = emailTemplates.find(t => t.id === st.templateId);
                                return (
                                  <div key={idx} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                    <span>Step {idx+1}:</span>
                                    <span className="font-semibold text-teal-400">+{st.delayDays} Days</span>
                                    <span>({template?.name || "Missing Template"})</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditSequence(seq)}
                              className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmailSequence(seq.id)}
                              className="p-1.5 rounded-lg border border-transparent hover:border-card-border text-slate-500 hover:text-red-400 transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* Inline Sequence Editor Form */
              <form onSubmit={handleSaveSequenceSubmit} className="rounded-2xl border border-card-border bg-card/25 p-6 space-y-6">
                <h5 className="font-bold text-sm text-white">{editingSequence ? "Edit Sequence" : "Create New Sequence"}</h5>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Sequence Name</label>
                  <input
                    type="text"
                    required
                    value={sequenceName}
                    onChange={(e) => setSequenceName(e.target.value)}
                    placeholder="e.g. Inbound Drip - SaaS Lead Qualified"
                    className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Hint: Add "Test" or "Demo" in the name to execute delays in seconds (10s delay per day) for instant tests.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-card-border/40 pb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Outreach Steps & Drips</label>
                    <button
                      type="button"
                      onClick={handleAddStepToSequence}
                      className="text-[10px] font-bold text-teal-400 hover:text-teal-300 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Add Step
                    </button>
                  </div>

                  <div className="space-y-3">
                    {sequenceSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-slate-950/40 p-4 border border-card-border rounded-xl">
                        <div className="text-xs font-bold text-slate-500">Step {idx + 1}</div>
                        
                        <div className="w-28">
                          <label className="block text-[9px] text-slate-600 mb-1">Delay (Days)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={step.delayDays}
                            onChange={(e) => handleStepChange(idx, "delayDays", parseInt(e.target.value) || 0)}
                            className="w-full rounded-lg bg-card border border-card-border px-3 py-1.5 text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="block text-[9px] text-slate-600 mb-1">Select Email Template</label>
                          <select
                            required
                            value={step.templateId}
                            onChange={(e) => handleStepChange(idx, "templateId", e.target.value)}
                            className="w-full rounded-lg bg-card border border-card-border px-3 py-1.5 text-xs text-white focus:outline-none"
                          >
                            <option value="" disabled>Choose template...</option>
                            {emailTemplates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveStepFromSequence(idx)}
                          className="mt-4 p-1.5 rounded-lg text-slate-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-card-border/40">
                  <button
                    type="button"
                    onClick={() => setShowSequenceForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-transparent text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Save Sequence
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* SUBTAB 3: Email Templates */}
        {subTab === "templates" && (
          <div className="space-y-4">
            {!showTemplateForm ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
                    <Mail className="h-4 w-4 text-accent-primary" />
                    Reusable corporate email templates
                  </h4>
                  <button
                    onClick={handleOpenCreateTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Create Template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailTemplates.length === 0 ? (
                    <div className="col-span-2 text-center py-10 border border-dashed border-card-border rounded-xl text-xs text-muted-text">
                      No email templates configured yet. Click above to create one.
                    </div>
                  ) : (
                    emailTemplates.map((temp) => (
                      <div
                        key={temp.id}
                        className="border border-card-border bg-card/10 rounded-2xl p-5 hover:border-slate-800 transition flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <h5 className="font-bold text-sm text-white">{temp.name}</h5>
                          <p className="text-[10px] font-medium text-slate-400 truncate">Subject: {temp.subject}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{temp.body.replace(/<[^>]+>/g, '')}</p>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-card-border/40 pt-3">
                          <button
                            onClick={() => handleOpenEditTemplate(temp)}
                            className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-[11px] text-slate-300 hover:text-white transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEmailTemplate(temp.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Inline Template Editor Form */
              <form onSubmit={handleSaveTemplateSubmit} className="rounded-2xl border border-card-border bg-card/25 p-6 space-y-6">
                <h5 className="font-bold text-sm text-white">{editingTemplate ? "Edit Email Template" : "Create New Template"}</h5>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Template Name</label>
                    <input
                      type="text"
                      required
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. Welcome Pitch - SaaS Sales"
                      className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Email Subject Line</label>
                    <input
                      type="text"
                      required
                      value={templateSubject}
                      onChange={(e) => setTemplateSubject(e.target.value)}
                      placeholder="e.g. Welcome to Beacon, {{lead.name}}!"
                      className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Template Body HTML / Text</label>
                    <span className="text-[9px] text-slate-500">Insert variables: <code>{"{{lead.name}}"}</code>, <code>{"{{lead.email}}"}</code>, <code>{"{{lead.budget}}"}</code></span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={templateBody}
                    onChange={(e) => setTemplateBody(e.target.value)}
                    placeholder="Hi {{lead.name}},\n\nNice to connect!..."
                    className="w-full rounded-xl bg-card border border-card-border px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTemplateForm(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* SUBTAB 4: Simple Trigger Rules */}
        {subTab === "rules" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-primary" />
              Simple Automation Rules
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workflowRules.length === 0 ? (
                <div className="col-span-2 text-center py-6 border border-dashed border-card-border rounded-2xl text-xs text-muted-text">
                  No single-rule automations available.
                </div>
              ) : (
                workflowRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="border border-card-border bg-card/10 rounded-2xl p-5 flex items-center justify-between gap-4"
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
        )}

        {/* SUBTAB 5: Outreach Outbox Queue */}
        {subTab === "outbox" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-accent-primary uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent-primary" />
              Outreach Sequence Outbox
            </h4>
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
        )}
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
