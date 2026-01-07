import { useState, useCallback, useEffect } from 'react';
import type { Node, Edge } from '@/pages/Index';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export const useGraphHistory = (
  nodes: Node[],
  edges: Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) => {
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // Push current state to history when nodes/edges change (but not from undo/redo)
  useEffect(() => {
    if (isUndoRedoAction) {
      setIsUndoRedoAction(false);
      return;
    }

    const currentState = { nodes, edges };
    const lastState = history[historyIndex];

    // Only add to history if state actually changed
    if (
      JSON.stringify(currentState.nodes) !== JSON.stringify(lastState.nodes) ||
      JSON.stringify(currentState.edges) !== JSON.stringify(lastState.edges)
    ) {
      // Remove any future states if we're not at the end
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } else {
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setIsUndoRedoAction(true);
      setHistoryIndex(newIndex);
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      return true;
    }
    return false;
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setIsUndoRedoAction(true);
      setHistoryIndex(newIndex);
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      return true;
    }
    return false;
  }, [history, historyIndex, setNodes, setEdges]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return { undo, redo, canUndo, canRedo };
};
