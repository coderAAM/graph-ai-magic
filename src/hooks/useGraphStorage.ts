import { useState, useEffect, useCallback } from 'react';
import type { Node, Edge } from '@/pages/Index';

const STORAGE_KEY = 'graphai-saved-graphs';

export interface SavedGraph {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
}

export const useGraphStorage = () => {
  const [savedGraphs, setSavedGraphs] = useState<SavedGraph[]>([]);

  // Load saved graphs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedGraphs(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load saved graphs:', error);
    }
  }, []);

  // Save to localStorage whenever savedGraphs changes
  const persistToStorage = useCallback((graphs: SavedGraph[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(graphs));
    } catch (error) {
      console.error('Failed to save graphs:', error);
    }
  }, []);

  const saveGraph = useCallback((name: string, nodes: Node[], edges: Edge[]) => {
    const now = Date.now();
    const newGraph: SavedGraph = {
      id: `graph_${now}`,
      name,
      nodes,
      edges,
      createdAt: now,
      updatedAt: now,
    };
    
    setSavedGraphs((prev) => {
      const updated = [...prev, newGraph];
      persistToStorage(updated);
      return updated;
    });
    
    return newGraph;
  }, [persistToStorage]);

  const updateGraph = useCallback((id: string, nodes: Node[], edges: Edge[]) => {
    setSavedGraphs((prev) => {
      const updated = prev.map((g) =>
        g.id === id ? { ...g, nodes, edges, updatedAt: Date.now() } : g
      );
      persistToStorage(updated);
      return updated;
    });
  }, [persistToStorage]);

  const deleteGraph = useCallback((id: string) => {
    setSavedGraphs((prev) => {
      const updated = prev.filter((g) => g.id !== id);
      persistToStorage(updated);
      return updated;
    });
  }, [persistToStorage]);

  const loadGraph = useCallback((id: string) => {
    return savedGraphs.find((g) => g.id === id);
  }, [savedGraphs]);

  return {
    savedGraphs,
    saveGraph,
    updateGraph,
    deleteGraph,
    loadGraph,
  };
};
