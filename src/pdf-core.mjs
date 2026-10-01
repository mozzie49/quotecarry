export const PDF_LIMITS=Object.freeze({bytes:25*1024*1024,pages:100,pageChars:100000,totalChars:2000000,timeoutMs:60000});
export function textFromContent(content) {
  let text='';const items=[],breaks=[];let previous=null;
  for(const item of content.items)if('str' in item) {
    if(previous?.transform&&item.transform&&item.str) {
      const height=Math.max(Math.abs(previous.height||previous.transform[3]||10),Math.abs(item.height||item.transform[3]||10));
      const dx=item.transform[4]-(previous.transform[4]+previous.width),dy=item.transform[5]-previous.transform[5];
      const sameLine=Math.abs(dy)<height*.45;
      const discontinuous=(sameLine&&dx>Math.max(50,height*4)) || dy>height*2 || (sameLine&&item.transform[4]<previous.transform[4]-height*2);
      if(discontinuous) {if(!/\s$/u.test(text))text+='\n';breaks.push(text.length);}
      else if(sameLine&&dx>height*.2&&!/\s$/u.test(text)&&!/^\s/u.test(item.str))text+=' ';
    }
    const start=text.length;text+=item.str;items.push({start,end:text.length,str:item.str,transform:item.transform,width:item.width,height:item.height});
    if(item.hasEOL&&!text.endsWith('\n'))text+='\n';
    if(item.str)previous=item;
  }
  return {text,items,breaks};
}
export function layoutWarning(items) {
  // A conservative warning for large separated text runs on a shared baseline.
  const lines=new Map();
  for(const item of items)if(item.str.trim().length>12&&item.transform) {
    const y=Math.round(item.transform[5]/3)*3;const line=lines.get(y)||[];line.push(item);lines.set(y,line);
  }
  let split=0;
  for(const line of lines.values()) {
    line.sort((a,b)=>a.transform[4]-b.transform[4]);
    for(let i=1;i<line.length;i++)if(line[i].transform[4]-(line[i-1].transform[4]+line[i-1].width)>50){split++;break;}
  }
  return split>=3;
}
export async function readPdfBytes(bytes,{getDocument,version,name='document.pdf',sha256='',signal,progress=()=>{},assetOptions={},timeoutMs=PDF_LIMITS.timeoutMs}={}) {
  if(!(bytes instanceof Uint8Array)||!bytes.length||bytes.length>PDF_LIMITS.bytes)throw new Error('Choose a non-empty PDF no larger than 25 MiB.');
  if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw new Error('The file does not have a PDF signature.');
  const abortError=()=>new DOMException('Cancelled','AbortError');
  const check=()=>{if(signal?.aborted)throw abortError();};check();
  let task,doc,timer,stopped=false,abortReject;
  const aborted=new Promise((_,reject)=>{abortReject=reject;});
  const onAbort=()=>{stopped=true;abortReject(abortError());void task?.destroy().catch(()=>{});};
  signal?.addEventListener('abort',onAbort,{once:true});
  const work=async()=>{
    task=getDocument({data:bytes,enableXfa:false,isEvalSupported:false,stopAtErrors:true,...assetOptions});
    doc=await task.promise;check();
    if(doc.numPages>PDF_LIMITS.pages)throw new Error('This prototype supports at most 100 PDF pages per file.');
    const warnings=[],pages=[],blankPages=[];let complete=true,total=0,labels=null;
    try{labels=await doc.getPageLabels();}catch{warnings.push('PDF page labels are unavailable. Physical PDF page indices are shown.');}
    for(let n=1;n<=doc.numPages;n++) {
      check();if(stopped)throw new Error('PDF extraction stopped.');let page;
      try {
        page=await doc.getPage(n);const content=await page.getTextContent();check();const extracted=textFromContent(content);
        total+=extracted.text.length;
        if(extracted.text.length>PDF_LIMITS.pageChars||total>PDF_LIMITS.totalChars)throw new Error('Extracted text exceeds the prototype limit.');
        if(!extracted.text.trim()){blankPages.push(n);complete=false;warnings.push(`PDF page ${n} has no extracted text. It may be blank or a scan; whole-document uniqueness is unavailable.`);}
        if(layoutWarning(extracted.items)||extracted.breaks.length){warnings.push(`PDF page ${n} has possible layout discontinuities. Searches do not cross detected boundaries. Additional occurrences can be missed in unreliable reading order; inspect the PDF.`);}
        pages.push({index:n,label:labels?.[n-1]??null,...extracted,available:true});
      }catch(error){check();complete=false;warnings.push(`PDF page ${n} could not be fully extracted: ${String(error.message||error).slice(0,180)}`);pages.push({index:n,label:labels?.[n-1]??null,text:'',items:[],available:false});if(total>PDF_LIMITS.totalChars)throw error;}
      finally{page?.cleanup();}
      progress(n,doc.numPages);await new Promise(resolve=>setTimeout(resolve,0));
    }
    if(!pages.some(p=>p.text.trim()))warnings.push('No readable text was found. OCR is not included.');
    return {name,sha256,pages,complete,warnings,blankPages,extractor:`PDF.js ${version}`,document:doc,dispose:()=>task.destroy()};
  };
  try {
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{stopped=true;void task?.destroy().catch(()=>{});reject(new Error('PDF extraction timed out after 60 seconds. Try a smaller PDF.'));},timeoutMs);});
    return await Promise.race([work(),timeout,aborted]);
  }catch(error){await task?.destroy().catch(()=>{});check();if(error?.name==='PasswordException')throw new Error('Password-protected PDFs are not supported.');throw error;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',onAbort);}
}
