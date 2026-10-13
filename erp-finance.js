(function(){
// Finance helpers for the back office: statements, OCR capture of POS documents, sample documents.
const E=()=>window.ERP;
const r3=v=>Math.round((+v||0)*1000)/1000;
const NAME={},TYPE={}; const acctMaps=()=>{ if(!NAME['1100']) E().ACCTS.forEach(a=>{ NAME[a[0]]=a[1]; TYPE[a[0]]=a[2]; }); };
const name=c=>{ acctMaps(); return NAME[c]||c; };
const type=c=>{ acctMaps(); return TYPE[c]||''; };

// ---------- balances and statements ----------
// net debit (dr − cr) per account for entries dated from..to (inclusive)
const sums=(db,from,to)=>{ const s={}; db.ledger.forEach(e=>{ if(e.date<from||e.date>to) return; s[e.acct]=(s[e.acct]||0)+e.dr-e.cr; }); return s; };
const PL_SECTIONS=[
  ['Revenue',['4000','4010','4050'],-1],
  ['Cost of sales',['5000','5400'],1],
  ['Operating expenses',['6100','6200','6300','6400','6500','6600','6700','6800','6900','6950'],1]];
const pl=(db,from,to)=>{ const s=sums(db,from,to); const sec=PL_SECTIONS.map(([title,codes,sign])=>{ const rows=codes.map(c=>({code:c,name:name(c),v:r3(sign*(s[c]||0))})); return {title,rows,total:r3(rows.reduce((a,r)=>a+r.v,0))}; });
  const rev=sec[0].total, cos=sec[1].total, opex=sec[2].total, gp=r3(rev-cos), net=r3(gp-opex);
  return {sections:sec,rev,cos,gp,opex,net,gm:rev?gp/rev*100:0,nm:rev?net/rev*100:0}; };
const bs=(db,asOf)=>{ const s=sums(db,'2000-01-01',asOf); const g=c=>s[c]||0;
  const cur=['1100','1110','1120','1130','1300','1310','1400'].map(c=>({code:c,name:name(c),v:r3(g(c))}));
  const fixed=[{code:'1500',name:name('1500'),v:r3(g('1500'))},{code:'1590',name:name('1590'),v:r3(g('1590'))}];
  const liab=['2100','2200'].map(c=>({code:c,name:name(c),v:r3(-g(c))}));
  const earn=r3(-Object.keys(s).filter(c=>c>='4000').reduce((a,c)=>a+s[c],0));
  const eq=[{code:'3000',name:name('3000'),v:r3(-g('3000'))},{code:'',name:'Earnings since opening',v:earn}];
  const tot=a=>r3(a.reduce((x,r)=>x+r.v,0));
  const ta=r3(tot(cur)+tot(fixed)), tl=tot(liab), te=tot(eq);
  return {cur,fixed,liab,eq,tCur:tot(cur),tFixed:tot(fixed),ta,tl,te,tle:r3(tl+te),ok:Math.abs(ta-tl-te)<0.01}; };
const cashBal=(db,asOf)=>{ let v=0; db.ledger.forEach(e=>{ if(e.date<=asOf&&(e.acct==='1100'||e.acct==='1110')) v+=e.dr-e.cr; }); return r3(v); };

// ---------- OCR engine (Tesseract.js, loaded on first use) ----------
const OCR_SRC='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
let loadP=null, workerP=null, onProg=null;
const loadEngine=()=>loadP||(loadP=new Promise((res,rej)=>{ if(window.Tesseract) return res(window.Tesseract); const s=document.createElement('script'); s.src=OCR_SRC; s.async=true; s.onload=()=>window.Tesseract?res(window.Tesseract):rej(new Error('OCR engine did not initialise')); s.onerror=()=>{ loadP=null; rej(new Error('Could not download the OCR engine. Check the internet connection.')); }; document.head.appendChild(s); }));
const getWorker=()=>workerP||(workerP=loadEngine().then(async T=>{ const w=await T.createWorker('eng',1,{logger:m=>onProg&&onProg(m)}); await w.setParameters({tessedit_pageseg_mode:'6',preserve_interword_spaces:'1'}); return w; }).catch(e=>{ workerP=null; throw e; }));
const recognize=async(src,progress)=>{ onProg=progress; const t0=performance.now(); const w=await getWorker(); const {data}=await w.recognize(src); onProg=null;
  let lines=(data.lines||[]).map(l=>({text:(l.text||'').replace(/\s+$/,''),conf:Math.round(l.confidence||0),bbox:l.bbox}));
  if(!lines.length) lines=(data.text||'').split('\n').map(t=>({text:t,conf:Math.round(data.confidence||0),bbox:null}));
  return {text:data.text||'',conf:Math.round(data.confidence||0),lines:lines.filter(l=>l.text.trim()),ms:Math.round(performance.now()-t0)}; };

// ---------- image loading and enhancement ----------
const loadImg=src=>new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>rej(new Error('That file is not an image the browser can open. Use JPG, PNG or WebP.')); i.src=src; });
const readFile=f=>new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=()=>rej(new Error('Could not read the file')); r.readAsDataURL(f); });
// scales to a working width, then adaptive threshold (Bradley) to flatten shadows and uneven light
const prepare=async src=>{ const img=await loadImg(src); let w=img.naturalWidth, h=img.naturalHeight; const target=Math.max(900,Math.min(1600,w)); const k=target/w; w=Math.round(w*k); h=Math.round(h*k);
  const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(img,0,0,w,h); const orig=c.toDataURL('image/jpeg',0.9);
  const d=x.getImageData(0,0,w,h), p=d.data, g=new Float64Array(w*h);
  for(let i=0;i<w*h;i++) g[i]=0.299*p[i*4]+0.587*p[i*4+1]+0.114*p[i*4+2];
  const I=new Float64Array((w+1)*(h+1)); for(let y=1;y<=h;y++){ let row=0; for(let x2=1;x2<=w;x2++){ row+=g[(y-1)*w+x2-1]; I[y*(w+1)+x2]=I[(y-1)*(w+1)+x2]+row; } }
  const s=Math.max(8,Math.round(w/14)), t=0.16;
  for(let y=0;y<h;y++) for(let x2=0;x2<w;x2++){ const x0=Math.max(0,x2-s),x1=Math.min(w-1,x2+s),y0=Math.max(0,y-s),y1=Math.min(h-1,y+s); const n=(x1-x0+1)*(y1-y0+1);
    const sum=I[(y1+1)*(w+1)+x1+1]-I[y0*(w+1)+x1+1]-I[(y1+1)*(w+1)+x0]+I[y0*(w+1)+x0]; const v=g[y*w+x2]*n<=sum*(1-t)?0:255; const j=(y*w+x2)*4; p[j]=p[j+1]=p[j+2]=v; p[j+3]=255; }
  x.putImageData(d,0,0); return {orig,enh:c.toDataURL('image/png'),w,h}; };

