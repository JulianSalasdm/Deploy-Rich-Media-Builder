import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, CanvasConfig, ElementType, ArrowType } from '../types';
import { Icons } from './Icons';

interface CanvasAreaProps {
  elements: CanvasElement[];
  config: CanvasConfig;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onAddElement: (type: ElementType, x: number, y: number) => void;
  onUpdateElement: (id: number, updates: Partial<CanvasElement>) => void;
  globalLockRatio: boolean;
  showGrid: boolean;
  animationsEnabled: boolean;
  zoomLevel: number;
}

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

const CanvasArea: React.FC<CanvasAreaProps> = ({
  elements,
  config,
  selectedId,
  onSelect,
  onAddElement,
  onUpdateElement,
  globalLockRatio,
  showGrid,
  animationsEnabled,
  zoomLevel
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [resizing, setResizing] = useState<{
    active: boolean;
    handle: ResizeHandle | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startLeft: number;
    startTop: number;
    aspectRatio: number;
  }>({
    active: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
    aspectRatio: 1
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-dnd-type') as ElementType;
    if (type && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoomLevel;
      const y = (e.clientY - rect.top) / zoomLevel;
      onAddElement(type, x, y);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleMouseDown = (e: React.MouseEvent, id: number, elX: number, elY: number) => {
    if (resizing.active) return;
    e.stopPropagation();
    onSelect(id);
    setDraggingId(id);
    if (canvasRef.current) {
       const rect = canvasRef.current.getBoundingClientRect();
       const mouseXInCanvas = (e.clientX - rect.left) / zoomLevel;
       const mouseYInCanvas = (e.clientY - rect.top) / zoomLevel;
       setDragOffset({ x: mouseXInCanvas - elX, y: mouseYInCanvas - elY });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle, el: CanvasElement) => {
    e.stopPropagation();
    e.preventDefault(); 
    setResizing({
      active: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: el.width,
      startHeight: el.height,
      startLeft: el.x,
      startTop: el.y,
      aspectRatio: el.width / el.height
    });
  };

  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (resizing.active && selectedId !== null) {
        const el = elements.find(item => item.id === selectedId);
        if (!el) return;
        const deltaX = (e.clientX - resizing.startX) / zoomLevel;
        const deltaY = (e.clientY - resizing.startY) / zoomLevel;
        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newX = resizing.startLeft;
        let newY = resizing.startTop;
        const ratio = resizing.aspectRatio;

        if (resizing.handle === 'br') {
          newWidth = resizing.startWidth + deltaX;
          newHeight = resizing.startHeight + deltaY;
          if (globalLockRatio) newHeight = newWidth / ratio;
        } else if (resizing.handle === 'bl') {
          newWidth = resizing.startWidth - deltaX;
          newX = resizing.startLeft + deltaX;
          newHeight = resizing.startHeight + deltaY;
          if (globalLockRatio) newHeight = newWidth / ratio;
        } else if (resizing.handle === 'tr') {
          newWidth = resizing.startWidth + deltaX;
          newHeight = resizing.startHeight - deltaY;
          newY = resizing.startTop + deltaY;
          if (globalLockRatio) {
             const calculatedHeight = newWidth / ratio;
             const heightDiff = calculatedHeight - newHeight;
             newHeight = calculatedHeight;
             newY = newY - heightDiff; 
          }
        } else if (resizing.handle === 'tl') {
           newWidth = resizing.startWidth - deltaX;
           newHeight = resizing.startHeight - deltaY;
           newX = resizing.startLeft + deltaX;
           newY = resizing.startTop + deltaY;
           if (globalLockRatio) {
             const calculatedHeight = newWidth / ratio;
             const heightDiff = calculatedHeight - newHeight;
             newY = newY - heightDiff; 
           }
        }
        if (newWidth < 20) newWidth = 20;
        if (newHeight < 20) newHeight = 20;
        onUpdateElement(selectedId, { width: Math.round(newWidth), height: Math.round(newHeight), x: Math.round(newX), y: Math.round(newY) });
        return;
      }
      if (draggingId !== null && canvasRef.current) {
        const el = elements.find(item => item.id === draggingId);
        if (!el) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentMouseX = (e.clientX - rect.left) / zoomLevel;
        const currentMouseY = (e.clientY - rect.top) / zoomLevel;
        const newX = currentMouseX - dragOffset.x;
        const newY = currentMouseY - dragOffset.y;
        const updates: Partial<CanvasElement> = {};
        if (el.lockAxis === 'x') updates.y = Math.round(newY);
        else if (el.lockAxis === 'y') updates.x = Math.round(newX);
        else if (el.lockAxis === 'both') return;
        else { updates.x = Math.round(newX); updates.y = Math.round(newY); }
        onUpdateElement(draggingId, updates);
      }
    };
    const handleWindowMouseUp = () => {
      setDraggingId(null);
      setResizing(prev => ({ ...prev, active: false, handle: null }));
    };
    if (draggingId !== null || resizing.active) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingId, dragOffset, resizing, selectedId, elements, onUpdateElement, globalLockRatio, zoomLevel]);

  const renderArrows = (type: ArrowType = 'simple', color: string = '#ffffff', size: number = 24) => {
      switch(type) {
          case 'circle': return { left: <Icons.CircleArrowLeft size={size} color={color} />, right: <Icons.CircleArrowRight size={size} color={color} /> };
          case 'triangle': return { left: <Icons.TriangleRight size={size} color={color} className="rotate-180" fill={color} />, right: <Icons.TriangleRight size={size} color={color} fill={color} /> };
          case 'long': return { left: <Icons.ArrowLeft size={size} color={color} />, right: <Icons.ArrowRight size={size} color={color} /> };
          default: return { left: <Icons.ChevronLeft size={size} color={color} />, right: <Icons.ChevronRight size={size} color={color} /> };
      }
  };

  const renderElementContent = (el: CanvasElement) => {
    const commonStyles: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden', ...el.style };
    switch (el.type) {
      case 'image': return <img src={el.content || 'https://picsum.photos/200/200'} alt="placeholder" style={commonStyles} className="object-cover" />;
      case 'box':
         if (el.content && (el.content.startsWith('http') || el.content.startsWith('blob:'))) return <img src={el.content} alt="box-bg" style={commonStyles} />;
         return <div style={commonStyles} className="bg-gray-200 border border-gray-300"></div>;
      case 'video': return <video style={commonStyles} className="bg-black"><source src={el.content} /></video>;
      case 'carousel':
        const arrows = renderArrows(el.arrowType, el.arrowColor, el.arrowSize || 24);
        const images = el.carouselImages || [];
        const currentImage = images[el.editingIndex || 0];
        return (
            <div style={{ ...el.style, width: '100%', height: '100%' }} className="flex items-center justify-between gap-1 pointer-events-none">
                <div className="flex-none z-10 drop-shadow-md">{arrows.left}</div>
                <div className="flex-1 h-full relative overflow-hidden bg-gray-100/10">
                    {currentImage ? (
                         <img src={currentImage.url} alt="" style={{ width: '100%', height: '100%', objectFit: currentImage.objectFit || 'cover', backgroundColor: currentImage.backgroundColor || 'transparent', transform: `scale(${currentImage.scale || 1})` }} />
                    ) : ( <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs">No Images</div> )}
                </div>
                <div className="flex-none z-10 drop-shadow-md">{arrows.right}</div>
            </div>
        );
      case 'button': return <button style={commonStyles} className="bg-[#9500cb] text-white rounded px-4 py-2">{el.content || 'Button'}</button>;
      case 'text': return <div style={commonStyles} className="text-gray-800 p-2 text-center">{el.content || 'Text Block'}</div>;
      default: return <div style={commonStyles} className="bg-gray-200 border border-gray-300"></div>;
    }
  };

  const scaledWidth = config.width * zoomLevel;
  const scaledHeight = config.height * zoomLevel;

  return (
    <div className="flex-1 overflow-auto bg-[#121212] p-12 flex items-center justify-center" onClick={() => onSelect(null)}>
      <div style={{ width: scaledWidth, height: scaledHeight, flexShrink: 0 }} className="relative">
        <div
            ref={canvasRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{ width: config.width, height: config.height, backgroundColor: config.backgroundColor, position: 'absolute', top: 0, left: 0, transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
            className={`shadow-2xl shadow-black ring-1 ring-gray-700 ${showGrid ? 'canvas-grid' : ''}`}
        >
            {elements.map((el) => {
            const isSelected = selectedId === el.id;
            // Only apply animation class if animations are enabled globally
            const animClass = (el.animation && animationsEnabled) 
              ? `${el.animation} ${el.loopAnimation ? 'infinite' : ''}`.trim() 
              : '';
            
            const animStyles: React.CSSProperties = {};
            if (el.animation && animationsEnabled) {
               if (el.animationDuration) animStyles['--anim-duration' as any] = `${el.animationDuration}s`;
               if (el.animationScale) animStyles['--anim-scale' as any] = el.animationScale;
            }

            return (
                <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id, el.x, el.y)}
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, cursor: draggingId === el.id ? 'grabbing' : 'grab', outline: isSelected ? '2px solid #9500cb' : 'none', zIndex: elements.indexOf(el), ...animStyles }}
                className={`group ${animClass}`}
                >
                {isSelected && (
                    <>
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#9500cb] border border-white rounded-full cursor-nwse-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'tl', el)} />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#9500cb] border border-white rounded-full cursor-nesw-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'tr', el)} />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#9500cb] border border-white rounded-full cursor-nesw-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'bl', el)} />
                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#9500cb] border border-white rounded-full cursor-nwse-resize z-50 hover:scale-125 transition-transform" onMouseDown={(e) => handleResizeStart(e, 'br', el)} />
                    </>
                )}
                {renderElementContent(el)}
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default CanvasArea;