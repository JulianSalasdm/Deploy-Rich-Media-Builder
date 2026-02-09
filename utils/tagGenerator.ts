import React from 'react';
import { CanvasElement, CanvasConfig } from '../types';
import { globalStyles } from './animations';

// Helper to convert React CSSProperties to CSS string
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
        const carousels = document.querySelectorAll('.rm-carousel');
        carousels.forEach(function(c) {
            var idx = 0;
            var images = c.querySelectorAll('.rm-carousel-img');
            var dots = c.querySelectorAll('.rm-dot');
            var total = images.length;
            if(total === 0) return;

            function show(n) {
                for (var i = 0; i < images.length; i++) {
                    images[i].style.opacity = '0';
                    images[i].style.zIndex = '0';
                    if (dots[i]) dots[i].style.backgroundColor = 'rgba(255,255,255,0.5)';
                }
                
                idx = (n + total) % total;
                images[idx].style.opacity = '1';
                images[idx].style.zIndex = '1';
                if(dots[idx]) dots[idx].style.backgroundColor = '#ffffff';
            }

            var nextBtn = c.querySelector('.rm-next');
            var prevBtn = c.querySelector('.rm-prev');

            if(nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); show(idx + 1); });
            if(prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); show(idx - 1); });
            
            dots.forEach(function(d, i) {
                d.addEventListener('click', function(e) { e.stopPropagation(); show(i); });
            });

            show(0);
        });
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
                                    var currentDisplay = target.style.display;
                                    var currentOpacity = target.style.opacity;
                                    
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
  
  // 1. Optimize Font Loading
  const usedFonts = new Set<string>();
  elements.forEach(el => {
      if (el.style.fontFamily) usedFonts.add(el.style.fontFamily as string);
  });
  if (usedFonts.size === 0) usedFonts.add('Roboto');
  
  const fontParams = Array.from(usedFonts)
      .map(font => `family=${font.replace(/\s+/g, '+')}:wght@400;700`)
      .join('&');
  
  const fontLink = `<link href="https://fonts.googleapis.com/css2?${fontParams}&display=swap" rel="stylesheet">`;

  // 2. ClickTag Selection
  const defaultDest = elements.find(el => el.type === 'button')?.linkUrl || "https://www.google.com";

  // 3. HTML Elements with fixed arrows and transparent backgrounds
  const htmlElements = elements.map(el => {
    const animVariables = [];
    if (el.animationDuration) animVariables.push(`--anim-duration: ${el.animationDuration}s`);
    if (el.animationScale) animVariables.push(`--anim-scale: ${el.animationScale}`);
    const animStylesStr = animVariables.length > 0 ? animVariables.join(';') + ';' : '';

    const baseStyle = `
        position: absolute;
        left: ${el.x}px;
        top: ${el.y}px;
        width: ${el.width}px;
        height: ${el.height}px;
        z-index: ${elements.indexOf(el)};
        ${styleToString(el.style)}
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        transition: opacity 0.3s ease, transform 0.3s ease;
        ${animStylesStr}
    `.replace(/\s+/g, ' ').trim();

    const commonClass = `rm-element ${el.animation ? el.animation : ''} ${el.animation && el.loopAnimation ? 'infinite' : ''}`.trim();
    let innerContent = '';

    switch (el.type) {
        case 'text':
            innerContent = `<div style="width:100%; height:100%; word-wrap:break-word;">${el.content}</div>`;
            break;
        case 'image':
            innerContent = `<img src="${el.content}" style="width:100%; height:100%; object-fit:${el.style.objectFit || 'cover'};" alt="${el.name}">`;
            break;
        case 'box':
            if (el.content && (el.content.startsWith('http') || el.content.startsWith('blob:'))) {
                 innerContent = `<img src="${el.content}" style="width:100%; height:100%; object-fit:${el.style.objectFit || 'cover'};" alt="bg">`;
            } else {
                 innerContent = `<div style="width:100%; height:100%;"></div>`;
            }
            break;
        case 'button':
            innerContent = `<div class="click-target" style="cursor:pointer; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">${el.content}</div>`;
            break;
        case 'video':
            innerContent = `<video src="${el.content}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>`;
            break;
        case 'carousel':
            const images = el.carouselImages || [];
            const arrowSize = el.arrowSize || 24;
            const arrowColor = el.arrowColor || '#ffffff';
            innerContent = `
                <div class="rm-carousel" style="width:100%; height:100%; position:relative; background:transparent;">
                    ${images.map((img, i) => `
                        <img class="rm-carousel-img" src="${img.url}" style="
                            position:absolute; top:0; left:0; width:100%; height:100%; 
                            object-fit:${img.objectFit}; background:${img.backgroundColor};
                            opacity:${i === 0 ? 1 : 0}; transition: opacity 0.5s; z-index:${i === 0 ? 1 : 0};
                            transform: scale(${img.scale || 1});
                        " />
                    `).join('')}
                    
                    <button class="rm-prev" style="position:absolute; left:0; top:50%; transform:translateY(-50%); cursor:pointer; z-index:10; padding:5px; background:transparent; border:none; display:flex; align-items:center; justify-content:center; outline:none;">
                        <svg width="${arrowSize}" height="${arrowSize}" viewBox="0 0 24 24" fill="none" stroke="${arrowColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button class="rm-next" style="position:absolute; right:0; top:50%; transform:translateY(-50%); cursor:pointer; z-index:10; padding:5px; background:transparent; border:none; display:flex; align-items:center; justify-content:center; outline:none;">
                        <svg width="${arrowSize}" height="${arrowSize}" viewBox="0 0 24 24" fill="none" stroke="${arrowColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>

                    ${el.showDots ? `
                    <div style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%); display:flex; gap:4px; z-index:10;">
                        ${images.map(() => `<div class="rm-dot" style="width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.5); cursor:pointer;"></div>`).join('')}
                    </div>
                    ` : ''}
                </div>
            `;
            break;
    }

    return `<div id="el-${el.id}" class="${commonClass}" style="${baseStyle}">${innerContent}</div>`;
  }).join('');

  // 4. Construct Final HTML securely
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="ad.size" content="width=${config.width},height=${config.height}">
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
        // Standard Ad Click Handling
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

  // 5. Minification and CSV escaping
  const minifiedTag = fullHtml.replace(/>\s+</g, '><').trim();
  const creativeName = "RichMedia_Banner_" + Date.now();
  const csvHeader = "Creative Name,Width,Height,Third-party Tag,Integration Code\n";
  const escapedTag = '"' + minifiedTag.replace(/"/g, '""') + '"';
  const csvRow = creativeName + "," + config.width + "," + config.height + "," + escapedTag + ",Standard\n";

  return {
    html: fullHtml,
    csv: csvHeader + csvRow
  };
};