// ---------- sample documents (rendered like thermal paper) ----------
const COLS=34;
const lr=(a,b)=>{ a=String(a); b=String(b); const n=Math.max(1,COLS-a.length-b.length); return a+' '.repeat(n)+b; };
const ctr=t=>{ t=String(t); const n=Math.max(0,Math.floor((COLS-t.length)/2)); return ' '.repeat(n)+t; };
const RULE='-'.repeat(COLS);
const paper=(rows,o)=>{ o=o||{}; const sc=2, fs=21*sc, lh=31*sc, padX=26*sc, top=34*sc; const font="500 "+fs+"px 'Courier New', Courier, monospace";
  const m=document.createElement('canvas').getContext('2d'); m.font=font; const cw=m.measureText('M').width; const pw=Math.ceil(cw*COLS+padX*2); const ph=top*2+rows.length*lh;
  const W=pw+120*sc, H=ph+110*sc; const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const bg=x.createLinearGradient(0,0,W,H); bg.addColorStop(0,'#C9CCD2'); bg.addColorStop(1,'#B5B9C1'); x.fillStyle=bg; x.fillRect(0,0,W,H);
  const ox=(W-pw)/2, oy=(H-ph)/2; x.save(); x.translate(W/2,H/2); x.rotate((o.tilt||0)*Math.PI/180); x.translate(-W/2,-H/2);
  x.shadowColor='rgba(14,17,22,.28)'; x.shadowBlur=26*sc; x.shadowOffsetY=8*sc;
  const z=9*sc; x.beginPath(); x.moveTo(ox,oy+z); for(let i=0,n=Math.ceil(pw/(z*2));i<n;i++){ x.lineTo(ox+i*z*2+z,oy); x.lineTo(Math.min(ox+pw,ox+i*z*2+z*2),oy+z); }
  x.lineTo(ox+pw,oy+ph-z); for(let i=Math.ceil(pw/(z*2));i>0;i--){ x.lineTo(ox+i*z*2-z,oy+ph); x.lineTo(Math.max(ox,ox+i*z*2-z*2),oy+ph-z); } x.closePath();
  x.fillStyle='#FCFBF7'; x.fill(); x.shadowColor='transparent';
  x.fillStyle='#1E2024'; x.font=font; x.textBaseline='top';
  rows.forEach((r,i)=>{ const y=oy+top+i*lh; if(typeof r==='object'&&r.b){ x.font="700 "+fs+"px 'Courier New', Courier, monospace"; x.fillText(r.t,ox+padX,y); x.font=font; } else x.fillText(r,ox+padX,y); });
  x.restore(); return c.toDataURL('image/png'); };
