/* ============================================================
   Field Hero — Scénářový validátor (Agent 3)
   Automatická kontrola scénářového enginu a hodnoticí logiky.

   Spuštění:
     npm install jsdom
     node field-hero-validace.js
   Očekává field-hero.html ve stejné složce.
   ============================================================ */
const fs = require('fs');
const path = require('path');
let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch(e){ console.error('Chybí balíček jsdom. Spusť: npm install jsdom'); process.exit(1); }

const htmlPath = path.join(__dirname, 'field-hero.html');
if(!fs.existsSync(htmlPath)){ console.error('Nenašel jsem field-hero.html ve složce', __dirname); process.exit(1); }
const dom = new JSDOM(fs.readFileSync(htmlPath,'utf8'), { runScripts:'dangerously' });
const w = dom.window;
let problems = 0;
const ok = c => c ? '✓' : (problems++, '✗ PROBLÉM');

// --- 1. KOMBINATORIKA ---
console.log('=== 1. KOMBINATORIKA (unikátní scénáře na use case, cíl 100+) ===');
const UC = w.eval('UC.map(u=>u.id)');
const per = w.eval('P_PERSONA.length'), tim = w.eval('P_TIME.length'), dec = w.eval('P_DEC.length');
for(const id of UC){
  const builds = w.eval(`P_BUILD['${id}'].length`);
  const moods  = w.eval(`Object.keys(P_OPEN).filter(m=>m!=='friendly'||['panelak','novostavba','tvup'].includes('${id}')).length`);
  const pains  = id==='tvup' ? 3 : w.eval('P_PAIN.length');
  const combos = builds*tim*per*moods*pains*dec;
  console.log(`  ${id.padEnd(11)} ${combos.toLocaleString('cs')} kombinací  ${ok(combos>=100)}`);
}

// --- 2. REALISMUS OTEVŘENÍ ---
console.log('\n=== 2. REALISMUS OTEVŘENÍ DVEŘÍ (500 vzorků) ===');
const bad = ['spokojen','všechno mám','nic nepotřebuj','už mám optiku','mám všechno'];
let badOpen = 0; const openers = {};
for(let i=0;i<500;i++){
  const sc = w.genScenario(UC[i%UC.length]);
  const lo = sc.open.toLowerCase();
  if(bad.some(b=>lo.includes(b))) badOpen++;
  openers[sc.open] = 1;
}
console.log('  scénáře začínající "vše mám":', badOpen, ok(badOpen===0));
console.log('  různých úvodních replik:', Object.keys(openers).length, ok(Object.keys(openers).length>=8));

// --- 3. NÁROČNOST ---
console.log('\n=== 3. NÁROČNOST (600 vzorků) ===');
const difs = {1:0,2:0,3:0,4:0}; let hiddenOk=0, winOk=0;
for(let i=0;i<600;i++){
  const sc = w.genScenario(UC[i%UC.length]);
  difs[sc.dif]++;
  if(sc.hidden.length>120) hiddenOk++;
  if(sc.win && sc.win.length>10) winOk++;
}
console.log('  obtížnost 1/2/3/4:', difs[1],'/',difs[2],'/',difs[3],'/',difs[4]);
console.log('  bohatý skrytý kontext:', Math.round(hiddenOk/600*100)+'%', ok(hiddenOk/600>=0.9));
console.log('  definovaná výhra:', Math.round(winOk/600*100)+'%', ok(winOk/600>=0.99));

// --- 4. FÁZOVÝ ENGINE ---
console.log('\n=== 4. FÁZOVÝ ENGINE (offline heuristika) ===');
w.eval('S.forceText=true');
async function runConv(id, lines){
  w.eval(`VR_SCEN=genScenario('${id}')`); w.startVoiceRp();
  const of = w.fetch; w.fetch = () => Promise.reject(new Error('offline-test'));
  for(const l of lines){ await w.vrProcess(l,0); if(w.eval('VR.ended')) break; }
  w.fetch = of;
  return { phase:w.eval('VR.phase'), success:w.eval('VR.success'), ended:w.eval('VR.ended') };
}
const MASTER = [
  'Dobrý den, Novák z T-Mobile Osobně, tady je můj průkaz.',
  'Jsem tu na základě oznámení ve vchodě, mám vám předat na jaké výhody v domě máte nárok, nezdržím vás.',
  'Než něco ukážu, jaké připojení teď doma máte a vyhovuje vám večer, když jste online všichni?',
  'Přesně to optika řeší, každý má vlastní kapacitu, nebude to sekat, velký rozdíl u vás doma.',
  'Pojďme se posadit, srovnám vám to na papíře i s cenou, hodí se zítra po šesté nebo o víkendu?'
];
(async()=>{
  // masterclass průchod přes všechny use case
  let pass=0, tot=0;
  for(const id of UC){ for(let k=0;k<8;k++){ const r=await runConv(id,MASTER); tot++; if(r.phase>=4) pass++; } }
  console.log(`  MASTERCLASS průchod → fáze ≥4 v ${pass}/${tot} (${Math.round(pass/tot*100)}%)`, ok(pass/tot>=0.85));

  // pitch v úvodu musí u nepříznivé nálady selhat
  let pf=0, pt=0;
  for(let k=0;k<12;k++){ const r=await runConv(['rd','senior','navrat'][k%3], ['Dobrý den, máme akci na optiku 299 korun, nezajímalo by vás to?','A co televizi?']); pt++; if(r.ended && r.phase<=1) pf++; }
  console.log(`  PITCH v úvodu → brzký konec v ${pf}/${pt}`, ok(pf/pt>=0.4));

  // slabý průchod nesmí uspět
  const weak = await runConv('panelak', ['Dobrý den, nabízíme internet.','Je rychlý a levný.','Tak co, berete?']);
  console.log('  SLABÝ průchod → úspěch:', weak.success, ok(!weak.success));

  console.log('\n=== VÝSLEDEK ===');
  console.log(problems===0 ? '✓ VŠE PROŠLO — engine je v pořádku.' : `✗ ${problems} problém(ů) k opravě.`);
  process.exit(problems===0 ? 0 : 1);
})();
