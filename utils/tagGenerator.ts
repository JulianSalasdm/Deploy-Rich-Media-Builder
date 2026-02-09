import React from 'react';
import { CanvasElement, CanvasConfig } from '../types';
import { globalStyles } from './animations';

export const styleToString = (style: React.CSSProperties): string => {
  return Object.entries(style).reduce((acc, [key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    const needsPx = typeof value === 'number' && !['opacity', 'zIndex', 'fontWeight', 'scale', 'lineHeight'].includes(key);
    const val = needsPx ? `${value}px` : value;
    return acc + `${cssKey}:${val};`;
  }, '');
};

export const generateCarouselScript = () => {
    return `
    function initCarousels() {
        var carousels = document.querySelectorAll('.rm-carousel');
        for (var i = 0; i < carousels.length; i++) {
            (function(c) {
                var idx = 0;
                var images = c.querySelectorAll('.rm-carousel-img');
                var dots = c.querySelectorAll('.rm-dot');
                var total = images.length;
                if(total === 0) return;

                function show(n) {
                    for (var j = 0; j < images.length; j++) {
                        images[j].style.opacity = '0';
                        images[j].style.zIndex = '0';
                        images[j].style.visibility = 'hidden';
                        if (dots[j]) dots[j].style.backgroundColor = 'rgba(255,255,255,0.5)';
                    }
                    idx = (n + total) % total;
                    images[idx].style.opacity = '1';
                    images[idx].style.zIndex = '1';
                    images[idx].style.visibility = 'visible';
                    if(dots[idx]) dots[idx].style.backgroundColor = '#ffffff';
                }

                var nextBtn = c.querySelector('.rm-next');
                var prevBtn = c.querySelector('.rm-prev');

                if(nextBtn) {
                    nextBtn.style.pointerEvents = 'auto';
                    nextBtn.addEventListener('click', function(e) { 
                        e.preventDefault(); e.stopPropagation(); show(idx + 1); 
                    });
                }
                if(prevBtn) {
                    prevBtn.style.pointerEvents = 'auto';
                    prevBtn.addEventListener('click', function(e) { 
                        e.preventDefault(); e.stopPropagation(); show(idx - 1); 
                    });
                }
                
                for (var k = 0; k < dots.length; k++) {
                    (function(d, kIdx) {
                        d.addEventListener('click', function(e) { 
                            e.preventDefault(); e.stopPropagation(); show(kIdx); 
                        });
                    })(dots[k], k);
                }
                show(0);
            })(carousels[i]);
        }
    }
    `;
};

export const generateInteractionsScript = (elements: CanvasElement[]) => {
    const interactions = elements.filter(el => el.actions && el.actions.length > 0);
    if (interactions.length === 0) return '';
    return `
    function initInteractions() {
        ${interactions.map(el => `
            (function() {
                var el = document.getElementById('el-${el.id}');
                if(el) {
                    el.addEventListener('click', function(e) {
                        ${el.actions?.map(action => `
                            (function() {
                                var target = document.getElementById('el-${action.targetId}');
                                if(target) {
                                    var currentDisplay = window.getComputedStyle(target).display;
                                    var currentOpacity = window.getComputedStyle(target).opacity;
                                    if('${action.type}' === 'showHide') {
                                        target.style.display = (currentDisplay === 'none') ? 'flex' : 'none';
                                    } else if ('${action.type}' === 'toggleFade') {
                                        target.style.opacity = (currentOpacity === '0') ? '1' : '0';
                                        target.style.pointerEvents = (currentOpacity === '0') ? 'auto' : 'none';
                                    }
                                }
                            })();
                        `).join('')}
                    });
                }
            })();
        `).join('')}
    }
    `;
};

export const generateTag = (
  elements: CanvasElement[], 
  config: CanvasConfig, 
  customCss: string, 
  customJs: string
): { html: string, csv: string } => {
  
  const usedFonts = new Set<string>();
  elements.forEach(el => { if (el.style.fontFamily) usedFonts.add(el.style.fontFamily as string); });
  if (usedFonts.size === 0) usedFonts.add('Roboto');
  const fontParams = Array.from(usedFonts).map(f => "family=" + f.replace(/\s+/g, '+') + ":wght@400;700").join('&');
  const fontLink = `<link href="https://fonts.googleapis.com/css2?${fontParams}&display=swap" rel="stylesheet">`;

  // DV360 clickTag standard
  const defaultDest = elements.find(el => el.type === 'button')?.linkUrl || "https://www.google.com";

  const htmlElements = elements.map(el => {
    const animVars = [];
    if (el.animationDuration) animVars.push(`--anim-duration: ${el.animationDuration}s`);
    if (el.animationScale) animVars.push(`--anim-scale: ${el.animationScale}`);
    const animStyles = animVars.length > 0 ? animVars.join(';') + ';' : '';

    const baseStyle = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;z-index:${elements.indexOf(el)};${styleToString(el.style)}display:flex;justify-content:center;align-items:center;overflow:hidden;transition:opacity 0.3s ease,transform 0.3s ease;${animStyles}`;
    const commonClass = `rm-element ${el.animation || ''} ${el.animation && el.loopAnimation ? 'infinite' : ''}`.trim();
    let inner = '';

    switch (el.type) {
        case 'text': inner = `<div style="width:100%;height:100%;word-wrap:break-word;">${el.content}</div>`; break;
        case 'image': inner = `<img src="${el.content}" style="width:100%;height:100%;object-fit:${el.style.objectFit || 'cover'};" alt="${el.name}">`; break;
        case 'box': inner = (el.content && (el.content.startsWith('http') || el.content.startsWith('blob:'))) ? `<img src="${el.content}" style="width:100%;height:100%;object-fit:${el.style.objectFit || 'cover'};" alt="bg">` : `<div style="width:100%;height:100%;"></div>`; break;
        case 'button': inner = `<div class="click-target" style="cursor:pointer;width:100%;height:100%;display:flex;align-items:center;justify-content:center;">${el.content}</div>`; break;
        case 'video': inner = `<video src="${el.content}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>`; break;
        case 'carousel':
            const imgs = el.carouselImages || [];
            const aS = el.arrowSize || 24;
            const aC = el.arrowColor || '#ffffff';
            inner = `<div class="rm-carousel" style="width:100%;height:100%;position:relative;background:transparent;">` + 
                    imgs.map((img, i) => `<img class="rm-carousel-img" src="${img.url}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:${img.objectFit};background:${img.backgroundColor};opacity:${i === 0 ? 1 : 0};visibility:${i === 0 ? 'visible' : 'hidden'};transition:opacity 0.5s;z-index:${i === 0 ? 1 : 0};transform:scale(${img.scale || 1});">`).join('') +
                    `<button class="rm-prev" style="position:absolute;left:0;top:50%;transform:translateY(-50%);cursor:pointer;z-index:100;padding:5px;background:transparent;border:none;display:flex;align-items:center;justify-content:center;outline:none;pointer-events:auto;"><svg width="${aS}" height="${aS}" viewBox="0 0 24 24" fill="none" stroke="${aC}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="15 18 9 12 15 6"></polyline></svg></button>` +
                    `<button class="rm-next" style="position:absolute;right:0;top:50%;transform:translateY(-50%);cursor:pointer;z-index:100;padding:5px;background:transparent;border:none;display:flex;align-items:center;justify-content:center;outline:none;pointer-events:auto;"><svg width="${aS}" height="${aS}" viewBox="0 0 24 24" fill="none" stroke="${aC}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="9 18 15 12 9 6"></polyline></svg></button>` +
                    (el.showDots ? `<div style="position:absolute;bottom:5px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:100;">` + imgs.map(() => `<div class="rm-dot" style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.5);cursor:pointer;"></div>`).join('') + `</div>` : '') +
                    `</div>`;
            break;
    }
    return `<div id="el-${el.id}" class="${commonClass}" style="${baseStyle}">${inner}</div>`;
  }).join('');

  // SECURE HTML TEMPLATE (Clean, no aggressive minification that breaks SVGs)
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="ad.size" content="width=${config.width},height=${config.height}">
  <title>Rich Media Ad</title>
  <script type="text/javascript">
    var clickTag = "${defaultDest}";
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  ${fontLink}
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; cursor: default; }
    #ad-container {
        position: relative;
        width: ${config.width}px;
        height: ${config.height}px;
        background: ${config.backgroundColor};
        overflow: hidden;
        margin: 0 auto;
    }
    ${globalStyles}
    ${customCss}
  </style>
