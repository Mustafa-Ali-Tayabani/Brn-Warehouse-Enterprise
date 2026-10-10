(function(){
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TODAY='2026-10-07', START='2026-08-09', OPEN_DATE='2026-08-08';
const fd=iso=>{ if(!iso) return ''; const [y,m,d]=iso.split('-'); return d+' '+MON[+m-1]+' '+y; };
const fds=iso=>{ if(!iso) return ''; const [y,m,d]=iso.split('-'); return d+' '+MON[+m-1]; };
const nf=(v,dp)=>(Number(v)||0).toLocaleString('en-US',{minimumFractionDigits:dp,maximumFractionDigits:dp});
const k3=v=>'KWD '+nf(v,3);
const mny=(v,c)=>c+' '+nf(v,c==='KWD'?3:2);
const addDays=(iso,n)=>{ const d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); };
const dayDiff=(a,b)=>Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/864e5);
const weekday=iso=>new Date(iso+'T12:00:00Z').getUTCDay();
const pad=n=>String(n).padStart(4,'0');
const POOL={
  store:{key:'store',label:'Store',name:'Main Store',bg:'#E2F4F1',fg:'#0A6E65',dot:'#12A594'},
  online:{key:'online',label:'Online',name:'Online Warehouse',bg:'#EEE8FD',fg:'#5B2FD1',dot:'#7C4DFF'}
};
const INVACCT={store:'1300',online:'1310'};
const STAT={Draft:['#EEF0F3','#4A5160'],Sent:['#E6E8FB','#010ECF'],'Partially received':['#FDF1DC','#8A5A00'],Received:['#E3F3E8','#1B7A3A'],Closed:['#EEF0F3','#4A5160'],'In transit':['#FDF1DC','#8A5A00'],Unpaid:['#E6E8FB','#010ECF'],'Partially paid':['#FDF1DC','#8A5A00'],Paid:['#E3F3E8','#1B7A3A'],Overdue:['#FDE7E5','#B42318'],Posted:['#E3F3E8','#1B7A3A'],'In progress':['#E6E8FB','#010ECF'],Active:['#E3F3E8','#1B7A3A'],Inactive:['#EEF0F3','#4A5160'],Damaged:['#FDE7E5','#B42318'],'Opened pack':['#FDF1DC','#8A5A00'],Theft:['#F3E8FD','#7A2BB5'],'Count variance':['#EEF0F3','#4A5160'],Invited:['#E6E8FB','#010ECF'],Online:['#E3F3E8','#1B7A3A'],Idle:['#EEF0F3','#4A5160'],'Low battery':['#FDE7E5','#B42318'],'In stock':['#E3F3E8','#1B7A3A'],Low:['#FDF1DC','#8A5A00'],Out:['#FDE7E5','#B42318'],'On time':['#E3F3E8','#1B7A3A'],Late:['#FDF1DC','#8A5A00'],'Pending approval':['#FDF1DC','#8A5A00'],Approved:['#E3F3E8','#1B7A3A'],Picking:['#E6E8FB','#010ECF'],Packed:['#E3F3E8','#1B7A3A']};
const chip=s=>{ const c=STAT[s]||STAT.Draft; return {text:s,bg:c[0],fg:c[1]}; };
const OPEN=['Draft','Pending approval','Approved','Sent','Partially received'];
const APPROVAL_LIMIT=250;
const VENDOR_BY_CAT={Fashion:'V-01',Home:'V-03',Beauty:'V-01',Gadgets:'V-02'};
const pl=(n,one,many)=>n+' '+(n===1?one:(many||one+'s'));
const CATS=['Fashion','Home','Beauty','Gadgets'];
const REASONS=['Damaged','Opened pack','Theft'];
const ACCTS=[['1100','Cash on hand','Asset'],['1110','Bank — current account','Asset'],['1300','Inventory — Main Store','Asset'],['1310','Inventory — Online Warehouse','Asset'],['2100','Accounts payable','Liability'],['3000','Owner’s equity','Equity'],['4000','Sales — Main Store','Revenue'],['4010','Sales — Online','Revenue'],['5000','Cost of goods sold','Expense'],['5400','Shrinkage and write-offs','Expense']];

const EL=['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const PAR=['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];
const inv=b=>b.replace(/./g,x=>x==='1'?'0':'1');
const eanCheck=s=>{ let t=0; for(let i=0;i<12;i++) t+=(+s[i])*(i%2?3:1); return s+((10-t%10)%10); };
const eanValid=c=>/^\d{13}$/.test(c)&&eanCheck(c.slice(0,12))===c;
const EAN_CACHE={};
const eanBuild=c=>{
  let b='101'; const p=PAR[+c[0]];
  for(let i=1;i<=6;i++){ const L=EL[+c[i]]; b+= p[i-1]==='L'?L:inv(L).split('').reverse().join(''); }
  b+='01010'; for(let i=7;i<=12;i++) b+=inv(EL[+c[i]]); b+='101';
  let r='';
  for(let i=0;i<b.length;i++){ if(b[i]!=='1') continue; let w=1; while(b[i+w]==='1') w++; const g=(i<3||(i>=45&&i<50)||i>=92); r+='<rect x="'+(i+6)+'" y="0" width="'+w+'" height="'+(g?50:44)+'"/>'; i+=w-1; }
  return '"data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 107 50" preserveAspectRatio="none"><g fill="#0E1116">'+r+'</g></svg>')+'"';
};
const eanSvg=c=>EAN_CACHE[c]||(EAN_CACHE[c]=eanBuild(c));
const symbology=code=>eanValid(code)?'EAN-13':/^(PO|GRN|TRF|CNT|WO|INV|SO)-\d{4}-\d{4}$/.test(code)?'Code 128 (document)':/^\d{12}$/.test(code)?'UPC-A':'Code 128';

