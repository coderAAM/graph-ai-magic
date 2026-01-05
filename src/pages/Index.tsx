import { useState, useRef, useCallback } from 'react';
import { Core } from 'cytoscape';
import { GraphCanvas, GraphNode, GraphEdge } from '@/components/graph/GraphCanvas';
import { Toolbar } from '@/components/graph/Toolbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

let nodeCounter = 1;

const Index = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [edgeSourceNode, setEdgeSourceNode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cyRef = useRef<Core | null>(null);
  const { toast } = useToast();

  const handleAddNode = useCallback(() => {
    const newNode: GraphNode = {
      id: `N${nodeCounter++}`,
      label: `Node ${nodeCounter - 1}`,
    };
    setNodes((prev) => [...prev, newNode]);
    toast({
      title: 'Node Added',
      description: `Added ${newNode.label}`,
    });
  }, [toast]);

  const handleAddEdge = useCallback(() => {
    setIsAddingEdge((prev) => !prev);
    setEdgeSourceNode(null);
    if (!isAddingEdge) {
      toast({
        title: 'Edge Mode',
        description: 'Click two nodes to create an edge',
      });
    }
  }, [isAddingEdge, toast]);

  const handleEdgeCreated = useCallback((source: string, target: string) => {
    if (source === target) {
      toast({
        title: 'Invalid Edge',
        description: 'Cannot connect a node to itself',
        variant: 'destructive',
      });
      return;
    }
    
    const edgeExists = edges.some(
      (e) => (e.source === source && e.target === target) || (e.source === target && e.target === source)
    );
    
    if (edgeExists) {
      toast({
        title: 'Edge Exists',
        description: 'This edge already exists',
        variant: 'destructive',
      });
      return;
    }
    
    setEdges((prev) => [...prev, { source, target }]);
    setIsAddingEdge(false);
    setEdgeSourceNode(null);
    toast({
      title: 'Edge Created',
      description: `Connected ${source} → ${target}`,
    });
  }, [edges, toast]);

  const handleNodeSelect = useCallback((nodeId: string | null) => {
    if (isAddingEdge) {
      if (!edgeSourceNode && nodeId) {
        setEdgeSourceNode(nodeId);
      } else if (edgeSourceNode && nodeId) {
        handleEdgeCreated(edgeSourceNode, nodeId);
      }
    } else {
      setSelectedNodeId(nodeId);
      setSelectedEdgeId(null);
    }
  }, [isAddingEdge, edgeSourceNode, handleEdgeCreated]);

  const handleEdgeSelect = useCallback((edgeId: string | null) => {
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
  }, []);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    nodeCounter = 1;
    toast({
      title: 'Cleared',
      description: 'All nodes and edges removed',
    });
  }, [toast]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) => prev.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
      setSelectedNodeId(null);
      toast({
        title: 'Deleted',
        description: `Removed node ${selectedNodeId}`,
      });
    } else if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => `${e.source}-${e.target}` !== selectedEdgeId));
      setSelectedEdgeId(null);
      toast({
        title: 'Deleted',
        description: 'Removed edge',
      });
    }
  }, [selectedNodeId, selectedEdgeId, toast]);

  const handleExport = useCallback(() => {
    const cy = cyRef.current;
    if (!cy) return;
    
    const png = cy.png({ bg: '#0a1628', full: true, scale: 2 });
    const link = document.createElement('a');
    link.href = png;
    link.download = 'graph.png';
    link.click();
    
    toast({
      title: 'Exported',
      description: 'Graph saved as PNG',
    });
  }, [toast]);

  const handleFitView = useCallback(() => {
    const cy = cyRef.current;
    if (cy) {
      cy.fit(undefined, 50);
      cy.center();
    }
  }, []);

  const handleGraphCommand = useCallback(async (command: string) => {
    setIsProcessing(true);
    
    try {
      console.log('Sending command to AI:', command);
      
      const { data, error } = await supabase.functions.invoke('generate-graph', {
        body: { command }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate graph');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log('Received graph data:', data);

      // Update node counter based on generated nodes
      const maxId = Math.max(...data.nodes.map((n: GraphNode) => {
        const match = n.id.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      }), 0);
      nodeCounter = maxId + 1;
      
      setNodes(data.nodes);
      setEdges(data.edges);
      
      // Add assistant message
      if ((window as any).addAssistantMessage) {
        (window as any).addAssistantMessage(data.message);
      }

      toast({
        title: 'Graph Generated',
        description: `Created ${data.nodes.length} nodes and ${data.edges.length} edges`,
      });

    } catch (error) {
      console.error('Error generating graph:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate graph';
      
      if ((window as any).addAssistantMessage) {
        (window as any).addAssistantMessage(`Sorry, I couldn't generate that graph: ${errorMessage}`);
      }
      
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 glass-panel-strong">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">GraphAI Visualizer</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Interactive AI-powered graph editor</p>
          </div>
        </div>
        
        {/* Toolbar - Desktop */}
        <div className="hidden md:block">
          <Toolbar
            onAddNode={handleAddNode}
            onAddEdge={handleAddEdge}
            onClear={handleClear}
            onExport={handleExport}
            onFitView={handleFitView}
            isAddingEdge={isAddingEdge}
            hasSelection={!!selectedNodeId || !!selectedEdgeId}
            onDeleteSelected={handleDeleteSelected}
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
          />
          
          {/* Mobile Toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 md:hidden">
            <Toolbar
              onAddNode={handleAddNode}
              onAddEdge={handleAddEdge}
              onClear={handleClear}
              onExport={handleExport}
              onFitView={handleFitView}
              isAddingEdge={isAddingEdge}
              hasSelection={!!selectedNodeId || !!selectedEdgeId}
              onDeleteSelected={handleDeleteSelected}
            />
          </div>
          
          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/50 flex items-center justify-center animate-glow-pulse">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Create Your Graph</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Use the chat to describe your graph, or add nodes manually with the toolbar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Chat Panel */}
        <div className="w-80 lg:w-96 border-l border-border/50 hidden sm:block">
          <ChatPanel
            onGraphCommand={handleGraphCommand}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
