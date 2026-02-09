
import React, { useState, useEffect, useRef } from 'react';
import { CanvasElement, CanvasConfig, ArrowType } from '../types';
import { Icons } from './Icons';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  elements: CanvasElement[];
  config: CanvasConfig;
  customCss: string;
  customJs: string;
}

const CarouselComponent: React.FC<{ element: CanvasElement }> = ({ element }) => {
    const [index, setIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);
    const [direction, setDirection] = useState<'left' | 'right' | null>(null);
    const images = element.carouselImages || [];
    const transitionType = element.carouselTransition || 'slide';
    
    useEffect(() => {
        setIndex(0);
        setPrevIndex(0);
        setDirection(null);
    }, [images.length]);

    if (images.length === 0) return <div className="w-full h-full bg-gray-300 flex items-center justify-center">No Images</div>;

    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPrevIndex(index);
        setDirection('right');
        setIndex((prev) => (prev + 1) % images.length);
    };

    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPrevIndex(index);
        setDirection('left');
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const renderArrows = (type: ArrowType = 'simple', color: string = '#ffffff', size: number = 24) => {
        const iconProps = { size, color, fill: type === 'triangle' ? color : 'none' };
        switch(type) {
            case 'circle': return { left: <Icons.CircleArrowLeft {...iconProps} fill="none" />, right: <Icons.CircleArrowRight {...iconProps} fill="none" /> };
            case 'triangle': return { left: <Icons.TriangleRight size={size} color={color} fill={color} className="rotate-180" />, right: <Icons.TriangleRight size={size} color={color} fill={color} /> };
            case 'long': return { left: <Icons.ArrowLeft {...iconProps} fill="none" />, right: <Icons.ArrowRight {...iconProps} fill="none" /> };
            default: return { left: <Icons.ChevronLeft {...iconProps} fill="none" />, right: <Icons.ChevronRight {...iconProps} fill="none" /> };
        }
    };

    const arrowSize = element.arrowSize || 24;
    const arrows = renderArrows(element.arrowType, element.arrowColor, arrowSize);
    
    const renderImage = (imgObj: any, idx: number, extraClass: string = '') => {
        const loopAnim = imgObj.animation ? `${imgObj.animation} infinite` : '';
        return (
             <img 
                key={imgObj.id}
                src={imgObj.url} 
                alt={`slide-${idx}`} 
                className={`w-full h-full absolute top-0 left-0 ${loopAnim} ${extraClass}`}
                style={{ objectFit: imgObj.objectFit || 'cover', backgroundColor: imgObj.backgroundColor || 'transparent', transform: `scale(${imgObj.scale || 1})` }}
            />
        );
    };

    return (
        <div style={{ width: '100%', height: '100%', ...element.style }} className="group flex items-center justify-between gap-1">
            {images.length > 1 && (
                <button onClick={prev} className="flex-none z-10 p-1 hover:scale-110 transition-transform drop-shadow-md cursor-pointer">{arrows.left}</button>
            )}
            <div className="flex-1 h-full relative overflow-hidden">
                {transitionType === 'slide' ? (
                     <div className="w-full h-full relative">
                        {images.map((img, i) => {
                            let animClass = 'hidden';
                            if (i === index) animClass = direction === 'right' ? 'slide-in-right z-20' : direction === 'left' ? 'slide-in-left z-20' : 'z-20';
                            else if (i === prevIndex && direction) animClass = direction === 'right' ? 'slide-out-left z-10' : direction === 'left' ? 'slide-out-right z-10' : 'hidden';
                            return renderImage(img, i, animClass);
                        })}
                     </div>
                ) : transitionType === 'fade' ? (
                    <div className="w-full h-full relative">
                        {images.map((img, i) => (
                            <div key={img.id} className={`w-full h-full absolute inset-0 transition-opacity duration-500 ease-in-out ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                                {renderImage(img, i, '')}
                            </div>
                        ))}
                    </div>
                ) : <div className="w-full h-full relative">{renderImage(images[index], index, 'z-10')}</div>}
            </div>
            {images.length > 1 && (
                <button onClick={next} className="flex-none z-10 p-1 hover:scale-110 transition-transform drop-shadow-md cursor-pointer">{arrows.right}</button>
            )}
        </div>
    );
};

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  elements,
  config,
  customCss,
  customJs
}) => {
  const [hiddenElements, setHiddenElements] = useState<Set<number>>(new Set());
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1); 
  
  useEffect(() => {
    if (isOpen) {
        setHiddenElements(new Set());
        const updateScale = () => {
             const availableWidth = window.innerWidth - 80; 
             const availableHeight = window.innerHeight - 80;
             const scaleX = availableWidth / config.width;
             const scaleY = availableHeight / config.height;
             let newScale = Math.min(scaleX, scaleY);
             newScale = Math.min(newScale, 1.5);
             setScale(newScale);
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }
  }, [isOpen, config.width, config.height]);

  if (!isOpen) return null;

  const handleInteraction = (triggerType: 'click', elementId: number) => {
    const el = elements.find(e => e.id === elementId);
    if (!el || !el.actions) return;
    el.actions.forEach(action => {
        if (action.trigger === triggerType) {
            setHiddenElements(prev => {
                const newSet = new Set(prev);
                if (newSet.has(action.targetId)) newSet.delete(action.targetId);
                else newSet.add(action.targetId);
                return newSet;
            });
        }
    });
  };

  const renderElementContent = (el: CanvasElement) => {
    const commonStyles: React.CSSProperties = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...el.style };
    switch (el.type) {
      case 'image':
      case 'box':
        if (el.content && (el.content.startsWith('http') || el.content.startsWith('blob:'))) return <img src={el.content} alt={el.name} style={commonStyles} />;
        return <div style={commonStyles}></div>;
      case 'video':
        return <video style={commonStyles} autoPlay muted loop playsInline><source src={el.content} /></video>;
      case 'carousel': return <CarouselComponent element={el} />;
      case 'button':
        if (el.linkUrl) return <a href={el.linkUrl} target="_blank" rel="noopener noreferrer" style={{...commonStyles, textDecoration: 'none'}} className="bg-[#9500cb] text-white rounded px-4 py-2 flex items-center justify-center">{el.content || 'Button'}</a>;
        return <button style={commonStyles} className="bg-[#9500cb] text-white rounded px-4 py-2">{el.content || 'Button'}</button>;
      case 'text': return <div style={commonStyles}>{el.content || 'Text Block'}</div>;
      default: return <div style={commonStyles}></div>;
    }
  };

  return (
    <div ref={modalContainerRef} className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center overflow-hidden">
      <div className="absolute top-4 left-4 text-white z-50 pointer-events-none opacity-50"><h2 className="text-lg font-bold">Preview Mode</h2><p className="text-xs">{config.width}x{config.height} @ {Math.round(scale * 100)}%</p></div>
      <button onClick={onClose} className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition-colors z-50 shadow-lg border border-gray-700"><Icons.Square size={20} className="rotate-45" /></button>
      <div style={{ width: config.width, height: config.height, backgroundColor: config.backgroundColor, position: 'relative', overflow: 'hidden', transform: `scale(${scale})`, transformOrigin: 'center center', boxShadow: '0 0 50px rgba(0,0,0,1)' }}>
        {elements.map(el => {
            const isHidden = hiddenElements.has(el.id);
            const animStyles: React.CSSProperties & { [key: string]: string | number } = {};
            if (el.animation) {
               if (el.animationDuration) animStyles['--anim-duration'] = `${el.animationDuration}s`;
               if (el.animationScale) animStyles['--anim-scale'] = el.animationScale;
            }
            return (
                <div key={el.id} onClick={() => el.actions?.some(a => a.trigger === 'click') && handleInteraction('click', el.id)}
                style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: elements.indexOf(el), cursor: el.actions?.length ? 'pointer' : 'default', opacity: isHidden ? 0 : 1, pointerEvents: isHidden ? 'none' : 'auto', transition: 'opacity 0.3s ease-in-out', ...animStyles }}
                className={el.animation ? `${el.animation} ${el.loopAnimation ? 'infinite' : ''}` : ''}>
                {renderElementContent(el)}
                </div>
            );
        })}
      </div>
      <style>{customCss}</style>
    </div>
  );
};

export default PreviewModal;
