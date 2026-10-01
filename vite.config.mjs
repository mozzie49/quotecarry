import {defineConfig} from 'vite';
import {cpSync,mkdirSync} from 'node:fs';
export default defineConfig({base:'./',plugins:[{name:'local-pdf-assets',buildStart(){mkdirSync('public/pdfjs',{recursive:true});for(const d of ['cmaps','standard_fonts','wasm','iccs']) cpSync(`node_modules/pdfjs-dist/${d}`,`public/pdfjs/${d}`,{recursive:true});cpSync('node_modules/pdfjs-dist/LICENSE','public/pdfjs/LICENSE');}}]});
