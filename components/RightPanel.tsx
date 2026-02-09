import React, { useRef, useState, useEffect } from 'react';
import { ElementType, CanvasElement, GOOGLE_FONTS, OBJECT_FIT_OPTIONS, ARROW_OPTIONS, CAROUSEL_TRANSITIONS, ANIMATION_OPTIONS } from '../types';
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
  globalLockRatio,
  setGlobalLockRatio,
  showGrid,
  setShowGrid,
  animationsEnabled,
  setAnimationsEnabled
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  const [sections, setSections] = useState({
      settings: true,
      drag: true,
      properties: true
  });

  const toggleSection = (key: keyof typeof sections) => {
      setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  const [selectedCarouselImageIndex, setSelectedCarouselImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedElement?.type === 'carousel') {
        if (selectedElement.editingIndex !== undefined) {
             setSelectedCarouselImageIndex(selectedElement.editingIndex);
        } else {
             setSelectedCarouselImageIndex(null);
        }
    } else {
        setSelectedCarouselImageIndex(null);
    }
  }, [selectedElement?.id]); 
  
  const handleDragStart = (e: React.DragEvent, type: ElementType) => {
    e.dataTransfer.setData('application/react-dnd-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedElement) {
        const url = URL.createObjectURL(file);
        onUpdateElement(selectedElement.id, { content: url });
        e.target.value = '';
    }
  };

  const handleCarouselUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedElement && selectedElement.carouselImages) {
          const url = URL.createObjectURL(file);
          const newImageObj = {
              id: Date.now().toString(),
              url: url,
              objectFit: 'cover' as const,
              backgroundColor: 'transparent',
              animation: '',
              scale: 1
          };
          onUpdateElement(selectedElement.id, { 
              carouselImages: [...selectedElement.carouselImages, newImageObj] 
          });
          e.target.value = '';
      }
  }

  const handleAddCarouselUrl = () => {
    if(newImageUrl && selectedElement) {
        const newImageObj = {
            id: Date.now().toString(),
            url: newImageUrl,
            objectFit: 'cover' as const,
            backgroundColor: 'transparent',
            animation: '',
            scale: 1
        };
        onUpdateElement(selectedElement.id, { 
            carouselImages: [...(selectedElement.carouselImages || []), newImageObj]
        });
        setNewImageUrl('');
    }
  };

  const updateCarouselImage = (index: number, updates: Partial<typeof selectedElement.carouselImages[0]>) => {
      if (!selectedElement || !selectedElement.carouselImages) return;
      
      const newImages = [...selectedElement.carouselImages];
      newImages[index] = { ...newImages[index], ...updates };
      onUpdateElement(selectedElement.id, { carouselImages: newImages });
  };

  const handleCarouselImageSelect = (index: number) => {
      if (!selectedElement) return;
      setSelectedCarouselImageIndex(index);
      onUpdateElement(selectedElement.id, { editingIndex: index });
  };

  const handleCarouselImageDeselect = () => {
      if (!selectedElement) return;
      setSelectedCarouselImageIndex(null);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleResizeToImage = () => {
    if (!selectedElement || !selectedElement.content) return;
    const img = new Image();
    img.src = selectedElement.content;
    img.onload = () => {
        onUpdateElement(selectedElement.id, { 
            width: img.naturalWidth, 
            height: img.naturalHeight 
        });
    };
  };

  const alignElement = (
      horizontal: 'left'|'center'|'right', 
      vertical: 'top'|'center'|'bottom',
      presetId: string
  ) => {
      if (!selectedElement) return;

      if (selectedElement.alignmentLock === presetId) {
          onUpdateElement(selectedElement.id, { 
              alignmentLock: undefined, 
              lockAxis: 'none' 
          });
          return;
      }

      let newX = selectedElement.x;
      let newY = selectedElement.y;

      if (horizontal === 'left') newX = 0;
      if (horizontal === 'center') newX = (canvasConfig.width - selectedElement.width) / 2;
      if (horizontal === 'right') newX = canvasConfig.width - selectedElement.width;

      if (vertical === 'top') newY = 0;
      if (vertical === 'center') newY = (canvasConfig.height - selectedElement.height) / 2;
      if (vertical === 'bottom') newY = canvasConfig.height - selectedElement.height;

      let lockAxis: 'x' | 'y' | 'both' | 'none' = 'none';
      if (presetId === 'tc' || presetId === 'bc') lockAxis = 'x';
      if (presetId === 'lc' || presetId === 'rc') lockAxis = 'y';
      if (presetId === 'cc') lockAxis = 'both';

      onUpdateElement(selectedElement.id, { 
          x: Math.round(newX), 
          y: Math.round(newY),
          alignmentLock: presetId,
          lockAxis: lockAxis
      });
  };

  const DraggableTool = ({ type, label, icon: Icon }: { type: ElementType, label: string, icon: React.ElementType }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, type)}
      className="flex flex-col items-center justify-center p-4 bg-[#181818] hover:bg-gray-800 rounded-lg cursor-grab active:cursor-grabbing transition-colors border border-gray-700 hover:border-[#9500cb]"
    >
      <Icon className="mb-2 text-[#9500cb]" size={24} />
      <span className="text-xs font-medium text-gray-200">{label}</span>
    </div>
  );

  const SectionHeader = ({ title, isOpen, onToggle, icon: Icon }: { title: string, isOpen: boolean, onToggle: () => void, icon?: any }) => (
      <div 
        onClick={onToggle}
        className="flex items-center justify-between p-4 bg-[#181818] border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors"
      >
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            {Icon && <Icon size={14} />} {title}
          </h3>
          <button className="text-gray-400 hover:text-white">
              {isOpen ? <Icons.Minus size={14} /> : <Icons.Plus size={14} />}
          </button>
      </div>
  );

  return (
    <div className="w-80 bg-[#121212] border-l border-gray-800 flex flex-col h-full overflow-y-auto">
      
      {/* Canvas Settings */}
      <SectionHeader 
        title="Canvas Settings" 
        isOpen={sections.settings} 
        onToggle={() => toggleSection('settings')} 
        icon={Icons.Settings} 
      />
      {sections.settings && (
        <div className="p-4 border-b border-gray-800">
            <div className="flex gap-2 mb-3">
                <button 
                    onClick={() => setCanvasConfig(prev => ({ ...prev, width: 320, height: 480 }))}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors"
                >
                    320 x 480
                </button>
                <button 
                    onClick={() => setCanvasConfig(prev => ({ ...prev, width: 1080, height: 1920 }))}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300 py-1 px-2 rounded border border-gray-600 transition-colors"
                >
                    1080 x 1920
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
                <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                <input 
                type="number" 
                value={canvasConfig.width}
                onChange={(e) => setCanvasConfig(prev => ({ ...prev, width: Number(e.target.value) }))}
                className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none" 
                />
            </div>
            <div>
                <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                <input 
                type="number" 
                value={canvasConfig.height}
                onChange={(e) => setCanvasConfig(prev => ({ ...prev, height: Number(e.target.value) }))}
                className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none" 
                />
            </div>
            </div>
            <div>
            <label className="block text-xs text-gray-400 mb-1">Background Color</label>
            <div className="flex gap-2 mb-3">
                <input 
                type="color" 
                value={canvasConfig.backgroundColor}
                onChange={(e) => setCanvasConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="h-8 w-8 rounded cursor-pointer bg-transparent border-0 p-0" 
                />
                <input 
                type="text" 
                value={canvasConfig.backgroundColor}
                onChange={(e) => setCanvasConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="flex-1 bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white font-mono focus:border-[#9500cb] focus:outline-none" 
                />
            </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="globalLockRatio"
                        checked={globalLockRatio}
                        onChange={(e) => setGlobalLockRatio(e.target.checked)}
                        className="rounded bg-[#181818] border-gray-700 text-[#9500cb] focus:ring-0 focus:ring-offset-0 accent-[#9500cb]"
                    />
                    <label htmlFor="globalLockRatio" className="text-xs text-gray-300 select-none">
                        Lock Ratio (Global)
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="showGrid"
                        checked={showGrid}
                        onChange={(e) => setShowGrid(e.target.checked)}
                        className="rounded bg-[#181818] border-gray-700 text-[#9500cb] focus:ring-0 focus:ring-offset-0 accent-[#9500cb]"
                    />
                    <label htmlFor="showGrid" className="text-xs text-gray-300 select-none flex items-center gap-2">
                    <Icons.Grid size={12} /> Show Grid
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="animationsEnabled"
                        checked={animationsEnabled}
                        onChange={(e) => setAnimationsEnabled(e.target.checked)}
                        className="rounded bg-[#181818] border-gray-700 text-[#9500cb] focus:ring-0 focus:ring-offset-0 accent-[#9500cb]"
                    />
                    <label htmlFor="animationsEnabled" className="text-xs text-gray-300 select-none flex items-center gap-2">
                    <Icons.Play size={12} /> Enable Animations
                    </label>
                </div>
            </div>

            {selectedElement && (
                <div className="mt-4 pt-2 border-t border-gray-700">
                    <label className="block text-xs text-gray-400 mb-2">Align Element & Lock Axis</label>
                    <div className="grid grid-cols-3 gap-1 w-24 mx-auto">
                        <button 
                            onClick={() => alignElement('left', 'top', 'tl')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'tl' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Top Left"
                        >
                            <div className={`w-1.5 h-1.5 rounded-tl-[1px] ${selectedElement.alignmentLock === 'tl' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>
                        <button 
                            onClick={() => alignElement('center', 'top', 'tc')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'tc' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Top Center (Locks X)"
                        >
                            <div className={`w-1.5 h-1.5 rounded-t-[1px] ${selectedElement.alignmentLock === 'tc' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>
                        <button 
                            onClick={() => alignElement('right', 'top', 'tr')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'tr' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Top Right"
                        >
                            <div className={`w-1.5 h-1.5 rounded-tr-[1px] ${selectedElement.alignmentLock === 'tr' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>

                        <button 
                            onClick={() => alignElement('left', 'center', 'lc')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'lc' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Left Center (Locks Y)"
                        >
                            <div className={`w-1.5 h-1.5 rounded-l-[1px] ${selectedElement.alignmentLock === 'lc' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>
                        <button 
                            onClick={() => alignElement('center', 'center', 'cc')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'cc' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Center (Locks Both)"
                        >
                            <div className={`w-2 h-2 border rounded-full ${selectedElement.alignmentLock === 'cc' ? 'border-white' : 'border-gray-400 group-hover:border-white'}`} />
                        </button>
                        <button 
                            onClick={() => alignElement('right', 'center', 'rc')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'rc' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Right Center (Locks Y)"
                        >
                            <div className={`w-1.5 h-1.5 rounded-r-[1px] ${selectedElement.alignmentLock === 'rc' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>

                        <button 
                            onClick={() => alignElement('left', 'bottom', 'bl')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'bl' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Bottom Left"
                        >
                            <div className={`w-1.5 h-1.5 rounded-bl-[1px] ${selectedElement.alignmentLock === 'bl' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>
                        <button 
                            onClick={() => alignElement('center', 'bottom', 'bc')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'bc' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Bottom Center (Locks X)"
                        >
                            <div className={`w-1.5 h-1.5 rounded-b-[1px] ${selectedElement.alignmentLock === 'bc' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>
                        <button 
                            onClick={() => alignElement('right', 'bottom', 'br')} 
                            className={`h-6 rounded border flex items-center justify-center transition-colors group ${selectedElement.alignmentLock === 'br' ? 'bg-[#9500cb] border-[#9500cb]' : 'bg-gray-800 border-gray-600 hover:bg-gray-700'}`} 
                            title="Bottom Right"
                        >
                            <div className={`w-1.5 h-1.5 rounded-br-[1px] ${selectedElement.alignmentLock === 'br' ? 'bg-white' : 'bg-gray-400 group-hover:bg-white'}`} />
                        </button>
                    </div>
                    
                    {selectedElement.type === 'box' && (
                        <button 
                            onClick={() => onUpdateElement(selectedElement.id, { x: 0, y: 0, width: canvasConfig.width, height: canvasConfig.height, alignmentLock: undefined, lockAxis: 'none' })}
                            className="w-full mt-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 px-3 rounded flex items-center justify-center gap-2 border border-gray-600 transition-colors"
                        >
                            <Icons.Maximize size={14} /> Fit to Canvas
                        </button>
                    )}
                </div>
            )}
        </div>
      )}

      {/* Toolbox */}
      <SectionHeader 
        title="Drag Elements" 
        isOpen={sections.drag} 
        onToggle={() => toggleSection('drag')} 
      />
      {sections.drag && (
        <div className="p-4 border-b border-gray-800">
            <div className="grid grid-cols-2 gap-3">
            <DraggableTool type="text" label="Textbox" icon={Icons.Type} />
            <DraggableTool type="button" label="Button" icon={Icons.Square} />
            <DraggableTool type="box" label="Box / BG" icon={Icons.Layers} />
            <DraggableTool type="image" label="Image" icon={Icons.Image} />
            <DraggableTool type="video" label="Video" icon={Icons.Video} />
            <DraggableTool type="carousel" label="Carousel" icon={Icons.Carousel} />
            </div>
        </div>
      )}

      {/* Properties Panel */}
      <SectionHeader 
        title="Properties" 
        isOpen={sections.properties} 
        onToggle={() => toggleSection('properties')} 
      />
      {sections.properties && (
        <div className="p-4">
            {selectedElement ? (
            <div className="space-y-4 pb-12">
                <div className="bg-[#181818] p-3 rounded border border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">ID: <span className="text-white font-mono">{selectedElement.id}</span></div>
                    <div className="text-xs text-gray-400">Type: <span className="capitalize text-white">{selectedElement.type}</span></div>
                </div>

                {/* Primary Content Editor (Text / URL) */}
                {selectedElement.type !== 'carousel' && (
                    <div className="bg-[#181818] p-3 rounded border border-gray-700">
                        <label className="block text-xs text-gray-400 mb-1 font-bold">
                            {selectedElement.type === 'button' ? 'Button Label' : 
                             selectedElement.type === 'text' ? 'Text Content' : 'Source URL'}
                        </label>
                        <textarea
                            value={selectedElement.content}
                            onChange={(e) => onUpdateElement(selectedElement.id, { content: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white h-20 resize-none focus:border-[#9500cb] focus:outline-none"
                            placeholder={selectedElement.type === 'button' || selectedElement.type === 'text' ? "Enter text here..." : "https://..."}
                        />
                        
                        {selectedElement.type === 'button' && (
                            <div className="mt-3">
                                <label className="block text-xs text-gray-400 mb-1">Click Action (URL)</label>
                                <input 
                                    type="text"
                                    value={selectedElement.linkUrl || ''}
                                    onChange={(e) => onUpdateElement(selectedElement.id, { linkUrl: e.target.value })}
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none"
                                    placeholder="https://example.com"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">X Pos</label>
                        <input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) => onUpdateElement(selectedElement.id, { x: Number(e.target.value) })}
                        className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Y Pos</label>
                        <input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) => onUpdateElement(selectedElement.id, { y: Number(e.target.value) })}
                        className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Width</label>
                        <input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => onUpdateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Height</label>
                        <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => onUpdateElement(selectedElement.id, { height: Number(e.target.value) })}
                        className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none"
                        />
                    </div>
                </div>

                {selectedElement.type === 'carousel' && (
                    <div className="bg-[#181818] p-3 rounded border border-gray-700 mt-4">
                        <label className="block text-xs text-gray-400 mb-2 font-bold">Carousel Images</label>
                        <p className="text-[10px] text-gray-500 mb-2">Click an image to edit its properties</p>
                        
                        <div className="space-y-2 mb-3">
                            {selectedElement.carouselImages?.map((img, index) => (
                                <div 
                                    key={index} 
                                    className={`flex gap-2 items-center p-1 rounded cursor-pointer ${selectedCarouselImageIndex === index ? 'bg-gray-700 ring-1 ring-[#9500cb]' : 'hover:bg-gray-800'}`}
                                    onClick={() => handleCarouselImageSelect(index)}
                                >
                                    <div className="w-8 h-8 flex-none bg-gray-800 rounded overflow-hidden border border-gray-600">
                                        <img src={img.url} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs text-white truncate">{img.url.substring(0, 20)}...</div>
                                        <div className="text-[10px] text-gray-400">
                                            {img.objectFit}, {img.animation || 'No Anim'}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const newImages = selectedElement.carouselImages?.filter((_, i) => i !== index);
                                            if (selectedCarouselImageIndex === index) {
                                                handleCarouselImageDeselect();
                                                onUpdateElement(selectedElement.id, { carouselImages: newImages, editingIndex: 0 });
                                            } else {
                                                onUpdateElement(selectedElement.id, { carouselImages: newImages });
                                            }
                                        }}
                                        className="text-gray-500 hover:text-red-400"
                                    >
                                        <Icons.Trash size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {selectedCarouselImageIndex !== null && selectedElement.carouselImages && selectedElement.carouselImages[selectedCarouselImageIndex] && (
                            <div className="mb-4 p-2 bg-gray-800 rounded border border-gray-600">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-white">Image {selectedCarouselImageIndex + 1} Properties</span>
                                    <button onClick={handleCarouselImageDeselect} className="text-[10px] text-[#9500cb] hover:underline">Done</button>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Image Scale</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="range" 
                                                min="0.1" 
                                                max="3.0" 
                                                step="0.1"
                                                value={selectedElement.carouselImages[selectedCarouselImageIndex].scale || 1}
                                                onChange={(e) => updateCarouselImage(selectedCarouselImageIndex, { scale: parseFloat(e.target.value) })}
                                                className="w-full accent-[#9500cb]"
                                            />
                                            <span className="text-[10px] w-6 text-right">{selectedElement.carouselImages[selectedCarouselImageIndex].scale || 1}x</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Object Fit</label>
                                        <select
                                            value={selectedElement.carouselImages[selectedCarouselImageIndex].objectFit}
                                            onChange={(e) => updateCarouselImage(selectedCarouselImageIndex, { objectFit: e.target.value as any })}
                                            className="w-full bg-[#121212] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                        >
                                            {OBJECT_FIT_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">Loop Animation</label>
                                        <select
                                            value={selectedElement.carouselImages[selectedCarouselImageIndex].animation}
                                            onChange={(e) => updateCarouselImage(selectedCarouselImageIndex, { animation: e.target.value })}
                                            className="w-full bg-[#121212] border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                        >
                                            {ANIMATION_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 mb-3">
                            <input 
                                type="text" 
                                placeholder="Image URL"
                                value={newImageUrl}
                                onChange={(e) => setNewImageUrl(e.target.value)}
                                className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                            />
                            <button 
                                onClick={handleAddCarouselUrl}
                                className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 rounded"
                            >Add</button>
                        </div>

                        <div className="relative">
                            <input 
                                type="file" 
                                ref={carouselInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleCarouselUpload} 
                            />
                            <button 
                                onClick={() => carouselInputRef.current?.click()}
                                className="w-full bg-[#9500cb] hover:bg-[#b000ee] text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-2"
                            >
                                <Icons.Download size={14} /> Upload Image
                            </button>
                        </div>

                        <label className="block text-xs text-gray-400 mt-4 mb-2 font-bold">Arrow Settings</label>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <select
                                value={selectedElement.arrowType || 'simple'}
                                onChange={(e) => onUpdateElement(selectedElement.id, { arrowType: e.target.value as any })}
                                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                            >
                                {ARROW_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <input 
                                type="color"
                                value={selectedElement.arrowColor || '#ffffff'}
                                onChange={(e) => onUpdateElement(selectedElement.id, { arrowColor: e.target.value })}
                                className="w-full h-8 rounded bg-transparent border-none cursor-pointer"
                            />
                        </div>
                    </div>
                )}

                {(selectedElement.type === 'image' || selectedElement.type === 'box') && (
                    <div className="bg-[#181818] p-3 rounded border border-gray-700 mt-4">
                        <label className="block text-xs text-gray-400 mb-2">Local Image</label>
                        <button 
                            onClick={triggerFileUpload}
                            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-2 border border-gray-600"
                        >
                            <Icons.Download size={14} /> Upload from PC
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileUpload} 
                        />
                        <button 
                            onClick={handleResizeToImage}
                            className="w-full mt-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-1 px-3 rounded border border-gray-600"
                        >
                            Resize Box to Image
                        </button>
                    </div>
                )}

                {/* Typography Settings for Text-based elements */}
                {(selectedElement.type === 'text' || selectedElement.type === 'button') && (
                    <div className="space-y-3 pt-2">
                        <label className="block text-xs text-gray-400 font-bold">Typography</label>
                        <select
                            value={(selectedElement.style.fontFamily as string) || 'Roboto'}
                            onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontFamily: e.target.value } })}
                            className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-[#9500cb] focus:outline-none"
                        >
                            {GOOGLE_FONTS.map(font => (
                                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Font Size</label>
                                <input 
                                    type="number"
                                    value={parseInt((selectedElement.style.fontSize as string) || '16')}
                                    onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, fontSize: `${e.target.value}px` } })}
                                    className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#9500cb]"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1">Text Color</label>
                                <input 
                                    type="color" 
                                    value={(selectedElement.style.color as string) || '#000000'}
                                    onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, color: e.target.value } })}
                                    className="w-full h-8 rounded bg-transparent border-0 p-0 cursor-pointer" 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Common Styling (Colors, Borders) */}
                <div className="border-t border-gray-800 pt-4 mt-2">
                    <label className="block text-xs text-gray-400 mb-1">Background Style</label>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="color" 
                            value={(selectedElement.style.backgroundColor as string) || '#ffffff'}
                            onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: e.target.value } })}
                            className="h-8 w-8 rounded cursor-pointer border-0 p-0 bg-transparent" 
                        />
                        <button 
                            onClick={() => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, backgroundColor: 'transparent' } })}
                            className="text-xs px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 text-gray-300 border border-gray-700"
                        >Transparent</button>
                    </div>

                    <label className="block text-xs text-gray-400 mb-1">Border Radius (px)</label>
                    <input 
                        type="number"
                        value={parseInt((selectedElement.style.borderRadius as string) || '0')}
                        onChange={(e) => onUpdateElement(selectedElement.id, { style: { ...selectedElement.style, borderRadius: `${e.target.value}px` } })}
                        className="w-full bg-[#181818] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#9500cb]"
                    />
                </div>
                
                {/* Actions (Duplicate/Delete) */}
                <div className="border-t border-gray-800 pt-4 mt-2 flex gap-3">
                    <button 
                        onClick={() => onDuplicateElement(selectedElement.id)}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded flex items-center justify-center gap-2 border border-gray-600 transition-colors"
                    >
                        <Icons.Copy size={14} /> Duplicate
                    </button>
                    <button 
                        onClick={() => onDeleteElement(selectedElement.id)}
                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-200 text-xs py-2 rounded flex items-center justify-center gap-2 border border-red-900/50 transition-colors"
                    >
                        <Icons.Trash size={14} /> Delete
                    </button>
                </div>
            </div>
            ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
                Select an element to edit properties.
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default RightPanel;