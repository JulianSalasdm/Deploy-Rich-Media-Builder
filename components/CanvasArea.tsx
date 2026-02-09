
import React, { useRef, useState, useEffect } from 'react';
import { CanvasElement, CanvasConfig, ElementType } from '../types';
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
  const [resizing, setResizing] = useState<{ active: boolean; handle: ResizeHandle | null; startX: number; startY: number; startWidth: number; startHeight: number; startLeft: number; startTop: number; aspectRatio: number; }>({ active: false, handle: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startLeft: 0, startTop: 0, aspectRatio: 1 });

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
       const mouseX = (e.clientX - rect.left) / zoomLevel;
       const mouseY = (e.clientY - rect.top) / zoomLevel;
       setDragOffset({ x: mouseX - elX, y: mouseY - elY });
    }
  };

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle, el: CanvasElement) => {
    e.stopPropagation();
    e.preventDefault(); 
    setResizing({ active: true, handle, startX: e.clientX, startY: e.clientY, startWidth: el.width, startHeight: el.height, startLeft: el.x, startTop: el.y, aspectRatio: el.width / el.height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizing.active && selectedId !== null) {
        const el = elements.find(item => item.id === selectedId);
        if (!el) return;
        const deltaX = (e.clientX - resizing.startX) / zoomLevel;
        const deltaY = (e.clientY - resizing.startY) / zoomLevel;
        let nw = resizing.startWidth, nh = resizing.startHeight, nx = resizing.startLeft, ny = resizing.startTop;
        const r = resizing.aspectRatio;

        if (resizing.handle === 'br') { nw = resizing.startWidth + deltaX; nh = resizing.startHeight + deltaY; if (globalLockRatio) nh = nw / r; }
        else if (resizing.handle === 'bl') { nw = resizing.startWidth - deltaX; nx = resizing.startLeft + deltaX; nh = resizing.startHeight + deltaY; if (globalLockRatio) nh = nw / r; }
        else if (resizing.handle === 'tr') { nw = resizing.startWidth + deltaX; nh = resizing.startHeight - deltaY; ny = resizing.startTop + deltaY; if (globalLockRatio) { const ch = nw / r; ny = ny - (ch - nh); nh = ch; } }
        else if (resizing.handle === 'tl') { nw = resizing.startWidth - deltaX; nh = resizing.startHeight - deltaY; nx = resizing.startLeft + deltaX; ny = resizing.startTop + deltaY; if (globalLockRatio) { const ch = nw / r; ny = ny - (ch - nh); nh = ch; } }
        
        onUpdateElement(selectedId, { width: Math.round(Math.max(20, nw)), height: Math.round(Math.max(20, nh)), x: Math.round(nx), y: Math.round(ny) });
      } else if (draggingId !== null && canvasRef.current) {
        const el = elements.find(item => item.id === draggingId);
        if (!el) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const curX = (e.clientX - rect.left) / zoomLevel;
        const curY = (e.clientY - rect.top) / zoomLevel;
        
        const nextX = Math.round(curX - dragOffset.x);
        const nextY = Math.round(curY - dragOffset.y);
        
        const updates: Partial<CanvasElement> = {};
        
        // Axis locking logic
        if (el.lockAxis === 'x') {
            updates.y = nextY;
        } else if (el.lockAxis === 'y') {
            updates.x = nextX;
        } else if (el.lockAxis === 'both') {
            // No movement allowed
        } else {
            updates.x = nextX;
            updates.y = nextY;
        }
        
        onUpdateElement(draggingId, updates);
      }
    };
    const handleMouseUp = () => { setDraggingId(null); setResizing(prev => ({ ...prev, active: false })); };
    if (draggingId !== null || resizing.active) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [draggingId, dragOffset, resizing, selectedId, elements, onUpdateElement, globalLockRatio, zoomLevel]);

  const renderElementContent = (el: CanvasElement) => {
    const s: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', ...el.style };
    switch (el.type) {
      case 'image': return <img src={el.content} style={s} alt="" className="object-cover" />;
      case 'box':
        if (el.content && (el.content.startsWith('http') || el.content.startsWith('blob:'))) return <img src={el.content} style={s} alt="" />;
        return <div style={s}></div>;
      case 'video': return <video style={s}><source src={el.content} /></video>;
      case 'carousel':
        const images = el.carouselImages || [];
        const cur = images[el.editingIndex || 0];
        return (
            <div style={s} className="relative bg-gray-900/10">
                {cur && <img src={cur.url} style={{ width: '100%', height: '100%', objectFit: cur.objectFit }} alt="" />}
                <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between text-white/50"><Icons.ChevronLeft size={24}/><Icons.ChevronRight size={24}/></div>
            </div>
        );
      case 'button': return <div style={s} className="px-4 py-2 bg-[#9500cb] text-white rounded">{el.content || 'Button'}</div>;
      case 'text': return <div style={{...s, whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{el.content}</div>;
      default: return <div style={s}></div>;
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-[#0d0d0d] p-12 flex items-center justify-center custom-scrollbar" onClick={() => onSelect(null)}>
      <div style={{ width: config.width * zoomLevel, height: config.height * zoomLevel }} className="relative">
        <div
          ref={canvasRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ width: config.width, height: config.height, backgroundColor: config.backgroundColor, transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          className={`absolute top-0 left-0 shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-shadow ${showGrid ? 'canvas-grid' : ''}`}
        >
          {elements.map((el) => {
            const isSelected = selectedId === el.id;
            const animStyles: React.CSSProperties & { [key: string]: string | number } = {};
            if (el.animation && animationsEnabled) {
               if (el.animationDuration) animStyles['--anim-duration'] = `${el.animationDuration}s`;
               if (el.animationScale) animStyles['--anim-scale'] = el.animationScale;
            }

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el.id, el.x, el.y)}
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: elements.indexOf(el), outline: isSelected ? '2px solid #9500cb' : 'none', ...animStyles }}
                className={`${el.animation && animationsEnabled ? el.animation : ''} ${el.loopAnimation && animationsEnabled ? 'infinite' : ''}`}
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
