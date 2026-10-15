(() => {
  'use strict';
  const storageKey = 'ziad-pharmacore-showcase-v1';
  const initial = [
    {id:1,name:'Panadol Advance',ar:'بانادول',barcode:'62210001',category:'tablets',price:60,strips:2,pills:12,stock:240,min:48,detail:'2 شريط × 12 حبة'},
    {id:2,name:'Brufen 400',ar:'بروفين',barcode:'62210002',category:'tablets',price:72,strips:3,pills:10,stock:180,min:30,detail:'3 شرائط × 10 حبات'},
    {id:3,name:'Vitamin D3',ar:'فيتامين د',barcode:'62210003',category:'vitamins',price:90,strips:2,pills:10,stock:80,min:20,detail:'2 شريط × 10 حبات'},
    {id:4,name:'Vitamin C',ar:'فيتامين سي',barcode:'62210004',category:'vitamins',price:80,strips:2,pills:10,stock:20,min:20,detail:'2 شريط × 10 حبات'},
    {id:5,name:'Hand Care',ar:'عناية اليدين',barcode:'62210005',category:'care',price:45,strips:1,pills:1,stock:26,min:5,detail:'عبوة كاملة'},
    {id:6,name:'First Aid Kit',ar:'اسعافات',barcode:'62210006',category:'care',price:125,strips:1,pills:1,stock:10,min:3,detail:'عبوة كاملة'}
  ];
  let state = {products:structuredClone(initial),sales:[]}, cart = [], filter = 'all', activePage = 'pos';
  try { const saved = JSON.parse(localStorage.getItem(storageKey)); if(saved && Array.isArray(saved.sales) && Array.isArray(saved.products) && saved.products.length === initial.length && saved.products.every((p,i) => p.id === initial[i].id && Number.isFinite(p.stock) && p.stock >= 0)) state = {products:initial.map((p,i)=>({...p,stock:saved.products[i].stock})),sales:saved.sales}; } catch {}
  const $ = id => document.getElementById(id);
  const money = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ج.م';
  const esc = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const product = id => state.products.find(p=>p.id === Number(id));
  const units = {box:'علبة',strip:'شريط',pill:'حبة'};
  const unitSize = (p,u) => u === 'box' ? p.strips*p.pills : u === 'strip' ? p.pills : 1;
  const unitPrice = (p,u) => p.price*unitSize(p,u)/(p.strips*p.pills);
  const reserved = id => cart.filter(c=>c.id===id).reduce((n,c)=>n+c.qty*unitSize(product(c.id),c.unit),0);
  function persist(){ try { localStorage.setItem(storageKey,JSON.stringify(state)); } catch { notify('تعذّر الحفظ في المتصفح، يمكنك متابعة التجربة في هذه الصفحة.'); } }
  let noticeTimer;
  function notify(text){ $('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),3500); }
  function renderProducts(){
    const q=$('search').value.trim().toLowerCase();
    const items=state.products.filter(p=>(filter==='all'||p.category===filter)&&`${p.name} ${p.ar} ${p.barcode}`.toLowerCase().includes(q));
    $('product-grid').innerHTML=items.length?items.map(p=>`<article class="product"><div class="product-top"><span class="pill-icon" aria-hidden="true">${p.category==='care'?'✚':'▱'}</span><div><h3>${p.name}</h3><small>${p.ar}</small></div></div><div class="barcode">▥ ${p.barcode}</div><div class="stock"><span>المتاح</span><b class="${p.stock<=p.min?'low':''}">${p.stock} ${p.pills===1?'عبوة':'حبة'}</b></div><label><span class="visually-hidden">وحدة بيع ${p.name}</span><select data-unit="${p.id}" aria-label="وحدة بيع ${p.name}"><option value="box">علبة · ${p.detail}</option>${p.strips*p.pills>1?'<option value="strip">شريط</option><option value="pill">حبة</option>':''}</select></label><div class="product-bottom"><span class="price" id="price-${p.id}">${money(p.price)}<small>للوحدة المختارة</small></span><button class="add" data-add="${p.id}" ${p.stock<=0?'disabled':''}>+ إضافة</button></div></article>`).join(''):'<div class="empty">لا توجد أصناف مطابقة. جرّب اسمًا أو باركودًا آخر.</div>';
  }
  function discountRate(){const v=Number($('discount').value);return Number.isFinite(v)?Math.min(100,Math.max(0,v)):0;}
  function totals(){const subtotal=cart.reduce((n,c)=>n+unitPrice(product(c.id),c.unit)*c.qty,0),discount=subtotal*discountRate()/100;return{subtotal,discount,total:subtotal-discount};}
  function renderCart(){
    $('cart-caption').textContent=cart.length?`${cart.reduce((n,c)=>n+c.qty,0)} وحدة في الفاتورة`:'ابدأ بإضافة صنف من الكتالوج';
    $('cart-items').innerHTML=cart.length?cart.map((c,i)=>`<div class="cart-row"><div class="cart-row-top"><b>${product(c.id).name}</b><span>${money(unitPrice(product(c.id),c.unit)*c.qty)}</span></div><div class="cart-row-bottom"><small>${units[c.unit]} · ${money(unitPrice(product(c.id),c.unit))}</small><div class="quantity"><button data-qty="${i}" data-change="-1" aria-label="تقليل كمية ${product(c.id).name}">−</button><span>${c.qty}</span><button data-qty="${i}" data-change="1" aria-label="زيادة كمية ${product(c.id).name}">+</button></div></div></div>`).join(''):'<div class="empty"><div class="empty-symbol">▱</div><b>السلة جاهزة لأول صنف</b><p>ابحث عن الدواء ثم اضغط إضافة</p></div>';
    const t=totals();$('subtotal').textContent=money(t.subtotal);$('discount-total').textContent=money(t.discount);$('total').textContent=money(t.total);$('checkout').disabled=!cart.length;
  }
  function renderSummary(){ $('catalog-count').textContent=state.products.length;$('sales-total').textContent=state.sales.reduce((n,s)=>n+s.total,0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});$('sales-count').textContent=state.sales.length;$('low-count').textContent=state.products.filter(p=>p.stock<=p.min).length; }
  function renderInventory(){ $('inventory-body').innerHTML=state.products.map(p=>`<tr><td><b dir="ltr">${p.name}</b><small>${p.ar}</small></td><td dir="ltr">${p.barcode}</td><td>${p.stock}</td><td>${p.detail}</td><td>${money(p.price)}</td><td><span class="${p.stock<=p.min?'low-badge':'good'}">${p.stock<=p.min?'مخزون منخفض':'متاح'}</span></td></tr>`).join(''); }
  function renderSales(){ $('sales-list').innerHTML=state.sales.length?state.sales.slice().reverse().map(s=>`<article class="sale-card"><div><b>فاتورة ${esc(s.number)}</b><p>${new Date(s.date).toLocaleString('ar-EG')} · ${esc(s.payment)}</p><p>${s.items.map(c=>`${esc(c.name)} — ${c.qty} ${units[c.unit]}`).join(' · ')}</p></div><div><span class="sale-total">${money(s.total)}</span><br><small>${s.discount>0?`خصم ${money(s.discount)}`:'تم التسجيل'}</small></div></article>`).join(''):'<div class="empty"><div class="empty-symbol">▥</div><b>لا توجد فواتير بعد</b><p>سجّل فاتورة من قسم الكاشير لتظهر هنا.</p></div>'; }
  function showPage(page){activePage=page;document.querySelectorAll('.page').forEach(p=>p.classList.toggle('hidden',p.id!==`${page}-page`));document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));$('page-title').textContent={pos:'الكاشير والمبيعات',inventory:'المخزون والأصناف',sales:'سجل المبيعات'}[page];$('page-description').textContent={pos:'تجربة عملية لمسار بيع سريع، مع متابعة المخزون وتسجيل الفواتير.',inventory:'راقب المخزون بالحبة، ومكوّنات العبوة، وحالة النواقص.',sales:'راجع فواتير التجربة التي سجّلتها في هذا المتصفح.'}[page];if(page==='inventory')renderInventory();if(page==='sales')renderSales(); }
  function render(){renderProducts();renderCart();renderSummary();if(activePage==='inventory')renderInventory();if(activePage==='sales')renderSales();}
  $('search').addEventListener('input',renderProducts);
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderProducts();}));
  document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
  $('product-grid').addEventListener('change',event=>{const el=event.target;if(el.matches('[data-unit]'))$('price-'+el.dataset.unit).innerHTML=money(unitPrice(product(el.dataset.unit),el.value))+'<small>للوحدة المختارة</small>';});
  $('product-grid').addEventListener('click',event=>{const btn=event.target.closest('[data-add]');if(!btn)return;const p=product(btn.dataset.add),unit=document.querySelector(`[data-unit="${p.id}"]`).value;if(reserved(p.id)+unitSize(p,unit)>p.stock){notify('الكمية المتاحة لا تكفي لهذه الوحدة. اختر وحدة أصغر.');return;}const existing=cart.find(c=>c.id===p.id&&c.unit===unit);if(existing)existing.qty++;else cart.push({id:p.id,unit,qty:1});renderCart();});
  $('cart-items').addEventListener('click',event=>{const btn=event.target.closest('[data-qty]');if(!btn)return;const i=Number(btn.dataset.qty),c=cart[i],delta=Number(btn.dataset.change),p=product(c.id);if(delta>0&&reserved(p.id)+unitSize(p,c.unit)>p.stock){notify('وصلت إلى الكمية المتاحة من هذا الصنف.');return;}c.qty+=delta;if(c.qty===0)cart.splice(i,1);renderCart();});
  $('discount').addEventListener('input',renderCart);$('discount').addEventListener('change',()=>{$('discount').value=discountRate();renderCart();});
  $('clear-cart').addEventListener('click',()=>{cart=[];renderCart();});
  $('checkout').addEventListener('click',()=>{if(!cart.length)return;const t=totals(),items=cart.map(c=>({...c,name:product(c.id).name,price:unitPrice(product(c.id),c.unit)}));cart.forEach(c=>{product(c.id).stock-=c.qty*unitSize(product(c.id),c.unit);});const number='DEMO-'+String(state.sales.length+1).padStart(4,'0');state.sales.push({number,date:new Date().toISOString(),items,payment:$('payment').value,...t});cart=[];$('discount').value=0;persist();render();notify(`تم تسجيل ${number} بقيمة ${money(t.total)} وتحديث المخزون.`);});
  $('reset').addEventListener('click',()=>{if(!confirm('إعادة بيانات التجربة ومسح الفواتير المحلية؟'))return;state={products:structuredClone(initial),sales:[]};cart=[];$('discount').value=0;$('search').value='';filter='all';document.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('selected',b.dataset.filter==='all'));persist();render();notify('تمت استعادة بيانات التجربة.');});
  document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();showPage('pos');$('search').focus();}});
  render();
})();
