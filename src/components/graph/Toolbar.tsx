import { Plus, Trash2, Link, Download, RotateCcw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ToolbarProps {
  onAddNode: () => void;
  onAddEdge: () => void;
  onClear: () => void;
  onExport: () => void;
  onFitView: () => void;
  isAddingEdge: boolean;
  hasSelection: boolean;
  onDeleteSelected: () => void;
}

export const Toolbar = ({
  onAddNode,
  onAddEdge,
  onClear,
  onExport,
  onFitView,
  isAddingEdge,
  hasSelection,
  onDeleteSelected,
}: ToolbarProps) => {
  const tools = [
    { icon: Plus, label: 'Add Node', onClick: onAddNode, active: false },
    { icon: Link, label: 'Add Edge', onClick: onAddEdge, active: isAddingEdge },
    { icon: Trash2, label: 'Delete Selected', onClick: onDeleteSelected, active: false, disabled: !hasSelection },
    { icon: RotateCcw, label: 'Clear All', onClick: onClear, active: false },
    { icon: Maximize2, label: 'Fit View', onClick: onFitView, active: false },
    { icon: Download, label: 'Export PNG', onClick: onExport, active: false },
  ];

  return (
    <div className="glass-panel p-2 flex gap-1 animate-slide-up">
      {tools.map((tool) => (
        <Tooltip key={tool.label}>
          <TooltipTrigger asChild>
            <Button
              variant={tool.active ? 'glow' : 'toolbar'}
              size="icon-sm"
              onClick={tool.onClick}
              disabled={tool.disabled}
              className="relative"
            >
              <tool.icon className="w-4 h-4" />
              {tool.active && (
                <div className="absolute inset-0 rounded-md bg-primary/20 border border-primary/50 transition-all duration-200" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {tool.label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};
