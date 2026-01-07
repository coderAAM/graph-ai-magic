import { useState } from 'react';
import { Save, FolderOpen, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SavedGraph } from '@/hooks/useGraphStorage';

interface SaveLoadPanelProps {
  savedGraphs: SavedGraph[];
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  hasNodes: boolean;
}

export const SaveLoadPanel = ({
  savedGraphs,
  onSave,
  onLoad,
  onDelete,
  hasNodes,
}: SaveLoadPanelProps) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [graphName, setGraphName] = useState('');

  const handleSave = () => {
    if (graphName.trim()) {
      onSave(graphName.trim());
      setGraphName('');
      setSaveDialogOpen(false);
    }
  };

  const handleLoad = (id: string) => {
    onLoad(id);
    setLoadDialogOpen(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex gap-1">
      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="toolbar" size="icon-sm" disabled={!hasNodes}>
                <Save className="w-4 h-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Save Graph
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Graph</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Enter graph name..."
              value={graphName}
              onChange={(e) => setGraphName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <Button onClick={handleSave} disabled={!graphName.trim()}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="toolbar" size="icon-sm" disabled={savedGraphs.length === 0}>
                <FolderOpen className="w-4 h-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Load Graph ({savedGraphs.length})
          </TooltipContent>
        </Tooltip>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Load Graph</DialogTitle>
          </DialogHeader>
          {savedGraphs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No saved graphs yet
            </p>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="flex flex-col gap-2">
                {savedGraphs.map((graph) => (
                  <div
                    key={graph.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <button
                      className="flex-1 text-left"
                      onClick={() => handleLoad(graph.id)}
                    >
                      <p className="font-medium text-sm">{graph.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {graph.nodes.length} nodes, {graph.edges.length} edges •{' '}
                        {formatDate(graph.updatedAt)}
                      </p>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(graph.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
