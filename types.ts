import { CSSProperties } from 'react';

export type ElementType = 'text' | 'button' | 'image' | 'video' | 'box' | 'carousel';
export type ArrowType = 'simple' | 'circle' | 'triangle' | 'long';
export type CarouselTransition = 'slide' | 'fade' | 'none';

export interface CarouselImage {
    id: string;
    url: string;
    objectFit: 'fill' | 'cover' | 'contain' | 'none';
    backgroundColor: string;
    animation: string; // Per-image loop animation
    scale: number; // Independent scale factor
}

export interface CanvasAction {
  id: string;
  trigger: 'click';
  type: 'showHide' | 'toggleFade';
  targetId: number;
}

export interface CanvasElement {
  id: number; // Persistent ID (1, 2, 3...)
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // Text content or Image/Video SRC (Main content)
  
  // Carousel specific
  carouselImages?: CarouselImage[]; // Array of image objects
  arrowType?: ArrowType;
  arrowColor?: string;
  arrowSize?: number; // Size in px
  carouselTransition?: CarouselTransition;
  editingIndex?: number; // Currently visible slide in editor
  showDots?: boolean; // Show navigation dots

  // Button specific
  linkUrl?: string;

  // Interactivity
  actions?: CanvasAction[];

  style: CSSProperties;
  animation: string; // Global Element Animation
  animationDuration?: number; // Duration in seconds
  animationScale?: number; // Scale multiplier (for Pulse)
  loopAnimation: boolean;

  // Alignment & Locking
  alignmentLock?: string; // ID of the active alignment preset (e.g. 'tc', 'bc')
  lockAxis?: 'x' | 'y' | 'both' | 'none';
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

export const ANIMATION_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Pulse (Grow)', value: 'custom-pulse' },
  { label: 'Bounce', value: 'animate-bounce' },
  { label: 'Spin', value: 'animate-spin' },
  { label: 'Ping', value: 'animate-ping' },
  { label: 'Shake', value: 'custom-shake' },
  { label: 'Fade In', value: 'custom-fade-in' },
  { label: 'Slide Up', value: 'custom-slide-up' },
];

export const GOOGLE_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Playfair Display',
  'Arial', // System fallback
  'Courier New', // System fallback
];

export const OBJECT_FIT_OPTIONS = [
  { label: 'Fill (Stretch)', value: 'fill' },
  { label: 'Cover (Crop)', value: 'cover' },
  { label: 'Contain (Fit)', value: 'contain' },
  { label: 'None', value: 'none' },
];

export const ARROW_OPTIONS: { label: string; value: ArrowType }[] = [
  { label: 'Simple (Chevron)', value: 'simple' },
  { label: 'Circle', value: 'circle' },
  { label: 'Triangle', value: 'triangle' },
  { label: 'Long Arrow', value: 'long' },
];

export const CAROUSEL_TRANSITIONS: { label: string; value: CarouselTransition }[] = [
    { label: 'Slide (Fade+Move)', value: 'slide' },
    { label: 'Fade (Opacity)', value: 'fade' },
    { label: 'None', value: 'none' },
];