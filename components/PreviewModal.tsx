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
    
    // Auto reset if images change
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
            case 'circle':
                return { 
                    left: <Icons.CircleArrowLeft {...iconProps} fill="none" />, 
                    right: <Icons.CircleArrowRight {...iconProps} fill="none" /> 
                };
            case 'triangle':
                return { 
                    left: <Icons.TriangleRight size={size} color={color} fill={color} className="rotate-180" />, 
                    right: <Icons.TriangleRight size={size} color={color} fill={color} /> 
                };
            case 'long':
                return { 
                    left: <Icons.ArrowLeft {...iconProps} fill="none" />, 
                    right: <Icons.ArrowRight {...iconProps} fill="none" /> 
                };
            case 'simple':
            default:
                return { 
                    left: <Icons.ChevronLeft {...iconProps} fill="none" />, 
                    right: <Icons.ChevronRight {...iconProps} fill="none" /> 
                };
        }
    };

    const arrowSize = element.arrowSize || 24;
    const arrows = renderArrows(element.arrowType, element.arrowColor, arrowSize);
    
    // Helper to render a specific image with its animation
    const renderImage = (imgObj: typeof images[0], idx: number, extraClass: string = '') => {
        const loopAnim = imgObj.animation ? `${imgObj.animation} infinite` : '';
        return (
             <img 
                key={imgObj.id} // Important for React to differentiate elements
                src={imgObj.url} 
                alt={`slide-${idx}`} 
                className={`w-full h-full absolute top-0 left-0 ${loopAnim} ${extraClass}`}
                style={{ 
                    objectFit: imgObj.objectFit || 'cover',
                    backgroundColor: imgObj.backgroundColor || 'transparent',
                    transform: `scale(${imgObj.scale || 1})`
                }}
            />
        );
    };

    return (
        <div 
            style={{ 
                width: '100%', 
                height: '100%', 
                ...element.style
            }} 
            className="group flex items-center justify-between gap-1"
        >
             {/* Left Arrow Outside */}
            {images.length > 1 && (
                <button 
                    onClick={prev}
                    className="flex-none z-10 p-1 hover:scale-110 transition-transform drop-shadow-md cursor-pointer"
                >
                    {arrows.left}
                </button>
            )}

            {/* Image Container */}
            <div className="flex-1 h-full relative overflow-hidden">
                {transitionType === 'slide' ? (
                     <div className="w-full h-full relative">
                        {images.map((img, i) => {
                            let animClass = 'hidden';
                            // Logic for specific enter/exit animations based on direction
                            if (i === index) {
                                animClass = direction === 'right' ? 'slide-in-right z-20' 
                                            : direction === 'left' ? 'slide-in-left z-20' 
                                            : 'z-20'; // Initial state or no direction
                            } else if (i === prevIndex && direction) {
                                animClass = direction === 'right' ? 'slide-out-left z-10' 
                                            : direction === 'left' ? 'slide-out-right z-10' 
                                            : 'hidden';
                            }
                            
                            return renderImage(img, i, animClass);
                        })}
                     </div>
                ) : transitionType === 'fade' ? (
                    <div className="w-full h-full relative">
                        {images.map((img, i) => (
                            <div 
                                key={img.id}
                                className={`w-full h-full absolute inset-0 transition-opacity duration-500 ease-in-out ${i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                            >
                                {renderImage(img, i, '')}
                            </div>
                        ))}
                    </div>
                ) : (
                    // None (Instant)
                    <div className="w-full h-full relative">
                        {renderImage(images[index], index, 'z-10')}
                    </div>
                )}

                {/* Dots */}
                {images.length > 1 && element.showDots !== false && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-30">
                        {images.map((_, idx) => (
                            <div 
                                key={idx} 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setPrevIndex(index);
                                    setDirection(idx > index ? 'right' : 'left');
                                    setIndex(idx); 
                                }}
                                className={`w-1.5 h-1.5 rounded-full cursor-pointer shadow-sm ${idx === index ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Right Arrow Outside */}
            {images.length > 1 && (
                <button 
                    onClick={next}
                    className="flex-none z-10 p-1 hover:scale-110 transition-transform drop-shadow-md cursor-pointer"
                >
                    {arrows.right}
                </button>
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
  // State to track hidden/visible elements based on actions
  const [hiddenElements, setHiddenElements] = useState<Set<number>>(new Set());
  
  // Ref for the outer modal container to calculate available space
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1); 
  
  // Track window size for responsiveness
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1200, 
    height: typeof window !== 'undefined' ? window.innerHeight : 900 
  });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset interactions when modal opens
  useEffect(() => {
    if (isOpen) {
        setHiddenElements(new Set());
    }
  }, [isOpen]);

  // Calculate content scale to fit window
  useEffect(() => {
    if (isOpen && modalContainerRef.current) {
        const updateScale = () => {
             // Available space (padding subtracted)
             const availableWidth = window.innerWidth - 80; 
             const availableHeight = window.innerHeight - 80;
             
             // Calculate ratios
             const scaleX = availableWidth / config.width;
             const scaleY = availableHeight / config.height;
             
             // Fit contain
             let newScale = Math.min(scaleX, scaleY);
             
             // Optional: Don't scale up past 1.0 if you want 1:1 pixel perfection on large screens,
             // but usually preview implies fitting the screen. Let's cap it at 1.5 to avoid blurriness.
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
            if (action.type === 'showHide' || action.type === 'toggleFade') {
                setHiddenElements(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(action.targetId)) {
                        newSet.delete(action.targetId);
                    } else {
                        newSet.add(action.targetId);
                    }
                    return newSet;
                });
            }
        }
    });
  };

  const renderElementContent = (el: CanvasElement) => {
    const commonStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      ...el.style
    };

    switch (el.type) {
      case 'image':
      case 'box':
        // If box has an image URL as content, render it
        if (el.content && (el.content.startsWith('http') || el.content.startsWith('blob:'))) {
           return <img src={el.content} alt={el.name} style={commonStyles} className="pointer-events-none" />;
        }
        return <div style={commonStyles} className="pointer-events-none"></div>;
      case 'video':
        return (
            <video style={commonStyles} autoPlay muted loop playsInline>
                <source src={el.content} />
            </video>
        );
      case 'carousel':
          return <CarouselComponent element={el} />;
      case 'button':
        if (el.linkUrl) {
            return (
                <a 
                    href={el.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{...commonStyles, textDecoration: 'none'}}
                    className="bg-[#9500cb] text-white rounded px-4 py-2 flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                    {el.content || 'Button'}
                </a>
            );
        }
        return <button style={commonStyles} className="bg-[#9500cb] text-white rounded px-4 py-2">{el.content || 'Button'}</button>;
      case 'text':
        return <div style={commonStyles}>{el.content || 'Text Block'}</div>;
      default:
        return <div style={commonStyles}></div>;
    }
  };

  return (
    <div 
        ref={modalContainerRef}
        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center overflow-hidden"
    >
      
      {/* Header / Info */}
      <div className="absolute top-4 left-4 text-white z-50 pointer-events-none opacity-50">
          <h2 className="text-lg font-bold">Preview Mode</h2>
          <p className="text-xs">
             {config.width}x{config.height} @ {Math.round(scale * 100)}%
          </p>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2 transition-colors z-50 shadow-lg border border-gray-700"
      >
        <Icons.Square size={20} className="rotate-45" /> 
        <span className="sr-only">Close</span>
      </button>

      {/* The Ad Container */}
      <div 
        style={{
            width: config.width,
            height: config.height,
            backgroundColor: config.backgroundColor,
            position: 'relative',
            overflow: 'hidden',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            boxShadow: '0 0 50px rgba(0,0,0,0.8)', // Cinematic shadow
        }}
      >
        {elements.map(el => {
            // Global element animation
            const animClass = el.animation 
            ? `${el.animation} ${el.loopAnimation ? 'infinite' : ''}`.trim() 
            : '';
            
            // Generate CSS Variables for animation
            const animStyles: React.CSSProperties = {};
            if (el.animation) {
               if (el.animationDuration) {
                 animStyles['--anim-duration' as any] = `${el.animationDuration}s`;
               }
               if (el.animationScale) {
                 animStyles['--anim-scale' as any] = el.animationScale;
               }
            }
            
            const isHidden = hiddenElements.has(el.id);

            // Actions check
            const hasClickAction = el.actions && el.actions.some(a => a.trigger === 'click');
            
            return (
                <div
                key={el.id}
                onClick={() => {
                    if (hasClickAction) {
                        handleInteraction('click', el.id);
                    }
                }}
                style={{
                position: 'absolute',
                left: el.x,
                top: el.y,
                width: el.width,
                height: el.height,
                zIndex: elements.indexOf(el),
                cursor: hasClickAction ? 'pointer' : 'default',
                opacity: isHidden ? 0 : 1,
                pointerEvents: isHidden ? 'none' : 'auto',
                transition: 'opacity 0.3s ease-in-out',
                ...animStyles
                }}
                className={animClass}
                >
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