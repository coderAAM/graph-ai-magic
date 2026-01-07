import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export const ZoomControls = ({ onZoomIn, onZoomOut, onFitView }: ZoomControlsProps) => {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1 glass-panel p-1 animate-fade-in z-10">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="toolbar" size="icon-sm" onClick={onZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          Zoom In
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="toolbar" size="icon-sm" onClick={onZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          Zoom Out
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="toolbar" size="icon-sm" onClick={onFitView}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          Fit View
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