const ITEMS=[
['FA-TEE-BLK-S','Ribbed Crop Tee','S','Black','تيشيرت قصير مضلّع من القطن المرن، لون أسود، مقاس صغير','Fashion',0.850,2.500,18,40],
['FA-TEE-BLK-M','Ribbed Crop Tee','M','Black','تيشيرت قصير مضلّع من القطن المرن، لون أسود، مقاس متوسط','Fashion',0.850,2.500,22,35],
['FA-TEE-BLK-L','Ribbed Crop Tee','L','Black','تيشيرت قصير مضلّع من القطن المرن، لون أسود، مقاس كبير','Fashion',0.850,2.500,0,28],
['FA-TEE-WHT-M','Ribbed Crop Tee','M','White','تيشيرت قصير مضلّع من القطن المرن، لون أبيض، مقاس متوسط','Fashion',0.850,2.500,14,30],
['FA-TRS-BEI-M','Wide-Leg Linen Trousers','M','Beige','بنطال واسع الساق من الكتان الخفيف، لون بيج، مقاس متوسط','Fashion',2.100,5.900,9,16],
['FA-TRS-BEI-L','Wide-Leg Linen Trousers','L','Beige','بنطال واسع الساق من الكتان الخفيف، لون بيج، مقاس كبير','Fashion',2.100,5.900,6,0],
['FA-HOD-GRY-M','Oversized Hoodie','M','Grey','هودي واسع بقماش ناعم من الداخل، لون رمادي، مقاس متوسط','Fashion',3.200,7.500,11,24],
['FA-HOD-GRY-L','Oversized Hoodie','L','Grey','هودي واسع بقماش ناعم من الداخل، لون رمادي، مقاس كبير','Fashion',3.200,7.500,8,19],
['FA-HOD-GRY-XL','Oversized Hoodie','XL','Grey','هودي واسع بقماش ناعم من الداخل، لون رمادي، مقاس كبير جداً','Fashion',3.200,7.500,4,12],
['FA-TOT-CRM','Canvas Tote Bag','One size','Cream','حقيبة كتف من قماش الكانفاس المتين، لون كريمي','Fashion',0.600,1.750,30,55],
['HO-MUG-SET4','Ceramic Mug Set, 4 pcs',null,null,'طقم أكواب من السيراميك من أربع قطع، مناسب للمشروبات الساخنة','Home',1.400,3.900,12,20],
['HO-LGT-5M','LED Fairy Lights, 5 m',null,null,'سلسلة إضاءة LED بطول خمسة أمتار تعمل بالبطارية','Home',0.700,1.990,25,0],
['HO-TWL-BLU','Microfiber Bath Towel',null,'Blue','منشفة حمام من الألياف الدقيقة سريعة الجفاف، لون أزرق','Home',0.950,2.750,15,26],
['HO-TWL-SND','Microfiber Bath Towel',null,'Sand','منشفة حمام من الألياف الدقيقة سريعة الجفاف، لون رملي','Home',0.950,2.750,0,18],
['HO-CND-VAN','Scented Candle',null,'Vanilla','شمعة معطّرة برائحة الفانيليا، مدة اشتعال حتى 25 ساعة','Home',0.500,1.500,20,34],
['BE-LIP-ROS','Lip Tint',null,'Rose','صبغة شفاه خفيفة تدوم طويلاً، درجة وردية','Beauty',0.300,1.250,40,60],
['BE-LIP-CRL','Lip Tint',null,'Coral','صبغة شفاه خفيفة تدوم طويلاً، درجة مرجانية','Beauty',0.300,1.250,3,45],
['BE-MSK-5PK','Sheet Mask, 5-pack',null,null,'عبوة من خمسة أقنعة ورقية مرطّبة للوجه','Beauty',0.450,1.500,28,50],
['BE-ROL-JAD','Jade Face Roller',null,null,'أداة تدليك للوجه مصنوعة من حجر اليشم','Beauty',0.800,2.900,7,14],
['BE-CLP-SET6','Hair Claw Clips, set of 6',null,null,'طقم من ستة مشابك للشعر بألوان متنوعة','Beauty',0.250,0.990,35,70],
['GA-EAR-WHT','Wireless Earbuds',null,'White','سماعات أذن لاسلكية مع علبة شحن، لون أبيض','Gadgets',2.800,6.900,10,22],
['GA-CBL-C1M','USB-C Cable, 1 m',null,null,'كابل شحن USB-C بطول متر واحد يدعم الشحن السريع','Gadgets',0.200,0.750,60,80],
['GA-FAN-MIN','Mini Desk Fan',null,null,'مروحة مكتب صغيرة قابلة لإعادة الشحن عبر USB','Gadgets',1.100,2.990,5,15],
['GA-PWR-10K','Power Bank 10,000 mAh',null,null,'بطارية متنقلة بسعة 10000 مللي أمبير بمنفذين','Gadgets',3.500,8.500,6,18]
];
// units per day [store, online, storeLastDay, onlineLastDay] (day index from START)
const VEL={'FA-TEE-BLK-S':[1.2,1.6],'FA-TEE-BLK-M':[1.5,1.8],'FA-TEE-BLK-L':[1.0,1.2,47],'FA-TEE-WHT-M':[1.0,1.1],'FA-TRS-BEI-M':[0.4,0.5],'FA-TRS-BEI-L':[0.12,0.3,null,40],'FA-HOD-GRY-M':[0.5,0.7],'FA-HOD-GRY-L':[0.4,0.5],'FA-HOD-GRY-XL':[0.06,0.08,20,24],'FA-TOT-CRM':[0.9,1.2],'HO-MUG-SET4':[0.08,0.9,22],'HO-LGT-5M':[0.7,0.6,null,45],'HO-TWL-BLU':[0.5,0.9],'HO-TWL-SND':[0.4,0.6,50],'HO-CND-VAN':[1.6,1.5],'BE-LIP-ROS':[2.0,4.6],'BE-LIP-CRL':[1.0,1.4],'BE-MSK-5PK':[1.2,1.6],'BE-ROL-JAD':[0.06,0.06,12,17],'BE-CLP-SET6':[1.6,1.8],'GA-EAR-WHT':[0.6,0.7],'GA-CBL-C1M':[3.0,2.4],'GA-FAN-MIN':[0.4,0.5],'GA-PWR-10K':[0.15,0.3]};