</head>
<body>
  <div id="ad-container">
    ${htmlElements}
  </div>
  <script type="text/javascript">
    (function() {
        // DV360 Click Handling
        var clickTargets = document.querySelectorAll('.click-target');
        for (var i = 0; i < clickTargets.length; i++) {
            clickTargets[i].addEventListener('click', function(e) {
                e.preventDefault();
                window.open(window.clickTag, "_blank");
            });
        }
        
        ${generateCarouselScript()}
        ${generateInteractionsScript(elements)}

        function startAd() {
            try {
                if (typeof initCarousels === 'function') initCarousels();
                if (typeof initInteractions === 'function') initInteractions();
                ${customJs}
            } catch(e) { console.error('RichMedia Error:', e); }
        }

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            startAd();
        } else {
            window.addEventListener('DOMContentLoaded', startAd);
        }
    })();
  </script>
</body>
</html>`;

  // For the TAG in CSV, we use the standard Excel CSV format
  const creativeName = "RichMedia_Ad_" + Date.now();
  const csvHeader = "Creative Name,Width,Height,Third-party Tag,Integration Code\n";
  const escapedTag = '"' + fullHtml.replace(/"/g, '""') + '"';
  const csvRow = creativeName + "," + config.width + "," + config.height + "," + escapedTag + ",Standard\n";

  return { 
    html: fullHtml, 
    csv: csvHeader + csvRow 
  };
};