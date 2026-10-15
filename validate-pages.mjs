import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const docs=path.resolve('docs');
const projectIds=['pharmacore','safi','prescripto','diacare'];
const projectBase='https://example.invalid/ziad-badea-portfolio/';
const bundle=fs.readFileSync(path.join(docs,'index.html'),'utf8');
assert(fs.existsSync(path.join(docs,'.nojekyll')),'Pages distribution requires .nojekyll');
assert(!fs.existsSync(path.join(docs,'Source')),'Private/source relay copy must not be published');
const scripts=[...bundle.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(Boolean);
assert(scripts.length>0,'Standalone Pages app script is missing');
for(const script of scripts)new vm.Script(script);

function fileExistsAtProjectBase(value,pageUrl){
  if(!value||value.startsWith('#')||/^(?:https?:|data:|mailto:|tel:)/i.test(value))return;
  const url=new URL(value,pageUrl);
  assert(url.pathname.startsWith('/ziad-badea-portfolio/'),`Link leaves the Pages project base: ${value}`);
  let file=path.join(docs,decodeURIComponent(url.pathname.slice('/ziad-badea-portfolio/'.length)));
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  assert(fs.existsSync(file),`Missing Pages asset or route: ${value}`);
}
function validateHtml(html,pageUrl){
  for(const match of html.matchAll(/(?:src|href)="([^"\r\n]+)"/g))fileExistsAtProjectBase(match[1],pageUrl);
}
function node(){return{innerHTML:'',listeners:{},addEventListener(type,callback){this.listeners[type]=callback;},getAttribute(){return'false';},setAttribute(){},classList:{toggle(){},remove(){}}};}
for(const hash of ['#home',...projectIds.map(id=>'#project/'+id)]){
  const app=node();const elements=new Map();
  const context=vm.createContext({localStorage:{getItem(){return'en';},setItem(){}},location:{hash,pathname:'/ziad-badea-portfolio/'},document:{documentElement:{},title:'',getElementById(id){return id==='app'?app:node();},querySelector(selector){if(!elements.has(selector))elements.set(selector,node());return elements.get(selector);},querySelectorAll(){return[];}},window:{addEventListener(){},scrollTo(){},open(){}},URL,console});
  for(const script of scripts)vm.runInContext(script,context);
  assert(app.innerHTML.includes('<main'),'Rendered Pages route missing: '+hash);
  validateHtml(app.innerHTML,projectBase);
  if(hash==='#home')for(const id of projectIds)assert(app.innerHTML.includes(`href="#project/${id}"`),'Project hash link missing: '+id);
  else{const id=hash.split('/')[1];assert(app.innerHTML.includes(`href="demos/${id}/"`),'Relative demo link missing: '+id);}
  if(hash==='#home'){elements.get('.language-toggle').listeners.click();assert.equal(context.document.documentElement.dir,'rtl');validateHtml(app.innerHTML,projectBase);}
}
function inspect(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name);
    assert(!/^(?:\.git|\.openai|Source|node_modules)$/i.test(entry.name),'Excluded directory reached Pages distribution');
    assert(!/\.(?:zip|tar|tgz|gz|db|sqlite|jks|keystore)$/i.test(entry.name),'Excluded artifact reached Pages distribution');
    if(entry.isDirectory()){inspect(file);continue;}
    if(file===path.join(docs,'index.html'))continue;
    if(entry.name.endsWith('.html'))validateHtml(fs.readFileSync(file,'utf8'),projectBase+path.relative(docs,file).replaceAll(path.sep,'/'));
    if(entry.name.endsWith('.js'))new vm.Script(fs.readFileSync(file,'utf8'));
    if(entry.name.endsWith('.css'))for(const match of fs.readFileSync(file,'utf8').matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g))fileExistsAtProjectBase(match[1],projectBase+path.relative(docs,file).replaceAll(path.sep,'/'));
  }
}
inspect(docs);
for(const id of projectIds)assert(fs.existsSync(path.join(docs,'demos',id,'index.html')),'Demo missing: '+id);
console.log('PASS: Pages project-base hash routes, Arabic toggle, relative demo/assets links, JS syntax, and upload exclusions.');