const dmy=iso=>{ const [y,m,d]=iso.split('-'); return d+'/'+m+'/'+y; };
const nf3=v=>(+v).toFixed(3);
const sampleZ=(z,counted)=>{ const exp=r3(z.float+z.cash), os=r3(counted-exp);
  return paper([ctr('NAJMA VALUE'),ctr('Main Store - Salmiya'),ctr('Salem Al-Mubarak St, Kuwait'),RULE,{t:ctr('Z-REPORT'),b:1},lr('Z No:',z.no),lr('Date:',dmy(z.date)),lr('Register:',z.register),lr('Cashier:',z.cashier),lr('Shift:','10:00 - 22:15'),RULE,
    lr('Receipts:',z.receipts),lr('Items sold:',z.units),lr('Gross sales:',nf3(z.gross)),lr('Discounts:',nf3(z.disc)),lr('Returns:',nf3(z.ret)),{t:lr('Net sales:',nf3(z.net)),b:1},RULE,
    'PAYMENTS',lr('Cash:',nf3(z.cash)),lr('K-Net:',nf3(z.knet)),lr('Card:',nf3(z.card)),lr('Total tendered:',nf3(z.net)),RULE,
    lr('Opening float:',nf3(z.float)),lr('Expected cash:',nf3(exp)),lr('Counted cash:',nf3(counted)),lr('Over/short:',(os<0?'-':'')+nf3(Math.abs(os))),RULE,ctr('*** END OF Z-REPORT ***')],{tilt:-0.4}); };
const sampleReceipt=(r,I)=>{ const rows=[ctr('NAJMA VALUE'),ctr('Main Store - Salmiya'),RULE,{t:'SALES RECEIPT',b:1},lr('Receipt:',r.no),lr('Date:',dmy(r.date)+' '+r.time),lr('Register:',r.register),lr('Cashier:',r.cashier),RULE];
  r.lines.forEach(l=>{ rows.push(I[l.sku].name.replace(' — ',' - ').slice(0,COLS)); rows.push(lr(l.sku+'  '+l.qty+' x '+nf3(l.price),nf3(l.qty*l.price))); });
  rows.push(RULE,lr('Items:',r.lines.reduce((a,l)=>a+l.qty,0)),{t:lr('TOTAL KWD',nf3(r.total)),b:1},lr('Paid by: '+r.pay.toUpperCase(),nf3(r.total)),RULE,ctr('Thank you for shopping!'));
  return paper(rows,{tilt:0.3}); };
const sampleBill=b=>paper([ctr(b.merchant.toUpperCase()),ctr(b.addr),ctr('Tel '+b.tel),RULE,{t:'INVOICE',b:1},lr('Bill No:',b.no),lr('Date:',dmy(b.date)),RULE,...b.lines.map(l=>lr(l[0],nf3(l[1]))),RULE,{t:lr('TOTAL KWD',nf3(b.lines.reduce((a,l)=>a+l[1],0))),b:1},'Payment: '+b.pay.toUpperCase(),RULE,ctr('Thank you')],{tilt:-0.25});

