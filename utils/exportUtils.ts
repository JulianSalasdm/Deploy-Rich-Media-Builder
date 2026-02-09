import JSZip from 'jszip';
import { CanvasElement, CanvasConfig } from '../types';
import { globalStyles } from './animations';
import { generateCarouselScript, generateInteractionsScript, styleToString } from './tagGenerator';

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
    
    const processedElements = JSON.parse(JSON.stringify(elements)) as CanvasElement[];
    const assetPromises: Promise<void>[] = [];

    const processUrl = async (url: string, prefix: string): Promise<string> => {
        if (url.startsWith('blob:')) {
            try {
                const blob = await fetchBlob(url);
                const ext = blob.type.split('/')[1] || 'png';
                const filename = `${prefix}_${Date.now()}.${ext}`;
                assetsFolder?.file(filename, blob);
                return `assets/${filename}`;
            } catch (err) {
                console.error("Asset process error:", err);
                return url;
            }
        }
        return url; 
    };

    processedElements.forEach(el => {
        if ((el.type === 'image' || el.type === 'video' || el.type === 'box') && el.content) {
            assetPromises.push(processUrl(el.content, `el_${el.id}`).then(url => { el.content = url; }));
        }
        if (el.type === 'carousel' && el.carouselImages) {
            el.carouselImages.forEach((img, idx) => {
                 assetPromises.push(processUrl(img.url, `el_${el.id}_s${idx}`).then(url => { img.url = url; }));
            });
        }
    });

    await Promise.all(assetPromises);

    const usedFonts = new Set<string>();
    processedElements.forEach(el => { if (el.style.fontFamily) usedFonts.add(el.style.fontFamily as string); });
    if (usedFonts.size === 0) usedFonts.add('Roboto');
    const fontParams = Array.from(usedFonts).map(f => "family=" + f.replace(/\s+/g, '+') + ":wght@400;700").join('&');
    const fontLink = `<link href="https://fonts.googleapis.com/css2?${fontParams}&display=swap" rel="stylesheet">`;
    const defaultDest = processedElements.find(el => el.type === 'button')?.linkUrl || "https://www.google.com";

    const htmlElements = processedElements.map(el => {
        const animVars = [];
        if (el.animationDuration) animVars.push(`--anim-duration:${el.animationDuration}s`);
        if (el.animationScale) animVars.push(`--anim-scale:${el.animationScale}`);
        const animStyle = animVars.length > 0 ? animVars.join(';') + ';' : '';
        const baseStyle = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;z-index:${processedElements.indexOf(el)};${styleToString(el.style)}display:flex;justify-content:center;align-items:center;overflow:hidden;transition:opacity 0.3s,transform 0.3s;${animStyle}`;
        const commonClass = `rm-element ${el.animation || ''} ${el.animation && el.loopAnimation ? 'infinite' : ''}`.trim();
        let inner = '';
        switch (el.type) {
            case 'text': inner = `<div style="width:100%;height:100%;word-wrap:break-word;">${el.content}</div>`; break;
            case 'image': inner = `<img src="${el.content}" style="width:100%;height:100%;object-fit:${el.style.objectFit || 'cover'};" alt="${el.name}">`; break;
            case 'box': inner = (el.content && (el.content.startsWith('assets/') || el.content.startsWith('http'))) ? `<img src="${el.content}" style="width:100%;height:100%;object-fit:${el.style.objectFit || 'cover'};" alt="bg">` : `<div style="width:100%;height:100%;"></div>`; break;
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

    zip.file("index.html", `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="ad.size" content="width=${config.width},height=${config.height}"><meta name="viewport" content="width=device-width,initial-scale=1"><script type="text/javascript">var clickTag = "${defaultDest}";</script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${fontLink}<link rel="stylesheet" href="css/style.css"></head><body><div id="ad-container">${htmlElements}</div><script src="js/script.js"></script></body></html>`);
    cssFolder?.file("style.css", `/* Animations */\n${globalStyles}\nbody,html{margin:0;padding:0;width:100%;height:100%;overflow:hidden}#ad-container{position:relative;width:${config.width}px;height:${config.height}px;background:${config.backgroundColor};overflow:hidden;margin:0 auto}${customCss}`);
    jsFolder?.file("script.js", `(function(){
    var t=document.querySelectorAll('.click-target');
    for(var i=0;i<t.length;i++){
        t[i].addEventListener('click',function(e){
            e.preventDefault();
            window.open(window.clickTag,"_blank");
        });
    }
    ${generateCarouselScript()}
    ${generateInteractionsScript(processedElements)}
    function start(){
        try{
            if(typeof initCarousels==='function')initCarousels();
            if(typeof initInteractions==='function')initInteractions();
            ${customJs}
        }catch(e){console.error(e)}
    }
    if(document.readyState==='complete'||document.readyState==='interactive'){start()}else{window.addEventListener('DOMContentLoaded',start)}
})();`);

    const blob = await zip.generateAsync({type:"blob"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rich_media_ad_${Date.now()}.zip`;
    link.click();
};