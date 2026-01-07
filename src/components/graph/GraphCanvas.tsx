import { useEffect, useRef, useState } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';

export interface GraphNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  color?: string;
  width?: number;
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeSelect?: (nodeId: string | null) => void;
  onEdgeSelect?: (edgeId: string | null) => void;
  selectedNodeId?: string | null;
  isAddingEdge?: boolean;
  edgeSourceNode?: string | null;
  onEdgeCreated?: (source: string, target: string) => void;
  cyRef?: React.MutableRefObject<Core | null>;
  onNodeDragEnd?: (positions: NodePosition[]) => void;
}

export const GraphCanvas = ({
  nodes,
  edges,
  onNodeSelect,
  onEdgeSelect,
  selectedNodeId,
  isAddingEdge,
  edgeSourceNode,
  onEdgeCreated,
  cyRef,
  onNodeDragEnd,
}: GraphCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalCyRef = useRef<Core | null>(null);
  const [isReady, setIsReady] = useState(false);

  const getCy = () => cyRef?.current || internalCyRef.current;

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#00d4ff',
            'background-opacity': 0.9,
            label: 'data(label)',
            color: '#ffffff',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '14px',
            'font-family': 'Space Grotesk, sans-serif',
            'font-weight': 500,
            width: 50,
            height: 50,
            'border-width': 2,
            'border-color': '#00d4ff',
            'text-outline-width': 2,
            'text-outline-color': '#0a1628',
            'overlay-padding': '6px',
            'z-index': 10,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': '#a855f7',
            'border-color': '#a855f7',
            'border-width': 3,
          },
        },
        {
          selector: 'node.highlighted',
          style: {
            'background-color': '#a855f7',
            'border-color': '#ffffff',
            'border-width': 3,
          },
        },
        {
          selector: 'node.edge-source',
          style: {
            'background-color': '#22c55e',
            'border-color': '#22c55e',
            'border-width': 3,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#0891b2',
            'target-arrow-color': '#0891b2',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2,
            opacity: 0.8,
          },
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#a855f7',
            'target-arrow-color': '#a855f7',
            width: 3,
            opacity: 1,
          },
        },
      ],
      layout: { name: 'preset' },
      minZoom: 0.3,
      maxZoom: 3,
      wheelSensitivity: 0.3,
    });

    if (cyRef) {
      cyRef.current = cy;
    }
    internalCyRef.current = cy;

    // Event handlers
    cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular;
      if (isAddingEdge && edgeSourceNode) {
        onEdgeCreated?.(edgeSourceNode, node.id());
      } else {
        onNodeSelect?.(node.id());
      }
    });

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target as EdgeSingular;
      onEdgeSelect?.(edge.id());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        onNodeSelect?.(null);
        onEdgeSelect?.(null);
      }
    });

    // Handle drag end to update node positions
    cy.on('dragfree', 'node', () => {
      if (onNodeDragEnd) {
        const positions: NodePosition[] = cy.nodes().map((n) => ({
          id: n.id(),
          x: n.position('x'),
          y: n.position('y'),
        }));
        onNodeDragEnd(positions);
      }
    });

    setIsReady(true);

    return () => {
      cy.destroy();
    };
  }, []);

  // Update graph data
  useEffect(() => {
    const cy = getCy();
    if (!cy || !isReady) return;

    // Update nodes
    const existingNodeIds = cy.nodes().map((n) => n.id());
    const newNodeIds = nodes.map((n) => n.id);

    // Remove nodes that no longer exist
    existingNodeIds.forEach((id) => {
      if (!newNodeIds.includes(id)) {
        cy.getElementById(id).remove();
      }
    });

    // Add or update nodes
    nodes.forEach((node, index) => {
      const existingNode = cy.getElementById(node.id);
      if (existingNode.length === 0) {
        const angle = (2 * Math.PI * index) / Math.max(nodes.length, 1);
        const radius = 150;
        const addedNode = cy.add({
          data: { id: node.id, label: node.label || node.id },
          position: {
            x: node.x ?? cy.width() / 2 + radius * Math.cos(angle),
            y: node.y ?? cy.height() / 2 + radius * Math.sin(angle),
          },
        });
        // Apply custom styles if present
        if (node.color || node.size) {
          addedNode.style({
            'background-color': node.color || '#00d4ff',
            'border-color': node.color || '#00d4ff',
            width: node.size || 50,
            height: node.size || 50,
          });
        }
      } else {
        existingNode.data('label', node.label || node.id);
        // Update styles if they changed
        if (node.color || node.size) {
          existingNode.style({
            'background-color': node.color || '#00d4ff',
            'border-color': node.color || '#00d4ff',
            width: node.size || 50,
            height: node.size || 50,
          });
        }
      }
    });

    // Update edges
    const existingEdgeIds = cy.edges().map((e) => e.id());
    const newEdgeIds = edges.map((e) => `${e.source}-${e.target}`);

    // Remove edges that no longer exist
    existingEdgeIds.forEach((id) => {
      if (!newEdgeIds.includes(id)) {
        cy.getElementById(id).remove();
      }
    });

    // Add new edges
    edges.forEach((edge) => {
      const edgeId = `${edge.source}-${edge.target}`;
      if (cy.getElementById(edgeId).length === 0) {
        const addedEdge = cy.add({
          data: {
            id: edgeId,
            source: edge.source,
            target: edge.target,
            label: edge.label,
          },
        });
        // Apply custom styles if present
        if (edge.color || edge.width) {
          addedEdge.style({
            'line-color': edge.color || '#0891b2',
            'target-arrow-color': edge.color || '#0891b2',
            width: edge.width || 2,
          });
        }
      } else {
        const existingEdge = cy.getElementById(edgeId);
        if (edge.color || edge.width) {
          existingEdge.style({
            'line-color': edge.color || '#0891b2',
            'target-arrow-color': edge.color || '#0891b2',
            width: edge.width || 2,
          });
        }
      }
    });

    // Run layout for new nodes
    if (nodes.length > 0) {
      cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 500,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 100,
        gravity: 0.25,
        fit: true,
        padding: 50,
      }).run();
    }
  }, [nodes, edges, isReady]);

  // Handle selected node highlighting
  useEffect(() => {
    const cy = getCy();
    if (!cy || !isReady) return;

    cy.nodes().removeClass('highlighted edge-source');
    
    if (edgeSourceNode) {
      cy.getElementById(edgeSourceNode).addClass('edge-source');
    } else if (selectedNodeId) {
      cy.getElementById(selectedNodeId).addClass('highlighted');
    }
  }, [selectedNodeId, edgeSourceNode, isReady]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full bg-gradient-to-br from-background via-background to-secondary/20 animate-fade-in"
      />
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Edge creation hint */}
      {isAddingEdge && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel px-4 py-2 text-sm text-foreground animate-slide-up">
          {edgeSourceNode 
            ? `Click target node to connect from "${edgeSourceNode}"`
            : 'Click source node to start edge'
          }
        </div>
      )}

      {/* Glow effect in corner */}
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-radial from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-radial from-accent/5 to-transparent pointer-events-none" />
    </div>
  );
};
