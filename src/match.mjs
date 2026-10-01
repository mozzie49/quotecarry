/** Conservative page-local matching. Offsets are UTF-16 indices in raw extracted text. */
const WORD = /[\p{L}\p{M}\p{N}]/u;
const SPACE = /\s/u;
const pageCache = new WeakMap();
function cached(page){let value=pageCache.get(page);if(!value||value.raw!==page.text){value={raw:page.text};pageCache.set(page,value);}return value;}
export const LIMITS = Object.freeze({quotes:50, quoteChars:2000, occurrences:100, candidates:3});
export function normalizeWithMap(text) {
  text=String(text); let normalized='', starts=[], ends=[];
  for(let i=0;i<text.length;) {
    if(SPACE.test(text[i])) { let j=i+1; while(j<text.length&&SPACE.test(text[j]))j++;
      if(normalized && j<text.length) {normalized+=' ';starts.push(i);ends.push(j);} i=j;
    } else { normalized+=text[i]; starts.push(i);ends.push(i+1);i++; }
  }
  return {text:normalized,starts,ends};
}
export function normalize(text) {return normalizeWithMap(text).text;}
function wordBefore(text,i) {if(i<=0)return false;const code=text.charCodeAt(i-1);return WORD.test(text.slice(code>=0xdc00&&code<=0xdfff?i-2:i-1,i));}
function wordAfter(text,i) {return i<text.length && WORD.test(String.fromCodePoint(text.codePointAt(i)));}
function boundary(text,start,end,needle) {
  return !(WORD.test([...needle][0])&&wordBefore(text,start)) && !(WORD.test([...needle].at(-1))&&wordAfter(text,end));
}
function operations(raw,quote) {
  const combined=raw+' '+quote; const ops=[];
  if(/\r/u.test(combined))ops.push('line endings');
  if(/\u00a0/u.test(combined))ops.push('nonbreaking spaces');
  if(/\t/u.test(combined))ops.push('tabs');
  if(/\n/u.test(combined))ops.push('line breaks');
  if(/\s{2,}/u.test(combined))ops.push('collapsed whitespace');
  if(raw.trim()!==raw||quote.trim()!==quote)ops.push('trimmed outer whitespace');
  return [...new Set(ops.length?ops:['whitespace normalization'])];
}
export function contextAt(text,start,end,breaks=[]) {
  const lower=breaks.filter(b=>b<=start).at(-1)??0, upper=breaks.find(b=>b>=end)??text.length;
  const left=text.slice(lower,start); const right=text.slice(end,upper);
  const lt=[...left.matchAll(/\S+/gu)], rt=[...right.matchAll(/\S+/gu)];
  return {before:left.slice(lt.length>10?lt.at(-10).index:0),quote:text.slice(start,end),after:right.slice(0,rt.length>10?rt[10].index:right.length)};
}
function pageRecords(pages) {return pages.map((page,i)=>typeof page==='string'?{index:i+1,label:null,text:page}:page);}
function documentInfo(doc) {return Array.isArray(doc)?{pages:pageRecords(doc),complete:true,warnings:[]}:{...doc,pages:pageRecords(doc.pages||[]),complete:doc.complete===true};}
function occurrence(page,start,end,quote,kind) {
  const text=page.text.slice(start,end);
  return {id:`${page.index}:${start}:${end}`,page:page.index,label:page.label??null,start,end,text,kind,operations:kind==='literal'?[]:operations(text,quote),context:contextAt(page.text,start,end,page.breaks)};
}
export function findMatches(pages,quote) {
  const needle=normalize(quote);
  if(!needle||quote.length>LIMITS.quoteChars)throw new Error('Enter a non-empty quote with at most 2,000 characters.');
  const matches=[];
  for(const page of pageRecords(pages)) {
    if(typeof page.text!=='string')continue;
    const cache=cached(page);const mapped=cache.normalized??=normalizeWithMap(page.text);let from=0;
    while(from<=mapped.text.length-needle.length) {
      const pos=mapped.text.indexOf(needle,from);if(pos<0)break;from=pos+1;
      const start=mapped.starts[pos],end=mapped.ends[pos+needle.length-1];
      if(!boundary(page.text,start,end,needle)||(page.breaks||[]).some(b=>b>start&&b<end))continue;
      matches.push(occurrence(page,start,end,quote,page.text.slice(start,end)===quote?'literal':'normalized'));
      if(matches.length>LIMITS.occurrences)throw new Error('More than 100 occurrences. Use a longer quote before comparing.');
    }
  }
  return matches;
}
export function wordDiff(before,after) {
  const a=normalize(before).split(' '),b=normalize(after).split(' ');
  if(a.length*b.length>160000)return [{type:'delete',text:before},{type:'insert',text:after}];
  const dp=Array.from({length:a.length+1},()=>new Uint16Array(b.length+1));
  for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const diff=[];let i=0,j=0; const add=(type,text)=>{const last=diff.at(-1);if(last?.type===type)last.text+=' '+text;else diff.push({type,text});};
  while(i<a.length||j<b.length) {if(i<a.length&&j<b.length&&a[i]===b[j]){add('equal',a[i++]);j++;}else if(j<b.length&&(i===a.length||dp[i][j+1]>=dp[i+1][j]))add('insert',b[j++]);else add('delete',a[i++]);}
  return diff;
}
export function findCandidates(pages,quote) {
  const q=normalize(quote).split(' ');if(q.length<5||q.length>160)return [];
  const candidates=[];let evaluated=0;const maxDelta=Math.min(5,Math.ceil(q.length*.2));
  for(const page of pageRecords(pages)) {
    if(!page.text)continue;const cache=cached(page);const tokens=cache.tokens??=[...page.text.matchAll(/\S+/gu)];
    for(let i=0;i<tokens.length;i++) {
      // A bounded suggestion search, not evidence of absence: keep the first word as an anchor.
      if(tokens[i][0]!==q[0])continue;
      for(let size=Math.max(3,q.length-maxDelta);size<=q.length+maxDelta&&i+size<=tokens.length;size++) {
        if(++evaluated>1500)break;
        const start=tokens[i].index,end=tokens[i+size-1].index+tokens[i+size-1][0].length;
        if((page.breaks||[]).some(b=>b>start&&b<end))continue;
        const raw=page.text.slice(start,end);if(normalize(raw)===normalize(quote))continue;
        const diff=wordDiff(quote,raw), equal=diff.filter(x=>x.type==='equal').reduce((n,x)=>n+x.text.split(' ').length,0);
        const score=2*equal/(q.length+size);
        if(score>=.72)candidates.push({...occurrence(page,start,end,quote,'candidate'),score:Number(score.toFixed(4)),diff});
      }
      if(evaluated>1500)break;
    }
    if(evaluated>1500)break;
  }
  candidates.sort((a,b)=>b.score-a.score||a.page-b.page||a.start-b.start||a.end-b.end);
  const selected=[];
  for(const candidate of candidates)if(!selected.some(x=>x.page===candidate.page&&x.start<candidate.end&&candidate.start<x.end)){selected.push(candidate);if(selected.length===LIMITS.candidates)break;}
  return selected;
}
export function compareQuote(oldInput,newInput,input,options={}) {
  const quote=typeof input==='string'?{quote:input}:input, oldDoc=documentInfo(oldInput),newDoc=documentInfo(newInput);
  const text=quote.quote;const before=findMatches(oldDoc.pages,text),after=findMatches(newDoc.pages,text);
  const warnings=[];
  if((oldDoc.warnings||[]).some(w=>w.includes('layout discontinuities'))||(newDoc.warnings||[]).some(w=>w.includes('layout discontinuities')))warnings.push('Layout warnings: occurrence counts cover searchable extracted text. Additional occurrences can be missed in unreliable reading order.');
  if(normalize(text).split(' ').length<5||normalize(text).replace(/\s/gu,'').length<25)warnings.push('Short passage: low-information matches need extra review.');
  if(oldDoc.sha256&&oldDoc.sha256===newDoc.sha256)warnings.push('Both files have identical SHA-256 hashes. You selected the same bytes.');
  const result={id:quote.id??'quote',quote:text,label:quote.label??'',note:quote.note??'',pageHint:quote.pageHint??null,baselineStatus:'baseline_not_located',targetStatus:'not_evaluated',before,after,candidates:[],selectedOldId:null,pageMoved:false,contextStatus:'context_unavailable',warnings,normalization:[]};
  if(!oldDoc.complete||!oldDoc.pages.length){result.baselineStatus='baseline_unavailable';return result;}
  if(!before.length)return result;
  let old;
  if(before.length>1){result.baselineStatus='baseline_ambiguous';old=before.find(x=>x.id===options.selectedOldId);if(!old)return result;result.selectedOldId=old.id;}
  else {result.baselineStatus='baseline_located';old=before[0];}
  if(!newDoc.complete||!newDoc.pages.length){result.targetStatus='source_unavailable';return result;}
  if(after.length>1)result.targetStatus='multiple_matches';
  else if(after.length===1) {
    const target=after[0];result.targetStatus=target.kind==='literal'?'literal_match':'normalized_match';result.normalization=target.operations;
    result.pageMoved=old.page!==target.page;
    result.contextStatus=normalize(old.context.before)===normalize(target.context.before)&&normalize(old.context.after)===normalize(target.context.after)?'context_same':'context_changed';
  }else {result.candidates=findCandidates(newDoc.pages,text);result.targetStatus=result.candidates.length?'possible_changed_passage':'not_located';}
  return result;
}
