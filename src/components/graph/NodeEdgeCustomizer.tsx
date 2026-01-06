import { useState, useEffect } from 'react';
import { X, Palette, Type, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const NODE_COLORS = [
  { name: 'Cyan', value: '#00d4ff' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
];

const EDGE_COLORS = [
  { name: 'Teal', value: '#0891b2' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Gray', value: '#6b7280' },
];

interface NodeCustomization {
  label: string;
  color: string;
  size: number;
}

interface EdgeCustomization {
  label: string;
  color: string;
  width: number;
}

interface NodeEdgeCustomizerProps {
  type: 'node' | 'edge';
  selectedId: string;
  currentLabel?: string;
  currentColor?: string;
  currentSize?: number;
  onUpdate: (customization: NodeCustomization | EdgeCustomization) => void;
  onClose: () => void;
}

export const NodeEdgeCustomizer = ({
  type,
  selectedId,
  currentLabel = '',
  currentColor,
  currentSize,
  onUpdate,
  onClose,
}: NodeEdgeCustomizerProps) => {
  const colors = type === 'node' ? NODE_COLORS : EDGE_COLORS;
  const defaultColor = type === 'node' ? '#00d4ff' : '#0891b2';
  const defaultSize = type === 'node' ? 50 : 2;

  const [label, setLabel] = useState(currentLabel);
  const [color, setColor] = useState(currentColor || defaultColor);
  const [size, setSize] = useState(currentSize || defaultSize);

  useEffect(() => {
    setLabel(currentLabel);
    setColor(currentColor || defaultColor);
    setSize(currentSize || defaultSize);
  }, [selectedId, currentLabel, currentColor, currentSize]);

  const handleApply = () => {
    if (type === 'node') {
      onUpdate({ label, color, size });
    } else {
      onUpdate({ label, color, width: size });
    }
  };

  return (
    <div className="absolute top-4 right-4 w-72 glass-panel-strong p-4 rounded-xl animate-scale-in z-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {type === 'node' ? (
            <Circle className="w-4 h-4 text-primary" />
          ) : (
            <div className="w-4 h-0.5 bg-primary rounded" />
          )}
          <h3 className="font-semibold text-foreground">
            {type === 'node' ? 'Node' : 'Edge'} Settings
          </h3>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Label */}
      <div className="space-y-2 mb-4">
        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Type className="w-3 h-3" />
          Label
        </Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`Enter ${type} label`}
          className="bg-secondary/50 border-border/50"
        />
      </div>

      {/* Color Picker */}
      <div className="space-y-2 mb-4">
        <Label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Palette className="w-3 h-3" />
          Color
        </Label>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-full aspect-square rounded-lg transition-all duration-200 ${
                color === c.value
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Size Slider */}
      <div className="space-y-2 mb-6">
        <Label className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{type === 'node' ? 'Size' : 'Width'}</span>
          <span className="text-foreground font-medium">{size}px</span>
        </Label>
        <Slider
          value={[size]}
          onValueChange={(v) => setSize(v[0])}
          min={type === 'node' ? 30 : 1}
          max={type === 'node' ? 100 : 8}
          step={1}
          className="w-full"
        />
      </div>

      {/* Preview */}
      <div className="mb-4 p-3 bg-secondary/30 rounded-lg flex items-center justify-center">
        {type === 'node' ? (
          <div
            className="rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              color: '#fff',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {label.substring(0, 3) || 'N'}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
            <div
              className="w-16 transition-all duration-200"
              style={{
                height: size,
                backgroundColor: color,
              }}
            />
            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
          </div>
        )}
      </div>

      {/* Apply Button */}
      <Button variant="glow" className="w-full" onClick={handleApply}>
        Apply Changes
      </Button>
    </div>
  );
};
