import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=path.resolve('dist');
const appCode=fs.readFileSync(path.join(root,'app.js'),'utf8');
const projectLinks=JSON.parse(fs.readFileSync(path.join(root,'project-links.json'),'utf8'));
for(const [id,destinations] of Object.entries(projectLinks)){
  assert.ok(!Object.hasOwn(destinations,'source'),`Private project source must not be in the public manifest: ${id}`);
  assert.deepEqual(Object.keys(destinations),['live'],`Only live destinations may be advertised: ${id}`);
}
assert.ok(!appCode.includes('urls.source'),'Source CTA must not remain in the public app');
const routes=['/','/projects/pharmacore/','/projects/safi/','/projects/prescripto/','/projects/diacare/','/demos/pharmacore/','/demos/safi/','/demos/prescripto/','/demos/diacare/'];
for(const route of routes) assert.ok(fs.existsSync(path.join(root,route,'index.html')),`Missing route ${route}`);
for(const route of routes){
  const page=path.join(root,route,'index.html');
  const html=fs.readFileSync(page,'utf8');
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    const value=match[1];
    if(/^(https?:|mailto:|data:)/.test(value)) continue;
    const file=value.startsWith('/')?path.join(root,value):path.resolve(path.dirname(page),value.split('?')[0]);
    assert.ok(fs.existsSync(file),`Missing asset ${value} from ${route}`);
  }
}
function element(){return {innerHTML:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},getAttribute(){return 'false';},setAttribute(){},classList:{toggle(){},remove(){}}};}
async function load(route,language='en'){
  const output=element(),grid=element(),languageButton=element(),menu=element(),header=element();
  const buttons=['all','web','mobile'].map(name=>Object.assign(element(),{dataset:{filter:name}}));
  const context={localStorage:{getItem(){return language;},setItem(){}},location:{pathname:route},fetch:async()=>({json:async()=>projectLinks}),document:{documentElement:{},title:'',getElementById:()=>output,querySelector(selector){return ({'.language-toggle':languageButton,'.menu-toggle':menu,'.site-header':header,'.project-grid':grid})[selector]||element();},querySelectorAll(selector){return selector==='[data-filter]'&&!route.startsWith('/projects/')?buttons:[];}}};
  vm.runInNewContext(appCode,context);
  await new Promise(resolve=>setImmediate(resolve));
  return {output,grid,buttons,languageButton,context};
}
const home=await load('/');
assert.equal((home.output.innerHTML.match(/<article class="project-card/g)||[]).length,4,'Homepage must show all four projects');
assert.ok(home.output.innerHTML.includes('href="tel:+201122463382"'),'Phone must use the supplied international number');
assert.ok(home.output.innerHTML.includes('href="https://wa.me/201122463382"'),'WhatsApp must use the supplied number');
assert.ok(home.output.innerHTML.includes('class="message-form"'),'Contact section must contain the draft form');
const draft = vm.runInNewContext("whatsappDraft('Visitor', 'Hello & hello')",home.context);
assert.equal(new URL(draft).pathname,'/201122463382');
assert.ok(new URL(draft).searchParams.get('text').includes('Visitor\n\nHello & hello'),'WhatsApp draft must preserve and encode visitor text');
for(const id of Object.keys(projectLinks)) assert.ok(home.output.innerHTML.includes(`/projects/${id}/`),`Homepage project link: ${id}`);
home.buttons[2].listeners.click();
assert.ok(home.grid.innerHTML.includes('Safi Debt Ledger')&&home.grid.innerHTML.includes('DiaCare Mom'),'Mobile filter must include both Android/Flutter projects');
assert.ok(!home.grid.innerHTML.includes('PharmaCore'),'Mobile filter excludes web-only pharmacy project');
home.languageButton.listeners.click();
assert.equal(home.context.document.documentElement.dir,'rtl');
assert.ok(home.output.innerHTML.includes('أبرز'));
for(const id of Object.keys(projectLinks)){
  for(const language of ['en','ar']){
    const page=await load(`/projects/${id}/`,language);
    assert.ok(page.output.innerHTML.includes(`/demos/${id}/`),`Project demo link: ${id}`);
    if(projectLinks[id].live)assert.ok(page.output.innerHTML.includes(projectLinks[id].live),`Actual live destination: ${id}`);
    assert.ok(!page.output.innerHTML.includes('undefined'),`Missing project content: ${id}`);
    assert.ok(!/View source|شوف الكود|github\.com/i.test(page.output.innerHTML),`Private source link exposed for ${id} (${language})`);
  }
}
console.log('PASS: 9 routes, assets, live-only project destinations in both languages, Arabic toggle, filters, phone/WhatsApp links and encoded contact draft.');
