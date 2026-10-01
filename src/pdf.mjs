import {getDocument,GlobalWorkerOptions,version} from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {readPdfBytes,PDF_LIMITS} from './pdf-core.mjs';
GlobalWorkerOptions.workerSrc=worker;
export const PDFJS_VERSION=version;
export async function extractPdf(file,signal,progress=()=>{}) {
  if(!file||!file.size||file.size>PDF_LIMITS.bytes)throw new Error('Choose a non-empty PDF no larger than 25 MiB.');
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  const bytes=new Uint8Array(await file.arrayBuffer());
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const sha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
  const base=new URL(`${import.meta.env.BASE_URL}pdfjs/`,location.href).href;
  return readPdfBytes(bytes,{getDocument,version,name:file.name,sha256,signal,progress,assetOptions:{cMapUrl:`${base}cmaps/`,cMapPacked:true,standardFontDataUrl:`${base}standard_fonts/`,wasmUrl:`${base}wasm/`,iccUrl:`${base}iccs/`}});
}
export async function renderPage(doc,pageIndex,canvas,occurrence) {
  const page=await doc.document.getPage(pageIndex),base=page.getViewport({scale:1});
  if(!Number.isFinite(base.width)||!Number.isFinite(base.height)||base.width<=0||base.height<=0)throw new Error('Unsupported page dimensions.');
  const width=Math.min(1100,canvas.parentElement?.clientWidth||650),viewport=page.getViewport({scale:width/base.width});
  const ratio=Math.min(window.devicePixelRatio||1,2);if(viewport.height>8000||viewport.width*viewport.height*ratio*ratio>16000000)throw new Error('Page preview exceeds the memory limit.');canvas.width=viewport.width*ratio;canvas.height=viewport.height*ratio;canvas.style.width='100%';
  const context=canvas.getContext('2d');await page.render({canvas,canvasContext:context,viewport,transform:[ratio,0,0,ratio,0,0]}).promise;
  // Only full extraction runs can map item bounds reliably. Partial words are not approximated.
  const items=doc.pages[pageIndex-1]?.items.filter(i=>occurrence&&i.start>=occurrence.start&&i.end<=occurrence.end&&i.str.trim())||[];
  let highlighted=false;
  if(items.length&&items.every(item=>item.transform&&Math.abs(item.transform[1])<.001&&Math.abs(item.transform[2])<.001&&item.width>=0&&item.height>0)&&items[0].start===occurrence.start&&items.at(-1).end===occurrence.end) {
    context.save();context.scale(ratio,ratio);context.fillStyle='rgba(244,190,67,.25)';
    for(const item of items){const rect=[...viewport.convertToViewportPoint(item.transform[4],item.transform[5]),...viewport.convertToViewportPoint(item.transform[4]+item.width,item.transform[5]+item.height)];context.fillRect(Math.min(rect[0],rect[2]),Math.min(rect[1],rect[3]),Math.abs(rect[2]-rect[0]),Math.abs(rect[3]-rect[1]));}
    context.restore();highlighted=true;
  }
  return {highlighted};
}
