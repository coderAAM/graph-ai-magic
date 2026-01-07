import { useState, useRef, useCallback } from 'react';
import { GraphCanvas, NodePosition } from '@/components/graph/GraphCanvas';
import { Toolbar } from '@/components/graph/Toolbar';
import { ZoomControls } from '@/components/graph/ZoomControls';
import { SaveLoadPanel } from '@/components/graph/SaveLoadPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { MobileChatDrawer } from '@/components/chat/MobileChatDrawer';
import { NodeEdgeCustomizer } from '@/components/graph/NodeEdgeCustomizer';
import { useToast } from '@/hooks/use-toast';
import { useGraphStorage } from '@/hooks/useGraphStorage';
import { useGraphHistory } from '@/hooks/useGraphHistory';
import { supabase } from '@/integrations/supabase/client';

export interface Node {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

export interface Edge {
  source: string;
  target: string;
  label?: string;
  color?: string;
  width?: number;
}

const Index = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cyRef = useRef<any>(null);
  const { toast } = useToast();
  const { savedGraphs, saveGraph, deleteGraph, loadGraph } = useGraphStorage();
  const { undo, redo, canUndo, canRedo } = useGraphHistory(nodes, edges, setNodes, setEdges);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    if (isAddingEdge && nodeId) {
      if (!edgeSourceNode) {
        setEdgeSourceNode(nodeId);
        toast({
          title: 'Edge Source Selected',
          description: `Now click on the target node for the edge from "${nodeId}"`,
        });
      } else if (nodeId !== edgeSourceNode) {
        // Create edge
        const newEdge: Edge = { source: edgeSourceNode, target: nodeId };
        setEdges((prev) => [...prev, newEdge]);
        setIsAddingEdge(false);
        setEdgeSourceNode(null);
        toast({
          title: 'Edge Created',
          description: `Connected "${edgeSourceNode}" to "${nodeId}"`,
        });
      }
    } else {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
    }
  }, [isAddingEdge, edgeSourceNode, toast]);

  const handleEdgeSelect = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  const handleAddNode = useCallback(() => {
    const newId = `node_${Date.now()}`;
    const newNode: Node = {
      id: newId,
      label: `Node ${nodes.length + 1}`,
    };
    setNodes((prev) => [...prev, newNode]);
    toast({
      title: 'Node Added',
      description: `Created new node "${newNode.label}"`,
    });
  }, [nodes.length, toast]);

  const handleAddEdge = useCallback(() => {
    if (nodes.length < 2) {
      toast({
        title: 'Cannot Add Edge',
        description: 'You need at least 2 nodes to create an edge',
        variant: 'destructive',
      });
      return;
    }
    setIsAddingEdge(true);
    setEdgeSourceNode(null);
    toast({
      title: 'Adding Edge',
      description: 'Click on the source node first, then the target node',
    });
  }, [nodes.length, toast]);

  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) =>
        prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
      );
      setSelectedNodeId(null);
      toast({
        title: 'Node Deleted',
        description: `Removed node and its connected edges`,
      });
    } else if (selectedEdgeId) {
      const [source, target] = selectedEdgeId.split('-');
      setEdges((prev) => prev.filter((e) => !(e.source === source && e.target === target)));
      setSelectedEdgeId(null);
      toast({
        title: 'Edge Deleted',
        description: 'Removed the selected edge',
      });
    }
  }, [selectedNodeId, selectedEdgeId, toast]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    toast({
      title: 'Graph Cleared',
      description: 'All nodes and edges have been removed',
    });
  }, [toast]);

  const handleExport = useCallback(() => {
    if (cyRef.current) {
      const png = cyRef.current.png({ full: true, scale: 2 });
      const link = document.createElement('a');
      link.href = png;
      link.download = 'graph.png';
      link.click();
      toast({
        title: 'Graph Exported',
        description: 'Your graph has been saved as PNG',
      });
    }
  }, [toast]);

  const handleFitView = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50);
      cyRef.current.center();
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.3);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() / 1.3);
    }
  }, []);

  const handleNodeDragEnd = useCallback((positions: NodePosition[]) => {
    setNodes((prev) =>
      prev.map((node) => {
        const pos = positions.find((p) => p.id === node.id);
        return pos ? { ...node, x: pos.x, y: pos.y } : node;
      })
    );
  }, []);

  const handleSaveGraph = useCallback((name: string) => {
    saveGraph(name, nodes, edges);
    toast({
      title: 'Graph Saved',
      description: `"${name}" has been saved to your browser`,
    });
  }, [nodes, edges, saveGraph, toast]);

  const handleLoadGraph = useCallback((id: string) => {
    const graph = loadGraph(id);
    if (graph) {
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      toast({
        title: 'Graph Loaded',
        description: `Loaded "${graph.name}"`,
      });
    }
  }, [loadGraph, toast]);

  const handleDeleteGraph = useCallback((id: string) => {
    deleteGraph(id);
    toast({
      title: 'Graph Deleted',
      description: 'The saved graph has been removed',
    });
  }, [deleteGraph, toast]);

  const handleEdgeCreated = useCallback((source: string, target: string) => {
    const newEdge: Edge = { source, target };
    setEdges((prev) => [...prev, newEdge]);
  }, []);

  const handleNodeUpdate = useCallback((customization: { label: string; color: string; size: number }) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId
          ? { ...n, label: customization.label, color: customization.color, size: customization.size }
          : n
      )
    );
    // Update cytoscape node style directly
    if (cyRef.current) {
      const node = cyRef.current.getElementById(selectedNodeId);
      if (node.length) {
        node.data('label', customization.label);
        node.style({
          'background-color': customization.color,
          'border-color': customization.color,
          width: customization.size,
          height: customization.size,
        });
      }
    }
    toast({
      title: 'Node Updated',
      description: `Applied changes to "${customization.label}"`,
    });
  }, [selectedNodeId, toast]);

  const handleEdgeUpdate = useCallback((customization: { label: string; color: string; width: number }) => {
    if (!selectedEdgeId) return;
    const [source, target] = selectedEdgeId.split('-');
    setEdges((prev) =>
      prev.map((e) =>
        e.source === source && e.target === target
          ? { ...e, label: customization.label, color: customization.color, width: customization.width }
          : e
      )
    );
    // Update cytoscape edge style directly
    if (cyRef.current) {
      const edge = cyRef.current.getElementById(selectedEdgeId);
      if (edge.length) {
        edge.data('label', customization.label);
        edge.style({
          'line-color': customization.color,
          'target-arrow-color': customization.color,
          width: customization.width,
        });
      }
    }
    toast({
      title: 'Edge Updated',
      description: 'Applied changes to edge',
    });
  }, [selectedEdgeId, toast]);

  const getSelectedNode = () => nodes.find((n) => n.id === selectedNodeId);
  const getSelectedEdge = () => {
    if (!selectedEdgeId) return undefined;
    const [source, target] = selectedEdgeId.split('-');
    return edges.find((e) => e.source === source && e.target === target);
  };

  const handleGraphCommand = async (command: string) => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-graph', {
        body: { command },
      });

      if (error) {
        throw error;
      }

      if (data.nodes && data.edges) {
        setNodes(data.nodes);
        setEdges(data.edges);
        
        // Add assistant message
        if ((window as any).addAssistantMessage) {
          (window as any).addAssistantMessage(
            data.message || `Generated a graph with ${data.nodes.length} nodes and ${data.edges.length} edges.`
          );
        }
        
        toast({
          title: 'Graph Generated',
          description: `Created ${data.nodes.length} nodes and ${data.edges.length} edges`,
        });
      }
    } catch (error: any) {
      console.error('Error generating graph:', error);
      
      if ((window as any).addAssistantMessage) {
        (window as any).addAssistantMessage(
          "I'm sorry, I encountered an error while generating the graph. Please try again."
        );
      }
      
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate graph',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 glass-panel shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg
              className="w-5 h-5 text-background"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="5" cy="5" r="2" />
              <circle cx="19" cy="5" r="2" />
              <circle cx="12" cy="19" r="2" />
              <line x1="5" y1="7" x2="12" y2="17" />
              <line x1="19" y1="7" x2="12" y2="17" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            GraphAI Visualizer
          </h1>
        </div>
        
        {/* Desktop Toolbar */}
        <div className="hidden sm:flex items-center gap-2">
          <SaveLoadPanel
            savedGraphs={savedGraphs}
            onSave={handleSaveGraph}
            onLoad={handleLoadGraph}
            onDelete={handleDeleteGraph}
            hasNodes={nodes.length > 0}
          />
          <Toolbar
            onAddNode={handleAddNode}
            onAddEdge={handleAddEdge}
            onDeleteSelected={handleDelete}
            onClear={handleClear}
            onExport={handleExport}
            onFitView={handleFitView}
            isAddingEdge={isAddingEdge}
            hasSelection={!!selectedNodeId || !!selectedEdgeId}
          />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph Canvas */}
        <div className="flex-1 relative">
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
            selectedNodeId={selectedNodeId}
            isAddingEdge={isAddingEdge}
            edgeSourceNode={edgeSourceNode}
            onEdgeCreated={handleEdgeCreated}
            cyRef={cyRef}
            onNodeDragEnd={handleNodeDragEnd}
          />

          {/* Zoom Controls */}
          <ZoomControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
          />

          {/* Mobile Toolbar */}
          <div className="absolute bottom-4 left-4 right-4 sm:hidden">
            <Toolbar
              onAddNode={handleAddNode}
              onAddEdge={handleAddEdge}
              onDeleteSelected={handleDelete}
              onClear={handleClear}
              onExport={handleExport}
              onFitView={handleFitView}
              isAddingEdge={isAddingEdge}
              hasSelection={!!selectedNodeId || !!selectedEdgeId}
            />
          </div>

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-primary/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="5" cy="5" r="2" />
                    <circle cx="19" cy="5" r="2" />
                    <circle cx="12" cy="19" r="2" />
                    <line x1="5" y1="7" x2="12" y2="17" />
                    <line x1="19" y1="7" x2="12" y2="17" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground/80 mb-2">
                  No Graph Yet
                </h2>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Use the chat to describe a graph, or click "Add Node" to start building manually
                </p>
              </div>
            </div>
          )}

          {/* Node Customizer */}
          {selectedNodeId && !isAddingEdge && (
            <NodeEdgeCustomizer
              type="node"
              selectedId={selectedNodeId}
              currentLabel={getSelectedNode()?.label || selectedNodeId}
              currentColor={getSelectedNode()?.color}
              currentSize={getSelectedNode()?.size}
              onUpdate={handleNodeUpdate}
              onClose={() => setSelectedNodeId(null)}
            />
          )}

          {/* Edge Customizer */}
          {selectedEdgeId && (
            <NodeEdgeCustomizer
              type="edge"
              selectedId={selectedEdgeId}
              currentLabel={getSelectedEdge()?.label || ''}
              currentColor={getSelectedEdge()?.color}
              currentSize={getSelectedEdge()?.width}
              onUpdate={handleEdgeUpdate}
              onClose={() => setSelectedEdgeId(null)}
            />
          )}
        </div>

        {/* Desktop Chat Panel */}
        <div className="w-80 lg:w-96 border-l border-border/50 hidden sm:block">
          <ChatPanel
            onGraphCommand={handleGraphCommand}
            isProcessing={isProcessing}
          />
        </div>
      </div>

      {/* Mobile Chat Drawer */}
      <MobileChatDrawer
        onGraphCommand={handleGraphCommand}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default Index;
