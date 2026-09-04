import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE='https://bask-psi.vercel.app';
const OUT='/home/danman60/projects/uvalux-platform/docs/screenshots/rehearsal-2026-09-03';
fs.mkdirSync(OUT,{recursive:true});
const beats=[];
const rec=(n,name,ms,shot,figs,notes='',status='OK')=>{beats.push({n,name,ms,shot,figs,notes,status});console.log(`[B${n}] ${name} — ${ms}ms — ${status}`);};
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1920,height:1080}});
p.on('pageerror',e=>console.log('PAGEERROR:',e.message));
const shot=async f=>{await p.screenshot({path:`${OUT}/${f}`});return f;};
const txt=async l=>(await l.innerText()).replace(/\s*\n\s*/g,'\n').trim();

// ---------- BEAT 1 ----------
let t0=Date.now();
const r1=await p.goto(BASE,{waitUntil:'commit',timeout:60000});
const letter=p.locator('h1,h2').filter({hasText:'Good morning, Dana'}).first();
await letter.waitFor({state:'visible',timeout:60000});
await p.waitForLoadState('networkidle',{timeout:60000});
const b1ms=Date.now()-t0;
await p.waitForTimeout(800);
rec(1,'Today — the Daybreak letter',b1ms,await shot('beat1-today-daybreak.png'),
  [await txt(letter), await txt(p.locator('.b-daybreak, [class*=daybreak]').first().locator('p').first()).catch(()=>'')].filter(Boolean),
  `HTTP ${r1.status()}`);

// ---------- BEAT 2 ----------
t0=Date.now();
const queueH=p.locator('h2').filter({hasText:'Needs your attention'}).first();
await queueH.scrollIntoViewIfNeeded();
const card=p.locator('[data-testid=insight-card]').first();
await card.waitFor({state:'visible',timeout:30000});
await card.scrollIntoViewIfNeeded();
const b2ms=Date.now()-t0;
await p.waitForTimeout(700);
const cardTxt=await txt(card);
rec(2,'The retail card in the attention queue',b2ms,await shot('beat2-retail-card.png'),
  [await txt(queueH),...cardTxt.split('\n').slice(0,3)],
  'Card lives under "Needs your attention — ranked by impact".');

// supplementary: the opportunity card that actually carries 8.3%/5.9%/$4,260
const opp=p.locator('[data-testid=opportunity-card]').first();
await opp.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
const oppTxt=await txt(opp);
await shot('beat2b-opportunity-card-8.3-to-5.9.png');
console.log('OPPORTUNITY CARD TEXT:\n'+oppTxt);
beats.push({n:'2b',name:'(context) "6 ways to grow" opportunity card #1 — where 8.3%→5.9% / $4,260 actually lives',
  ms:null,shot:'beat2b-opportunity-card-8.3-to-5.9.png',figs:oppTxt.split('\n').slice(0,8),
  notes:'Separate section, ABOVE the attention queue. Has no "Show me why" / "Fix this".',status:'NOTE'});

// ---------- BEAT 3 ----------
await card.scrollIntoViewIfNeeded();
t0=Date.now();
await card.locator('button:has-text("Show me why")').click();
await card.locator('text=WHAT WE MEASURED').first().waitFor({timeout:30000});
await card.locator('table, [role=table]').first().waitFor({timeout:30000});
const b3ms=Date.now()-t0;
await p.waitForTimeout(900);
await card.locator('text=WHAT WE MEASURED').first().scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
const measured=await txt(card.locator('text=WHAT WE MEASURED').first().locator('xpath=..'));
rec(3,'"Show me why" — the evidence view (chart, then visit rows)',b3ms,await shot('beat3-evidence-chart.png'),
  measured.split('\n').slice(0,12),'Chart + windows + money working.');
// visit rows shot
const rowsHdr=card.locator('text=/counted from the visits below/').first();
await rowsHdr.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
await shot('beat3b-evidence-visit-rows.png');
const rowsLine=await txt(rowsHdr);
const tail=await txt(card.locator('text=/Showing 40 of/').first());
beats.push({n:'3b',name:'"Show me why" — the visit rows',ms:null,shot:'beat3b-evidence-visit-rows.png',
  figs:[rowsLine,tail],notes:'Row-level receipts under the chart.',status:'OK'});

// ---------- BEAT 4 ----------
t0=Date.now();
const drew=card.locator('text=What this drew on').first();
await drew.waitFor({timeout:40000});
const b4wait=Date.now()-t0;
await drew.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
const citeBlock=drew.locator('xpath=..');
const toggles=citeBlock.locator('button, summary');
const nTog=await toggles.count();
let quoteTxt='(no citation toggle found)';
let b4ms=b4wait;
if(nTog>0){
  const t1=Date.now();
  await toggles.first().click();
  await p.waitForTimeout(1500);
  b4ms=b4wait+(Date.now()-t1);
  quoteTxt=await txt(citeBlock);
}
await drew.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
rec(4,'"What this drew on" — coaching citations, one opened',b4ms,await shot('beat4-coaching-citations.png'),
  quoteTxt.split('\n').slice(0,14),`Citation block loads async after "Show me why" (${b4wait}ms to appear). ${nTog} toggles.`);

// ---------- BEAT 5 ----------
const fix=card.locator('a:has-text("Fix this")').first();
const fixHref=await fix.getAttribute('href');
await fix.scrollIntoViewIfNeeded();
t0=Date.now();
await fix.click();
await p.waitForURL(/\/marketing/,{timeout:60000});
await p.locator('text=/^Fixing:/').first().waitFor({timeout:60000});
await p.waitForLoadState('networkidle',{timeout:60000});
const b5ms=Date.now()-t0;
await p.waitForTimeout(1200);
const fixing=await txt(p.locator('text=/^Fixing:/').first());
const rail=await txt(p.locator('button:has-text("Goal")').first().locator('xpath=..')).catch(()=>'');
rec(5,'"Fix this" → Studio, pre-filled (NOT generated)',b5ms,await shot('beat5-studio-prefilled.png'),
  [fixing,...rail.split('\n').filter(Boolean).slice(0,8)],
  `Route: ${fixHref}. No generate/approve/schedule/send clicked.`);

// ---------- BEAT 6 ----------
for(const [key,url,name,wait] of [
  ['6a','/compass','Compass — Call List (the dark side)','Four calls worth making'],
  ['6b','/compass/network','Compass — Network',"salons across the network"],
  ['6c','/compass/calls','Compass — /compass/calls',null]]){
  t0=Date.now();
  const r=await p.goto(BASE+url,{waitUntil:'commit',timeout:60000});
  let st='OK', figs=[];
  try{
    if(wait) await p.locator(`text=/${wait}/`).first().waitFor({timeout:30000});
    await p.waitForLoadState('networkidle',{timeout:60000});
  }catch(e){ st='FAILED'; }
  const ms=Date.now()-t0;
  await p.waitForTimeout(800);
  const body=(await p.innerText('body')).replace(/\s*\n\s*/g,'\n');
  if(r.status()>=400||body.includes('NOT FOUND')) st='FAILED — HTTP '+r.status();
  figs=body.split('\n').filter(Boolean).slice(0,14);
  rec(key,name,ms,await shot(`beat${key}-${url.replace(/\//g,'-').replace(/^-/,'')}.png`),figs,`GET ${url} → HTTP ${r.status()}`,st);
}
fs.writeFileSync(`${OUT}/beats.json`,JSON.stringify(beats,null,2));
await b.close();
console.log('\nDONE');