// ---------- parsing ----------
const digitish=t=>(t.match(/[0-9]/g)||[]).length>=Math.max(1,t.replace(/[^0-9A-Za-z|]/g,'').length*0.5);
const fixTok=t=>t.replace(/[Oo]/g,'0').replace(/[Il|]/g,'1').replace(/S/g,'5').replace(/B/g,'8');
const fixNums=s=>s.split(/(\s+)/).map(t=>/\S/.test(t)&&digitish(t)?fixTok(t):t).join('');
const money=s=>{ const m=fixNums(s).match(/(-?)\s*(\d{1,3}(?:[,\s]\d{3})*|\d+)\s?[.,]\s?(\d{3})\s*$/); if(!m) return null; return (m[1]?-1:1)*parseFloat(m[2].replace(/[,\s]/g,'')+'.'+m[3]); };
const integer=s=>{ const m=fixNums(s).match(/(\d+)\s*$/); return m?+m[1]:null; };
const dateIn=s=>{ let m=fixNums(s).match(/\b(\d{1,2})\s?[\/.\-]\s?(\d{1,2})\s?[\/.\-]\s?(\d{4})\b/); if(m) return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
  m=s.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/); if(m) return m[0];
  const MON=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']; m=s.match(/\b(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\b/); if(m&&MON.includes(m[2].toLowerCase())) return m[3]+'-'+String(MON.indexOf(m[2].toLowerCase())+1).padStart(2,'0')+'-'+m[1].padStart(2,'0'); return null; };
const after=s=>{ const i=s.indexOf(':'); return (i>=0?s.slice(i+1):s.replace(/^\S+\s+/,'')).trim(); };
const label=s=>s.split(':')[0].toLowerCase().replace(/[^a-z]/g,'');
const detect=text=>/z\s*[-–]?\s*report|end\s*of\s*day|x\s*\/\s*z/i.test(text)?'z':/RCT\s*[-–]?\s*\d|sales\s*receipt/i.test(text)?'receipt':'bill';
const ZF=[['zno','Z-report number'],['date','Business date'],['register','Register'],['cashier','Cashier'],['receipts','Receipts'],['units','Items sold'],['gross','Gross sales'],['disc','Discounts'],['ret','Returns'],['net','Net sales'],['cash','Cash'],['knet','K-Net'],['card','Card'],['float','Opening float'],['expected','Expected cash'],['counted','Counted cash'],['os','Over / short']];
const RF=[['rno','Receipt number'],['date','Date'],['time','Time'],['register','Register'],['cashier','Cashier'],['pay','Payment method'],['total','Total']];
const BF=[['merchant','Supplier'],['billNo','Bill number'],['date','Bill date'],['total','Total'],['pay','Payment'],['acct','Expense account']];
const FIELDS={z:ZF,receipt:RF,bill:BF};
const MONEY=['gross','disc','ret','net','cash','knet','card','float','expected','counted','os','total'];
const payOf=s=>/k\s*[-.]?\s*net/i.test(s)?'K-Net':/cash/i.test(s)?'Cash':/card|visa|master|amex|credit|debit/i.test(s)?'Card':/transfer|bank/i.test(s)?'Bank':null;
const CAT=[[/electric|water|\bmew\b|zain|ooredoo|\bstc\b|internet|telecom/i,'6300'],[/rent|real\s*estate|lease/i,'6100'],[/deliver|courier|armada|talabat|aramex|dhl/i,'6600'],[/meta|instagram|facebook|google|snap|tiktok|advert|\bads?\b|marketing/i,'6500'],[/salary|salaries|payroll|wps/i,'6200'],[/bank\s*charge|maintenance\s*fee/i,'6700'],[/office|stationery|clean|supplies|label|paper|refreshment|water/i,'6950']];
const lev=(a,b)=>{ const d=Array.from({length:a.length+1},(_,i)=>[i]); for(let j=1;j<=b.length;j++) d[0][j]=j; for(let i=1;i<=a.length;i++) for(let j=1;j<=b.length;j++) d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return d[a.length][b.length]; };
const skuNorm=s=>s.toUpperCase().replace(/[–—_]/g,'-').replace(/0/g,'O').replace(/1/g,'I').replace(/5/g,'S').replace(/8/g,'B');
const matchSku=(raw,items)=>{ const n=skuNorm(raw); let best=null,bd=9; items.forEach(i=>{ const d=lev(n,skuNorm(i.sku)); if(d<bd){ bd=d; best=i; } }); return bd<=2?best.sku:null; };

