import React, { useState, useRef, useEffect } from "react";
import { 
  Zap, 
  Play, 
  ArrowRight, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  HelpCircle, 
  Sliders, 
  Info,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export interface Node {
  id: string;
  type: "trigger" | "action" | "condition";
  x: number;
  y: number;
  data: {
    label: string;
    type: string; // trigger type, action type, etc.
    config?: Record<string, any>;
  };
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string; // 'true' or 'false' for condition nodes
}

interface WorkflowCanvasProps {
  initialWorkflow: {
    id: string | null;
    name: string;
    trigger: string;
    nodes: Node[];
    edges: Edge[];
  } | null;
  onSave: (id: string | null, name: string, trigger: string, nodes: Node[], edges: Edge[]) => Promise<void>;
  onClose: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  initialWorkflow,
  onSave,
  onClose,
}) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [workflowName, setWorkflowName] = useState("");
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Dragging connection state
  const [drawingConnection, setDrawingConnection] = useState<{
    sourceId: string;
    sourceHandle?: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    if (initialWorkflow) {
      setWorkflowName(initialWorkflow.name || "Untitled Sales Flow");
      setNodes(initialWorkflow.nodes || []);
      setEdges(initialWorkflow.edges || []);
    } else {
      setWorkflowName("New Automated Workflow");
      // Add a default trigger node to start
      setNodes([
        {
          id: "node-trigger",
          type: "trigger",
          x: 100,
          y: 200,
          data: {
            label: "Lead Created",
            type: "LEAD_CREATED",
          },
        },
      ]);
      setEdges([]);
    }
  }, [initialWorkflow]);

  // Handle canvas mouse move for dragging nodes and drawing connections
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingNodeId) {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNodeId
            ? {
                ...node,
                x: Math.max(10, Math.min(rect.width - 200, x - dragStartOffset.current.x)),
                y: Math.max(10, Math.min(rect.height - 120, y - dragStartOffset.current.y)),
              }
            : node
        )
      );
    } else if (drawingConnection) {
      setDrawingConnection((prev) =>
        prev ? { ...prev, currentX: x, currentY: y } : null
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setDrawingConnection(null);
  };

  const handleStartNodeDrag = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    setDraggingNodeId(node.id);
    dragStartOffset.current = {
      x: cursorX - node.x,
      y: cursorY - node.y,
    };
    setSelectedNode(node);
  };

  const handleStartConnection = (e: React.MouseEvent, sourceId: string, handle?: string) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawingConnection({
      sourceId,
      sourceHandle: handle,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
    });
  };

  const handleEndConnection = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!drawingConnection || drawingConnection.sourceId === targetId) return;

    // Prevent duplicate edges
    const exists = edges.some(
      (edge) =>
        edge.source === drawingConnection.sourceId &&
        edge.target === targetId &&
        edge.sourceHandle === drawingConnection.sourceHandle
    );

    if (!exists) {
      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: drawingConnection.sourceId,
        target: targetId,
        sourceHandle: drawingConnection.sourceHandle,
      };
      setEdges((prev) => [...prev, newEdge]);
    }
    setDrawingConnection(null);
  };

  const handleAddNode = (type: "action" | "condition", actionOrTriggerType: string, label: string) => {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      x: 350,
      y: 150 + nodes.length * 40,
      data: {
        label,
        type: actionOrTriggerType,
        config: type === "condition" ? {
          field: "score",
          operator: "gt",
          value: "80"
        } : actionOrTriggerType === "SEND_EMAIL" ? {
          to: "{{lead.email}}",
          subject: "Welcome to Beacon",
          body: "Hi {{lead.name}},\n\nNice to connect with you!"
        } : actionOrTriggerType === "NOTIFY_SLACK" ? {
          webhookUrl: "https://hooks.slack.com/services/mock/url",
          message: "A new lead {{lead.name}} has been qualified with score {{lead.status}}."
        } : {}
      }
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
  };

  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === "node-trigger") {
      alert("Trigger node cannot be deleted.");
      return;
    }
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  const handleSave = async () => {
    const triggerNode = nodes.find((n) => n.type === "trigger");
    if (!triggerNode) {
      alert("A trigger is required.");
      return;
    }
    await onSave(
      initialWorkflow?.id || null,
      workflowName,
      triggerNode.data.type,
      nodes,
      edges
    );
  };

  // Node position helper to compute connector coordinates
  const getNodeConnector = (nodeId: string, type: "input" | "output", handle?: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    const nodeWidth = 180;
    const nodeHeight = 70;
    
    if (type === "input") {
      return { x: node.x, y: node.y + nodeHeight / 2 };
    } else {
      if (node.type === "condition") {
        if (handle === "true") {
          return { x: node.x + nodeWidth, y: node.y + nodeHeight / 3 };
        } else {
          return { x: node.x + nodeWidth, y: node.y + (nodeHeight * 2) / 3 };
        }
      }
      return { x: node.x + nodeWidth, y: node.y + nodeHeight / 2 };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 animate-fadeIn">
      {/* Top Banner Toolbar */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-teal-500 py-1 font-bold text-white text-lg focus:outline-none transition w-64"
          />
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm rounded-xl transition shadow shadow-teal-950"
        >
          <Save className="h-4 w-4" />
          Save Workflow
        </button>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Toolbox Node Drawer */}
        <aside className="w-72 bg-slate-900/60 border-r border-slate-800 p-5 overflow-y-auto space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trigger Event</h4>
            <p className="text-[10px] text-slate-500 mt-1">Starting point. Triggers when event fires.</p>
            <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Zap className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                {nodes.find(n => n.type === 'trigger')?.data.label || 'Lead Created'}
              </span>
            </div>
            
            {/* Quick trigger selectors */}
            <div className="mt-2 grid grid-cols-1 gap-1.5">
              {[
                { type: "LEAD_CREATED", label: "Lead Created" },
                { type: "LEAD_UPDATED", label: "Lead Updated" },
                { type: "DEAL_WON", label: "Deal Won (HOT Status)" },
                { type: "DEAL_LOST", label: "Deal Lost (COLD Status)" },
                { type: "MEETING_SCHEDULED", label: "Meeting Scheduled" },
              ].map((trig) => (
                <button
                  key={trig.type}
                  onClick={() => {
                    setNodes((prev) =>
                      prev.map((node) =>
                        node.type === "trigger"
                          ? { ...node, data: { ...node.data, label: trig.label, type: trig.type } }
                          : node
                      )
                    );
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-[11px] text-left text-slate-400 hover:text-white transition font-medium"
                >
                  Change trigger to: {trig.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Action nodes catalog */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Add Actions</h4>
            <div className="space-y-2">
              {[
                { type: "AI_RESEARCH", label: "AI Research" },
                { type: "LEAD_SCORING", label: "Lead Scoring" },
                { type: "SEND_EMAIL", label: "Send Email" },
                { type: "CREATE_TASK", label: "Create Task" },
                { type: "NOTIFY_SLACK", label: "Notify Slack" },
                { type: "GENERATE_REPORT", label: "Generate Report" },
              ].map((act) => (
                <button
                  key={act.type}
                  onClick={() => handleAddNode("action", act.type, act.label)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 hover:border-slate-700 text-left text-xs font-medium transition cursor-pointer text-slate-300"
                >
                  <span>{act.label}</span>
                  <Plus className="h-3.5 w-3.5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Logic elements catalog */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Add Conditionals</h4>
            <button
              onClick={() => handleAddNode("condition", "LEAD_SCORE_FILTER", "Condition Gate")}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-800 hover:border-slate-700 text-left text-xs font-medium transition cursor-pointer text-slate-300"
            >
              <span>If-Then Condition</span>
              <Plus className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </aside>

        {/* Center: Grid Workspace Visual Editor Canvas */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 h-full bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] relative overflow-hidden select-none"
        >
          
          {/* SVG Canvas drawing connection lines */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full z-10">
            {/* Render established edges */}
            {edges.map((edge) => {
              const start = getNodeConnector(edge.source, "output", edge.sourceHandle);
              const end = getNodeConnector(edge.target, "input");
              const d = `M ${start.x} ${start.y} C ${(start.x + end.x) / 2} ${start.y}, ${(start.x + end.x) / 2} ${end.y}, ${end.x} ${end.y}`;
              
              return (
                <g key={edge.id} className="group pointer-events-auto cursor-pointer">
                  {/* Outer thicker line to make clicking easy */}
                  <path
                    d={d}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={8}
                    onClick={() => handleDeleteEdge(edge.id)}
                  />
                  <path
                    d={d}
                    fill="none"
                    stroke={edge.sourceHandle === 'false' ? '#ef4444' : edge.sourceHandle === 'true' ? '#10b981' : '#0d9488'}
                    strokeWidth={2}
                    className="hover:stroke-red-500 transition-colors"
                  />
                  {/* Edge overlay label or icon */}
                  {edge.sourceHandle && (
                    <text
                      x={(start.x + end.x) / 2}
                      y={(start.y + end.y) / 2 - 5}
                      fill={edge.sourceHandle === 'true' ? '#10b981' : '#ef4444'}
                      fontSize={9}
                      fontWeight="bold"
                      textAnchor="middle"
                      className="bg-slate-950 font-sans"
                    >
                      {edge.sourceHandle.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render drawing connection line */}
            {drawingConnection && (
              <path
                d={`M ${drawingConnection.startX} ${drawingConnection.startY} C ${(drawingConnection.startX + drawingConnection.currentX) / 2} ${drawingConnection.startY}, ${(drawingConnection.startX + drawingConnection.currentX) / 2} ${drawingConnection.currentY}, ${drawingConnection.currentX} ${drawingConnection.currentY}`}
                fill="none"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            )}
          </svg>

          {/* Render workflow nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <div
                key={node.id}
                style={{ left: node.x, top: node.y }}
                onMouseDown={(e) => handleStartNodeDrag(e, node)}
                className={`absolute w-[180px] min-h-[70px] bg-slate-900 border rounded-xl p-3 flex flex-col justify-between cursor-move transition-shadow z-20 ${
                  isSelected 
                    ? "border-teal-500 shadow-lg shadow-teal-500/10 ring-1 ring-teal-500/20" 
                    : "border-slate-800 hover:border-slate-700 shadow-sm"
                }`}
              >
                {/* Inputs and output connection ports */}
                {node.type !== "trigger" && (
                  <div
                    onMouseUp={(e) => handleEndConnection(e, node.id)}
                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-slate-950 border border-slate-700 rounded-full hover:bg-teal-500 hover:border-teal-400 cursor-crosshair flex items-center justify-center transition"
                    title="Connect input port"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 hover:bg-slate-200" />
                  </div>
                )}

                {/* Header label */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {node.type === "trigger" && <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
                    {node.type === "action" && <Play className="h-3.5 w-3.5 text-teal-400 shrink-0" />}
                    {node.type === "condition" && <Sliders className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                    
                    <span className="font-bold text-[11px] text-white truncate leading-tight">
                      {node.data.label}
                    </span>
                  </div>
                  {node.id !== "node-trigger" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Subtitle / context */}
                <div className="text-[10px] text-slate-500 truncate mt-1">
                  {node.type === "trigger" ? "Trigger Event" : node.type === "condition" ? "Evaluation Branch" : "Action task"}
                </div>

                {/* Output Ports handles */}
                {node.type === "condition" ? (
                  <>
                    {/* True branch handle port */}
                    <div
                      onMouseDown={(e) => handleStartConnection(e, node.id, "true")}
                      className="absolute -right-1.5 top-[23px] w-3 h-3 bg-slate-950 border border-emerald-500 rounded-full hover:bg-emerald-400 cursor-crosshair flex items-center justify-center transition"
                      title="True branch link"
                    >
                      <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                    </div>
                    {/* False branch handle port */}
                    <div
                      onMouseDown={(e) => handleStartConnection(e, node.id, "false")}
                      className="absolute -right-1.5 top-[47px] w-3.5 h-3.5 bg-slate-950 border border-rose-500 rounded-full hover:bg-rose-400 cursor-crosshair flex items-center justify-center transition"
                      title="False branch link"
                    >
                      <div className="w-1 h-1 bg-rose-500 rounded-full" />
                    </div>
                  </>
                ) : (
                  /* Standard Output Handle port */
                  <div
                    onMouseDown={(e) => handleStartConnection(e, node.id)}
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-slate-950 border border-slate-700 rounded-full hover:bg-teal-500 hover:border-teal-400 cursor-crosshair flex items-center justify-center transition"
                    title="Connect output port"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600 hover:bg-slate-200" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Side: Node Configuration Parameter Panel */}
        <aside className="w-80 bg-slate-900/60 border-l border-slate-800 p-5 overflow-y-auto">
          {!selectedNode ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <Sliders className="h-8 w-8 text-slate-700 mb-3 stroke-1" />
              <h5 className="text-xs font-bold text-slate-400">Node Configuration</h5>
              <p className="text-[10px] mt-1">Select a node in the grid workspace to configure its attributes, execution conditions, and variables.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Configure Node
                </h4>
                <span className="text-[10px] font-mono text-slate-500">{selectedNode.id.substring(0, 8)}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Label
                </label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...n.data, label: val } }
                          : n
                      )
                    );
                    setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, label: val } } : null));
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Dynamic properties based on node contents */}
              {selectedNode.type === "condition" && (
                <div className="space-y-4 border-t border-slate-800 pt-4">
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5" />
                    Conditional Evaluator
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Check Field
                    </label>
                    <select
                      value={selectedNode.data.config?.field || "score"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, field: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, field: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                    >
                      <option value="score">Lead AI Score (0-100)</option>
                      <option value="budget">Lead Budget Value ($)</option>
                      <option value="engagement">Engagement Metric (0-100)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Comparison Operator
                    </label>
                    <select
                      value={selectedNode.data.config?.operator || "gt"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, operator: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, operator: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="gt">Greater Than (&gt;)</option>
                      <option value="lt">Less Than (&lt;)</option>
                      <option value="eq">Equal To (=)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Threshold Value
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.value || "80"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, value: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, value: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {selectedNode.data.type === "SEND_EMAIL" && (
                <div className="space-y-4 border-t border-slate-800 pt-4">
                  <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-2">
                    Send Email Parameters
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.to || "{{lead.email}}"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, to: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, to: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Email Subject
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.subject || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, subject: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, subject: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Email Body HTML / Text
                    </label>
                    <textarea
                      rows={5}
                      value={selectedNode.data.config?.body || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, body: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, body: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none font-mono"
                    />
                    <div className="text-[9px] text-slate-500 mt-1 leading-tight">
                      Use placeholders like <code>{"{{lead.name}}"}</code>, <code>{"{{lead.email}}"}</code> to insert dynamic data.
                    </div>
                  </div>
                </div>
              )}

              {selectedNode.data.type === "NOTIFY_SLACK" && (
                <div className="space-y-4 border-t border-slate-800 pt-4">
                  <div className="text-[10px] font-bold text-teal-400 uppercase tracking-wider mb-2">
                    Slack webhook parameters
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Slack Webhook URL
                    </label>
                    <input
                      type="text"
                      value={selectedNode.data.config?.webhookUrl || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, webhookUrl: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, webhookUrl: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      Slack Message Payload
                    </label>
                    <textarea
                      rows={4}
                      value={selectedNode.data.config?.message || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes((prev) =>
                          prev.map((n) =>
                            n.id === selectedNode.id
                              ? { ...n, data: { ...n.data, config: { ...n.data.config, message: val } } }
                              : n
                          )
                        );
                        setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, config: { ...prev.data.config, message: val } } } : null));
                      }}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedNode.type === "action" && 
                selectedNode.data.type !== "SEND_EMAIL" && 
                selectedNode.data.type !== "NOTIFY_SLACK" && (
                  <div className="border-t border-slate-800 pt-4 text-center p-4 bg-slate-950/40 rounded-xl">
                    <Sliders className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-500 leading-tight">
                      This action type executes autonomously based on execution context inputs. No parameters required.
                    </p>
                  </div>
              )}

            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
