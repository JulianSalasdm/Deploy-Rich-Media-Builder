import JSZip from 'jszip';
import { CanvasElement, CanvasConfig } from '../types';
import { globalStyles } from './animations';
import { generateCarouselScript, generateInteractionsScript, styleToString } from './tagGenerator';

// Helper to fetch blob data
const fetchBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    return await response.blob();
};

export const exportToZip = async (
    elements: CanvasElement[],
    config: CanvasConfig,
    customCss: string,
    customJs: string
) => {
    const zip = new JSZip();
    const assetsFolder = zip.folder("assets");
    const jsFolder = zip.folder("js");
    const cssFolder = zip.folder("css");
    
    // Deep copy elements to avoid modifying state during export processing
    const processedElements = JSON.parse(JSON.stringify(elements)) as CanvasElement[];
    
    // 1. Process Assets (Images/Videos that are blob URLs)
    const assetPromises: Promise<void>[] = [];

    const processUrl = async (url: string, prefix: string): Promise<string> => {
        if (url.startsWith('blob:')) {
            try {
                const blob = await fetchBlob(url);
                const ext = blob.type.split('/')[1] || 'png';
                const filename = `${prefix}_${Date.now()}.${ext}`;
                assetsFolder?.file(filename, blob);
                // RETURN RELATIVE PATH FOR PRODUCTION
                return `assets/${filename}`;
            } catch (err) {
                console.error("Failed to process asset blob:", url, err);
                return url;
            }
        }
        return url; 
    };

    processedElements.forEach(el => {
        if ((el.type === 'image' || el.type === 'video' || el.type === 'box') && el.content) {
            assetPromises.push(
                processUrl(el.content, `el_${el.id}`).then(newUrl => {
                    el.content = newUrl;
                })
            );
        }

        if (el.type === 'carousel' && el.carouselImages) {
            el.carouselImages.forEach((img, idx) => {
                 assetPromises.push(
                    processUrl(img.url, `el_${el.id}_slide_${idx}`).then(newUrl => {
                        img.url = newUrl;
                    })
                 );
            });
        }
    });

    await Promise.all(assetPromises);

    // 2. Generate Font Optimization
    const usedFonts = new Set<string>();
    processedElements.forEach(el => {
        if (el.style.fontFamily) usedFonts.add(el.style.fontFamily as string);
    });
    if (usedFonts.size === 0) usedFonts.add('Roboto');
    
    const fontParams = Array.from(usedFonts)
        .map(font => `family=${font.replace(/\s+/g, '+')}:wght@400;700`)
        .join('&');
    
    const fontLink = `<link href="https://fonts.googleapis.com/css2?${fontParams}&display=swap" rel="stylesheet">`;
    const defaultDest = processedElements.find(el => el.type === 'button')?.linkUrl || "https://www.google.com";

    // 3. Generate HTML Elements
    const htmlElements = processedElements.map(el => {
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
            z-index: ${processedElements.indexOf(el)};
            ${styleToString(el.style)}
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            transition: opacity 0.3s ease, transform 0.3s ease;
            ${animStylesStr}
        `.replace(/\n/g, '').trim();

        const animClass = (el.animation) 
          ? `${el.animation} ${el.loopAnimation ? 'infinite' : ''}`.trim() 
          : '';
        const commonClass = `rm-element ${animClass}`.trim();
        
        let innerContent = '';

        switch (el.type) {
            case 'text':
                innerContent = `<div style="width:100%; height:100%; word-wrap:break-word;">${el.content}</div>`;
                break;
            case 'image':
                innerContent = `<img src="${el.content}" style="width:100%; height:100%; object-fit:${el.style.objectFit || 'cover'};" alt="${el.name}">`;
                break;
            case 'box':
                if (el.content && (el.content.startsWith('assets/') || el.content.startsWith('http'))) {
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

    const indexHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="ad.size" content="width=${config.width},height=${config.height}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script type="text/javascript">
  var clickTag = "${defaultDest}";
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLink}
<link rel="stylesheet" href="css/style.css">
</head>
<body>
  <div id="ad-container">
    ${htmlElements}
  </div>
  <script src="js/script.js"></script>
</body>
</html>`;

    const cssContent = `
/* Global Animations */
${globalStyles}

/* Base Container */
body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
#ad-container {
    position: relative;
    width: ${config.width}px;
    height: ${config.height}px;
    background: ${config.backgroundColor};
    overflow: hidden;
    margin: 0 auto;
}

/* Custom CSS */
${customCss}`;

    const jsContent = `
(function() {
    // Ad Click Logic
    var targets = document.querySelectorAll('.click-target');
    for (var i = 0; i < targets.length; i++) {
        targets[i].addEventListener('click', function(e) {
            e.preventDefault();
            window.open(window.clickTag, "_blank");
        });
    }

    ${generateCarouselScript()}
    ${generateInteractionsScript(processedElements)}

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
})();`;

    zip.file("index.html", indexHtml);
    cssFolder?.file("style.css", cssContent);
    jsFolder?.file("script.js", jsContent);

    const content = await zip.generateAsync({type:"blob"});
    const url = URL.createObjectURL(content);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rich_media_${Date.now()}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};