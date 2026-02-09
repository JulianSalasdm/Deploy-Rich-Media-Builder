
import React, { useRef, useState } from 'react';
import { ElementType, CanvasElement, GOOGLE_FONTS, OBJECT_FIT_OPTIONS } from '../types';
import { Icons } from './Icons';

interface RightPanelProps {
  selectedElement: CanvasElement | undefined;
  onUpdateElement: (id: number, updates: Partial<CanvasElement>) => void;
  onDuplicateElement: (id: number) => void;
  onDeleteElement: (id: number) => void;
  canvasConfig: { width: number; height: number; backgroundColor: string };
  setCanvasConfig: React.Dispatch<React.SetStateAction<{ width: number; height: number; backgroundColor: string }>>;
  globalLockRatio: boolean;
  setGlobalLockRatio: React.Dispatch<React.SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  animationsEnabled: boolean;
  setAnimationsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  selectedElement, 
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  canvasConfig,
  setCanvasConfig,
  showGrid,
  setShowGrid,
  animationsEnabled,
  setAnimationsEnabled
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sections, setSections] = useState({ settings: true, drag: true, properties: true });

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('application/react-dnd-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const updateStyle = (updates: React.CSSProperties) => {
    if (selectedElement) {
      onUpdateElement(selectedElement.id, { 
        style: { ...selectedElement.style, ...updates } 
      });
    }
  };

  const fitToCanvas = () => {
    if (!selectedElement) return;
    onUpdateElement(selectedElement.id, {
      x: 0,
      y: 0,
      width: canvasConfig.width,
      height: canvasConfig.height,
      lockAxis: 'both'
    });
  };

  const alignPreset = (pos: 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br') => {
    if (!selectedElement) return;
    const updates: Partial<CanvasElement> = {};
    const centerX = Math.round((canvasConfig.width - selectedElement.width) / 2);
    const rightX = Math.round(canvasConfig.width - selectedElement.width);
    const middleY = Math.round((canvasConfig.height - selectedElement.height) / 2);
    const bottomY = Math.round(canvasConfig.height - selectedElement.height);

    switch (pos) {
        case 'tl': updates.x = 0; updates.y = 0; updates.lockAxis = 'none'; break;
        case 'tc': updates.x = centerX; updates.y = 0; updates.lockAxis = 'x'; break;
        case 'tr': updates.x = rightX; updates.y = 0; updates.lockAxis = 'none'; break;
        case 'ml': updates.x = 0; updates.y = middleY; updates.lockAxis = 'y'; break;
        case 'mc': updates.x = centerX; updates.y = middleY; updates.lockAxis = 'both'; break;
        case 'mr': updates.x = rightX; updates.y = middleY; updates.lockAxis = 'y'; break;
        case 'bl': updates.x = 0; updates.y = bottomY; updates.lockAxis = 'none'; break;
        case 'bc': updates.x = centerX; updates.y = bottomY; updates.lockAxis = 'x'; break;
        case 'br': updates.x = rightX; updates.y = bottomY; updates.lockAxis = 'none'; break;
    }
    onUpdateElement(selectedElement.id, updates);
  };

  const DraggableTool = ({ type, label, icon: Icon }: { type: ElementType, label: string, icon: any }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, type)}
      className="flex flex-col items-center justify-center p-3 bg-[#1a1a1a] hover:bg-gray-800 rounded-lg cursor-grab active:cursor-grabbing transition-colors border border-gray-800 hover:border-[#9500cb]"
    >
      <Icon className="mb-1 text-[#9500cb]" size={20} />
      <span className="text-[10px] font-medium text-gray-300">{label}</span>
    </div>
  );

  const SectionHeader = ({ title, isOpen, onToggle, icon: Icon }: { title: string, isOpen: boolean, onToggle: () => void, icon?: any }) => (
    <div 
      onClick={onToggle}
      className="flex items-center justify-between p-3 bg-[#1a1a1a] border-b border-gray-800 cursor-pointer hover:bg-[#222] transition-colors"
    >
      <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
        {Icon && <Icon size={12} />} {title}
      </h3>
      {isOpen ? <Icons.Minus size={12} /> : <Icons.Plus size={12} />}
    </div>
  );

  const getLockType = (pos: string) => {
    if (pos === 'tc' || pos === 'bc') return 'x';
    if (pos === 'ml' || pos === 'mr') return 'y';
    if (pos === 'mc') return 'both';
    return 'none';
  };

  const AlignmentButton = ({ pos, label }: { pos: Parameters<typeof alignPreset>[0], label: string }) => (
      <button 
        onClick={() => alignPreset(pos)} 
        className={`p-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-400 flex items-center justify-center transition-all ${selectedElement?.lockAxis === getLockType(pos) ? 'ring-1 ring-[#9500cb] text-white bg-gray-700' : ''}`}
        title={label}
      >
        <div className={`w-2 h-2 rounded-sm border border-current ${pos.includes('c') || pos.includes('m') ? 'bg-current' : ''}`}></div>
      </button>
  );

  return (
    <div className="w-80 bg-[#121212] border-l border-gray-800 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <SectionHeader title="Ad Canvas" isOpen={sections.settings} onToggle={() => toggleSection('settings')} icon={Icons.Settings} />
      {sections.settings && (
        <div className="p-4 border-b border-gray-800 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-tighter font-bold">Width (px)</label>
              <input type="number" value={canvasConfig.width} onChange={(e) => setCanvasConfig(prev => ({ ...prev, width: Number(e.target.value) }))} className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 mb-1 uppercase tracking-tighter font-bold">Height (px)</label>
              <input type="number" value={canvasConfig.height} onChange={(e) => setCanvasConfig(prev => ({ ...prev, height: Number(e.target.value) }))} className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400">Canvas BG</label>
            <input type="color" value={canvasConfig.backgroundColor} onChange={(e) => setCanvasConfig(prev => ({ ...prev, backgroundColor: e.target.value }))} className="h-6 w-12 bg-transparent border-none cursor-pointer" />
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
             <div className="flex items-center gap-2">
                <input type="checkbox" id="showGrid" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="accent-[#9500cb]" />
                <label htmlFor="showGrid" className="text-xs text-gray-400">Show Grid</label>
             </div>
             <div className="flex items-center gap-2">
                <input type="checkbox" id="animEn" checked={animationsEnabled} onChange={(e) => setAnimationsEnabled(e.target.checked)} className="accent-[#9500cb]" />
                <label htmlFor="animEn" className="text-xs text-gray-400">Preview Animations</label>
             </div>
          </div>
        </div>
      )}

      <SectionHeader title="Elements Store" isOpen={sections.drag} onToggle={() => toggleSection('drag')} icon={Icons.Plus} />
      {sections.drag && (
        <div className="p-4 border-b border-gray-800 grid grid-cols-2 gap-2">
          <DraggableTool type="text" label="Text" icon={Icons.Type} />
          <DraggableTool type="button" label="Button" icon={Icons.Square} />
          <DraggableTool type="image" label="Image" icon={Icons.Image} />
          <DraggableTool type="box" label="Box / BG" icon={Icons.Maximize} />
          <DraggableTool type="carousel" label="Carousel" icon={Icons.Carousel} />
          <DraggableTool type="video" label="Video" icon={Icons.Video} />
        </div>
      )}

      <SectionHeader title="Element Properties" isOpen={sections.properties} onToggle={() => toggleSection('properties')} icon={Icons.Layers} />
      {sections.properties && (
        <div className="p-4 space-y-6">
          {selectedElement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded border border-gray-800">
                <span className="text-[10px] font-mono text-gray-500">ID: #{selectedElement.id}</span>
                <span className="text-[10px] font-bold uppercase text-[#9500cb]">{selectedElement.type}</span>
              </div>

              {/* Transformation Inputs */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">X Position</label>
                    <input type="number" value={selectedElement.x} onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })} className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Y Position</label>
                    <input type="number" value={selectedElement.y} onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })} className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Width</label>
                    <input type="number" value={selectedElement.width} onChange={(e) => onUpdateElement(selectedElement.id, { width: Number(e.target.value) })} className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Height</label>
                    <input type="number" value={selectedElement.height} onChange={(e) => onUpdateElement(selectedElement.id, { height: Number(e.target.value) })} className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                  </div>
                </div>
              </div>

              {/* Alignment Presets & Fit to Canvas */}
              <div className="pt-2 border-t border-gray-800">
                <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Alignment & Lock</label>
                <div className="flex flex-col items-center gap-3">
                    <div className="grid grid-cols-3 gap-1.5 w-full max-w-[120px] mx-auto">
                        <AlignmentButton pos="tl" label="Top Left" />
                        <AlignmentButton pos="tc" label="Top Center (Lock X)" />
                        <AlignmentButton pos="tr" label="Top Right" />
                        <AlignmentButton pos="ml" label="Middle Left (Lock Y)" />
                        <AlignmentButton pos="mc" label="Full Center (Lock Both)" />
                        <AlignmentButton pos="mr" label="Middle Right (Lock Y)" />
                        <AlignmentButton pos="bl" label="Bottom Left" />
                        <AlignmentButton pos="bc" label="Bottom Center (Lock X)" />
                        <AlignmentButton pos="br" label="Bottom Right" />
                    </div>
                    <button 
                        onClick={fitToCanvas}
                        className="w-full max-w-[120px] py-2 bg-gray-800 hover:bg-[#9500cb] text-gray-300 hover:text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg"
                        title="Fit to Canvas Size"
                    >
                        <Icons.Maximize size={12} /> Fit Canvas
                    </button>
                </div>
                
                {selectedElement.lockAxis && selectedElement.lockAxis !== 'none' && (
                    <div className="mt-2 text-center">
                        <span className="text-[9px] text-[#9500cb] uppercase font-bold tracking-widest bg-[#9500cb]/10 px-2 py-0.5 rounded-full border border-[#9500cb]/30">
                            Axis Locked: {selectedElement.lockAxis?.toUpperCase()}
                        </span>
                        <button 
                            onClick={() => onUpdateElement(selectedElement.id, { lockAxis: 'none' })}
                            className="block mx-auto mt-1 text-[9px] text-gray-500 hover:text-white underline transition-colors"
                        >
                            Unlock Drag Axis
                        </button>
                    </div>
                )}
              </div>

              {/* Style Controls */}
              <div className="space-y-3 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Fill Color</label>
                  <input type="color" value={String(selectedElement.style?.backgroundColor || '#ffffff')} onChange={(e) => updateStyle({ backgroundColor: e.target.value })} className="h-6 w-12 bg-transparent border-none cursor-pointer" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Opacity</label>
                  <input type="range" min="0" max="1" step="0.1" value={Number(selectedElement.style?.opacity ?? 1)} onChange={(e) => updateStyle({ opacity: Number(e.target.value) })} className="w-24 accent-[#9500cb]" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-400">Corner Radius</label>
                  <input type="number" value={parseInt(String(selectedElement.style?.borderRadius || '0'))} onChange={(e) => updateStyle({ borderRadius: `${e.target.value}px` })} className="w-16 bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                </div>
              </div>

              {/* Text Specifics */}
              {selectedElement.type === 'text' && (
                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Edit Text Content</label>
                  <textarea value={selectedElement.content} onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} className="w-full bg-[#181818] border border-gray-700 rounded p-2 text-xs text-white h-20 resize-none font-sans" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={selectedElement.style?.fontFamily} onChange={(e) => updateStyle({ fontFamily: e.target.value })} className="bg-[#181818] border border-gray-700 rounded px-2 py-1 text-[10px] text-white">
                      {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <input type="number" value={parseInt(String(selectedElement.style?.fontSize || '16'))} onChange={(e) => updateStyle({ fontSize: `${e.target.value}px` })} className="bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Font Color</label>
                    <input type="color" value={String(selectedElement.style?.color || '#000000')} onChange={(e) => updateStyle({ color: e.target.value })} className="h-6 w-12 bg-transparent border-none cursor-pointer" />
                  </div>
                </div>
              )}

              {/* Media Specifics */}
              {(selectedElement.type === 'image' || selectedElement.type === 'video' || selectedElement.type === 'box') && (
                <div className="space-y-3 pt-4 border-t border-gray-800">
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Media Source / URL</label>
                  <div className="flex gap-2">
                    <input type="text" value={selectedElement.content} onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })} className="flex-1 bg-[#181818] border border-gray-700 rounded px-2 py-1 text-[10px] text-white" placeholder="https://..." />
                    <button onClick={() => fileInputRef.current?.click()} className="p-1 bg-gray-800 rounded hover:bg-gray-700 text-gray-400"><Icons.Download size={14}/></button>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const url = URL.createObjectURL(file);
                        onUpdateElement(selectedElement.id, { content: url });
                    }
                  }} className="hidden" accept="image/*,video/*" />
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Scaling (Object Fit)</label>
                    <select value={selectedElement.style?.objectFit || 'cover'} onChange={(e) => updateStyle({ objectFit: e.target.value as any })} className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-xs text-white">
                      {OBJECT_FIT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {/* Utility Buttons */}
              <div className="pt-6 flex gap-2 border-t border-gray-800">
                <button onClick={() => onDuplicateElement(selectedElement.id)} className="flex-1 py-2 bg-[#1a1a1a] border border-gray-800 hover:bg-gray-800 text-[10px] rounded uppercase font-bold tracking-widest transition-colors flex items-center justify-center gap-2">
                  <Icons.Copy size={12} /> Duplicate
                </button>
                <button onClick={() => onDeleteElement(selectedElement.id)} className="flex-1 py-2 bg-red-900/10 hover:bg-red-900/30 text-red-400 text-[10px] rounded uppercase font-bold tracking-widest transition-colors border border-red-900/20 flex items-center justify-center gap-2">
                  <Icons.Trash size={12} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600 opacity-50 space-y-4">
              <Icons.Cursor size={40} strokeWidth={1} />
              <p className="text-xs text-center max-w-[150px]">Select an item from the layers or canvas to edit its details</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RightPanel;
