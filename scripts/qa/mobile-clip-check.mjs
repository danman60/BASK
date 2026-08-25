import { chromium } from 'playwright';
const BASE='https://bask-psi.vercel.app';
const OUT='/tmp/qa';
const ROUTES=[['/',''],['/customers',''],['/monitor',''],['/insights',''],['/insights/peers',''],
  ['/marketing',''],['/inventory',''],['/book',''],['/settings/data-sharing',''],['/insights/activity',''],
  ['/inventory/order',''],['/floor',''],
  ['/compass','?role=uvalux_rep'],['/compass/accounts','?role=uvalux_rep'],
  ['/compass/coaching','?role=uvalux_rep'],['/compass/knowledge','?role=uvalux_rep'],
  ['/compass/network','?role=uvalux_rep']];
const SHOTS=new Set(['/monitor','/customers','/compass/accounts','/compass/network']);
const b=await chromium.launch();
const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await c.newPage();
const errs=[]; p.on('pageerror',e=>errs.push(String(e).slice(0,120)));
const rows=[];
for(const [r,q] of ROUTES){
  errs.length=0; let st=0;
  try{const resp=await p.goto(BASE+r+q,{waitUntil:'networkidle',timeout:60000}); st=resp?resp.status():0;}
  catch(e){rows.push({r,st:'NAV_FAIL',clip:'-'}); continue;}
  await p.waitForTimeout(1000);
  const m=await p.evaluate(()=>({clip:document.body.scrollWidth-document.body.clientWidth,len:(document.body.innerText||'').trim().length}));
  if(SHOTS.has(r)) await p.screenshot({path:`${OUT}/final-${r.replace(/\//g,'_')||'home'}.png`});
  rows.push({r,st,...m,errs:[...errs]});
}
await b.close();
console.log('route                       http  clipped  chars  jserr');
for(const x of rows) console.log(String(x.r).padEnd(28)+String(x.st).padEnd(6)+String(x.clip).padEnd(9)+String(x.len??'-').padEnd(7)+(x.errs&&x.errs.length?x.errs[0]:''));
const clipped=rows.filter(x=>typeof x.clip==='number'&&x.clip>0);
console.log('\nroutes='+rows.length+'  http200='+rows.filter(x=>x.st===200).length+'  jserrors='+rows.filter(x=>x.errs&&x.errs.length).length+'  still_clipping='+clipped.length);