const rate=(db,c)=>c==='KWD'?1:db.rates[db.rates.length-1][c];
const rateOn=(db,c,date)=>{ if(c==='KWD') return 1; let r=db.rates[0]; for(const x of db.rates){ if(x.date<=date) r=x; else break; } return r[c]; };
const poCalc=(po,db)=>{
  const r=po.rate!=null?po.rate:rate(db,po.ccy);
  const ls=po.lines.map(l=>({...l,qty:+l.qty||0,unit:+l.unit||0}));
  const goods=ls.reduce((a,l)=>a+l.qty*l.unit,0);
  const extra=(+po.freight||0)+(+po.duty||0);
  const f=goods?extra/goods:0;
  return {r,goods,extra,f,totalV:goods+extra,totalK:(goods+extra)*r,lines:ls.map(l=>({...l,value:l.qty*l.unit,landedV:l.unit*(1+f),landedK:l.unit*(1+f)*r}))};
};
const invStatus=v=>v.paid>=v.amount-0.0005?'Paid':v.paid>0?'Partially paid':v.due<TODAY?'Overdue':'Unpaid';
const invRate=(db,v)=>v.rate!=null?v.rate:rate(db,v.ccy);
const post=(db,date,ref,memo,lines)=>{ lines.forEach(([acct,dr,cr])=>db.ledger.push({id:db.ledger.length+1,date,ref,memo,acct,dr:Math.round(dr*1000)/1000,cr:Math.round(cr*1000)/1000})); };
const audit=(db,date,time,user,action,ref,detail)=>db.audit.push({id:db.audit.length+1,date,time,user,action,ref,detail});

const USERS=[
  ['Noura Al-Saleh','noura@najmavalue.kw','Owner · Admin','All locations','Now','Active'],
  ['Yousef Hamdan','yousef@najmavalue.kw','Store manager','Main Store','12 min ago','Active'],
  ['Maryam Qasim','maryam@najmavalue.kw','Inventory controller','All locations','38 min ago','Active'],
  ['Ahmad Rahman','ahmad@najmavalue.kw','Cashier','Main Store','1 h ago','Active'],
  ['Sara Haddad','sara@najmavalue.kw','Cashier','Main Store','Yesterday','Active'],
  ['Omar Nasser','omar@najmavalue.kw','Cashier','Main Store','Yesterday','Active'],
  ['Layla Karim','layla@najmavalue.kw','Accountant','All locations','2 h ago','Active'],
  ['Bader Al-Enezi','bader@najmavalue.kw','HR officer','All locations','3 days ago','Active'],
  ['Rania Faris','rania@najmavalue.kw','Online operations lead','Online Warehouse','25 min ago','Active'],
  ['Hussain Jaber','hussain@najmavalue.kw','Warehouse picker','Online Warehouse','—','Invited']
];
const DEVICES=[
  {id:'DEV-01',name:'Receiving dock scanner',model:'Zebra DS2208 · USB',kind:'Scanner',loc:'online',user:'Rania Faris',last:'2 min ago',batt:null,status:'Online'},
  {id:'DEV-02',name:'Store counter scanner',model:'Zebra DS2208 · USB',kind:'Scanner',loc:'store',user:'Ahmad Rahman',last:'Now',batt:null,status:'Online'},
  {id:'DEV-03',name:'Stockroom cordless',model:'Zebra DS8178 · Bluetooth',kind:'Scanner',loc:'store',user:'Yousef Hamdan',last:'14 min ago',batt:72,status:'Online'},
  {id:'DEV-04',name:'Warehouse handheld 1',model:'Zebra TC22 mobile computer',kind:'Handheld',loc:'online',user:'Hussain Jaber',last:'1 h ago',batt:38,status:'Idle'},
  {id:'DEV-05',name:'Warehouse handheld 2',model:'Zebra TC22 mobile computer',kind:'Handheld',loc:'online',user:'Rania Faris',last:'Yesterday',batt:9,status:'Low battery'},
  {id:'DEV-06',name:'Shelf label printer',model:'Zebra ZD421 · USB',kind:'Label printer',loc:'store',user:'—',last:'3 h ago',batt:null,status:'Online'}
];