const parse=(ocr,force,items)=>{ const lines=ocr.lines; const text=lines.map(l=>l.text).join('\n'); const type=force||detect(text); const f={};
  const set=(k,v,li,raw)=>{ if(v==null||v===''||f[k]) return; f[k]={v,conf:li!=null?lines[li].conf:0,line:li,raw:raw!=null?raw:(li!=null?lines[li].text.trim():'')}; };
  lines.forEach((l,i)=>{ const s=l.text.trim(); const lab=label(s); const d=dateIn(s);
    if(type==='z'){
      const zm=fixNums(s).match(/\bZ\s*[-–—]?\s*(\d{3,4})\b/i); if(zm&&/z\s*n[o0]|z\s*#|z\s*number/i.test(s)) set('zno','Z-'+zm[1].padStart(4,'0'),i);
      if(d&&/date|day/i.test(s)) set('date',d,i);
      if(/register|terminal|till/.test(lab)) set('register',after(s),i);
      if(/cashier|operator|clerk/.test(lab)) set('cashier',after(s),i);
      if(/receipt|transaction|ticket/.test(lab)) set('receipts',integer(s),i);
      if(/itemssold|units|qty/.test(lab)) set('units',integer(s),i);
      const v=money(s); if(v==null) return;
      if(/expected/.test(lab)) set('expected',v,i); else if(/counted|declared|actual/.test(lab)) set('counted',v,i); else if(/over|short|variance|diff/.test(lab)) set('os',v,i); else if(/float|opening/.test(lab)) set('float',v,i);
      else if(/gross/.test(lab)) set('gross',v,i); else if(/disc/.test(lab)) set('disc',v,i); else if(/return|refund/.test(lab)) set('ret',v,i); else if(/knet|kne|k?net\b/.test(lab)&&/^k/.test(lab)) set('knet',v,i);
      else if(/^net|nettotal/.test(lab)) set('net',v,i); else if(/^cash/.test(lab)) set('cash',v,i); else if(/card|visa|master|credit/.test(lab)) set('card',v,i);
    } else if(type==='receipt'){
      const rm=fixNums(s).match(/RCT\s*[-–]?\s*(\d{4})\s*[-–]?\s*(\d{3})/i); if(rm) set('rno','RCT-'+rm[1]+'-'+rm[2],i);
      if(d) set('date',d,i); const tm=fixNums(s).match(/\b([01]?\d|2[0-3])\s?:\s?([0-5]\d)\b/); if(tm&&d) set('time',tm[1].padStart(2,'0')+':'+tm[2],i);
      if(/register|terminal|till/.test(lab)) set('register',after(s),i);
      if(/cashier|operator|clerk/.test(lab)) set('cashier',after(s),i);
      if(/paid|payment|tender/.test(lab)) set('pay',payOf(s),i);
      if(/total/.test(lab)&&!/sub/.test(lab)) set('total',money(s),i);
    } else {
      const letters=(s.match(/[A-Za-z]/g)||[]).length, words=s.split(/\s+/).filter(w=>/^[A-Za-z][A-Za-z&.'-]{2,}$/.test(w)).length;
      if(i<5&&!f.merchant&&l.conf>=55&&words>=1&&letters>=s.replace(/\s/g,'').length*0.7&&!/[^\x20-\x7E]/.test(s)&&!/invoice|bill|receipt|tel|date|kuwait\b.*\d/i.test(s)) set('merchant',s.replace(/\s+/g,' ').toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()),i);
      const bm=s.match(/(?:bill|invoice|inv|receipt)\s*(?:no|n0|#|number)?\.?\s*[:#]\s*([A-Z0-9][A-Z0-9\-\/]{2,})/i); if(bm) set('billNo',bm[1].toUpperCase(),i);
      if(d) set('date',d,i);
      if(/total/.test(lab)&&!/sub/.test(lab)) set('total',money(s),i);
      if(/payment|paidby|paid|tender/.test(lab)) set('pay',payOf(s),i);
    } });
  let itemsOut=[];
  if(type==='receipt'){ lines.forEach((l,i)=>{ const s=fixNums(l.text.trim()); const m=s.match(/^([A-Z0-9]{2}\s?[-–]\s?[A-Z0-9][A-Z0-9\-–\s]{2,}?)\s+(\d+)\s*[xX×*]\s*(\d+[.,]\d{3})\s+(\d+[.,]\d{3})\s*$/);
      if(m){ const raw=m[1].replace(/\s/g,''); itemsOut.push({raw,sku:matchSku(raw,items),qty:+m[2],price:parseFloat(m[3].replace(',','.')),amount:parseFloat(m[4].replace(',','.')),conf:l.conf,line:i}); } });
    if(!f.total&&itemsOut.length) set('total',r3(itemsOut.reduce((a,x)=>a+x.amount,0)),null,'Sum of item lines'); }
  if(type==='bill'){ if(!f.total){ let best=null; lines.forEach((l,i)=>{ const v=money(l.text); if(v!=null&&(!best||v>best.v)) best={v,i}; }); if(best) set('total',best.v,best.i); }
    const hit=CAT.find(c=>c[0].test(text)); set('acct',hit?hit[1]:'6950',null,hit?'Matched keywords in the bill':'Default account'); if(!f.pay) set('pay','Cash',null,'Default'); }
  if(type==='z'){ // fill gaps that the arithmetic of a Z-report fixes
    const g=k=>f[k]?+f[k].v:null; const inf=(k,v,why)=>{ if(!f[k]&&v!=null&&isFinite(v)) f[k]={v:r3(v),conf:0,line:null,raw:why,inferred:true}; };
    inf('disc',0,'Not printed, assumed 0'); inf('ret',0,'Not printed, assumed 0');
    if(g('gross')!=null) inf('net',g('gross')-g('disc')-g('ret'),'Calculated: gross − discounts − returns');
    if(g('net')!=null) inf('gross',g('net')+g('disc')+g('ret'),'Calculated: net + discounts + returns');
    const pay=['cash','knet','card'], miss=pay.filter(k=>!f[k]); if(miss.length===1&&g('net')!=null) inf(miss[0],g('net')-pay.filter(k=>f[k]).reduce((a,k)=>a+g(k),0),'Calculated: net − other tenders');
    if(g('expected')!=null&&g('cash')!=null) inf('float',g('expected')-g('cash'),'Calculated: expected − cash sales');
    inf('float',E().FLOAT,'Standard float');
    if(g('float')!=null&&g('cash')!=null) inf('expected',g('float')+g('cash'),'Calculated: float + cash sales');
    if(g('counted')!=null&&g('expected')!=null) inf('os',g('counted')-g('expected'),'Calculated: counted − expected');
    if(g('os')!=null&&g('expected')!=null) inf('counted',g('expected')+g('os'),'Calculated: expected + over/short'); }
  const fields=FIELDS[type].map(([k,lab])=>{ const x=f[k]; return {k,label:lab,money:MONEY.includes(k),v:x?(MONEY.includes(k)&&typeof x.v==='number'?x.v.toFixed(3):String(x.v)):'',conf:x?x.conf:0,line:x?x.line:null,raw:x?x.raw:'',inferred:!!(x&&x.inferred),found:!!x}; });
  return {type,fields,items:itemsOut,text}; };

const num=v=>{ const n=parseFloat(String(v==null?'':v).replace(/,/g,'')); return isFinite(n)?n:null; };
const zChecks=v=>{ const g=k=>num(v[k]); const ok=(a,b)=>a!=null&&b!=null&&Math.abs(a-b)<0.0015; const fm=x=>x==null?'—':x.toFixed(3);
  return [
    {label:'Net = gross − discounts − returns',ok:ok(g('net'),g('gross')-g('disc')-g('ret')),detail:fm(g('gross'))+' − '+fm(g('disc'))+' − '+fm(g('ret'))+' = '+fm(g('gross')-g('disc')-g('ret'))},
    {label:'Cash + K-Net + card = net sales',ok:ok(g('cash')+g('knet')+g('card'),g('net')),detail:fm(g('cash')+g('knet')+g('card'))+' vs '+fm(g('net'))},
    {label:'Expected cash = float + cash sales',ok:ok(g('expected'),g('float')+g('cash')),detail:fm(g('float'))+' + '+fm(g('cash'))+' = '+fm(g('float')+g('cash'))},
    {label:'Over / short = counted − expected',ok:ok(g('os'),g('counted')-g('expected')),detail:fm(g('counted'))+' − '+fm(g('expected'))+' = '+fm(g('counted')-g('expected'))}]; };

window.FIN={r3,name,type,sums,pl,bs,cashBal,recognize,loadEngine,prepare,readFile,sampleZ,sampleReceipt,sampleBill,parse,zChecks,num,matchSku,payOf,FIELDS,OCR_SRC,terminate:()=>{ if(workerP) workerP.then(w=>w.terminate()).catch(()=>{}); workerP=null; }};
})();
