import React, { useState, useRef, useEffect } from 'react';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import CanvasArea from './components/CanvasArea';
import PreviewModal from './components/PreviewModal';
import { Icons } from './components/Icons';
import { CanvasElement, CanvasConfig, ElementType } from './types';
import { globalStyles } from './utils/animations';
import { generateTag } from './utils/tagGenerator';
import { exportToZip } from './utils/exportUtils';

const App: React.FC = () => {
  // State
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
    width: 320, // Default to mobile width
    height: 480, // Default to mobile height
    backgroundColor: '#ffffff'
  });
  const [customCss, setCustomCss] = useState<string>('');
  const [customJs, setCustomJs] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [globalLockRatio, setGlobalLockRatio] = useState(false);
  
  // Builder Environment States
  const [showGrid, setShowGrid] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // ID Counter
  const nextId = useRef(1);

  // Add Element Logic
  const addElement = (type: ElementType, x: number, y: number) => {
    const id = nextId.current++;
    
    // Calculate a scale factor based on current canvas width vs standard reference (320px)
    const scaleFactor = canvasConfig.width / 320;

    // Default dimensions based on type, scaled by scaleFactor
    let width = 150 * scaleFactor;
    let height = 150 * scaleFactor;
    let content = '';
    let style: React.CSSProperties = {
        fontFamily: 'Roboto', // Default font
    };
    let extraProps: Partial<CanvasElement> = {};

    if (type === 'text') { 
        width = 200 * scaleFactor; 
        height = 60 * scaleFactor; 
        content = 'Double click to edit'; 
        style = { ...style, fontSize: `${Math.round(16 * scaleFactor)}px`, color: '#000000' }; 
    }
    
    if (type === 'button') { 
        width = 120 * scaleFactor; 
        height = 40 * scaleFactor; 
        content = 'Click Me'; 
        style = { ...style, backgroundColor: '#9500cb', color: '#ffffff', borderRadius: `${Math.round(6 * scaleFactor)}px`, fontSize: `${Math.round(16 * scaleFactor)}px` };
        extraProps = { linkUrl: '' };
    }
    
    if (type === 'image') { 
        width = 200 * scaleFactor; 
        height = 200 * scaleFactor; 
        content = 'https://picsum.photos/400'; 
        style = { ...style, objectFit: 'cover' }; 
    }
    
    if (type === 'video') { 
        width = 300 * scaleFactor; 
        height = 200 * scaleFactor; 
        content = 'https://www.w3schools.com/html/mov_bbb.mp4'; 
    }
    
    if (type === 'box') { 
        width = 200 * scaleFactor; 
        height = 200 * scaleFactor; 
        style = { ...style, backgroundColor: '#e5e7eb', objectFit: 'cover' }; 
    }
    
    if (type === 'carousel') { 
        width = 320 * scaleFactor; 
        height = 180 * scaleFactor; 
        style = { ...style }; 
        extraProps = {
            carouselImages: [
                { 
                    id: '1', 
                    url: `https://picsum.photos/${Math.round(width)}/${Math.round(height)}?random=1`, 
                    objectFit: 'cover', 
                    backgroundColor: 'transparent', 
                    animation: '',
                    scale: 1
                },
                { 
                    id: '2', 
                    url: `https://picsum.photos/${Math.round(width)}/${Math.round(height)}?random=2`, 
                    objectFit: 'cover', 
                    backgroundColor: 'transparent', 
                    animation: '',
                    scale: 1
                }
            ],
            arrowType: 'simple',
            arrowColor: '#000000',
            arrowSize: Math.round(24 * scaleFactor),
            carouselTransition: 'slide',
            editingIndex: 0,
            showDots: true
        };
    }

    const newEl: CanvasElement = {
      id,
      type,
      name: `${type} ${id}`,
      x,
      y,
      width: Math.round(width),
      height: Math.round(height),
      content,
      style,
      animation: '',
      loopAnimation: true,
      actions: [],
      ...extraProps
    };

    setElements(prev => [...prev, newEl]);
    setSelectedId(id);
  };

  // Duplicate Element Logic
  const duplicateElement = (id: number) => {
    const elToCopy = elements.find(el => el.id === id);
    if (!elToCopy) return;

    const newId = nextId.current++;
    const newEl: CanvasElement = {
        ...elToCopy,
        id: newId,
        name: `${elToCopy.name} (Copy)`,
        x: elToCopy.x + 20, 
        y: elToCopy.y + 20,
        style: { ...elToCopy.style },
        carouselImages: elToCopy.carouselImages ? elToCopy.carouselImages.map(img => ({...img})) : undefined,
        actions: elToCopy.actions ? elToCopy.actions.map(a => ({...a})) : []
    };

    setElements(prev => [...prev, newEl]);
    setSelectedId(newId);
  };

  // Update Element Logic
  const updateElement = (id: number, updates: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  };

  // Delete Element
  const deleteElement = (id: number) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Reorder Layers Logic
  const reorderElements = (dragIndex: number, hoverIndex: number) => {
    const newElements = [...elements];
    const [removed] = newElements.splice(dragIndex, 1);
    newElements.splice(hoverIndex, 0, removed);
    setElements(newElements);
  };

  // Zoom Helpers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.1));

  // Generate Tag and Download CSV
  const handleGenerateTag = () => {
    const { csv } = generateTag(elements, canvasConfig, customCss, customJs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ad_tag_sheet.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle ZIP Export
  const handleExportZip = async () => {
      try {
          setIsExporting(true);
          await exportToZip(elements, canvasConfig, customCss, customJs);
      } catch (error) {
          console.error("Export failed:", error);
          alert("Failed to export ZIP.");
      } finally {
          setIsExporting(false);
      }
  };

  // Execute Custom JS
  useEffect(() => {
    if (!customJs) return;
    const timeoutId = setTimeout(() => {
      try {
        new Function(customJs)();
      } catch (err) {
        console.error("Custom JS Error:", err);
      }
    }, 1000); 
    return () => clearTimeout(timeoutId);
  }, [customJs]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121212] text-white font-sans overflow-hidden">
      
      {/* Inject Custom CSS Styles */}
      <style>
        {globalStyles}
        {customCss}
      </style>

      {/* Header */}
      <header className="h-16 flex-none border-b border-gray-800 bg-[#121212] flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-6">
            <img 
            src="https://kidscorp.digital/wp-content/uploads/2025/02/LogoKC.png" 
            alt="KidsCorp" 
            className="h-8 object-contain"
            />
            <div className="h-6 w-px bg-gray-700"></div>
            <h1 className="text-lg font-bold tracking-wide text-white">
            Rich media builder <span className="text-[#9500cb] ml-1">ALPHA</span>
            </h1>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-800 rounded border border-gray-600 mr-2">
                <button 
                    onClick={handleZoomOut} 
                    className="p-2 hover:bg-gray-700 hover:text-white text-gray-400 transition-colors"
                    title="Zoom Out"
                >
                    <Icons.ZoomOut size={16} />
                </button>
                <span className="text-xs w-12 text-center text-gray-300 font-mono">{Math.round(zoomLevel * 100)}%</span>
                <button 
                    onClick={handleZoomIn} 
                    className="p-2 hover:bg-gray-700 hover:text-white text-gray-400 transition-colors"
                    title="Zoom In"
                >
                    <Icons.ZoomIn size={16} />
                </button>
            </div>

            <button 
                onClick={handleGenerateTag}
                className="flex items-center gap-2 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded font-medium transition-colors border border-green-800"
                title="Download CSV for DV360"
            >
                <Icons.FileJson size={16} /> Generate TAG
            </button>

            <button 
                onClick={handleExportZip}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded font-medium transition-colors border border-gray-600 ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <Icons.Download size={16} /> {isExporting ? 'Zipping...' : 'Export ZIP'}
            </button>

            <button 
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#9500cb] hover:bg-[#b000ee] text-white rounded font-medium transition-colors"
            >
                <Icons.Play size={16} fill="currentColor" /> Preview
            </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <LeftPanel 
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onReorder={reorderElements}
          onUpdateElement={updateElement}
          onDelete={deleteElement}
          customCss={customCss}
          setCustomCss={setCustomCss}
          customJs={customJs}
          setCustomJs={setCustomJs}
        />

        <CanvasArea 
          elements={elements}
          config={canvasConfig}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddElement={addElement}
          onUpdateElement={updateElement}
          globalLockRatio={globalLockRatio}
          showGrid={showGrid}
          animationsEnabled={animationsEnabled}
          zoomLevel={zoomLevel}
        />

        <RightPanel 
          selectedElement={elements.find(el => el.id === selectedId)}
          onUpdateElement={updateElement}
          onDuplicateElement={duplicateElement}
          onDeleteElement={deleteElement}
          canvasConfig={canvasConfig}
          setCanvasConfig={setCanvasConfig}
          globalLockRatio={globalLockRatio}
          setGlobalLockRatio={setGlobalLockRatio}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          animationsEnabled={animationsEnabled}
          setAnimationsEnabled={setAnimationsEnabled}
        />
      </div>

      <PreviewModal 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        elements={elements}
        config={canvasConfig}
        customCss={customCss}
        customJs={customJs}
      />
    </div>
  );
};

export default App;