function seed(){
  const R=(s=>()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; })(20261007);
  const items=ITEMS.map((r,i)=>{ const v=[r[3],r[2]].filter(Boolean); return {sku:r[0],product:r[1],size:r[2],colour:r[3],ar:r[4],cat:r[5],cost:r[6],price:r[7],active:true,vendor:VENDOR_BY_CAT[r[5]],barcode:eanCheck('6271234'+String(i+1).padStart(5,'0')),name:r[1]+(v.length?' — '+v.join(' / '):'')}; });
  const IT={}; items.forEach(i=>IT[i.sku]=i);
  const stock={}; ITEMS.forEach(r=>{ stock[r[0]]={store:r[8],online:r[9],res:r[9]>=30?2:0}; });
  const vendors=[
    {id:'V-01',name:'Shenzhen Brightway Trading Co.',country:'China',ccy:'CNY',terms:'Net 30',phone:'+86 755 2981 4410',contact:'Lin Wei'},
    {id:'V-02',name:'Pacific Crest Goods Inc.',country:'United States',ccy:'USD',terms:'Net 30',phone:'+1 310 555 0142',contact:'Dana Brooks'},
    {id:'V-03',name:'Gulf Horizon General Trading LLC',country:'United Arab Emirates',ccy:'AED',terms:'Net 30',phone:'+971 4 555 0187',contact:'Imran Sheikh'},
    {id:'V-04',name:'Al Dana Wholesale Co.',country:'Kuwait',ccy:'KWD',terms:'Net 10',phone:'+965 2224 5180',contact:'Khaled Saad'}
  ];
  // 60 days of sample rates, ending 06 Oct
  const U=[0.30652,0.30668,0.30661,0.30679,0.30690,0.30684,0.30702], C=[0.04281,0.04285,0.04279,0.04288,0.04292,0.04290,0.04296], A=[0.08346,0.08350,0.08348,0.08353,0.08356,0.08354,0.08359];
  const rates=U.map((u,i)=>({date:addDays('2026-09-30',i),USD:u,CNY:C[i],AED:A[i]}));
  while(rates[0].date>OPEN_DATE){ const f=rates[0]; const d=()=>1+(R()-.5)*0.0024; rates.unshift({date:addDays(f.date,-1),USD:+(f.USD*d()).toFixed(5),CNY:+(f.CNY*d()).toFixed(5),AED:+(f.AED*d()).toFixed(5)}); }
  const db={items,stock,moves:[],vendors,rates,pos:[],grns:[],transfers:[],counts:[],writeoffs:[],invoices:[],ledger:[],sales:[],online:[],audit:[],seq:{PO:144,GRN:92,TRF:35,CNT:14,WO:47,INV:208,BT:55120}};

  const P=(no,vendor,ccy,date,eta,dest,status,freight,duty,lines,log,by)=>({no,vendor,ccy,date,eta,dest,status,freight,duty,rate:null,rateDate:null,lines,log,by});
  db.pos=[
    P('PO-2026-0143','V-02','USD','2026-10-06','2026-10-22','store','Pending approval',85,40,[{sku:'GA-PWR-10K',qty:60,unit:8.90,rec:0},{sku:'GA-EAR-WHT',qty:50,unit:7.10,rec:0}],[['Draft','2026-10-06'],['Pending approval','2026-10-06']],'Maryam Qasim'),
    P('PO-2026-0141','V-01','CNY','2026-10-05','2026-10-26','online','Draft',450,120,[{sku:'HO-LGT-5M',qty:200,unit:9.80,rec:0},{sku:'FA-TOT-CRM',qty:150,unit:7.20,rec:0}],[['Draft','2026-10-05']],'Rania Faris'),
    P('PO-2026-0138','V-02','USD','2026-10-02','2026-10-16','store','Sent',85,40,[{sku:'GA-EAR-WHT',qty:40,unit:7.10,rec:0},{sku:'GA-PWR-10K',qty:30,unit:8.90,rec:0}],[['Draft','2026-10-01'],['Sent','2026-10-02']],'Maryam Qasim'),
    P('PO-2026-0135','V-01','CNY','2026-09-21','2026-10-02','online','Partially received',380,150,[{sku:'BE-LIP-ROS',qty:300,unit:4.20,rec:300},{sku:'BE-LIP-CRL',qty:300,unit:4.20,rec:0},{sku:'BE-MSK-5PK',qty:200,unit:6.50,rec:120}],[['Draft','2026-09-20'],['Sent','2026-09-21'],['Partially received','2026-10-02']],'Maryam Qasim'),
    P('PO-2026-0129','V-03','AED','2026-09-14','2026-09-28','online','Received',220,90,[{sku:'HO-MUG-SET4',qty:60,unit:14.50,rec:60},{sku:'HO-TWL-BLU',qty:80,unit:9.75,rec:80}],[['Draft','2026-09-13'],['Sent','2026-09-14'],['Received','2026-09-28']],'Rania Faris'),
    P('PO-2026-0122','V-04','KWD','2026-09-08','2026-09-15','store','Closed',6,0,[{sku:'GA-CBL-C1M',qty:200,unit:0.180,rec:200},{sku:'BE-CLP-SET6',qty:150,unit:0.230,rec:150}],[['Draft','2026-09-07'],['Sent','2026-09-08'],['Received','2026-09-15'],['Closed','2026-09-17']],'Yousef Hamdan'),
    P('PO-2026-0118','V-03','AED','2026-08-24','2026-09-10','online','Closed',300,140,[{sku:'FA-HOD-GRY-M',qty:30,unit:26,rec:30},{sku:'FA-HOD-GRY-L',qty:30,unit:26,rec:30},{sku:'FA-HOD-GRY-XL',qty:20,unit:26,rec:20}],[['Draft','2026-08-23'],['Sent','2026-08-24'],['Received','2026-09-14'],['Closed','2026-09-16']],'Rania Faris'),
    P('PO-2026-0116','V-04','KWD','2026-08-20','2026-08-24','store','Closed',4,0,[{sku:'BE-CLP-SET6',qty:100,unit:0.24,rec:100},{sku:'HO-CND-VAN',qty:60,unit:0.46,rec:60}],[['Draft','2026-08-20'],['Sent','2026-08-20'],['Received','2026-08-24'],['Closed','2026-08-25']],'Yousef Hamdan'),
    P('PO-2026-0112','V-01','CNY','2026-08-12','2026-08-30','online','Closed',420,160,[{sku:'FA-TEE-BLK-S',qty:120,unit:8.20,rec:120},{sku:'FA-TEE-BLK-M',qty:120,unit:8.20,rec:120},{sku:'FA-TEE-WHT-M',qty:80,unit:8.20,rec:60}],[['Draft','2026-08-11'],['Sent','2026-08-12'],['Partially received','2026-08-29'],['Closed','2026-09-05']],'Maryam Qasim'),
    P('PO-2026-0109','V-02','USD','2026-08-10','2026-08-28','store','Closed',90,45,[{sku:'GA-EAR-WHT',qty:50,unit:7.20,rec:50},{sku:'GA-FAN-MIN',qty:40,unit:6.10,rec:40}],[['Draft','2026-08-09'],['Sent','2026-08-10'],['Received','2026-08-28'],['Closed','2026-08-30']],'Maryam Qasim'),
    P('PO-2026-0104','V-03','AED','2026-08-03','2026-08-17','online','Closed',260,110,[{sku:'HO-CND-VAN',qty:120,unit:4.10,rec:120},{sku:'HO-TWL-BLU',qty:60,unit:9.50,rec:60}],[['Draft','2026-08-02'],['Sent','2026-08-03'],['Received','2026-08-19'],['Closed','2026-08-21']],'Rania Faris'),
    P('PO-2026-0098','V-01','CNY','2026-07-20','2026-08-08','online','Closed',380,150,[{sku:'BE-ROL-JAD',qty:60,unit:12,rec:60},{sku:'FA-TRS-BEI-M',qty:40,unit:30,rec:40},{sku:'FA-TRS-BEI-L',qty:40,unit:30,rec:40}],[['Draft','2026-07-19'],['Sent','2026-07-20'],['Received','2026-08-09'],['Closed','2026-08-11']],'Maryam Qasim')
  ];
  const G=(no,po,loc,date,lines,by,time)=>({no,po,loc,date,lines,by,time});
  db.grns=[
    G('GRN-2026-0091','PO-2026-0135','online','2026-10-02',[{sku:'BE-LIP-ROS',qty:300},{sku:'BE-MSK-5PK',qty:120}],'Rania Faris','11:20'),
    G('GRN-2026-0087','PO-2026-0129','online','2026-09-28',[{sku:'HO-MUG-SET4',qty:60},{sku:'HO-TWL-BLU',qty:80}],'Rania Faris','10:05'),
    G('GRN-2026-0082','PO-2026-0122','store','2026-09-15',[{sku:'GA-CBL-C1M',qty:200},{sku:'BE-CLP-SET6',qty:150}],'Yousef Hamdan','09:40'),
    G('GRN-2026-0076','PO-2026-0118','online','2026-09-14',[{sku:'FA-HOD-GRY-M',qty:30},{sku:'FA-HOD-GRY-L',qty:30},{sku:'FA-HOD-GRY-XL',qty:20}],'Hussain Jaber','14:10'),
    G('GRN-2026-0075','PO-2026-0112','online','2026-08-29',[{sku:'FA-TEE-BLK-S',qty:120},{sku:'FA-TEE-BLK-M',qty:120},{sku:'FA-TEE-WHT-M',qty:60}],'Rania Faris','12:30'),
    G('GRN-2026-0074','PO-2026-0109','store','2026-08-28',[{sku:'GA-EAR-WHT',qty:50},{sku:'GA-FAN-MIN',qty:40}],'Yousef Hamdan','10:15'),
    G('GRN-2026-0073','PO-2026-0116','store','2026-08-24',[{sku:'BE-CLP-SET6',qty:100},{sku:'HO-CND-VAN',qty:60}],'Yousef Hamdan','09:55'),
    G('GRN-2026-0072','PO-2026-0104','online','2026-08-19',[{sku:'HO-CND-VAN',qty:120},{sku:'HO-TWL-BLU',qty:60}],'Rania Faris','13:05'),
    G('GRN-2026-0071','PO-2026-0098','online','2026-08-09',[{sku:'BE-ROL-JAD',qty:60},{sku:'FA-TRS-BEI-M',qty:40},{sku:'FA-TRS-BEI-L',qty:40}],'Hussain Jaber','15:40')
  ];
  // lock rates for fully received POs at their last receipt date
  db.pos.forEach(p=>{ if(!OPEN.includes(p.status)){ const g=db.grns.filter(x=>x.po===p.no).map(x=>x.date).sort().pop(); p.rateDate=g; p.rate=rateOn(db,p.ccy,g); } });
  db.grns.forEach(g=>{ const p=db.pos.find(x=>x.no===g.po); const c=poCalc({...p,rate:rateOn(db,p.ccy,g.date)},db); g.valK=g.lines.reduce((a,l)=>a+l.qty*c.lines.find(x=>x.sku===l.sku).landedK,0); g.valV=g.lines.reduce((a,l)=>a+l.qty*c.lines.find(x=>x.sku===l.sku).landedV,0); g.rate=c.r; });

  db.transfers=[
    {no:'TRF-2026-0034',from:'online',to:'store',date:'2026-10-06',status:'Draft',lines:[{sku:'BE-LIP-CRL',qty:12,scanned:0}],by:'Maryam Qasim'},
    {no:'TRF-2026-0033',from:'store',to:'online',date:'2026-10-04',status:'In transit',lines:[{sku:'FA-TOT-CRM',qty:10,scanned:0}],by:'Yousef Hamdan'},
    {no:'TRF-2026-0031',from:'online',to:'store',date:'2026-09-28',received:'2026-09-29',status:'Received',lines:[{sku:'FA-HOD-GRY-M',qty:6,scanned:6}],by:'Maryam Qasim'},
    {no:'TRF-2026-0029',from:'store',to:'online',date:'2026-09-10',received:'2026-09-10',status:'Received',lines:[{sku:'BE-CLP-SET6',qty:15,scanned:15}],by:'Maryam Qasim'},
    {no:'TRF-2026-0027',from:'online',to:'store',date:'2026-08-20',received:'2026-08-21',status:'Received',lines:[{sku:'HO-CND-VAN',qty:20,scanned:20},{sku:'HO-TWL-BLU',qty:10,scanned:10}],by:'Maryam Qasim'}
  ];
  db.counts=[
    {no:'CNT-2026-0013',loc:'online',date:'2026-10-03',status:'Posted',by:'Maryam Qasim',lines:[{sku:'BE-MSK-5PK',sys:52,counted:50,cost:0.45},{sku:'GA-CBL-C1M',sys:80,counted:80,cost:0.2},{sku:'HO-CND-VAN',sys:35,counted:34,cost:0.5}]},
    {no:'CNT-2026-0012',loc:'store',date:'2026-09-30',status:'Posted',by:'Maryam Qasim',lines:[{sku:'BE-LIP-ROS',sys:42,counted:40,cost:0.3},{sku:'GA-CBL-C1M',sys:60,counted:60,cost:0.2}]},
    {no:'CNT-2026-0011',loc:'online',date:'2026-08-31',status:'Posted',by:'Rania Faris',lines:[{sku:'BE-LIP-ROS',sys:120,counted:118,cost:0.3},{sku:'FA-TOT-CRM',sys:60,counted:60,cost:0.6}]},
    {no:'CNT-2026-0010',loc:'store',date:'2026-08-31',status:'Posted',by:'Maryam Qasim',lines:[{sku:'GA-CBL-C1M',sys:95,counted:93,cost:0.2},{sku:'HO-CND-VAN',sys:40,counted:40,cost:0.5},{sku:'BE-LIP-ROS',sys:55,counted:54,cost:0.3}]}
  ];
  db.writeoffs=[
    ['WO-2026-0046','2026-10-06','store','FA-TEE-WHT-M',1,'Damaged','Stain on front, found in fitting room','Yousef Hamdan'],
    ['WO-2026-0045','2026-10-05','store','BE-LIP-ROS',2,'Opened pack','Testers opened by customers','Yousef Hamdan'],
    ['WO-2026-0044','2026-10-03','online','HO-MUG-SET4',1,'Damaged','One mug cracked in carton','Rania Faris'],
    ['WO-2026-0043','2026-10-01','store','GA-EAR-WHT',1,'Theft','Missing from display, CCTV reviewed','Yousef Hamdan'],
    ['WO-2026-0042','2026-09-27','online','BE-MSK-5PK',3,'Opened pack','Outer seal broken on receipt','Rania Faris'],
    ['WO-2026-0041','2026-09-22','store','HO-CND-VAN',2,'Damaged','Dropped during restock','Yousef Hamdan'],
    ['WO-2026-0040','2026-09-15','store','GA-EAR-WHT',1,'Theft','Display unit missing at close','Yousef Hamdan'],
    ['WO-2026-0039','2026-09-09','online','HO-LGT-5M',3,'Damaged','Crushed in returned parcel','Hussain Jaber'],
    ['WO-2026-0038','2026-09-02','store','BE-MSK-5PK',2,'Opened pack','Opened on shelf','Sara Haddad'],
    ['WO-2026-0037','2026-08-26','store','GA-CBL-C1M',2,'Theft','Cut packaging found in aisle','Yousef Hamdan'],
    ['WO-2026-0036','2026-08-18','online','BE-LIP-CRL',4,'Opened pack','Seals broken in inbound carton','Rania Faris'],
    ['WO-2026-0035','2026-08-12','store','FA-TEE-BLK-M',1,'Damaged','Torn seam','Sara Haddad']
  ].map(w=>({no:w[0],date:w[1],loc:w[2],sku:w[3],qty:w[4],reason:w[5],note:w[6],by:w[7],value:w[4]*IT[w[3]].cost}));

  // events (excluding sales) as moves
  const ev=[];
  db.grns.forEach(g=>{ const p=db.pos.find(x=>x.no===g.po); const c=poCalc({...p,rate:g.rate},db); g.lines.forEach(l=>ev.push({date:g.date,sku:l.sku,loc:g.loc,qty:l.qty,type:'Goods receipt',ref:g.no,note:'Landed '+nf(c.lines.find(x=>x.sku===l.sku).landedK,3)+' KWD/unit'})); });
  db.transfers.forEach(t=>{ if(t.status==='Draft') return; t.lines.forEach(l=>{ ev.push({date:t.date,sku:l.sku,loc:t.from,qty:-l.qty,type:'Transfer out',ref:t.no}); if(t.status==='Received') ev.push({date:t.received,sku:l.sku,loc:t.to,qty:l.qty,type:'Transfer in',ref:t.no}); }); });
  db.counts.forEach(c=>c.lines.forEach(l=>{ if(l.counted!==l.sys) ev.push({date:c.date,sku:l.sku,loc:c.loc,qty:l.counted-l.sys,type:'Count adjustment',ref:c.no}); }));
  db.writeoffs.forEach(w=>ev.push({date:w.date,sku:w.sku,loc:w.loc,qty:-w.qty,type:'Write-off · '+w.reason,ref:w.no,note:w.note}));

  // sales
  const days=dayDiff(START,TODAY)+1;
  const sold={}; ITEMS.forEach(r=>sold[r[0]]={store:new Array(days).fill(0),online:new Array(days).fill(0)});
  const draw=x=>Math.floor(x)+(R()<x-Math.floor(x)?1:0);
  for(let d=0;d<days;d++){ const date=addDays(START,d); const wd=weekday(date); const m=(wd===4||wd===5)?1.45:wd===6?1.15:0.9; const part=date===TODAY?0.35:1;
    ITEMS.forEach(r=>{ const v=VEL[r[0]]; if(v[2]==null||d<=v[2]) sold[r[0]].store[d]=draw(v[0]*m*part*(0.6+R()*0.8)); if(v[3]==null||d<=v[3]) sold[r[0]].online[d]=draw(v[1]*(0.85+R()*0.3)*part*(0.6+R()*0.8)); }); }
  // ensure opening >= a few units
  ['store','online'].forEach(loc=>ITEMS.forEach(r=>{ const sku=r[0]; const cur=loc==='store'?r[8]:r[9]; const net=ev.filter(e=>e.sku===sku&&e.loc===loc).reduce((a,e)=>a+e.qty,0)-sold[sku][loc].reduce((a,b)=>a+b,0); let opening=cur-net; const want=4+Math.floor(R()*10);
    if(opening<want){ let need=want-opening; const lim=VEL[sku][loc==='store'?2:3]; const maxD=lim==null?days-2:Math.min(lim,days-2); while(need>0){ const d=Math.floor(R()*(maxD+1)); sold[sku][loc][d]++; need--; } } }));
  // POS transactions
  const cashiers=['Ahmad Rahman','Sara Haddad','Omar Nasser'];
  let rc=0;
  for(let d=0;d<days;d++){ const date=addDays(START,d); const units=[]; ITEMS.forEach(r=>{ for(let k=0;k<sold[r[0]].store[d];k++) units.push(r[0]); });
    if(!units.length) continue; const T=Math.max(3,Math.round(units.length/2.1)); const tx=Array.from({length:T},()=>({}));
    units.forEach(sku=>{ const t=tx[Math.floor(R()*T)]; t[sku]=(t[sku]||0)+1; });
    const mmdd=date.slice(5,7)+date.slice(8,10);
    tx.filter(t=>Object.keys(t).length).forEach((t,i)=>{ const lines=Object.keys(t).map(sku=>({sku,qty:t[sku],price:IT[sku].price})); const total=lines.reduce((a,l)=>a+l.qty*l.price,0); const p=R(); const hh=10+Math.floor(R()*12), mm=Math.floor(R()*60);
      db.sales.push({no:'RCT-'+mmdd+'-'+String(i+1).padStart(3,'0'),date,time:String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0'),cashier:cashiers[Math.floor(R()*3)],pay:p<0.34?'Cash':p<0.84?'K-Net':'Card',lines,total:Math.round(total*1000)/1000}); rc++; });
  }
  for(let d=0;d<days;d++){ const date=addDays(START,d); ITEMS.forEach(r=>{ const q=sold[r[0]].online[d]; if(q) db.online.push({date,sku:r[0],qty:q,price:IT[r[0]].price}); }); }
  // sales as aggregated daily moves
  for(let d=0;d<days;d++){ const date=addDays(START,d); const mmdd=date.slice(5,7)+date.slice(8,10); ITEMS.forEach(r=>{ const s=sold[r[0]]; if(s.store[d]) ev.push({date,sku:r[0],loc:'store',qty:-s.store[d],type:'Sale · POS',ref:'Z-'+mmdd}); if(s.online[d]) ev.push({date,sku:r[0],loc:'online',qty:-s.online[d],type:'Sale · Online',ref:'SO-'+mmdd}); }); }
  // opening balances
  const opening={};
  ITEMS.forEach(r=>{ const sku=r[0]; opening[sku]={}; ['store','online'].forEach(loc=>{ const cur=loc==='store'?r[8]:r[9]; const net=ev.filter(e=>e.sku===sku&&e.loc===loc).reduce((a,e)=>a+e.qty,0); opening[sku][loc]=cur-net; db.moves.push({date:OPEN_DATE,sku,loc,qty:cur-net,type:'Opening balance',ref:'OPEN'}); }); });
  ev.sort((a,b)=>a.date.localeCompare(b.date)); ev.forEach(e=>db.moves.push(e));
  db.opening=opening;

  // invoices (booked at the receipt-date sample rate)
  const V={}; vendors.forEach(v=>V[v.id]=v);
  const I=(no,grn,status,paidOn,paidPart)=>{ const g=db.grns.find(x=>x.no===grn); const p=db.pos.find(x=>x.no===g.po); const dp=p.ccy==='KWD'?1000:100; const amount=Math.round(g.valV*dp)/dp; const terms=+V[p.vendor].terms.replace(/\D/g,''); const inv={no,vendor:p.vendor,po:p.no,grn,ccy:p.ccy,amount,date:g.date,due:addDays(g.date,terms),rate:g.rate,rateDate:g.date,paid:0,payments:[]};
    if(paidOn){ const amt=paidPart||amount; inv.paid=amt; inv.payments.push({date:paidOn,amount:amt,k:Math.round(amt*g.rate*1000)/1000,ref:'BT-'+(55000+db.invoices.length*7)}); } db.invoices.push(inv); };
  I('INV-2026-0207','GRN-2026-0087');
  I('INV-2026-0201','GRN-2026-0091',null,'2026-10-03',1000);
  I('INV-2026-0195','GRN-2026-0082',null,'2026-09-16');
  I('INV-2026-0188','GRN-2026-0074');
  I('INV-2026-0185','GRN-2026-0076',null,'2026-10-01');
  I('INV-2026-0183','GRN-2026-0072',null,'2026-09-15');
  I('INV-2026-0179','GRN-2026-0073');
  I('INV-2026-0176','GRN-2026-0075',null,'2026-09-25');
  I('INV-2026-0168','GRN-2026-0071');
  db.invoices.push({no:'INV-2026-0161',vendor:'V-02',po:'PO-2026-0091',grn:null,ccy:'USD',amount:412.00,date:'2026-06-28',due:'2026-07-28',rate:0.30612,rateDate:'2026-06-28',paid:0,payments:[]});

  // ledger
  const sv=l=>ITEMS.reduce((a,r)=>a+opening[r[0]][l]*IT[r[0]].cost,0);
  post(db,OPEN_DATE,'OPEN','Opening inventory — Main Store',[['1300',sv('store'),0],['3000',0,sv('store')]]);
  post(db,OPEN_DATE,'OPEN','Opening inventory — Online Warehouse',[['1310',sv('online'),0],['3000',0,sv('online')]]);
  post(db,OPEN_DATE,'OPEN','Opening bank and cash',[['1110',16500,0],['1100',350,0],['3000',0,16850]]);
  const op=412*0.30612; post(db,OPEN_DATE,'OPEN','Opening payables',[['3000',op,0],['2100',0,op]]);
  db.grns.forEach(g=>post(db,g.date,g.no,'Goods received on '+g.po,[[INVACCT[g.loc],g.valK,0],['2100',0,g.valK]]));
  db.invoices.forEach(v=>v.payments.forEach(p=>post(db,p.date,v.no,'Payment '+p.ref+' to '+V[v.vendor].name,[['2100',p.k,0],['1110',0,p.k]])));
  db.counts.forEach(c=>{ const v=c.lines.reduce((a,l)=>a+(l.sys-l.counted)*l.cost,0); if(v) post(db,c.date,c.no,'Count variance — '+POOL[c.loc].name,[['5400',v,0],[INVACCT[c.loc],0,v]]); });
  db.writeoffs.forEach(w=>post(db,w.date,w.no,'Write-off · '+w.reason,[['5400',w.value,0],[INVACCT[w.loc],0,w.value]]));
  db.transfers.forEach(t=>{ if(t.status==='Draft') return; const v=t.lines.reduce((a,l)=>a+l.qty*IT[l.sku].cost,0); post(db,t.date,t.no,'Transfer '+POOL[t.from].label+' → '+POOL[t.to].label,[[INVACCT[t.to],v,0],[INVACCT[t.from],0,v]]); });
  for(let d=0;d<days;d++){ const date=addDays(START,d); const mmdd=date.slice(5,7)+date.slice(8,10);
    const ss=db.sales.filter(s=>s.date===date); const rev=ss.reduce((a,s)=>a+s.total,0); const cogs=ss.reduce((a,s)=>a+s.lines.reduce((b,l)=>b+l.qty*IT[l.sku].cost,0),0);
    const cash=ss.filter(s=>s.pay==='Cash').reduce((a,s)=>a+s.total,0);
    if(rev){ post(db,date,'Z-'+mmdd,'Store sales',[['1100',cash,0],['1110',rev-cash,0],['4000',0,rev]]); post(db,date,'Z-'+mmdd,'Cost of store sales',[['5000',cogs,0],['1300',0,cogs]]); }
    const os=db.online.filter(o=>o.date===date); const orev=os.reduce((a,o)=>a+o.qty*o.price,0), ocogs=os.reduce((a,o)=>a+o.qty*IT[o.sku].cost,0);
    if(orev){ post(db,date,'SO-'+mmdd,'Online sales',[['1110',orev,0],['4010',0,orev]]); post(db,date,'SO-'+mmdd,'Cost of online sales',[['5000',ocogs,0],['1310',0,ocogs]]); }
  }
  db.ledger.sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id); db.ledger.forEach((e,i)=>e.id=i+1);

  // audit log
  const tm=()=>String(8+Math.floor(R()*11)).padStart(2,'0')+':'+String(Math.floor(R()*60)).padStart(2,'0');
  db.pos.forEach(p=>(p.log||[]).forEach(([s,d])=>audit(db,d,tm(),s==='Draft'?p.by:s==='Sent'?p.by:'System',s==='Draft'?'PO created':s==='Sent'?'PO sent':s==='Closed'?'PO closed':s==='Pending approval'?'PO submitted for approval':'PO status changed',p.no,s)));
  db.grns.forEach(g=>audit(db,g.date,g.time,g.by,'Goods receipt posted',g.no,g.lines.reduce((a,l)=>a+l.qty,0)+' units into '+POOL[g.loc].name));
  db.transfers.forEach(t=>{ audit(db,t.date,tm(),t.by,t.status==='Draft'?'Transfer created':'Transfer dispatched',t.no,POOL[t.from].name+' → '+POOL[t.to].name); if(t.received) audit(db,t.received,tm(),t.to==='store'?'Yousef Hamdan':'Rania Faris','Transfer received',t.no,'Scanned in at '+POOL[t.to].name); });
  db.counts.forEach(c=>audit(db,c.date,tm(),c.by,'Stock count posted',c.no,POOL[c.loc].name+' · '+c.lines.length+' lines'));
  db.writeoffs.forEach(w=>audit(db,w.date,tm(),w.by,'Write-off logged',w.no,w.reason+' · '+w.qty+' × '+w.sku));
  db.invoices.forEach(v=>{ audit(db,v.date,tm(),'System','Invoice created',v.no,v.grn?'From '+v.grn+' on '+v.po:'Entered for '+v.po); v.payments.forEach(p=>audit(db,p.date,tm(),'Layla Karim','Payment recorded',v.no,mny(p.amount,v.ccy))); });
  rates.forEach(r=>{ if(r.date>='2026-09-20') audit(db,r.date,'07:00','System','Exchange rates updated','RATES','Sample rates USD, CNY, AED'); });
  for(let d=0;d<days-1;d++){ const date=addDays(START,d); audit(db,date,'22:15',cashiers[d%3],'Shift closed','Z-'+date.slice(5,7)+date.slice(8,10),'Z-report printed'); }
  db.audit.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)); db.audit.forEach((e,i)=>e.id=i+1);
  db.devices=DEVICES.map(d=>({...d}));
  db.orders=[{no:'SO-2026-0412',cust:'Salmiya · Block 10',slot:'Today 16:00–18:00',lines:[{sku:'BE-LIP-ROS',qty:2},{sku:'FA-TOT-CRM',qty:1}]},{no:'SO-2026-0413',cust:'Jabriya · Block 8',slot:'Today 18:00–20:00',lines:[{sku:'GA-CBL-C1M',qty:3},{sku:'HO-CND-VAN',qty:1},{sku:'BE-MSK-5PK',qty:1}]},{no:'SO-2026-0415',cust:'Hawalli · Block 2',slot:'Tomorrow 10:00–12:00',lines:[{sku:'FA-HOD-GRY-M',qty:1},{sku:'GA-EAR-WHT',qty:1}]}].map(o=>({...o,status:'Picking',picked:{},short:{}}));
  db.eanNext=items.length+1;
  return db;
}

const R_=window.__resources||{};
const LOGO=R_.brnLogo||'./assets/brn-dynamics-logo.png', LOGO_WHITE=R_.brnLogoWhite||'./assets/brn-dynamics-logo-white.png';
const eanFor=n=>eanCheck('6271234'+String(n).padStart(5,'0'));
const NOTES_KEY='nv-erp-delivery-notes';
const readNotes=()=>{ try{ return JSON.parse(localStorage.getItem(NOTES_KEY)||'{}'); }catch(e){ return {}; } };
const addNote=(po,note)=>{ try{ const n=readNotes(); (n[po]=n[po]||[]).push(note); localStorage.setItem(NOTES_KEY,JSON.stringify(n)); }catch(e){} };
window.ERP={LOGO,LOGO_WHITE,eanFor,readNotes,addNote,APPROVAL_LIMIT,VENDOR_BY_CAT,pl,TODAY,START,OPEN_DATE,fd,fds,nf,k3,mny,addDays,dayDiff,weekday,pad,POOL,INVACCT,chip,OPEN,CATS,REASONS,ACCTS,eanSvg,eanValid,symbology,rate,rateOn,poCalc,invStatus,invRate,post,audit,seed,USERS};
})();
