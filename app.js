

/* ================================================================
   WYPRAWY — generyczna apka podróżna
   Jedna apka, wiele wypraw. Treść wypraw w PACKS, Twoje dane w pamięci
   przeglądarki (wy-*). Nic osobistego nie trafia do pliku.
   ================================================================ */

/* ---------- narzędzia ---------- */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const attr=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const num=v=>{const n=parseFloat(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return isNaN(n)?0:n;};
const fmt=n=>Math.round(n).toLocaleString('pl-PL');
const fmt2=n=>n.toLocaleString('pl-PL',{maximumFractionDigits:n<10?2:(n<100?1:0)});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function pl(n,a,b,c){n=Math.abs(Math.round(n));if(n===1)return a;const d=n%10,h=n%100;return(d>=2&&d<=4&&!(h>=12&&h<=14))?b:c;}
function plural(n,a,b,c){return n+' '+pl(n,a,b,c);}
const norm=s=>' '+String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/ł/g,'l').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,' ').trim()+' ';

/* ---------- pamięć ---------- */
let LS_OK=true;
function lsGet(k){try{return localStorage.getItem(k);}catch(e){LS_OK=false;return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){LS_OK=false;return false;}}
function load(k,def){try{const v=lsGet(k);return v==null?def:JSON.parse(v);}catch(e){return def;}}
function save(k,v){lsSet(k,JSON.stringify(v));}
const K={trips:'wy-trips',active:'wy-active',exp:'wy-exp',ci:'wy-ci',learned:'wy-learned',mode:'wy-mode',
  rates:'wy-rates',wx:'wy-wx',bak:'wy-lastbackup',convmin:'wy-convmin',visited:'wy-visited',migrated:'wy-migrated',
  tilesAsked:'wy-tiles-n',hidedone:'wy-hidedone',ideas:'wy-ideas',domAdded:'wy-dom',caboAdded:'wy-cabo',packs:'wy-packs'};

/* ---------- daty ---------- */
const MON=['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];
const DOW=['nd','pn','wt','śr','czw','pt','sob'];
function isoToday(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dAt(iso){return new Date(iso+'T12:00:00');}
function dayDiff(a,b){return Math.round((dAt(b)-dAt(a))/86400000);}
function addDays(iso,n){const d=dAt(iso);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function dateFor(start,off){
  const d=dAt(start);if(isNaN(d))return{d:'—',wd:'',full:'—',iso:''};
  d.setDate(d.getDate()+off);
  return{d:d.getDate()+' '+MON[d.getMonth()],wd:DOW[d.getDay()],full:d.getDate()+' '+MON[d.getMonth()]+' '+d.getFullYear(),iso:addDays(start,off)};
}

/* ---------- słowniki ---------- */
const MODES={
  plane:{l:'Samolot',s:'lot',i:'✈'},train:{l:'Pociąg',s:'pociąg',i:'🚆'},bus:{l:'Autobus',s:'autobus',i:'🚌'},
  dolmus:{l:'Marszrutka / dolmusz',s:'minibus',i:'🚐'},ferry:{l:'Prom',s:'prom',i:'⚓'},car:{l:'Auto / transfer',s:'transfer',i:'🚗'},
  taxi:{l:'Taxi',s:'taxi',i:'🚕'},tour:{l:'Wycieczka / kolejka',s:'wycieczka',i:'🎟'},walk:{l:'Pieszo',s:'pieszo',i:'🚶'},
  stay:{l:'Bez przejazdu',s:'na miejscu',i:'⏸'},med:{l:'Wizyta / sprawa',s:'sprawa',i:'⚕'}
};
const SYM={PLN:'zł',EUR:'€',USD:'$',TRY:'₺',AMD:'֏',GEL:'₾',GBP:'£',BGN:'лв',RON:'lei',HUF:'Ft',CZK:'Kč',CHF:'CHF',AZN:'₼',IRR:'﷼',UAH:'₴',RSD:'din',ALL:'L',MKD:'ден',BAM:'KM',THB:'฿',JPY:'¥',INR:'₹',VND:'₫',IDR:'Rp',MAD:'DH',EGP:'E£',ILS:'₪',JOD:'JD',MXN:'MX$',CVE:'$'};
const CODE=Object.fromEntries(Object.entries(SYM).map(([c,s])=>[s,c]));
const toCode=x=>SYM[x]?x:(CODE[x]||x);
const toSym=x=>SYM[x]||x;
const CATS=[
  {id:'food',l:'Jedzenie',i:'🍽',c:'#B45A2E'},{id:'trans',l:'Transport',i:'🚌',c:'#2E7D82'},
  {id:'stay',l:'Nocleg',i:'🛏',c:'#6E1B24'},{id:'fun',l:'Atrakcje',i:'🎟',c:'#C89B3C'},
  {id:'shop',l:'Zakupy',i:'🛒',c:'#6B7A4F'},{id:'other',l:'Inne',i:'•',c:'#8A7E70'}
];
const CATM=Object.fromEntries(CATS.map(c=>[c.id,c]));

/* ---------- gazetteer: współrzędne + nazwa w lokalnym piśmie + wymowa ---------- */
const GAZ=[
 {a:['mindelo','sao vicente','são vicente'],c:[16.8866,-24.9956],loc:'Mindelo',say:'min-DE-lu'},
 {a:['porto novo'],c:[17.0167,-25.0667],loc:'Porto Novo',say:'POR-tu NO-wu'},
 {a:['santo antao','santo antão','ribeira grande','ponta do sol','paul','cova','fontainhas','cruzinha'],c:[17.1833,-25.0667],loc:'Santo Antão',say:'SAN-tu an-TĄU'},
 {a:['sao nicolau','são nicolau','ribeira brava','tarrafal de sao nicolau'],c:[16.6167,-24.3],loc:'São Nicolau',say:'sąu ni-ko-LAU'},
 {a:['praia','santiago','plateau'],c:[14.9167,-23.5167],loc:'Praia',say:'PRA-ja'},
 {a:['cidade velha'],c:[14.9153,-23.6033],loc:'Cidade Velha',say:'si-DA-dzi WE-lia'},
 {a:['tarrafal'],c:[15.2772,-23.7525],loc:'Tarrafal',say:'ta-ra-FAL'},
 {a:['fogo','sao filipe','são filipe'],c:[14.8961,-24.4953],loc:'Fogo',say:'FO-gu'},
 {a:['cha das caldeiras','chã das caldeiras','pico do fogo','portela'],c:[14.9475,-24.3433],loc:'Chã das Caldeiras',say:'SZĄ dasz kal-DEJ-rasz'},
 {a:['brava','nova sintra','faja d agua'],c:[14.8667,-24.7],loc:'Brava',say:'BRA-wa'},
 {a:['maio','vila do maio'],c:[15.1333,-23.2167],loc:'Maio',say:'MA-ju'},
 {a:['sal','santa maria','espargos'],c:[16.5942,-22.9056],loc:'Sal',say:'sal'},
 {a:['boa vista','sal rei'],c:[16.1833,-22.9167],loc:'Boa Vista',say:'BO-a WISZ-ta'},
 {a:['gyumri','giumri'],c:[40.7894,43.8475],loc:'Գյումրի',say:'gium-RI'},
 {a:['debed','alaverdi','odzun','sanahin','haghpat'],c:[41.0972,44.66],loc:'Ալավերդի',say:'a-la-wer-DI'},
 {a:['dilijan','dilidzan'],c:[40.7408,44.8628],loc:'Դիլիջան',say:'di-li-DŻAN'},
 {a:['sewan','sevan','sevanavank'],c:[40.5667,45.0],loc:'Սևան',say:'se-WAN'},
 {a:['goris'],c:[39.5108,46.34],loc:'Գորիս',say:'go-RIS'},
 {a:['tatev','tatew','chndzoresk','halidzor'],c:[39.38,46.2497],loc:'Տաթև',say:'ta-TEW'},
 {a:['erywan','erywania','erywaniu','erewan','yerevan','yerevani'],c:[40.1811,44.5136],loc:'Երևան',say:'je-re-WAN'},
 {a:['garni'],c:[40.1122,44.728],loc:'Գառնի',say:'gar-NI'},
 {a:['geghard'],c:[40.1403,44.8183],loc:'Գեղարդ',say:'ge-GHARD'},
 {a:['eczmiadzyn','echmiadzin','etchmiadzin','vagharshapat','zwartnoc'],c:[40.1622,44.2916],loc:'Էջմիածին',say:'edż-mia-DZIN'},
 {a:['areni','noravank'],c:[39.7236,45.1872],loc:'Արենի',say:'a-re-NI'},
 {a:['chor wirap','khor virap','chor virap'],c:[39.8781,44.5772],loc:'Խոր Վիրապ',say:'chor wi-RAP'},
 {a:['aragats','amberd'],c:[40.3886,44.2256],loc:'Ամբերդ',say:'am-BERD'},
 {a:['vanadzor','wanadzor'],c:[40.8128,44.4883],loc:'Վանաձոր',say:'wa-na-DZOR'},
 {a:['zvartnots','zwartnots'],c:[40.1473,44.3959],loc:'Զվարթնոց',say:'zwart-NOC'},
 {a:['larnaka','larnaca'],c:[34.9182,33.6301],loc:'Λάρνακα',say:'LAR-na-ka'},
 {a:['nikozja','nicosia','lefkosa','ledra','zielona linia'],c:[35.1728,33.3617],loc:'Λευκωσία · Lefkoşa',say:'lef-ko-SI-a / lef-KO-sza'},
 {a:['girne','kyrenia','kirenia'],c:[35.3364,33.3192],loc:'Girne · Κερύνεια',say:'GIR-ne'},
 {a:['pafos','paphos'],c:[34.7754,32.4245],loc:'Πάφος',say:'PA-fos'},
 {a:['tasucu'],c:[36.32,33.88],loc:'Taşucu',say:'TASZ-u-dżu'},
 {a:['silifke'],c:[36.3778,33.9344],loc:'Silifke',say:'si-LIF-ke'},
 {a:['adana'],c:[37.0,35.3213],loc:'Adana',say:'A-da-na'},
 {a:['gaziantep','antep'],c:[37.0662,37.3833],loc:'Gaziantep',say:'ga-zi-AN-tep'},
 {a:['karadut','kahta'],c:[37.93,38.78],loc:'Karadut',say:'ka-ra-DUT'},
 {a:['nemrut'],c:[37.981,38.741],loc:'Nemrut Dağı',say:'nem-RUT da-YY'},
 {a:['sanliurfa','urfa'],c:[37.1591,38.7969],loc:'Şanlıurfa',say:'szan-ly-UR-fa'},
 {a:['mardin'],c:[37.3126,40.735],loc:'Mardin',say:'MAR-din'},
 {a:['diyarbakir'],c:[37.9144,40.2306],loc:'Diyarbakır',say:'di-JAR-ba-kyr'},
 {a:['van'],c:[38.4891,43.4089],loc:'Van',say:'wan'},
 {a:['dogubayazit','dogubeyazit'],c:[39.547,44.0836],loc:'Doğubayazıt',say:'do-u-ba-ja-ZYT'},
 {a:['kars'],c:[40.6013,43.0975],loc:'Kars',say:'kars'},
 {a:['ani'],c:[40.5075,43.5725],loc:'Ani',say:'a-NI'},
 {a:['ankara'],c:[39.9334,32.8597],loc:'Ankara',say:'AN-ka-ra'},
 {a:['stambul','istanbul','halkali'],c:[41.0082,28.9784],loc:'İstanbul',say:'is-TAN-bul'},
 {a:['alanya'],c:[36.5444,31.9998],loc:'Alanya',say:'a-LAN-ja'},
 {a:['antalya'],c:[36.8969,30.7133],loc:'Antalya',say:'an-TAL-ja'},
 {a:['kas'],c:[36.2021,29.6383],loc:'Kaş',say:'kasz'},
 {a:['olympos','cirali'],c:[36.3958,30.4739],loc:'Olympos · Çıralı',say:'o-LIM-pos'},
 {a:['sofia','sofii','sofie'],c:[42.6977,23.3219],loc:'София',say:'SO-fi-ja'},
 {a:['bukareszt','bucuresti','bucharest'],c:[44.4268,26.1025],loc:'București',say:'bu-ku-RESZT'},
 {a:['budapeszt','budapest'],c:[47.4979,19.0402],loc:'Budapest',say:'BU-da-pest'},
 {a:['burgas'],c:[42.5048,27.4626],loc:'Бургас',say:'bur-GAS'},
 {a:['krakow'],c:[50.0647,19.945],loc:'Kraków',say:''}
];
function gaz(name){
  const n=norm(name);if(n.trim()==='')return null;
  let best=null,bestLen=0;
  GAZ.forEach(g=>g.a.forEach(a=>{if(n.includes(' '+a+' ')&&a.length>bestLen){best=g;bestLen=a.length;}}));
  return best;
}
function stageCoord(s){
  if(s.lat!=null&&s.lng!=null&&s.lat!==''&&s.lng!=='')return[num(s.lat),num(s.lng)];
  const g=gaz(s.to)||gaz(s.title)||gaz(s.from);return g?g.c:null;
}
function stageLocal(s){
  const g=gaz(s.to)||gaz(s.title);
  return{loc:s.loc||(g?g.loc:''),say:s.say||(g?g.say:'')};
}
const sameLoc=(a,b)=>norm(a).trim()===norm(b).trim();
const isTransfer=s=>s&&s.from&&s.to&&s.to!=='—'&&!sameLoc(s.from,s.to);

/* ---------- kursy walut (PLN za 1 jednostkę) — stan na 21.09.2026 ---------- */
const RATES_DEFAULT={ts:Date.parse('2026-09-21T05:25:00Z'),src:'wbudowane (21.09.2026)',
  pln:{PLN:1,AMD:1/95.427,TRY:1/12.837,EUR:4.366,USD:3.80,GEL:1.40,BGN:2.23,RON:0.878,HUF:0.0111,CZK:0.175,GBP:5.10,CVE:4.366/110.265}};
let rates=load(K.rates,null)||RATES_DEFAULT;
if(!rates.pln)rates=RATES_DEFAULT;
function rate(cur){const c=toCode(cur);return rates.pln[c]!=null?rates.pln[c]:(RATES_DEFAULT.pln[c]!=null?RATES_DEFAULT.pln[c]:0);}
function toPln(v,cur){return num(v)*rate(cur);}
async function refreshRates(){
  if(!navigator.onLine)return false;
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/PLN',{cache:'no-store'});
    if(!r.ok)return false;
    const j=await r.json();if(j.result!=='success'||!j.rates)return false;
    const p={PLN:1};Object.keys(j.rates).forEach(c=>{if(j.rates[c]>0)p[c]=1/j.rates[c];});
    rates={ts:(j.time_last_update_unix||Date.now()/1000)*1000,src:'na żywo (open.er-api.com)',pln:p};
    save(K.rates,rates);return true;
  }catch(e){return false;}
}

/* ---------- stan ---------- */
let trips=load(K.trips,null);
let expenses=load(K.exp,[]);
let checkins=load(K.ci,[]);
let learned=load(K.learned,{});
let visited=load(K.visited,{});
let convMin=load(K.convmin,{});
let wxCache=load(K.wx,{});
const saveTrips=()=>save(K.trips,trips);
const saveExp=()=>save(K.exp,expenses);
const saveCi=()=>save(K.ci,checkins);

/* ---------- budowa wyprawy z pakietu ---------- */
/* ---------- pakiety treści: wbudowane + wczytane przez użytkownika ---------- */
let userPacks=load(K.packs,{});
if(!userPacks||typeof userPacks!=='object'||Array.isArray(userPacks))userPacks={};
const PACKS=Object.assign({},BASE_PACKS,userPacks);
function savePacks(){save(K.packs,userPacks);}
const PACK_FIELDS=['stops','places','food','lang','culture','ig','checks','budget','info','events','windows','options'];
function normalizePack(o){
  if(!o||typeof o!=='object')return{err:'To nie jest obiekt JSON.'};
  const id=String(o.id||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  if(!id)return{err:'Brak pola „id” (krótka nazwa bez spacji, np. gruzja27).'};
  if(!o.name)return{err:'Brak pola „name” — nazwy wyprawy.'};
  if(!Array.isArray(o.stages))return{err:'Brak listy „stages” — etapów. Może być pusta: [].'};
  const p=Object.assign({},o);
  p.id=id;
  p.emoji=o.emoji||'🧭';
  p.cur=toCode(o.cur||'EUR');
  p.sym=o.sym||toSym(p.cur);
  p.extra=Array.isArray(o.extra)?o.extra:[];
  p.start=/^\d{4}-\d{2}-\d{2}$/.test(o.start||'')?o.start:isoToday();
  p.rev=num(o.rev)||1;
  PACK_FIELDS.forEach(f=>{if(!Array.isArray(p[f]))p[f]=[];});
  p.alphabet=Array.isArray(o.alphabet)?o.alphabet:null;
  p.ferry=o.ferry&&typeof o.ferry==='object'?o.ferry:null;
  p.stages=o.stages.map(x=>Object.assign({title:'',from:'',to:'',via:'',mode:'bus',modeSug:'bus',nights:1,status:'',
    dep:'',arr:'',carrier:'',price:'',curr:p.sym,stay:'',stayPrice:'',curr2:p.sym,src:'core',see:'',detail:'',note:''},x));
  p.stages.forEach(x=>{x.nights=Math.max(0,num(x.nights));if(!MODES[x.mode])x.mode='bus';});
  p.places=p.places.map(x=>Object.assign({area:'Miejsca',tag:'worth',icon:'◇',where:'',desc:'',tip:''},x,
    {key:(x.key||((x.area||'Miejsca')+'|'+(x.name||'')))}));
  p.checks=p.checks.map(c=>Object.assign({cat:'Lista',t:'',w:''},c));
  return{pack:p};
}
function installPack(o){
  const n=normalizePack(o);if(n.err)return n;
  userPacks[n.pack.id]=n.pack;PACKS[n.pack.id]=n.pack;savePacks();
  return n;
}
function packTemplate(){
  return{
   _opis:'Szablon pakietu wyprawy dla apki Rihla. Usuń pola, których nie potrzebujesz — zostaną puste. Pola _opis są ignorowane.',
   id:'gruzja27',name:'Gruzja 2027',emoji:'🇬🇪',start:'2027-05-10',cur:'GEL',extra:['EUR','PLN'],rev:1,
   dateless:true,
   stages:[
    {title:'Kraków → Tbilisi',from:'Kraków',to:'Tbilisi',mode:'plane',nights:2,dep:'',carrier:'',price:'',
     see:'Krótki opis pod nagłówkiem dnia.',detail:'Dłuższy opis etapu.',note:'Uwagi praktyczne.',stay:'Tbilisi'},
    {title:'Tbilisi → Kazbegi',from:'Tbilisi',to:'Kazbegi',mode:'dolmus',nights:2,see:'',detail:'',note:'',stay:'Kazbegi'},
    {title:'Powrót',from:'Tbilisi',to:'Kraków',mode:'plane',nights:0,src:'tail',see:'',detail:'',note:''}],
   windows:[{name:'Maj',when:'10.05 → 30.05.2027',start:'2027-05-10',why:'Dlaczego to dobry termin.'}],
   stops:[{n:'Tbilisi',c:[41.6938,44.8015],d:'10–12.05',note:'Notatka na mapie.',t:'core'}],
   places:[{area:'Góry',name:'Kazbegi',tag:'must',icon:'★',where:'12.05',desc:'Opis miejsca.',tip:'Praktyczna wskazówka.'}],
   food:[{area:'Dania',name:'Chinkali',icon:'◍',desc:'Opis.',tip:'Jak jeść.'}],
   lang:[{sec:'Podstawy',note:'',items:[{pl:'Dzień dobry',local:'გამარჯობა',say:'ga-mar-DŻO-ba'}]}],
   alphabet:null,
   culture:[{cat:'Muzyka',items:[{t:'Polifonia gruzińska',m:'tradycja',d:'Opis.',star:true}]}],
   events:[{cat:'Festiwale',t:'Tbilisoba',where:'Tbilisi',when:'październik',iso:null,sure:false,d:'Opis.',tip:'Wskazówka.'}],
   ig:[{t:'Pomysł na zdjęcie',d:'Opis kadru.'}],
   checks:[{cat:'Przed wyjazdem',t:'Ubezpieczenie',w:'dok'},{cat:'Pierwszy dzień na miejscu',t:'Karta SIM',w:'SIM',on:'day0'}],
   budget:[{n:'Nocleg — 10 nocy po 25 €',v:250,c:'€'}],
   info:[{title:'Karta informacyjna',rows:[['Nagłówek wiersza','Treść wiersza.']]}],
   options:[{group:'Warianty',insert:true,items:[{id:'a',letter:'A',name:'Wariant A',tag:'Krótki opis.',days:'5 dni',cash:'~200 €',diff:'łatwo',
     legs:[{t:'Odcinek',from:'A',to:'B',mode:'bus',price:20,curr:'₾',dur:'3 h',nights:1,s:'Opis odcinka.',note:''}],
     pros:['Zaleta.'],cons:['Wada.'],pts:[{n:'Punkt na mapie',c:[41.6,44.8],tag:'',f:'Fakt o miejscu.'}]}]}]
  };
}
function freshTrip(packId){
  const P=PACKS[packId];
  return{id:packId,pack:packId,name:P.name,emoji:P.emoji,start:P.start,cur:P.cur,extra:P.extra.slice(),
    stages:JSON.parse(JSON.stringify(P.stages)),
    checks:P.checks.map(c=>Object.assign({done:false},c)),
    budget:JSON.parse(JSON.stringify(P.budget||[])),
    picked:JSON.parse(JSON.stringify(P.picked||{})),packRev:P.rev||1,dateless:!!P.dateless,ferry:{},plan:null,booking:{}};
}
/* podmiana etapów na nowszą rewizję pakietu — zachowuje Twoje notatki przy etapach o tym samym armIdx */
function applyPackRev(t){
  const Pk=PACKS[t.pack];if(!Pk)return;
  const old={};t.stages.forEach(s=>{if(s.armIdx!=null)old[s.armIdx]=s;});
  t.stages=JSON.parse(JSON.stringify(Pk.stages)).map(s=>{
    const o=s.armIdx!=null&&old[s.armIdx];
    if(o)['carrier','detail','note','stay','stayUrl','star','food','dep','arr','price','stayPrice','status'].forEach(k=>{
      if(o[k]!=null&&o[k]!==''&&!(k==='status'&&s.status))s[k]=o[k];});
    return s;});
  t.picked=Object.assign({},t.picked||{},JSON.parse(JSON.stringify(Pk.picked||{})));
  if(Pk.renames){t.name=Pk.name;t.emoji=Pk.emoji;}
  if(Pk.dateless!=null)t.dateless=!!Pk.dateless;
  if(Pk.start&&(Pk.renames||Pk.restart))t.start=Pk.start;
  if(Pk.resetChecks&&Array.isArray(Pk.checks)){
    const done={};(t.checks||[]).forEach(c=>{if(c.done)done[c.t]=1;});
    t.checks=Pk.checks.map(c=>Object.assign({},c,{done:!!done[c.t]}));
  }
  if(Pk.restart)delete t.blocks;
  t.packRev=Pk.rev;delete t.pendingRev;
}
let REV_NOTE='';
const FIRST_DAY=[
  {cat:'Pierwszy dzień na miejscu',t:'Karta SIM / eSIM — znaleźć sklep albo ofertę, porównać pakiety danych',w:'SIM',on:'day0'},
  {cat:'Pierwszy dzień na miejscu',t:'Bankomat bez prowizji — sprawdzić, które banki nie doliczają opłaty; zawsze rozliczenie w lokalnej walucie (odrzuć DCC)',w:'ATM',on:'day0'},
  {cat:'Pierwszy dzień na miejscu',t:'Transport z lotniska do miasta — autobus / taxi / aplikacja, orientacyjna cena',w:'dojazd',on:'day0'},
  {cat:'Pierwszy dzień na miejscu',t:'Zapisać mapę offline okolicy (zakładka Mapa, na wifi)',w:'mapa',on:'day0'},
  {cat:'Przed wyjazdem',t:'Ubezpieczenie obejmujące kraj docelowy (EKUZ działa tylko w UE/EOG)',w:'dok'},
  {cat:'Przed wyjazdem',t:'Ważność paszportu i wiza / e-wiza',w:'dok'},
  {cat:'Przed wyjazdem',t:'Pierwszy backup danych z apki (stopka)',w:'dane'}
];
function blankTrip(o){
  return{id:'t'+uid(),pack:null,name:o.name||'Nowa wyprawa',emoji:o.emoji||'🧭',start:o.start||isoToday(),
    cur:o.cur||'EUR',extra:o.cur==='EUR'?['USD']:['EUR'],stages:[],
    checks:FIRST_DAY.map(c=>Object.assign({done:false},c)),budget:[],picked:{},ferry:{},plan:null,booking:{}};
}

/* ---------- migracja ze starych apek (arm-* i ret-*) ---------- */
function migrateArmenia(){
  const t=freshTrip('armenia');
  const ed=load('arm-dayedits',{}),fl=load('arm-dayflags',{}),fd=load('arm-dayfood',{}),
        st=load('arm-stays',{}),ck=load('arm-checks',{}),sd=load('arm-seedone',{}),bk=load('arm-booked',{});
  t.stages.forEach(s=>{
    const i=s.armIdx,e=ed[i]||{};
    if(e.transport)s.carrier=e.transport;
    if(e.transportDetail)s.carrier=(s.carrier?s.carrier+' · ':'')+e.transportDetail;
    if(e.detail)s.detail=e.detail;
    if(e.note)s.note=e.note;
    if(fl[i]&&fl[i].star)s.star=true;
    if(Array.isArray(fd[i])&&fd[i].length)s.food=fd[i];
    if(i===PACKS.armenia.booking.stageIdx)s.extra='booking';
  });
  const STAYMAP={0:0,1:2,2:3,3:4,4:6};
  Object.keys(st).forEach(k=>{
    const v=st[k]||{},si=STAYMAP[k];if(si==null||!v.name)return;
    const s=t.stages.find(x=>x.armIdx===si);if(!s)return;
    s.stay=[v.name,v.addr].filter(Boolean).join(' · ');
    if(v.price)s.note=(s.note?s.note+' ':'')+'Nocleg: '+v.price+'.';
    if(v.url)s.stayUrl=v.url;
  });
  t.checks.forEach(c=>{if(c.armIdx!=null&&ck[c.armIdx])c.done=true;});
  Object.keys(sd).forEach(k=>{if(sd[k])visited['armenia|'+k]=true;});
  t.booking=Object.assign({},bk);
  return t;
}
function migratePowrot(){
  const t=freshTrip('powrot');
  const rs=load('ret-stages2',null);
  if(Array.isArray(rs)&&rs.length){
    t.stages=rs.map(s=>{const o=Object.assign({},s);delete o._off;return o;});
    // oznaczenia bloków, gdyby ich brakowało w starych danych
    t.stages.forEach(s=>{if(!s.extra&&s.from==='Girne'&&s.to==='Taşucu')s.extra='ferry';
      if(!s.extra&&/Powrót do Polski/.test(s.title||''))s.extra='return';});
  }
  const rc=load('ret-checks2',null);
  if(Array.isArray(rc)&&rc.length){
    const fresh=t.checks.filter(c=>/^Pierwszy dzień/.test(c.cat));
    t.checks=fresh.concat(rc.filter(c=>!/^Pierwszy dzień/.test(c.cat)));
  }
  const rb=load('ret-budget',null);if(Array.isArray(rb))t.budget=rb;
  const rf=load('ret-ferry',null);if(rf)t.ferry=rf;
  t.plan=load('ret-plan',null);
  const rv=load('ret-variant',null);if(rv)t.picked['Warianty przez Turcję']=rv;
  const ro=load('ret-retopt',null);if(ro)t.picked['Powrót do Polski']=ro;
  const rst=load('ret-start',null);if(rst)t.start=rst;
  return t;
}
/* znane ustawienia pakietów przy każdym starcie (uzupełnienia bez nadpisywania Twoich zmian) */
function patchTrip(t){
  if(t.pack==='powrot'){
    // nowe zadania „pierwszego dnia” — dopisz, jeśli ich nie ma
    PACKS.powrot.checks.filter(c=>/^Pierwszy dzień/.test(c.cat)).forEach(c=>{
      if(!t.checks.some(x=>x.t===c.t))t.checks.unshift(Object.assign({done:false},c));
    });
    t.checks.forEach(c=>{
      if(/Cypr/.test(c.cat)&&!c.on)c.on='Larnaka';
      if(/Turcja/.test(c.cat)&&/^Pierwszy/.test(c.cat)&&!c.on)c.on='Taşucu';
    });
  }
  const Pk=t.pack&&PACKS[t.pack];
  if(Pk&&Pk.rev&&(t.packRev||1)<Pk.rev&&!t.pendingRev){
    if(!t.stages.some(s=>s.src==='user')){applyPackRev(t);REV_NOTE='Plan „'+t.name+'” zaktualizowany do Twojej prawdziwej trasy';}
    else t.pendingRev=true;
  }
  if(t.pack==='armenia'&&!t.stages.some(s=>s.extra==='booking')){
    const b=t.stages.find(s=>s.armIdx===PACKS.armenia.booking.stageIdx);if(b)b.extra='booking';}
  if(!t.extra)t.extra=[];
  if(!t.picked)t.picked={};
  t.stages.forEach(s=>{if(s.mode&&!MODES[s.mode])s.mode='bus';});
  return t;
}

if(!Array.isArray(trips)||!trips.length){
  trips=[migrateArmenia(),migratePowrot()];
  save(K.visited,visited);
  save(K.migrated,Date.now());
}
/* wyprawa „Powrót do domu” — dodawana raz */
if(!load(K.domAdded,false)&&!trips.some(t=>t.id==='dom')){
  trips.push(freshTrip('dom'));save(K.domAdded,true);
  const pw=trips.find(t=>t.id==='powrot');if(pw&&!pw.dormant){pw.dormant=true;pw.dormantAt=Date.now();}
}
/* wyprawa „Cabo Verde” — dodawana raz */
if(!load(K.caboAdded,false)&&!trips.some(t=>t.id==='cabo')){
  trips.push(freshTrip('cabo'));save(K.caboAdded,true);
}
trips=trips.map(patchTrip);
saveTrips();

/* ---------- pomysły i research ---------- */
let ideas=load(K.ideas,[]);
if(!Array.isArray(ideas))ideas=[];
function saveIdeas(){save(K.ideas,ideas);}
const IDEA_CATS=[['miejsce','◇ Miejsce'],['jedzenie','◍ Jedzenie'],['nocleg','🛏 Nocleg'],['transport','🚌 Transport'],['sprawdzic','? Do sprawdzenia'],['inne','• Inne']];
const COUNTRY_SKELETON=[
 ['sprawdzic','Waluta i kurs','Ile kosztuje dzień? Gotówka czy karta? Które bankomaty bez prowizji?'],
 ['sprawdzic','Wjazd i dokumenty','Wiza czy bezwizowo, ile dni, jaka ważność paszportu, czy jest opłata graniczna.'],
 ['sprawdzic','Ubezpieczenie i zdrowie','Co obejmuje polisa, czy działa EKUZ, szczepienia, apteki.'],
 ['sprawdzic','Internet','eSIM kupiony przed wyjazdem czy lokalna karta na miejscu. Ceny pakietów danych.'],
 ['transport','Transport między miastami','Kolej, autobusy, marszrutki, aplikacje do kupowania biletów. Ile trwa najdłuższy odcinek.'],
 ['transport','Dojazd z lotniska','Autobus, taxi, aplikacja. Orientacyjna cena i ostatni kurs w nocy.'],
 ['sprawdzic','Sezon i pogoda','Temperatury, deszcze, co spakować. Co jest zamknięte poza sezonem.'],
 ['sprawdzic','Święta i dni wolne','Czy w terminie wyjazdu wypada coś, co zamyka muzea albo zapycha transport.'],
 ['sprawdzic','Prąd i gniazdka','Wtyczka, napięcie, czy potrzebny adapter.'],
 ['sprawdzic','Bezpieczeństwo i naciągacze','Typowe oszustwa, taksówki, dzielnice do omijania po zmroku.'],
 ['sprawdzic','Język','Jakie pismo, czy alfabet trzeba znać, dziesięć zwrotów na start.'],
 ['jedzenie','Jedzenie','Pięć dań, które trzeba zjeść, trzy napoje, jedna rzecz, której lepiej unikać.'],
 ['miejsce','Must see','Pięć miejsc oczywistych i trzy, o których mało kto wie.'],
 ['nocleg','Noclegi','Które dzielnice, jakie ceny, czy trzeba rezerwować z wyprzedzeniem.'],
 ['sprawdzic','Budżet dzienny','Nocleg, jedzenie, transport, wstępy. Ile dziennie realnie.']
];
function addIdea(o){const i=Object.assign({id:'i'+uid(),trip:activeId,cat:'inne',t:'',d:'',url:'',done:false,ts:Date.now()},o);ideas.unshift(i);saveIdeas();return i;}
function tripIdeas(id){return ideas.filter(x=>x.trip===(id||activeId));}

/* ---------- aktywna wyprawa ---------- */
function tripRange(t){
  let off=0;t.stages.forEach(s=>{if(s.status!=='skip')off+=Math.max(0,num(s.nights));});
  return{start:t.start,end:addDays(t.start,off),days:off+1};
}
function pickDefaultTrip(){
  const q=new URLSearchParams(location.search).get('trip');
  if(q&&trips.some(t=>t.id===q))return q;
  const saved=lsGet(K.active);
  const today=isoToday();
  const awake=trips.filter(t=>!t.dormant);
  const live=awake.find(t=>{const r=tripRange(t);return today>=r.start&&today<=r.end;});
  if(live)return live.id;
  if(saved&&trips.some(t=>t.id===JSON.parse(saved)))return JSON.parse(saved);
  const upcoming=awake.filter(t=>t.start>=today).sort((a,b)=>a.start<b.start?-1:1)[0];
  return(upcoming||trips[0]).id;
}
let activeId=pickDefaultTrip();
save(K.active,activeId);
const T=()=>trips.find(t=>t.id===activeId)||trips[0];
const P=()=>(T().pack&&PACKS[T().pack])||null;

/* offsety dni i „dziś” */
function computeOffsets(t){
  t=t||T();let off=0;
  t.stages.forEach(s=>{s._off=off;if(s.status!=='skip')off+=Math.max(0,num(s.nights));});
  return off;
}
function todayIdx(t){return dayDiff((t||T()).start,isoToday());}
function stagesOnDay(d,t){t=t||T();computeOffsets(t);return t.stages.filter(s=>s._off===d&&s.status!=='skip');}


/* ============ PLAN: etapy ============ */
let editMode={},orderMode=false,planScrolled=false;

function stageTitle(s){return s.title||((s.from||'?')+(isTransfer(s)?' → '+(s.to||'?'):''));}
function currOpts(){const t=T();return[...new Set([toSym(t.cur),...t.extra.map(toSym),'€','$','zł'])];}
function modeSelect(i,s){
  return '<select data-i="'+i+'" data-k="mode">'+Object.keys(MODES).map(k=>
    '<option value="'+k+'"'+(s.mode===k?' selected':'')+'>'+MODES[k].i+' '+MODES[k].l+(s.modeSug===k?' ★ sugerowany':'')+'</option>').join('')+'</select>';
}
function currSelect(i,k,val){
  const o=currOpts();if(val&&!o.includes(val))o.unshift(val);
  return '<select data-i="'+i+'" data-k="'+k+'">'+o.map(c=>'<option'+(val===c?' selected':'')+'>'+c+'</option>').join('')+'</select>';
}

/* ---- blok promu (pakiet Powrót) ---- */
function ferryHTML(){
  const F=P()&&P().ferry;if(!F)return'';
  const t=T(),fd=t.ferry||{};
  let h='';
  F.facts.forEach(f=>{
    h+='<div class="fact'+(f.cls?' '+f.cls:'')+'"><h3>'+esc(f.title)+' <span class="tagv '+f.badge+'">'+esc(f.badgeTxt)+'</span></h3><div class="sub">'+esc(f.sub)+'</div>';
    if(f.rows)h+=f.rows.map(r=>'<div class="frow"><span class="fk">'+r[0]+'</span><span class="fv">'+r[1]+'</span></div>').join('');
    if(f.tl)h+='<ul class="tl">'+f.tl.map(x=>'<li class="'+(x.c||'')+'"><b>'+esc(x.t)+'</b>'+esc(x.x)+'</li>').join('')+'</ul>';
    if(f.after)h+='<div class="frow" style="border:0;padding-top:12px"><span class="fv" style="font-size:13px;color:var(--muted)">'+f.after+'</span></div>';
    if(f.call)h+='<a class="callbtn" href="'+f.call.href+'">'+esc(f.call.txt)+'</a>';
    h+='</div>';
  });
  h+='<div class="var-sect">Dwa plany na dzień z dentystą</div><div class="plan-grid">';
  F.plans.forEach(p=>{
    h+='<div class="fact'+(t.plan===p.id?' ok':'')+'" style="margin-bottom:0"><h3>'+esc(p.title)+(t.plan===p.id?' <span class="tagv ok">wybrany</span>':'')+'</h3><div class="sub">'+esc(p.tag)+'</div>'+
      '<div class="pc pro" style="margin-bottom:10px"><h5>Za</h5><ul>'+p.pros.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
      '<div class="pc con"><h5>Przeciw</h5><ul>'+p.cons.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+
      '<div class="frow" style="border:0;padding-top:12px"><span class="fv" style="font-size:13px"><b>Kiedy:</b> '+esc(p.when)+'</span></div>'+
      '<button class="var-pick" style="margin-top:4px" data-plan="'+p.id+'">'+(t.plan===p.id?'✓ Wybrany':'Wybieram plan '+p.id)+'</button></div>';
  });
  h+='</div><div class="fact sea" style="margin-top:16px"><h3>Moje dane promu</h3><div class="inp-grid">'+
    [['ref','Nr rezerwacji','—'],['price','Cena biletu','np. ₺2450'],['night','Godzina rejsu','np. 23:30'],['notes','Notatki','bagaż, odprawa…']]
      .map(f=>'<div><label>'+f[1]+'</label><input data-f="'+f[0]+'" value="'+attr(fd[f[0]])+'" placeholder="'+f[2]+'"></div>').join('')+
    '</div><div class="saved-note" id="ferry-saved">Zapisano ✓</div></div>';
  return h;
}
function bookingHTML(){
  const b=T().booking||{},pub=P()&&P().booking&&P().booking.pub;
  const F=[['addr','Adres'],['code','Kod rezerwacji'],['tel','Telefon do gospodyni'],['url','Link do ogłoszenia']];
  return '<div class="inline-ferry"><div class="fact ok" style="margin-bottom:0"><h3>Rezerwacja'+(pub?' · '+esc(pub.nights):'')+'</h3>'+
    (pub?'<div class="sub">'+esc(pub.checkin)+' → '+esc(pub.checkout)+' · '+esc(pub.price)+'</div>':'')+
    '<div class="inp-grid">'+F.map(f=>'<div><label>'+f[1]+'</label><input data-bk="'+f[0]+'" value="'+attr(b[f[0]])+'" placeholder="zapisze się tylko w tym telefonie"></div>').join('')+'</div>'+
    (b.tel?'<a class="callbtn" href="tel:'+attr(String(b.tel).replace(/\s/g,''))+'">☎ Zadzwoń</a> ':'')+
    (b.url?'<a class="callbtn" style="background:var(--cop)" href="'+attr(b.url)+'" target="_blank" rel="noopener">Ogłoszenie ↗</a>':'')+
    (pub&&pub.note?'<div class="frow" style="border:0;padding-top:12px"><span class="fv" style="font-size:13px;color:var(--muted)">'+esc(pub.note)+'</span></div>':'')+
    '</div></div>';
}

function dayLabel(t,off){
  if(t.dateless)return{d:'DZIEŃ '+(off+1),dow:'',full:'dzień '+(off+1)+' wyprawy'};
  return dateFor(t.start,off);
}
function renderStage(i){
  const t=T(),s=t.stages[i],m=MODES[s.mode]||MODES.stay,dt=dayLabel(t,s._off);
  const tIdx=todayIdx();
  const isToday=s.status!=='skip'&&(s._off===tIdx);
  const cls=['day'];
  if(s.mode==='ferry')cls.push('sea');
  if(s.mode==='med')cls.push('med');
  if(s.status)cls.push('st-'+s.status);
  if(isToday)cls.push('st-today');
  const c=el('div',cls.join(' '));c.id='st-'+i;
  const editing=!!editMode[i];
  const times=[s.dep,s.arr].filter(Boolean).join(' → ')||'—';
  const priceTxt=(s.price!==''&&s.price!=null)?(s.price+' '+s.curr):'—';
  const n=num(s.nights);
  const stayTxt=s.stay?(s.stay+(s.stayPrice?' · '+s.stayPrice+' '+(s.curr2||toSym(t.cur)):'')):(n?plural(n,'noc','noce','nocy')+' — dopisz gdzie':'—');
  const lc=stageLocal(s);

  let extra='';
  if(s.extra==='ferry')extra='<div class="inline-ferry" id="ferry-block">'+ferryHTML()+'</div>';
  if(s.extra==='booking')extra=bookingHTML();
  if(s.extra==='return'){
    const grp=(P()&&P().options||[]).find(g=>!g.insert);
    const r=grp&&grp.items.find(x=>x.id===t.picked[grp.group]);
    extra='<div class="inline-ferry">'+(r?'<div class="fact ok" style="margin-bottom:10px"><h3>Wybrana droga: '+esc(r.n)+'</h3><div class="sub">'+esc(r.m)+' · '+esc(r.c)+'</div></div>':'')+
      '<div style="font-size:13.5px;color:var(--muted)">Opcje powrotu są w sekcji pod listą etapów.</div></div>';
  }
  const food=(s.food&&s.food.length)?'<div class="dv-row"><span class="dv-k">Jedzenie</span><span class="dv-v"><div class="food-l">'+
    s.food.map(f=>'<div>'+esc(f.name)+(f.meta?' <small>· '+esc(f.meta)+'</small>':'')+'</div>').join('')+'</div></span></div>':'';

  const readView=
    (isTransfer(s)&&lc.loc&&lc.loc!==s.to?'<div class="dv-row"><span class="dv-k">Cel</span><span class="dv-v"><b style="font-size:17px">'+esc(lc.loc)+'</b>'+(lc.say?' <span class="dv-sub">['+esc(lc.say)+']</span>':'')+'</span></div>':'')+
    '<div class="dv-row"><span class="dv-k">Transport</span><span class="dv-v"><span class="mode-pill'+(s.mode===s.modeSug?' sug':'')+'">'+m.i+' '+esc(m.l)+'</span>'+
      (s.carrier?' <span class="dv-sub">'+esc(s.carrier)+'</span>':'')+(s.via?' <span class="dv-sub">· przez '+esc(s.via)+'</span>':'')+'</span></div>'+
    '<div class="dv-row"><span class="dv-k">Godziny</span><span class="dv-v times">'+esc(times)+'</span></div>'+
    '<div class="dv-row"><span class="dv-k">Cena</span><span class="dv-v">'+esc(priceTxt)+'</span></div>'+
    '<div class="dv-row"><span class="dv-k">Nocleg</span><span class="dv-v">'+esc(stayTxt)+(s.stayUrl?' <a href="'+attr(s.stayUrl)+'" target="_blank" rel="noopener">↗</a>':'')+'</span></div>'+
    (s.detail?'<div class="dv-row"><span class="dv-k">Program</span><span class="dv-v">'+esc(s.detail)+'</span></div>':'')+
    (s.note?'<div class="dv-row"><span class="dv-k">Uwagi</span><span class="dv-v dv-note">'+esc(s.note)+'</span></div>':'')+food+
    '<div class="dv-actions"><button class="day-edit-btn" data-edit="'+i+'">✎ Edytuj</button>'+
      '<span class="stage-src">'+(s.src==='variant'?'z wariantu':s.src==='user'?'własny':'')+'</span></div>'+extra;

  const g=gaz(s.to);
  const editView=
    '<div class="edit-grid">'+
      '<div class="f2"><div><label>Skąd</label><input data-i="'+i+'" data-k="from" value="'+attr(s.from)+'"></div>'+
      '<div><label>Dokąd</label><input data-i="'+i+'" data-k="to" value="'+attr(s.to)+'"></div></div>'+
      '<label>Tytuł własny (puste = „skąd → dokąd”)</label><input data-i="'+i+'" data-k="title" value="'+attr(s.title)+'">'+
      '<label>Środek transportu</label>'+modeSelect(i,s)+
      '<label>Przewoźnik / linia / nr rezerwacji</label><input data-i="'+i+'" data-k="carrier" value="'+attr(s.carrier)+'">'+
      '<div class="f2"><div><label>Odjazd</label><input data-i="'+i+'" data-k="dep" value="'+attr(s.dep)+'" placeholder="np. 10:15"></div>'+
      '<div><label>Przyjazd</label><input data-i="'+i+'" data-k="arr" value="'+attr(s.arr)+'" placeholder="np. ~11:30"></div></div>'+
      '<div class="f2"><div><label>Cena przejazdu</label><div class="price-row"><input data-i="'+i+'" data-k="price" value="'+attr(s.price)+'" inputmode="decimal">'+currSelect(i,'curr',s.curr||toSym(t.cur))+'</div></div>'+
      '<div><label>Cena noclegu</label><div class="price-row"><input data-i="'+i+'" data-k="stayPrice" value="'+attr(s.stayPrice)+'" inputmode="decimal">'+currSelect(i,'curr2',s.curr2||toSym(t.cur))+'</div></div></div>'+
      '<label>Nocleg (miejsce / hotel)</label><input data-i="'+i+'" data-k="stay" value="'+attr(s.stay)+'">'+
      '<label>Krótki opis (na zwiniętej karcie)</label><input data-i="'+i+'" data-k="see" value="'+attr(s.see)+'">'+
      '<label>Program</label><textarea data-i="'+i+'" data-k="detail" rows="4">'+esc(s.detail)+'</textarea>'+
      '<label>Uwagi</label><textarea data-i="'+i+'" data-k="note" rows="3">'+esc(s.note)+'</textarea>'+
      '<label>Cel w lokalnym piśmie · wymowa (do dużej tablicy „Dziś”)</label>'+
      '<div class="f2"><input data-i="'+i+'" data-k="loc" value="'+attr(s.loc)+'" placeholder="'+attr(g?g.loc:'np. Երևան')+'">'+
      '<input data-i="'+i+'" data-k="say" value="'+attr(s.say)+'" placeholder="'+attr(g?g.say:'np. je-re-WAN')+'"></div>'+
      '<label>Współrzędne celu (mapa, pogoda)</label>'+
      '<div class="f2"><input data-i="'+i+'" data-k="lat" value="'+attr(s.lat)+'" placeholder="'+(g?g.c[0]:'szer.')+'" inputmode="decimal">'+
      '<input data-i="'+i+'" data-k="lng" value="'+attr(s.lng)+'" placeholder="'+(g?g.c[1]:'dł.')+'" inputmode="decimal"></div>'+
      '<button class="geo-btn" data-geocode="'+i+'">🔎 Znajdź „'+esc(s.to||'—')+'”</button> '+
      '<button class="geo-btn" data-gps="'+i+'">📍 Tu jestem</button><div class="geo-msg" id="geo-'+i+'"></div>'+
    '</div>'+
    '<div class="dv-actions"><button class="day-done-btn" data-done="'+i+'">✓ Gotowe</button></div>';

  c.innerHTML=
    '<div class="day-top">'+
      '<div class="date-badge'+(s.mode==='med'||s.mode==='ferry'?' hot':'')+'"><span class="wd">'+esc(dt.d)+'</span><span class="d">'+esc(s.dep||'—')+'</span><span class="m">'+esc(dt.wd)+'</span></div>'+
      '<div class="day-head-txt"><div class="day-route">'+esc(stageTitle(s))+(isToday?'<span class="today-pill">dziś</span>':'')+(s.star?' <span style="color:var(--gold)">★</span>':'')+'</div>'+
        '<div class="day-see">'+esc(s.see)+'</div>'+
        (function(){const c=(typeof onsiteForStage==='function')?onsiteForStage(T(),s):0;
          return c?'<div class="day-cash">⌂ Płatność na miejscu: <b>'+fmt(c)+' zł</b></div>':'';})()+
        '</div>'+
      '<span class="chip">'+m.i+' '+esc(m.s)+'</span><span class="expand">⌄</span>'+
    '</div>'+
    '<div class="status-bar">'+
      '<button class="st-btn done'+(s.status==='done'?' on':'')+'" data-st="'+i+'" data-v="done">✓ odbyło się</button>'+
      '<button class="st-btn skip'+(s.status==='skip'?' on':'')+'" data-st="'+i+'" data-v="skip">⤳ pomijam</button>'+
      '<span class="st-nights">noce <button class="nb" data-nm="'+i+'">−</button><b>'+n+'</b><button class="nb" data-np="'+i+'">+</button></span>'+
    '</div>'+
    (orderMode?'<div class="order-bar"><button class="ord-btn" data-up="'+i+'">↑</button><button class="ord-btn" data-down="'+i+'">↓</button>'+
      '<button class="ord-btn" data-ins="'+i+'" title="wstaw etap poniżej">＋</button><button class="ord-btn del" data-del="'+i+'">🗑 usuń</button></div>':'')+
    '<div class="day-body"><div class="day-body-inner">'+(editing?editView:readView)+'</div></div>';
  c.querySelector('.day-top').onclick=()=>c.classList.toggle('open');
  if(isToday&&!editing)c.classList.add('open');
  return c;
}
function buildStages(openIdx){
  const t=T(),total=computeOffsets(t);
  const w=$('#stages');w.innerHTML='';
  if(!t.stages.length)w.innerHTML='<div class="empty">Brak etapów. Dodaj pierwszy przyciskiem „+ Etap”.</div>';
  t.stages.forEach((s,i)=>{const n=renderStage(i);if(openIdx===i)n.classList.add('open');w.appendChild(n);});
  const act=t.stages.filter(s=>s.status!=='skip').length,skipped=t.stages.length-act,done=t.stages.filter(s=>s.status==='done').length;
  $('#stage-count').textContent=plural(act,'etap','etapy','etapów')+(skipped?' · '+skipped+' pomin.':'')+(done?' · '+done+' odbyte':'');
  if(t.dateless){
    $('#trip-sum').innerHTML='<b>Termin nieustalony</b>'+plural(total+1,'dzień','dni','dni')+' · daty policzą się po wybraniu startu';
  }else{
    const end=dateFor(t.start,total);
    $('#trip-sum').innerHTML='<b>'+esc(dateFor(t.start,0).d+' → '+end.d)+'</b>'+plural(total+1,'dzień','dni','dni')+' · koniec '+esc(end.full);
  }
  $('#trip-start').value=t.start;
  $('#trip-start').disabled=!!t.dateless;
  $('#trip-nodate').checked=!!t.dateless;
  $('.trip-bar').classList.toggle('nod',!!t.dateless);
  buildWindows();
  buildHeader();a11y(w);
}
function scrollToToday(){
  const d=$('#stages .st-today');
  if(d){d.classList.add('open');d.scrollIntoView({behavior:'smooth',block:'start'});return true;}
  return false;
}
function buildHeader(){
  const t=T();
  $('#trip-name').textContent=t.emoji+' '+t.name;
  $('#h1').textContent=t.name.toUpperCase();
  $('#hdr-mark').textContent=t.emoji||'✦';
  $('#foot-name').textContent=t.name+' · '+(new Date(dAt(t.start))).getFullYear();
  const r=tripRange(t);
  $('#brand-dates').textContent=t.dateless?(plural(r.days,'dzień','dni','dni')+' · termin nieustalony'):(dateFor(t.start,0).d+' → '+dateFor(t.start,r.days-1).d);
  const parts=[];
  t.stages.forEach(s=>{
    const nm=(s.to&&s.to!=='—')?s.to:s.from;if(!nm)return;
    const last=parts[parts.length-1];
    if(last&&sameLoc(last.n,nm)){if(s.status!=='skip')last.skip=false;if(s.status==='done')last.done=true;return;}
    parts.push({n:nm,skip:s.status==='skip',done:s.status==='done'});
  });
  const f=t.stages[0]&&t.stages[0].from;
  const all=(f&&!(parts[0]&&sameLoc(parts[0].n,f))?[{n:f,done:t.stages[0].status==='done'}]:[]).concat(parts);
  const ti=todayIdx(),today=stagesOnDay(ti)[0]||coveringStage(ti);
  const cur=today&&((today.to&&today.to!=='—')?today.to:today.from);
  let curMarked=false;
  $('#route-line').innerHTML=all.map(p=>{
    const x=esc(p.n);
    if(p.skip)return'<s>'+x+'</s>';
    if(!curMarked&&cur&&sameLoc(p.n,cur)&&!p.done){curMarked=true;return'<em>'+x+'</em>';}
    if(p.done)return'<u>'+x+'</u>';return x;
  }).join(' <i>·</i> ');
}
function coveringStage(d){
  const t=T();computeOffsets(t);let c=null;
  t.stages.forEach(s=>{if(s.status!=='skip'&&s._off<=d)c=s;});
  return c;
}

/* ---- sugerowane terminy z pakietu ---- */
function buildWindows(){
  const w=$('#windows'),p=P();
  const list=(p&&p.windows)||[];
  if(!list.length){w.innerHTML='';return;}
  const t=T();
  w.innerHTML='<div class="win-h">Sugerowane terminy</div><div class="wins">'+list.map((x,i)=>
    '<button class="win'+(!t.dateless&&t.start===x.start?' on':'')+'" data-win="'+i+'">'+
    '<b>'+esc(x.name)+'</b><span>'+esc(x.when)+'</span><small>'+esc(x.why)+'</small></button>').join('')+'</div>';
}
$('#windows').addEventListener('click',e=>{
  const b=e.target.closest('[data-win]');if(!b)return;
  const x=(P().windows||[])[+b.dataset.win];if(!x)return;
  const t=T();t.start=x.start;t.dateless=false;saveTrips();buildStages();
  toast('Start ustawiony na '+dateFor(x.start,0).full);
});
$('.trip-bar').addEventListener('click',e=>{
  const sh=e.target.closest('[data-shift]');
  if(sh){const t=T();if(t.dateless)return;t.start=addDays(t.start,+sh.dataset.shift);saveTrips();buildStages();return;}
});
$('#trip-nodate').addEventListener('change',e=>{
  const t=T();t.dateless=e.target.checked;saveTrips();buildStages();
  toast(t.dateless?'Daty ukryte — zostają numery dni':'Daty włączone');
});

/* ---- zdarzenia etapów ---- */
$('#trip-start').addEventListener('change',e=>{
  const v=e.target.value;if(!v||isNaN(dAt(v))){e.target.value=T().start;return;}
  T().start=v;saveTrips();buildStages();
});
$('#stages').addEventListener('input',e=>{
  const t=T();
  const fi=e.target.closest('[data-f]');
  if(fi){t.ferry=t.ferry||{};t.ferry[fi.dataset.f]=fi.value;saveTrips();
    const n=$('#ferry-saved');if(n){n.classList.add('show');clearTimeout(window._fs);window._fs=setTimeout(()=>n.classList.remove('show'),1300);}return;}
  const bi=e.target.closest('[data-bk]');
  if(bi){t.booking=t.booking||{};t.booking[bi.dataset.bk]=bi.value;saveTrips();return;}
  const inp=e.target.closest('[data-k]');if(!inp)return;
  t.stages[+inp.dataset.i][inp.dataset.k]=inp.value;saveTrips();buildHeader();
});
$('#stages').addEventListener('change',e=>{
  const sel=e.target.closest('select[data-k]');if(!sel)return;
  T().stages[+sel.dataset.i][sel.dataset.k]=sel.value;saveTrips();
});
$('#stages').addEventListener('click',async e=>{
  const t=T();
  const pl_=e.target.closest('[data-plan]');
  if(pl_){t.plan=(t.plan===pl_.dataset.plan)?null:pl_.dataset.plan;saveTrips();const b=$('#ferry-block');if(b)b.innerHTML=ferryHTML();return;}
  const ed=e.target.closest('[data-edit]');if(ed){editMode[+ed.dataset.edit]=true;buildStages(+ed.dataset.edit);return;}
  const dn=e.target.closest('[data-done]');if(dn){editMode[+dn.dataset.done]=false;buildStages(+dn.dataset.done);return;}
  const st=e.target.closest('[data-st]');
  if(st){const i=+st.dataset.st,v=st.dataset.v;t.stages[i].status=(t.stages[i].status===v)?'':v;saveTrips();buildStages();return;}
  const nm=e.target.closest('[data-nm]');if(nm){const i=+nm.dataset.nm;t.stages[i].nights=Math.max(0,num(t.stages[i].nights)-1);saveTrips();buildStages(i);return;}
  const np=e.target.closest('[data-np]');if(np){const i=+np.dataset.np;t.stages[i].nights=num(t.stages[i].nights)+1;saveTrips();buildStages(i);return;}
  const up=e.target.closest('[data-up]');if(up){const i=+up.dataset.up;if(i>0){[t.stages[i-1],t.stages[i]]=[t.stages[i],t.stages[i-1]];editMode={};saveTrips();buildStages();}return;}
  const dw=e.target.closest('[data-down]');if(dw){const i=+dw.dataset.down;if(i<t.stages.length-1){[t.stages[i+1],t.stages[i]]=[t.stages[i],t.stages[i+1]];editMode={};saveTrips();buildStages();}return;}
  const ins=e.target.closest('[data-ins]');if(ins){const i=+ins.dataset.ins;const prev=t.stages[i];
    t.stages.splice(i+1,0,newStage(prev?prev.to:''));editMode={};editMode[i+1]=true;saveTrips();buildStages(i+1);
    const nd=$('#st-'+(i+1));if(nd)nd.scrollIntoView({behavior:'smooth',block:'center'});return;}
  const dl=e.target.closest('[data-del]');if(dl){const i=+dl.dataset.del;if(confirm('Usunąć etap „'+stageTitle(t.stages[i])+'”?')){t.stages.splice(i,1);editMode={};saveTrips();buildStages();}return;}
  const gc=e.target.closest('[data-geocode]');
  if(gc){const i=+gc.dataset.geocode,s=t.stages[i],msg=$('#geo-'+i);
    const g=gaz(s.to);if(g&&!navigator.onLine){s.lat=g.c[0];s.lng=g.c[1];saveTrips();buildStages(i);return;}
    msg.textContent='Szukam…';
    try{const r=await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&language=pl&name='+encodeURIComponent(s.to||s.title));
      const j=await r.json();const x=j.results&&j.results[0];
      if(x){s.lat=+x.latitude.toFixed(4);s.lng=+x.longitude.toFixed(4);saveTrips();buildStages(i);
        const m2=$('#geo-'+i);if(m2)m2.textContent='✓ '+x.name+(x.country?', '+x.country:'');}
      else msg.textContent='Nie znalazłem — wpisz ręcznie albo użyj „Tu jestem”.';
    }catch(err){msg.textContent=g?'Offline — użyłem wbudowanych współrzędnych.':'Brak sieci.';if(g){s.lat=g.c[0];s.lng=g.c[1];saveTrips();}}
    return;}
  const gp=e.target.closest('[data-gps]');
  if(gp){const i=+gp.dataset.gps,msg=$('#geo-'+i);msg.textContent='Ustalam pozycję…';
    getPos().then(p=>{t.stages[i].lat=+p.lat.toFixed(5);t.stages[i].lng=+p.lng.toFixed(5);saveTrips();buildStages(i);},
      err=>{msg.textContent='Nie udało się: '+err;});return;}
});
function newStage(from){
  return{title:'',from:from||'',to:'',mode:'bus',modeSug:'bus',nights:1,status:'',dep:'',arr:'',carrier:'',
    price:'',curr:toSym(T().cur),stay:'',stayPrice:'',curr2:toSym(T().cur),src:'user',see:'',detail:'',note:''};
}
$('#add-stage').addEventListener('click',()=>{
  const t=T(),last=t.stages[t.stages.length-1];
  // wstaw przed etapem „ogonowym” (np. powrót), jeśli taki jest
  const tail=t.stages.findIndex(s=>s.src==='tail');
  const at=tail<0?t.stages.length:tail;
  t.stages.splice(at,0,newStage(last?last.to:''));
  editMode={};editMode[at]=true;saveTrips();buildStages(at);
  const n=$('#st-'+at);if(n)n.scrollIntoView({behavior:'smooth',block:'center'});
});
$('#jump-today').addEventListener('click',()=>{if(!scrollToToday())toast('Dziś nie przypada żaden etap tej wyprawy.');});
$('#order-mode').addEventListener('click',e=>{orderMode=!orderMode;e.target.classList.toggle('on',orderMode);buildStages();});
$('#reset-stages').addEventListener('click',()=>{
  const t=T();if(!t.pack){toast('Własna wyprawa nie ma wersji domyślnej.');return;}
  if(!confirm('Przywrócić domyślne etapy „'+t.name+'”? Twoje zmiany w etapach przepadną.'))return;
  t.stages=JSON.parse(JSON.stringify(PACKS[t.pack].stages));editMode={};saveTrips();buildStages();
});

/* ============ OPCJE (warianty, powroty) ============ */
function buildOptions(){
  const w=$('#options');w.innerHTML='';
  const t=T(),groups=(P()&&P().options)||[];
  groups.forEach((g,gi)=>{
    const pick=t.picked[g.group];
    const pickedItem=g.items.find(x=>x.id===pick);
    const f=el('div','fold');f.id='fold-'+gi;
    let inner='';
    if(g.insert&&pickedItem){
      const already=t.stages.some(s=>s.src==='variant'&&s.vid===pickedItem.id);
      inner+='<div class="insert-box"><p>Wybrany: <b>'+esc(pickedItem.name)+'</b> — '+plural(pickedItem.legs.length,'odcinek','odcinki','odcinków')+'.'+
        (already?' Odcinki są już w planie.':'')+'</p><button class="insert-btn" data-insert="'+gi+'">'+(already?'↻ Wstaw ponownie (nadpisze)':'→ Wstaw do planu')+'</button></div>';
    }
    g.items.forEach(v=>{
      const on=pick===v.id;
      if(g.insert){
        inner+='<div class="var'+(on?' picked':'')+'"><div class="var-top"><div class="var-letter">'+esc(v.letter||'•')+'</div>'+
          '<div class="var-main"><div class="var-name">'+esc(v.name)+'</div><div class="var-tag">'+esc(v.tag||'')+'</div>'+
          '<div class="var-facts">'+(v.days?'<span class="vf time">'+esc(v.days)+'</span>':'')+(v.cash?'<span class="vf cash">'+esc(v.cash)+'</span>':'')+(v.diff?'<span class="vf">'+esc(v.diff)+'</span>':'')+'</div></div>'+
          '<button class="var-quick" data-pick="'+gi+'|'+v.id+'">'+(on?'✓ mój wybór':'Wybieram')+'</button><span class="expand">⌄</span></div>'+
          '<div class="var-body"><div class="var-body-inner">'+(v.short?'<div class="fact" style="margin:0 0 4px;padding:14px 16px;border-left:4px solid var(--olive)"><span style="font-size:13.5px">'+v.short+'</span></div>':'')+
          '<div class="var-sect">Odcinki</div>'+(v.legs||[]).map((l,n)=>'<div class="leg"><span class="leg-n">'+(n+1)+'</span><span class="leg-t"><b>'+esc(l.t)+'</b>'+
            (l.mode?'<span>'+MODES[l.mode].i+' '+esc(MODES[l.mode].l)+' · '+esc(l.dur||'')+' · ~'+l.price+(l.curr||'')+(l.nights?' · '+plural(l.nights,'noc','noce','nocy'):'')+'</span>':'')+
            '<span>'+(l.s||'')+'</span></span></div>').join('')+
          (v.pros?'<div class="pc-grid"><div class="pc pro"><h5>Za</h5><ul>'+v.pros.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul></div><div class="pc con"><h5>Przeciw</h5><ul>'+v.cons.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul></div></div>':'')+
          '</div></div></div>';
      }else{
        inner+='<div class="ropt '+(v.k||'')+(on?' open':'')+'"><div class="ropt-top"><div class="ropt-n"><b>'+esc(v.n)+(on?' ✓':'')+'</b><span>'+esc(v.sub||'')+'</span></div>'+
          '<div class="ropt-m"><b>'+esc(v.m||'')+'</b>'+esc(v.c||'')+'</div><span class="expand">⌄</span></div>'+
          '<div class="ropt-body"><div class="ropt-body-inner">'+(v.legs||[]).map((l,n)=>'<div class="rleg"><span class="rleg-n">'+(n+1)+'</span><span class="rleg-t"><b>'+esc(l.t)+'</b><span>'+l.s+'</span></span></div>').join('')+
          (v.v?'<div class="rverdict">'+v.v+'</div>':'')+'<button class="var-pick" style="margin-top:12px" data-pick="'+gi+'|'+v.id+'">'+(on?'✓ Tak wracam':'Tak wracam')+'</button></div></div></div>';
      }
    });
    f.innerHTML='<div class="fold-top"><div class="fold-ico">'+(g.insert?'⇄':'✈')+'</div><div class="fold-h"><div class="fold-n">'+esc(g.group)+'</div>'+
      '<div class="fold-s">'+(pickedItem?'Wybrane: '+esc(pickedItem.name||pickedItem.n):'Nic nie wybrano — rozwiń, żeby porównać.')+'</div></div><span class="expand">⌄</span></div>'+
      '<div class="fold-body"><div class="fold-body-inner">'+inner+'</div></div>';
    f.querySelector('.fold-top').onclick=()=>f.classList.toggle('open');
    f.querySelectorAll('.var-top').forEach(x=>x.onclick=ev=>{if(ev.target.closest('[data-pick]'))return;x.parentElement.classList.toggle('open');});
    f.querySelectorAll('.ropt-top').forEach(x=>x.onclick=()=>x.parentElement.classList.toggle('open'));
    w.appendChild(f);
  });
  a11y(w);
}
$('#options').addEventListener('click',e=>{
  const t=T(),groups=(P()&&P().options)||[];
  const pk=e.target.closest('[data-pick]');
  if(pk){const[gi,id]=pk.dataset.pick.split('|');const g=groups[+gi];
    t.picked[g.group]=(t.picked[g.group]===id)?null:id;saveTrips();
    const wasOpen=$('#fold-'+gi)&&$('#fold-'+gi).classList.contains('open');
    buildOptions();if(wasOpen)$('#fold-'+gi).classList.add('open');buildStages();drawRouteLayer();return;}
  const ins=e.target.closest('[data-insert]');
  if(ins){const g=groups[+ins.dataset.insert];const v=g.items.find(x=>x.id===t.picked[g.group]);if(!v)return;
    if(t.stages.some(s=>s.src==='variant')&&!confirm('Nadpisać wstawione wcześniej odcinki wariantu?'))return;
    t.stages=t.stages.filter(s=>s.src!=='variant'&&s.src!=='ph');
    const gen=v.legs.map(l=>({title:l.t,from:l.from,to:l.to,via:l.via||'',mode:l.mode,modeSug:l.mode,nights:l.nights||0,status:'',dep:l.dep||'',arr:'',carrier:'',
      price:String(l.price||''),curr:l.curr||toSym(t.cur),stay:l.nights?(l.stay||l.to):'',stayPrice:l.nights?String(Math.round(l.nights*30*rate('EUR')/rate(t.cur))):'',curr2:toSym(t.cur),
      src:'variant',vid:v.id,see:(l.dur||'')+(l.nights?' · '+plural(l.nights,'noc','noce','nocy'):' · bez noclegu'),detail:(l.s||'').replace(/<[^>]+>/g,''),note:l.note||''}));
    const tail=t.stages.findIndex(s=>s.src==='tail');
    t.stages.splice(tail<0?t.stages.length:tail,0,...gen);
    editMode={};saveTrips();buildStages();buildOptions();window.scrollTo({top:0,behavior:'smooth'});toast('Wstawiono '+plural(gen.length,'odcinek','odcinki','odcinków'));}
});

/* ---- karty informacyjne pakietu (np. loty) ---- */
/* pasek aktualizacji pakietu — NA GÓRZE planu, bo pod listą etapów nikt go nie znajdzie */
function revDot(){
  const b=document.querySelector('.tab[data-p="plan"]');
  if(b)b.classList.toggle('has-rev',!!(T()&&T().pendingRev));
}
function buildRevBar(){
  const w=$('#revbar');if(!w)return;
  w.innerHTML='';revDot();
  const t=T();if(!t.pendingRev)return;
  const Pk=t.pack&&PACKS[t.pack];
  const r=el('div','remind rev-top');
  r.innerHTML='<b>↻ Jest nowa wersja tego planu</b>'+
    '<p>Masz własne etapy, więc nie podmieniam ich sam. Zastosowanie wstawi zaktualizowaną trasę'+
    (Pk&&Pk.rev?' (wersja '+Pk.rev+')':'')+'. Twoje notatki, ceny i noclegi zostaną.</p>'+
    '<div class="rev-acts"><button class="insert-btn" id="rev-apply">Zastosuj nowy plan</button>'+
    '<button class="tb-btn" id="rev-skip">Nie teraz</button></div>';
  w.appendChild(r);
  r.querySelector('#rev-apply').onclick=()=>{
    applyPackRev(T());saveTrips();buildRevBar();revDot();buildStages();buildOptions();buildInfos();
    if(typeof buildHeader==='function')buildHeader();toast('Plan zaktualizowany');
    window.scrollTo({top:0,behavior:'smooth'});};
  r.querySelector('#rev-skip').onclick=()=>{w.innerHTML='';};
  setTimeout(()=>{try{r.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){}},200);
}
function buildInfos(){
  const w=$('#infos');w.innerHTML='';
  const info=(P()&&P().info)||[];if(!info.length)return;
  info.forEach((x,i)=>{
    const f=el('div','fold');
    const rows=Array.isArray(x.rows)?x.rows:[];
    const body=rows.length
      ? rows.map(r=>'<div class="irow"><span class="ik">'+esc(r[0])+'</span><div class="iv">'+(r[1]||'')+'</div></div>').join('')
      : ((x.sub?'<small>'+esc(x.sub)+'</small>':'')+(x.body?'<p>'+esc(x.body)+'</p>':''));
    f.innerHTML='<div class="fold-top"><div class="fold-ico" style="background:var(--burgundy)">i</div>'+
      '<div class="fold-h"><div class="fold-n">'+esc(x.title||'Informacje')+'</div>'+
      '<div class="fold-s">'+(rows.length?plural(rows.length,'pozycja','pozycje','pozycji'):'rozwiń')+'</div></div><span class="expand">⌄</span></div>'+
      '<div class="fold-body"><div class="fold-body-inner info-c">'+body+'</div></div>';
    f.querySelector('.fold-top').onclick=()=>f.classList.toggle('open');
    w.appendChild(f);
  });
}


/* ============ DZIŚ — ekran startowy w podróży ============ */
const WMO=c=>c===0?['☀','bezchmurnie']:c<=2?['🌤','lekkie zachmurzenie']:c===3?['☁','pochmurno']:c<=48?['🌫','mgła']:
  c<=57?['🌦','mżawka']:c<=67?['🌧','deszcz']:c<=77?['🌨','śnieg']:c<=82?['🌧','przelotne opady']:c<=86?['🌨','przelotny śnieg']:['⛈','burza'];

function todayCtx(){
  const t=T(),d=todayIdx(t),total=computeOffsets(t);
  const starting=t.stages.filter(s=>s._off===d&&s.status!=='skip');
  const cover=coveringStage(d);
  const after=t.stages.filter(s=>s._off>d&&s.status!=='skip');
  const open=t.stages.some(x=>x.src==='ph');
  return{t,d,total,starting,cover,next:after[0]||null,before:d<0,ended:d>total&&!open,openPlan:d>total&&open};
}
function destCard(c){
  const{t,d,starting,cover,next}=c;
  const tr=starting.filter(isTransfer);
  const s=tr.find(x=>x.status!=='done')||tr[tr.length-1]||null;
  if(s){
    const lc=stageLocal(s),m=MODES[s.mode]||MODES.bus;
    const others=tr.filter(x=>x!==s&&x.status!=='done');
    return '<div class="card dest">'+(s.status==='done'?'':'<div class="ultreia">Ultreia<span>naprzód, dalej</span></div>')+
      '<h4>'+(s.status==='done'?'Dziś dojechałeś do':'Dziś jedziesz do')+'</h4>'+
      '<div class="d-from">z '+esc(s.from)+(s.via?' · przez '+esc(s.via):'')+'</div>'+
      '<div class="d-to">'+esc(s.to)+'</div>'+
      (lc.loc&&norm(lc.loc)!==norm(s.to)?'<div class="d-loc">'+esc(lc.loc)+'</div>':'')+
      (lc.say?'<div class="d-say">wymowa: '+esc(lc.say)+'</div>':'')+
      '<div class="d-meta"><span>'+m.i+' '+esc(m.l)+'</span>'+(s.dep?'<span>⏱ '+esc(s.dep)+(s.arr?' → '+esc(s.arr):'')+'</span>':'')+
        (s.carrier?'<span>'+esc(s.carrier.length>60?s.carrier.slice(0,58)+'…':s.carrier)+'</span>':'')+'</div>'+
      (s.see?'<div class="d-note">'+esc(s.see)+'</div>':'')+
      (others.length?'<div class="d-next">Potem dziś: <b>'+others.map(x=>esc(x.to)).join(' → ')+'</b></div>':'')+
      (next&&!others.length?'<div class="d-next">Następnie: <b>'+esc(stageTitle(next))+'</b> · '+esc(dateFor(t.start,next._off).d)+'</div>':'')+
      '</div>';
  }
  const st=starting[0]||cover;
  if(!st)return'';
  const where=(st.to&&st.to!=='—')?st.to:st.from,lc=stageLocal(st);
  const dayN=d-st._off+1,nn=Math.max(1,num(st.nights));
  return '<div class="card dest stay-day"><h4>Dziś jesteś w</h4><div class="d-to">'+esc(where)+'</div>'+
    (lc.loc&&norm(lc.loc)!==norm(where)?'<div class="d-loc">'+esc(lc.loc)+'</div>':'')+
    (lc.say?'<div class="d-say">wymowa: '+esc(lc.say)+'</div>':'')+
    '<div class="d-meta"><span>'+esc(stageTitle(st))+'</span>'+(nn>1?'<span>dzień '+dayN+' z '+nn+'</span>':'')+(st.stay?'<span>🛏 '+esc(st.stay)+'</span>':'')+'</div>'+
    (st.detail?'<div class="d-note">'+esc(st.detail)+'</div>':'')+
    (next?'<div class="d-next">Następnie: <b>'+esc(stageTitle(next))+'</b> · '+esc(dateFor(t.start,next._off).d)+'</div>':'')+'</div>';
}

/* ---- rozkład dnia: wszystkie etapy tego dnia po godzinach ---- */
function dayPlanCard(c){
  const list=c.starting.slice();
  if(list.length<2)return'';
  const row=s=>{
    const m=MODES[s.mode]||MODES.bus,done=s.status==='done';
    return '<div class="dp-row'+(done?' done':'')+'"><span class="dp-t">'+esc(s.dep||'—')+'</span>'+
      '<span class="dp-b"><b>'+esc(stageTitle(s))+'</b>'+(s.carrier?'<small>'+esc(s.carrier.length>54?s.carrier.slice(0,52)+'…':s.carrier)+'</small>':'')+'</span>'+
      '<span class="dp-m">'+m.i+'</span></div>';};
  return '<div class="card dayplan"><h4>Rozkład dnia</h4>'+list.map(row).join('')+'</div>';
}
/* ---- co przygotować na jutro ---- */
function tomorrowCard(c){
  const{t,d}=c;
  if(d<0)return'';
  const tm=t.stages.filter(s=>s._off===d+1&&s.status!=='skip');
  if(!tm.length)return'';
  const hh=new Date().getHours();
  const hasTransfer=tm.some(isTransfer);
  if(hh<15&&!(!c.starting.length))return'';
  const s=tm[0],lc=stageLocal(s),m=MODES[s.mode]||MODES.bus;
  return '<div class="card tomo"><h4>Jutro</h4>'+
    '<div class="tm-h"><b>'+esc(stageTitle(s))+'</b>'+(lc.loc?'<span class="tm-loc">'+esc(lc.loc)+'</span>':'')+'</div>'+
    '<div class="d-meta"><span>'+m.i+' '+esc(m.l)+'</span>'+(s.dep?'<span>⏱ wyjazd '+esc(s.dep)+'</span>':'')+
      (s.stay?'<span>🛏 '+esc(s.stay)+'</span>':'')+'</div>'+
    (s.carrier?'<div class="d-note">'+esc(s.carrier)+'</div>':'')+
    (s.note?'<div class="d-note">'+esc(s.note)+'</div>':'')+
    (hasTransfer?'<div class="tm-prep">Wieczorem: bilet, gotówka na jutro, woda, naładowany powerbank, mapa offline dla celu.</div>':'')+
    '</div>';
}

/* ---- zwroty do nauczenia ---- */
let showLearned=false;
function phrasesCard(){
  const L=(P()&&P().lang)||[];
  const quick=[];L.forEach(s=>s.items.forEach(it=>{if(it.quick)quick.push(it);}));
  if(!quick.length)return'';
  const todo=quick.filter(q=>!learned[q.local]),done=quick.filter(q=>learned[q.local]);
  const list=(showLearned?quick:todo).slice(0,showLearned?99:6);
  if(!list.length&&!showLearned)return '<div class="card"><h4>Zwroty <button class="mini" data-showl>pokaż nauczone ('+done.length+')</button></h4>'+
    '<div class="conv-mini">Wszystkie podstawowe zwroty oznaczone jako nauczone. 👏</div></div>';
  return '<div class="card"><h4>Zwroty na dziś'+(done.length?'<button class="mini" data-showl>'+(showLearned?'ukryj nauczone':'nauczone: '+done.length)+'</button>':'')+'</h4>'+
    list.map(q=>'<div class="phr"><div class="p-main"><div class="p-loc">'+esc(q.local)+'</div><div class="p-say">'+esc(q.say)+'</div><div class="p-pl">'+esc(q.pl)+'</div></div>'+
      '<button class="learn" data-learn="'+attr(q.local)+'" title="'+(learned[q.local]?'cofnij':'umiem')+'">'+(learned[q.local]?'↺':'✓')+'</button></div>').join('')+
    (todo.length>6&&!showLearned?'<div class="learned-line">+ '+(todo.length-6)+' kolejnych po odhaczeniu tych.</div>':'')+'</div>';
}

/* ---- przelicznik ---- */
function niceVals(perPln){
  const k=Math.max(0,Math.floor(Math.log10(Math.max(1,perPln))));
  const b=Math.pow(10,k);return[1*b,5*b,10*b,50*b,100*b];
}
function convCard(){
  const t=T(),cur=toCode(t.cur);if(cur==='PLN')return'';
  const r=rate(cur);if(!r)return'';
  const per=1/r,sym=toSym(cur);
  const age=Math.round((Date.now()-rates.ts)/3600000);
  const src='<div class="rate-src">Kurs '+esc(rates.src)+(age>1?' · sprzed '+(age<48?plural(age,'godziny','godzin','godzin'):plural(Math.round(age/24),'dnia','dni','dni')):'')+'</div>';
  if(convMin[cur])return '<div class="card"><h4>Waluta <button class="mini" data-convmax>rozwiń</button></h4>'+
    '<div class="conv-mini">1 zł ≈ <b>'+fmt2(per)+' '+sym+'</b> · '+fmt(niceVals(per)[2])+' '+sym+' ≈ <b>'+fmt2(niceVals(per)[2]*r)+' zł</b></div>'+src+'</div>';
  const plnV=[1,10,20,50,100],locV=niceVals(per);
  return '<div class="card"><h4>Przelicznik '+esc(cur)+' <button class="mini" data-convmin>✓ znam kurs</button></h4>'+
    '<div class="conv"><div class="col"><div class="ch">złoty → '+esc(sym)+'</div>'+plnV.map(v=>'<div class="r"><span>'+v+' zł</span><b>'+fmt(v*per)+' '+sym+'</b></div>').join('')+'</div>'+
    '<div class="col"><div class="ch">'+esc(sym)+' → złoty</div>'+locV.map(v=>'<div class="r"><span>'+fmt(v)+' '+sym+'</span><b>'+fmt2(v*r)+' zł</b></div>').join('')+'</div></div>'+
    '<div class="conv-calc"><input id="cv-in" inputmode="decimal" placeholder="kwota"><select id="cv-dir"><option value="l">'+esc(sym)+' → zł</option><option value="p">zł → '+esc(sym)+'</option></select>'+
    '<div class="conv-out" id="cv-out">—</div></div>'+src+'</div>';
}

/* ---- pogoda (Open-Meteo, bez klucza; ostatni wynik trzymany offline) ---- */
function wxKey(c){return c[0].toFixed(2)+','+c[1].toFixed(2);}
function wxHTML(c,where){
  const k=wxKey(c),w=wxCache[k];
  if(!w)return '<div class="card"><h4>Pogoda · '+esc(where)+'</h4><div class="conv-mini" id="wx-body">'+(navigator.onLine?'Pobieram…':'Brak zapisanej prognozy — pojawi się po połączeniu z internetem.')+'</div></div>';
  const j=w.data,cu=j.current||{},[ico,desc]=WMO(cu.weather_code);
  const age=Math.round((Date.now()-w.ts)/60000);
  const ageTxt=age<60?'teraz':(age<1440?'sprzed '+plural(Math.round(age/60),'godziny','godzin','godzin'):'sprzed '+plural(Math.round(age/1440),'dnia','dni','dni'));
  const dd=j.daily||{};
  return '<div class="card"><h4>Pogoda · '+esc(where)+' <span class="mini">'+ageTxt+'</span></h4>'+
    '<div class="wx"><div class="w-ico">'+ico+'</div><div><div class="w-t">'+Math.round(cu.temperature_2m)+'°</div></div>'+
    '<div class="w-d">'+esc(desc)+'<br>wiatr '+Math.round(cu.wind_speed_10m||0)+' km/h'+(cu.apparent_temperature!=null?' · odczuwalna '+Math.round(cu.apparent_temperature)+'°':'')+'</div></div>'+
    (dd.time?'<div class="wx-days">'+dd.time.slice(0,3).map((x,i)=>{const[ic]=WMO(dd.weather_code[i]);
      return '<div><b>'+(i===0?'dziś':i===1?'jutro':DOW[dAt(x).getDay()])+'</b>'+ic+' '+Math.round(dd.temperature_2m_min[i])+'°/'+Math.round(dd.temperature_2m_max[i])+'°'+
      (dd.precipitation_probability_max&&dd.precipitation_probability_max[i]!=null?'<br>☂ '+dd.precipitation_probability_max[i]+'%':'')+'</div>';}).join('')+'</div>':'')+'</div>';
}
async function fetchWx(c){
  if(!navigator.onLine)return false;
  const k=wxKey(c),w=wxCache[k];
  if(w&&Date.now()-w.ts<30*60000)return false;
  try{
    const u='https://api.open-meteo.com/v1/forecast?latitude='+c[0]+'&longitude='+c[1]+
      '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m'+
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3';
    const r=await fetch(u,{cache:'no-store'});if(!r.ok)return false;
    wxCache[k]={ts:Date.now(),data:await r.json()};
    const keys=Object.keys(wxCache);if(keys.length>12)delete wxCache[keys[0]];
    save(K.wx,wxCache);return true;
  }catch(e){return false;}
}

/* ---- zadania na dziś ---- */
function todoItems(c){
  const t=c.t;const names=new Set();
  c.starting.concat(c.cover?[c.cover]:[]).forEach(s=>{[s.to,s.from].forEach(x=>x&&names.add(norm(x).trim()));});
  return t.checks.map((x,i)=>({x,i})).filter(({x})=>{
    if(!x.on)return false;
    if(x.on==='day0')return c.d===0;
    return names.has(norm(x.on).trim());
  });
}

/* ---- główne renderowanie ---- */
async function buildToday(){
  const c=todayCtx(),t=c.t,w=$('#today');
  let h='<div class="today-h"><h2>'+(c.before?'Przed wyjazdem':c.ended?'Po wyprawie':c.openPlan?'Dzień '+(c.d+1):'Dzień '+(c.d+1)+' z '+(c.total+1))+'</h2>'+
    '<span class="dn">'+esc(dateFor(isoToday(),0).d)+' · '+esc(DOW[new Date().getDay()])+'</span></div>';
  if(t.dateless){
    const r=tripRange(t);
    h+='<div class="card dest stay-day"><h4>Termin nieustalony</h4><div class="d-to">'+plural(r.days,'dzień','dni','dni')+'</div>'+
      '<div class="d-note">Plan jest gotowy, brakuje tylko daty startu. W zakładce Plan wybierz termin albo jedno z sugerowanych okien — wszystkie dni przeliczą się same.</div>'+
      '<div class="tm-prep"><button class="tb-btn" data-go="plan">Otwórz Plan</button></div></div>';
  }else if(c.before){
    h+='<div class="card dest stay-day"><h4>Start za</h4><div class="d-to">'+plural(-c.d,'dzień','dni','dni')+'</div>'+
      '<div class="d-meta"><span>'+esc(dateFor(t.start,0).full)+'</span>'+(t.stages[0]?'<span>'+esc(stageTitle(t.stages[0]))+'</span>':'')+'</div></div>';
  }else if(c.ended){
    const sp=expenses.filter(e=>e.trip===t.id).reduce((a,e)=>a+toPln(e.amt,e.cur),0);
    h+='<div class="card dest stay-day"><h4>Wyprawa zakończona</h4><div class="d-to">'+fmt(sp)+' zł</div>'+
      '<div class="d-meta"><span>'+plural(c.total+1,'dzień','dni','dni')+'</span><span>'+plural(checkins.filter(x=>x.trip===t.id).length,'check-in','check-iny','check-inów')+'</span></div>'+
      '<div class="d-note">Podsumowanie wydatków znajdziesz w zakładce Wydatki.</div></div>';
  }else if(c.openPlan){
    h+='<div class="card dest stay-day"><h4>Plan się urwał</h4><div class="d-to">Wybierz wariant</div>'+
      '<div class="d-note">Zaplanowane etapy się skończyły, a wyprawa trwa. Wejdź w Plan, wybierz wariant i wstaw jego odcinki — dni policzą się dalej.</div>'+
      '<div class="tm-prep"><button class="tb-btn" data-go="plan">Otwórz Plan</button></div></div>';
  }else{h+=destCard(c);h+=dayPlanCard(c);}

  h+='<div class="acts"><button class="act exp" data-open="exp"><span>💸</span>Wydatek</button><button class="act chk" data-open="ci"><span>📍</span>Check-in</button></div>';

  // przypomnienia
  const tn=load(K.tilesAsked,0);
  if(tn<40)h+='<div class="remind">🗺 <div><b>Mapa offline</b><br>Nie masz jeszcze zapisanych map. Zrób to na wifi, zanim stracisz zasięg.</div><button class="tb-btn" data-go="mapa">Mapa</button></div>';
  const bak=load(K.bak,null);
  if(!bak||(Date.now()-bak)>7*86400000)h+='<div class="remind">💾 <div><b>Backup</b><br>'+(bak?'Ostatni '+plural(Math.floor((Date.now()-bak)/86400000),'dzień','dni','dni')+' temu.':'Jeszcze nie zrobiony.')+' Dane są tylko w tym telefonie.</div><button class="tb-btn" data-backup>Zrób</button></div>';

  const todos=todoItems(c);
  if(todos.length)h+='<div class="card"><h4>Do zrobienia dziś</h4>'+todos.map(({x,i})=>
    '<div class="todo-row'+(x.done?' done':'')+'" data-tick="'+i+'"><span class="box">'+(x.done?'✓':'')+'</span><span class="tt">'+esc(x.t)+'</span></div>').join('')+'</div>';

  h+=tomorrowCard(c);
  h+=phrasesCard();
  h+=convCard();

  // pogoda dla miejsca dnia
  const ws=(c.starting.filter(isTransfer).find(x=>x.status!=='done'))||c.starting[0]||c.cover||t.stages[0];
  let wc=ws&&stageCoord(ws);
  const lastCi=checkins.filter(x=>x.trip===t.id).slice(-1)[0];
  if(lastCi&&lastCi.day===isoToday())wc=[lastCi.lat,lastCi.lng];
  const wWhere=lastCi&&lastCi.day===isoToday()?(lastCi.note||'ostatni check-in'):(ws?((ws.to&&ws.to!=='—')?ws.to:ws.from):'');
  if(wc)h+='<div id="wx-slot">'+wxHTML(wc,wWhere)+'</div>';

  // dzisiejsze check-iny i wydatki
  const ci=checkins.filter(x=>x.trip===t.id&&x.day===isoToday());
  const ex=expenses.filter(x=>x.trip===t.id&&x.day===isoToday());
  if(ci.length||ex.length){
    h+='<div class="card"><h4>Dziś zapisane</h4>'+
      (ex.length?'<div class="conv-mini" style="margin-bottom:8px">Wydane: <b>'+fmt(ex.reduce((a,e)=>a+toPln(e.amt,e.cur),0))+' zł</b> · '+plural(ex.length,'pozycja','pozycje','pozycji')+'</div>':'')+
      ci.map(x=>'<div class="ci"><span class="ci-t">'+new Date(x.ts).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})+'</span><span class="ci-n">📍 '+esc(x.note||'bez opisu')+'<small>'+x.lat.toFixed(4)+', '+x.lng.toFixed(4)+'</small></span></div>').join('')+'</div>';
  }
  w.innerHTML=h;
  if(wc&&navigator.onLine){fetchWx(wc).then(ch=>{if(ch){const sl=$('#wx-slot');if(sl)sl.innerHTML=wxHTML(wc,wWhere);}});}
}
$('#today').addEventListener('click',e=>{
  const t=T();
  const l=e.target.closest('[data-learn]');
  if(l){const k=l.dataset.learn;if(learned[k])delete learned[k];else learned[k]=Date.now();save(K.learned,learned);buildToday();return;}
  if(e.target.closest('[data-showl]')){showLearned=!showLearned;buildToday();return;}
  if(e.target.closest('[data-convmin]')){convMin[toCode(t.cur)]=true;save(K.convmin,convMin);buildToday();return;}
  if(e.target.closest('[data-convmax]')){delete convMin[toCode(t.cur)];save(K.convmin,convMin);buildToday();return;}
  const o=e.target.closest('[data-open]');if(o){openSheet(o.dataset.open);return;}
  const g=e.target.closest('[data-go]');if(g){goTab(g.dataset.go);return;}
  if(e.target.closest('[data-backup]')){doExport();buildToday();return;}
  const tk=e.target.closest('[data-tick]');if(tk){const x=t.checks[+tk.dataset.tick];x.done=!x.done;saveTrips();buildToday();return;}
});
$('#today').addEventListener('input',e=>{
  if(e.target.id!=='cv-in')return;
  const t=T(),cur=toCode(t.cur),r=rate(cur),v=num(e.target.value),dir=$('#cv-dir').value;
  $('#cv-out').textContent=v?(dir==='l'?fmt2(v*r)+' zł':fmt(v/r)+' '+toSym(cur)):'—';
});
$('#today').addEventListener('change',e=>{if(e.target.id==='cv-dir'){const i=$('#cv-in');i.dispatchEvent(new Event('input',{bubbles:true}));}});


/* ============ drobne wspólne ============ */
function toast(msg){
  let t=$('#toast');if(!t){t=el('div','');t.id='toast';t.style.cssText='position:fixed;left:50%;bottom:92px;transform:translateX(-50%);background:#221D1C;color:#fff;'+
    'padding:11px 18px;border-radius:12px;font:600 13.5px Inter,system-ui,sans-serif;z-index:2000;opacity:0;transition:opacity .2s;max-width:88vw;text-align:center;pointer-events:none';document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity='1';clearTimeout(window._tt);window._tt=setTimeout(()=>t.style.opacity='0',2200);
}
function getPos(){
  return new Promise((res,rej)=>{
    if(!navigator.geolocation)return rej('brak GPS w tej przeglądarce');
    navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy}),
      e=>rej(e.code===1?'brak zgody na lokalizację':'nie udało się ustalić pozycji'),{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  });
}
function a11y(root){
  (root||document).querySelectorAll('.day-top,.pcard-top,.fold-top,.ropt-top,.var-top,.chk,.todo-row,.trip').forEach(e=>{
    if(e.getAttribute('tabindex')!==null)return;e.setAttribute('tabindex','0');e.setAttribute('role','button');});
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeSheet();return;}
  if(e.key!=='Enter'&&e.key!==' ')return;
  const t=e.target;if(!t||!t.matches||!t.matches('.day-top,.pcard-top,.fold-top,.ropt-top,.var-top,.chk,.todo-row,.trip'))return;
  e.preventDefault();t.click();
});

/* ============ zakładki i tryb ============ */
const tabs=$$('.tab');
const BUILD={dzis:buildToday,plan:()=>{buildRevBar();buildStages();buildOptions();buildInfos();if(!planScrolled&&!T().pendingRev){planScrolled=true;setTimeout(scrollToToday,120);}},
  mapa:()=>setTimeout(initMap,60),wydatki:buildExpenses,przew:buildGuide,insta:buildIG,lista:buildChecks,pomysly:buildIdeas,kosztorys:buildCalc,klocki:buildBlocks};
let curTab=null;
tabs.forEach(b=>b.addEventListener('click',()=>{
  tabs.forEach(t=>t.classList.remove('active'));$$('.panel').forEach(p=>p.classList.remove('active'));
  b.classList.add('active');$('#'+b.dataset.p).classList.add('active');curTab=b.dataset.p;
  if(b.dataset.p!=='plan')window.scrollTo({top:0,behavior:'smooth'});
  BUILD[b.dataset.p]&&BUILD[b.dataset.p]();
}));
function goTab(id){const b=tabs.find(t=>t.dataset.p===id);if(b)b.click();}

function effMode(){
  const m=load(K.mode,'auto');if(m!=='auto')return m;
  const t=T(),d=todayIdx(),r=tripRange(t);
  if(t.dateless)return'plan';
  if(d>=0&&d<r.days)return'travel';
  if(d>=0&&t.stages.some(s=>s.src==='ph'))return'travel';
  return'plan';
}
function applyMode(){
  const m=effMode();
  const b=$('#mode-btn');b.className='hdr-btn '+(m==='travel'?'mode-travel':'mode-plan');
  b.textContent=m==='travel'?'✈ Podróż':'✎ Planowanie';
  $$('.plan-only').forEach(x=>x.style.display=m==='plan'?'':'none');
  $('#fab').style.display=m==='travel'?'':'none';
  $('#mode-note').innerHTML=m==='travel'
    ?'<b>Tryb podróży.</b> Apka otwiera się na „Dziś”. Plan dalej możesz zmieniać: noce, pomijanie, ✎ w karcie, ⇅ kolejność i ＋ wstawianie etapu.'
    :'<b>Tryb planowania.</b> Wszystkie narzędzia widoczne. W dniu wyjazdu apka sama przełączy się na tryb podróży.';
}
$('#mode-btn').addEventListener('click',()=>{
  const m=effMode()==='travel'?'plan':'travel';save(K.mode,m);applyMode();
  toast(m==='travel'?'Tryb podróży':'Tryb planowania');goTab(m==='travel'?'dzis':'plan');
});

/* ============ ARKUSZ: wydatek i check-in ============ */
const sheet=$('#sheet'),sheetBg=$('#sheet-bg');
function closeSheet(){sheet.classList.remove('on');sheetBg.classList.remove('on');}
sheetBg.addEventListener('click',closeSheet);
$('#fab').addEventListener('click',()=>openSheet('pick'));
let exDraft={};
function openSheet(kind){
  const t=T();
  if(kind==='pick'){
    sheet.innerHTML='<h3>Dodaj <button data-close>✕</button></h3><div class="acts" style="margin:0"><button class="act exp" data-open="exp"><span>💸</span>Wydatek</button><button class="act chk" data-open="ci"><span>📍</span>Check-in</button></div>';
  }else if(kind==='exp'){
    const curs=[...new Set([toCode(t.cur),...t.extra.map(toCode),'PLN'])];
    exDraft={cur:exDraft.cur&&curs.includes(exDraft.cur)?exDraft.cur:curs[0],cat:exDraft.cat||'food'};
    sheet.innerHTML='<h3>Wydatek <button data-close>✕</button></h3>'+
      '<div class="amt-row"><input id="ex-amt" inputmode="decimal" placeholder="0" autocomplete="off"></div>'+
      '<div class="cur-pills">'+curs.map(c=>'<button class="pill'+(c===exDraft.cur?' on':'')+'" data-cur="'+c+'">'+esc(toSym(c))+' '+c+'</button>').join('')+'</div>'+
      '<div class="pln-eq" id="ex-pln"></div>'+
      '<div class="cat-pills">'+CATS.map(c=>'<button class="pill'+(c.id===exDraft.cat?' on':'')+'" data-cat="'+c.id+'">'+c.i+' '+c.l+'</button>').join('')+'</div>'+
      '<input class="note-in" id="ex-note" placeholder="co / gdzie (opcjonalnie)">'+
      '<button class="go" id="ex-save">Zapisz wydatek</button>';
    setTimeout(()=>{const a=$('#ex-amt');if(a)a.focus();},250);
  }else if(kind==='ci'){
    const c=todayCtx(),s=c.starting[0]||c.cover;
    sheet.innerHTML='<h3>Check-in <button data-close>✕</button></h3>'+
      '<input class="note-in" id="ci-note" placeholder="gdzie jesteś? np. Klasztor Haghpat" style="margin-top:0">'+
      '<button class="go teal" id="ci-save">📍 Zapisz to miejsce</button>'+
      '<div class="geo-st" id="ci-st">Użyje GPS telefonu — działa też bez internetu.</div>'+
      (s&&stageCoord(s)?'<button class="vis" id="ci-fallback">Bez GPS: przypisz do „'+esc((s.to&&s.to!=='—')?s.to:s.from)+'”</button>':'');
  }
  sheet.classList.add('on');sheetBg.classList.add('on');
}
sheet.addEventListener('click',e=>{
  if(e.target.closest('[data-close]')){closeSheet();return;}
  const o=e.target.closest('[data-open]');if(o){openSheet(o.dataset.open);return;}
  const cu=e.target.closest('[data-cur]');if(cu){exDraft.cur=cu.dataset.cur;$$('#sheet [data-cur]').forEach(x=>x.classList.toggle('on',x===cu));updPln();return;}
  const ca=e.target.closest('[data-cat]');if(ca){exDraft.cat=ca.dataset.cat;$$('#sheet [data-cat]').forEach(x=>x.classList.toggle('on',x===ca));return;}
  if(e.target.id==='ex-save'){
    const amt=num($('#ex-amt').value);if(!amt){$('#ex-amt').focus();toast('Wpisz kwotę');return;}
    const t=T(),c=todayCtx(),s=c.starting[0]||c.cover;
    expenses.push({id:uid(),trip:t.id,ts:Date.now(),day:isoToday(),amt,cur:exDraft.cur,cat:exDraft.cat,note:$('#ex-note').value.trim(),
      place:s?((s.to&&s.to!=='—')?s.to:s.from):''});
    saveExp();closeSheet();toast('Zapisano: '+fmt2(amt)+' '+toSym(exDraft.cur)+' ≈ '+fmt(toPln(amt,exDraft.cur))+' zł');
    refresh();return;
  }
  if(e.target.id==='ci-save'){
    const st=$('#ci-st'),btn=e.target;btn.disabled=true;st.textContent='Ustalam pozycję…';
    getPos().then(p=>{addCheckin(p.lat,p.lng,p.acc,$('#ci-note').value.trim());},
      err=>{st.textContent='Nie udało się: '+err+'.';btn.disabled=false;});
    return;
  }
  if(e.target.id==='ci-fallback'){
    const c=todayCtx(),s=c.starting[0]||c.cover,co=stageCoord(s);
    addCheckin(co[0],co[1],null,$('#ci-note').value.trim()||((s.to&&s.to!=='—')?s.to:s.from));return;
  }
});
function addCheckin(lat,lng,acc,note){
  checkins.push({id:uid(),trip:T().id,ts:Date.now(),day:isoToday(),lat,lng,acc,note});
  saveCi();closeSheet();toast('📍 Zapisano'+(acc?' (±'+Math.round(acc)+' m)':''));refresh();
}
sheet.addEventListener('input',e=>{if(e.target.id==='ex-amt')updPln();});
sheet.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target.id==='ex-amt'||e.target.id==='ex-note')){e.preventDefault();$('#ex-save').click();}});
function updPln(){const a=$('#ex-amt');if(!a)return;const v=num(a.value);
  $('#ex-pln').textContent=v&&exDraft.cur!=='PLN'?'≈ '+fmt2(toPln(v,exDraft.cur))+' zł':'';}
function refresh(){if(curTab&&BUILD[curTab])BUILD[curTab]();if(mapObj)drawRouteLayer();}

/* ============ WYDATKI ============ */
function plannedPln(t){
  let s=0;t.stages.forEach(x=>{if(x.status==='skip')return;s+=toPln(x.price,x.curr)+toPln(x.stayPrice,x.curr2);});
  (t.budget||[]).forEach(b=>{s+=toPln(b.v,b.c);});return s;
}
function buildExpenses(){
  const t=T(),w=$('#expenses');
  const ex=expenses.filter(e=>e.trip===t.id).sort((a,b)=>b.ts-a.ts);
  const tot=ex.reduce((a,e)=>a+toPln(e.amt,e.cur),0);
  const days=[...new Set(ex.map(e=>e.day))];
  const today=ex.filter(e=>e.day===isoToday()).reduce((a,e)=>a+toPln(e.amt,e.cur),0);
  const plan=plannedPln(t),r=tripRange(t);
  let h='<div class="acts"><button class="act exp" data-open="exp"><span>💸</span>Dodaj wydatek</button><button class="act chk" data-report><span>📋</span>Kopiuj raport</button></div>';
  h+='<div class="exp-sum">'+
    '<div class="k"><div class="l">Razem</div><div class="v">'+fmt(tot)+' zł</div><div class="s">'+plural(ex.length,'pozycja','pozycje','pozycji')+'</div></div>'+
    '<div class="k"><div class="l">Dziennie</div><div class="v">'+fmt(days.length?tot/days.length:0)+' zł</div><div class="s">średnio z '+plural(days.length,'dnia','dni','dni')+'</div></div>'+
    '<div class="k"><div class="l">Dziś</div><div class="v">'+fmt(today)+' zł</div><div class="s">'+esc(dateFor(isoToday(),0).d)+'</div></div>'+
    (plan?'<div class="k"><div class="l">Plan</div><div class="v">'+fmt(plan)+' zł</div><div class="s">'+(tot?Math.round(tot/plan*100)+'% wydane':'z etapów i budżetu')+'</div></div>':'')+
  '</div>';
  if(!ex.length){w.innerHTML=h+'<div class="empty">Jeszcze nic. Dodawaj na bieżąco przyciskiem ＋ w rogu — kwota, waluta, kategoria, trzy dotknięcia.</div>';return;}
  const byCat={};ex.forEach(e=>{byCat[e.cat]=(byCat[e.cat]||0)+toPln(e.amt,e.cur);});
  h+='<div class="card"><h4>Według kategorii</h4>'+CATS.filter(c=>byCat[c.id]).sort((a,b)=>byCat[b.id]-byCat[a.id]).map(c=>
    '<div class="cat-bar"><div class="cb-h"><span>'+c.i+' '+c.l+'</span><span><b>'+fmt(byCat[c.id])+' zł</b> · '+Math.round(byCat[c.id]/tot*100)+'%</span></div>'+
    '<div class="cb-t"><i style="width:'+(byCat[c.id]/tot*100)+'%;background:'+c.c+'"></i></div></div>').join('')+'</div>';
  days.forEach(d=>{
    const de=ex.filter(e=>e.day===d),ds=de.reduce((a,e)=>a+toPln(e.amt,e.cur),0);
    const off=dayDiff(t.start,d);
    h+='<div class="exp-day">'+esc(dateFor(d,0).d)+(off>=0&&off<r.days?' · dzień '+(off+1):'')+'<span>'+fmt(ds)+' zł</span></div>';
    de.forEach(e=>{const c=CATM[e.cat]||CATM.other;
      h+='<div class="exp"><div class="e-ic">'+c.i+'</div><div class="e-m"><b>'+esc(e.note||c.l)+'</b><small>'+esc(c.l)+(e.place?' · '+esc(e.place):'')+' · '+
        new Date(e.ts).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})+'</small></div>'+
        '<div class="e-v"><b>'+fmt2(e.amt)+' '+esc(toSym(e.cur))+'</b>'+(toCode(e.cur)!=='PLN'?'<small>'+fmt2(toPln(e.amt,e.cur))+' zł</small>':'')+'</div>'+
        '<button class="e-x" data-exdel="'+e.id+'" title="usuń">✕</button></div>';});
  });
  h+='<div id="rep-slot"></div>';
  w.innerHTML=h;
}
function reportText(){
  const t=T(),ex=expenses.filter(e=>e.trip===t.id).sort((a,b)=>a.ts-b.ts);
  const tot=ex.reduce((a,e)=>a+toPln(e.amt,e.cur),0),days=[...new Set(ex.map(e=>e.day))];
  const byCat={};ex.forEach(e=>{byCat[e.cat]=(byCat[e.cat]||0)+toPln(e.amt,e.cur);});
  let s=t.emoji+' '+t.name+' — wydatki\n'+'='.repeat(28)+'\n';
  s+='Razem: '+fmt(tot)+' zł ('+plural(ex.length,'pozycja','pozycje','pozycji')+', '+plural(days.length,'dzień','dni','dni')+')\n';
  s+='Średnio dziennie: '+fmt(days.length?tot/days.length:0)+' zł\n\nKategorie:\n';
  CATS.filter(c=>byCat[c.id]).forEach(c=>{s+='  '+c.l.padEnd(10)+fmt(byCat[c.id]).padStart(8)+' zł  '+Math.round(byCat[c.id]/tot*100)+'%\n';});
  s+='\nDni:\n';
  days.forEach(d=>{const de=ex.filter(e=>e.day===d);s+='  '+dateFor(d,0).d+'  '+fmt(de.reduce((a,e)=>a+toPln(e.amt,e.cur),0))+' zł\n';
    de.forEach(e=>{s+='     · '+(e.note||CATM[e.cat].l)+' — '+fmt2(e.amt)+' '+toSym(e.cur)+'\n';});});
  s+='\nKurs: '+rates.src;return s;
}
$('#expenses').addEventListener('click',e=>{
  const o=e.target.closest('[data-open]');if(o){openSheet(o.dataset.open);return;}
  const d=e.target.closest('[data-exdel]');
  if(d){if(!confirm('Usunąć ten wydatek?'))return;expenses=expenses.filter(x=>x.id!==d.dataset.exdel);saveExp();buildExpenses();return;}
  if(e.target.closest('[data-report]')){
    const txt=reportText();const slot=$('#rep-slot');if(slot)slot.innerHTML='<div class="card"><h4>Raport</h4><div class="rep">'+esc(txt)+'</div></div>';
    const ok=()=>toast('Raport skopiowany — wklej gdzie chcesz');
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,()=>{});
    else{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok();}catch(err){}ta.remove();}
    if(slot)slot.scrollIntoView({behavior:'smooth'});
  }
});

/* ============ PRZEWODNIK ============ */
let guideTab=null;
let hideDone=load(K.hidedone,false),gProg={lbl:'',keys:[]};
function tickDone(){const t=T();return gProg.keys.filter(k=>visited[t.id+'|'+k]).length;}
function progBar(){
  if(!gProg.keys.length)return'';
  return '<div class="chk-progress"><span id="g-prog">'+esc(gProg.lbl)+': <b>'+tickDone()+'</b> z <b>'+gProg.keys.length+'</b></span>'+
    '<button class="g-hide'+(hideDone?' on':'')+'" id="g-hide">'+(hideDone?'✓ ukryte':'ukryj odhaczone')+'</button></div>';
}
function tickDot(key,lbl){
  const v=!!visited[T().id+'|'+key];
  return '<button class="tick'+(v?' on':'')+'" data-vis="'+attr(key)+'" data-lbl="'+attr(lbl)+'" aria-label="'+attr(lbl)+': '+attr(key.split('|').pop())+'" title="'+attr(lbl)+'">'+(v?'✓':'○')+'</button>';
}
function tickBtn(key,lbl){
  const v=!!visited[T().id+'|'+key];
  return '<div class="tick-wrap"><button class="vis'+(v?' on':'')+'" data-vis="'+attr(key)+'" data-lbl="'+attr(lbl)+'">'+(v?'✓ '+lbl:lbl)+'</button></div>';
}
function relevant(x){const t=T(),g=(P()&&P().options||[]).find(g=>g.insert);const p=g&&t.picked[g.group];return!p||!x.v||x.v.indexOf(p)>=0;}
function groupBy(arr,k){const o={};arr.forEach(x=>{(o[x[k]]=o[x[k]]||[]).push(x);});return o;}
function buildGuide(){
  const p=P(),sub=$('#subtabs'),w=$('#guide');
  if(!p){sub.innerHTML='';w.innerHTML='<div class="empty">Własna wyprawa nie ma jeszcze przewodnika.<br>Poproś Claude’a o pakiet treści (miejsca, jedzenie, zwroty) dla tego kraju.</div>';return;}
  const tabsG=[];
  if(p.places&&p.places.length)tabsG.push(['places','★ Must see']);
  if(p.food&&p.food.length)tabsG.push(['food','◍ Smaki']);
  if(p.lang&&p.lang.length)tabsG.push(['lang','✎ Język']);
  if(p.culture&&p.culture.length)tabsG.push(['culture','▤ Kultura']);
  if(p.events&&p.events.length)tabsG.push(['events','◷ Święta']);
  if(!tabsG.find(x=>x[0]===guideTab))guideTab=tabsG[0]&&tabsG[0][0];
  sub.innerHTML=tabsG.map(x=>'<button class="subtab'+(x[0]===guideTab?' active':'')+'" data-g="'+x[0]+'">'+x[1]+'</button>').join('');
  let h='';
  if(guideTab==='places'){
    const t=T(),all=p.places.filter(relevant),list=all.filter(x=>!hideDone||!visited[t.id+'|'+x.key]);
    gProg={lbl:'Odwiedzone',keys:all.map(x=>x.key)};
    h+=progBar();
    const g=groupBy(list,'area');
    Object.keys(g).forEach(a=>{
      h+='<div class="area-h">'+esc(a)+'<span>'+plural(g[a].length,'miejsce','miejsca','miejsc')+'</span></div>';
      g[a].forEach(x=>{const v=!!visited[t.id+'|'+x.key];
        h+='<div class="pcard '+(x.tag==='must'?'must':x.tag==='detour'?'detour':'')+(v?' visited':'')+'"><div class="pcard-top"><div class="pc-ico">'+esc(x.icon||'◇')+'</div>'+
          '<div class="pc-h"><div class="pc-n">'+esc(x.name)+'</div><div class="pc-w">'+esc(x.where||'')+'</div></div>'+
          '<span class="pc-tag">'+({must:'must see',worth:'warto',detour:'objazd'}[x.tag]||'')+'</span>'+tickDot(x.key,'Odwiedzone')+'<span class="expand">⌄</span></div>'+
          '<div class="pc-body"><div class="pc-body-inner">'+esc(x.desc||'')+(x.tip?'<div class="lbl">Praktycznie</div>'+esc(x.tip):'')+
          tickBtn(x.key,'Odwiedzone')+'</div></div></div>';});
    });
    if(!list.length)h+='<div class="empty">Wszystko odwiedzone. Zdejmij filtr, żeby zobaczyć listę.</div>';
  }else if(guideTab==='food'){
    const t=T(),all=p.food.filter(relevant).map(x=>Object.assign({key:'smak|'+x.name},x)),
          list=all.filter(x=>!hideDone||!visited[t.id+'|'+x.key]);
    gProg={lbl:'Spróbowane',keys:all.map(x=>x.key)};
    h+=progBar();
    const g=groupBy(list,'area');
    Object.keys(g).forEach(a=>{h+='<div class="area-h">'+esc(a)+'</div>';
      g[a].forEach(x=>{const v=!!visited[t.id+'|'+x.key];
        h+='<div class="pcard'+(v?' visited':'')+'"><div class="pcard-top"><div class="pc-ico">'+esc(x.icon||'◍')+'</div><div class="pc-h"><div class="pc-n">'+esc(x.name)+'</div></div>'+tickDot(x.key,'Spróbowane')+'<span class="expand">⌄</span></div>'+
        '<div class="pc-body"><div class="pc-body-inner">'+esc(x.desc)+(x.tip?'<div class="lbl">Praktycznie</div>'+esc(x.tip):'')+
        tickBtn(x.key,'Spróbowane')+'</div></div></div>';});});
    if(!list.length)h+='<div class="empty">Wszystko spróbowane. Zdejmij filtr, żeby zobaczyć listę.</div>';
  }else if(guideTab==='lang'){
    p.lang.forEach(s=>{h+='<div class="area-h">'+esc(s.sec)+'</div>'+(s.note?'<div class="lang-note">'+s.note+'</div>':'')+
      '<div class="lang-grid">'+s.items.map(x=>'<div class="phrase"><div class="pl">'+esc(x.pl)+'</div><div class="tr">'+esc(x.local)+'</div><div class="ph">['+esc(x.say)+']</div></div>').join('')+'</div>';});
    if(p.alphabet)h+='<div class="area-h">Alfabet</div><div class="abc">'+p.alphabet.map(x=>'<div><b>'+esc(x.c)+'</b><span>'+esc(x.t)+'</span></div>').join('')+'</div>';
  }else if(guideTab==='events'){
    const t=T(),r=tripRange(t),inTrip=d=>!t.dateless&&d&&d>=r.start&&d<=r.end;
    const g=groupBy(p.events,'cat');
    h+='<div class="ev-note">Daty świąt kościelnych i festiwali na 2027 bywają ogłaszane późno. Pozycje oznaczone jako orientacyjne potwierdź bliżej wyjazdu.</div>';
    Object.keys(g).forEach(cat=>{
      h+='<div class="area-h">'+esc(cat)+'</div>';
      h+=g[cat].map(x=>'<div class="ev'+(inTrip(x.iso)?' hit':'')+(x.warn?' warn':'')+'">'+
        '<div class="ev-d"><b>'+esc(x.when)+'</b>'+(x.sure===false?'<small>orientacyjnie</small>':'')+'</div>'+
        '<div class="ev-b"><b>'+esc(x.t)+'</b>'+(x.where?'<span class="ev-w">'+esc(x.where)+'</span>':'')+
        '<p>'+esc(x.d)+'</p>'+(x.tip?'<p class="ev-tip">'+esc(x.tip)+'</p>':'')+
        (inTrip(x.iso)?'<p class="ev-hit">Wypada w Twoim terminie</p>':'')+'</div></div>').join('');
    });
  }else if(guideTab==='culture'){
    const t=T(),all=[];p.culture.forEach(c=>c.items.forEach(x=>all.push('kult|'+x.t)));
    gProg={lbl:'Odhaczone',keys:all};
    h+=progBar();
    p.culture.forEach(c=>{
      const its=c.items.filter(x=>!hideDone||!visited[t.id+'|kult|'+x.t]);
      if(!its.length)return;
      h+='<div class="area-h">'+esc(c.cat)+'</div>'+its.map(x=>{const k='kult|'+x.t,v=!!visited[t.id+'|'+k];
        return '<div class="cult'+(v?' visited':'')+'"><b>'+esc(x.t)+(x.star?' ★':'')+'</b><small>'+esc(x.m)+'</small><p>'+esc(x.d)+'</p>'+tickBtn(k,'Odhaczone')+'</div>';}).join('');});
  }
  w.innerHTML=h;
  w.querySelectorAll('.pcard-top').forEach(x=>x.onclick=e=>{if(e.target.closest('[data-vis]'))return;x.parentElement.classList.toggle('open');});
  a11y(w);
}
$('#subtabs').addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b)return;guideTab=b.dataset.g;buildGuide();});
$('#guide').addEventListener('click',e=>{
  if(e.target.closest('#g-hide')){hideDone=!hideDone;save(K.hidedone,hideDone);buildGuide();return;}
  const v=e.target.closest('[data-vis]');if(!v)return;
  const k=T().id+'|'+v.dataset.vis,lbl=v.dataset.lbl||'Odwiedzone';
  if(visited[k])delete visited[k];else visited[k]=Date.now();save(K.visited,visited);
  const on=!!visited[k],card=v.closest('.pcard')||v.closest('.cult');
  if(card)card.classList.toggle('visited',on);
  (card||$('#guide')).querySelectorAll('[data-vis="'+CSS.escape(v.dataset.vis)+'"]').forEach(b=>{
    b.classList.toggle('on',on);
    b.textContent=b.classList.contains('tick')?(on?'✓':'○'):(on?'✓ '+lbl:lbl);});
  const pr=$('#g-prog');if(pr)pr.innerHTML=esc(gProg.lbl)+': <b>'+tickDone()+'</b> z <b>'+gProg.keys.length+'</b>';
  if(on&&hideDone&&card)setTimeout(()=>{card.style.transition='opacity .25s';card.style.opacity='0';setTimeout(buildGuide,250);},450);
});

/* ============ INSTAGRAM ============ */
function buildIG(){
  const p=P(),w=$('#igcards');
  $('#ig-note').textContent='';
  if(!p||!p.ig||!p.ig.length){w.innerHTML='<div class="empty">Brak pomysłów na posty dla tej wyprawy.</div>';return;}
  const list=p.ig.filter(relevant);
  w.innerHTML=list.map((x,i)=>'<div class="ig"><div class="ig-top"><span class="ig-place">'+esc(x.place)+'</span><span class="ig-type '+esc(x.type)+'">'+esc(x.type)+'</span></div>'+
    (x.shot?'<div class="ig-shot"><b>Kadr:</b> '+esc(x.shot)+'</div>':'')+
    '<div class="ig-cap">'+esc(x.caption)+'</div><div class="ig-tags">'+esc(x.tags||'')+'</div>'+
    (x.vo?'<div class="ig-vo"><b>Lektor:</b> '+esc(x.vo)+'</div>':'')+
    (x.reel&&x.reel.length?'<ol class="ig-reel">'+x.reel.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ol>':'')+
    '<button class="ig-copy" data-ig="'+i+'">⧉ Kopiuj opis + tagi</button></div>').join('');
}
$('#igcards').addEventListener('click',e=>{
  const b=e.target.closest('[data-ig]');if(!b)return;
  const x=P().ig.filter(relevant)[+b.dataset.ig],txt=x.caption+'\n\n'+(x.tags||'');
  const ok=()=>{b.textContent='✓ Skopiowane';b.classList.add('done');setTimeout(()=>{b.textContent='⧉ Kopiuj opis + tagi';b.classList.remove('done');},1800);};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(ok,()=>{});
  else{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok();}catch(err){}ta.remove();}
});

/* ============ LISTA ============ */
function buildChecks(){
  const t=T(),w=$('#checks');w.innerHTML='';
  const cats=[...new Set(t.checks.map(c=>c.cat))];let done=0;
  cats.forEach(cat=>{
    w.appendChild(el('div','chk-cat',esc(cat)));
    t.checks.forEach((c,i)=>{if(c.cat!==cat)return;if(c.done)done++;
      const d=el('div','chk'+(c.done?' done':''));
      d.innerHTML='<span class="box">'+(c.done?'✓':'')+'</span><span class="task">'+esc(c.t)+'</span><span class="when">'+esc(c.w||'')+'</span>'+
        '<button class="ord-btn del" data-cdel="'+i+'" style="flex:0 0 auto;margin-left:8px">✕</button>';
      d.onclick=ev=>{if(ev.target.closest('[data-cdel]'))return;c.done=!c.done;saveTrips();buildChecks();};
      w.appendChild(d);});
  });
  $('#chk-progress').innerHTML='Odhaczone: <b>'+done+'</b> z <b>'+t.checks.length+'</b>';a11y(w);
}
$('#checks').addEventListener('click',e=>{const d=e.target.closest('[data-cdel]');if(!d)return;T().checks.splice(+d.dataset.cdel,1);saveTrips();buildChecks();});
$('#add-check').addEventListener('click',()=>{
  const tx=prompt('Treść pozycji:');if(!tx)return;
  const cat=prompt('Kategoria (puste = „Moje”):')||'Moje';
  T().checks.push({cat,t:tx,w:'',done:false});saveTrips();buildChecks();
});
$('#reset-checks').addEventListener('click',()=>{
  const t=T();if(!confirm('Przywrócić domyślną listę? Twoje pozycje i odhaczenia przepadną.'))return;
  t.checks=(t.pack?PACKS[t.pack].checks:FIRST_DAY).map(c=>Object.assign({done:false},c));patchTrip(t);saveTrips();buildChecks();
});

/* ============ WYPRAWY (menedżer) ============ */
$('#trip-btn').addEventListener('click',openTrips);
function tripRow(t,today){
  const r=tripRange(t),live=!t.dormant&&today>=r.start&&today<=r.end;
  return '<div class="trip'+(t.id===activeId?' on':'')+(t.dormant?' dorm':'')+'" data-trip="'+t.id+'"><span class="t-e">'+esc(t.emoji)+'</span>'+
    '<div class="t-m"><b>'+esc(t.name)+'</b><small>'+esc(dateFor(t.start,0).full)+' · '+plural(r.days,'dzień','dni','dni')+
      (live?' · trwa teraz':'')+(t.dormant?' · uśpiona':'')+' · '+esc(toCode(t.cur))+'</small></div>'+
    '<button class="t-z" data-tdorm="'+t.id+'" title="'+(t.dormant?'obudź':'uśpij')+'">'+(t.dormant?'☀':'☾')+'</button>'+
    (t.pack?'':'<button class="t-x" data-tdel="'+t.id+'" title="usuń">🗑</button>')+'</div>';
}
function openTrips(){
  const today=isoToday();
  const awake=trips.filter(t=>!t.dormant),sleep=trips.filter(t=>t.dormant);
  sheet.innerHTML='<h3>Wyprawy <button data-close>✕</button></h3>'+
    awake.map(t=>tripRow(t,today)).join('')+
    (sleep.length?'<div class="area-h" style="margin-top:18px">Uśpione<span>wracasz jednym kliknięciem</span></div>'+sleep.map(t=>tripRow(t,today)).join(''):'')+
    '<div class="unconf" style="margin-top:10px">☾ usypia wyprawę: znika z przełącznika i z ekranu Dziś, ale nic nie tracisz — wydatki, check-iny i etapy zostają.</div>'+
    '<div class="area-h" style="margin-top:20px">Nowa wyprawa</div>'+
    '<div class="newtrip"><div class="full"><label>Nazwa albo kraj</label><input id="nt-name" placeholder="np. Gruzja 2027"></div>'+
    '<div><label>Start</label><input id="nt-start" type="date" value="'+isoToday()+'"></div>'+
    '<div><label>Waluta</label><select id="nt-cur">'+['EUR','USD','GEL','TRY','AMD','BGN','RON','HUF','CZK','GBP','THB','JPY','MAD','EGP','ILS','AZN','UAH','RSD','ALL','MKD','BAM','INR','IDR','VND','MXN','PLN']
      .map(c=>'<option value="'+c+'">'+c+' '+toSym(c)+'</option>').join('')+'</select></div>'+
    '<div><label>Emoji</label><input id="nt-emoji" value="🧭" maxlength="4"></div>'+
    '<div class="full"><label class="cbx"><input type="checkbox" id="nt-skel" checked> Dodaj szkielet researchu: 15 pytań o kraj do wypełnienia</label></div>'+
    '<div class="full"><button class="tb-btn" id="nt-go" style="width:100%">+ Utwórz</button></div></div>'+
    '<div class="unconf">Nowa wyprawa dostaje listę „pierwszego dnia”: SIM, bankomat, dojazd z lotniska, mapa offline. Etapy dodajesz w Planie, pomysły w zakładce Pomysły.</div>'+
    '<div class="area-h" style="margin-top:20px">Pakiety treści</div>'+
    '<div class="unconf">Pakiet to jeden plik JSON z gotową wyprawą: etapy, miejsca, smaki, zwroty, lista spraw i budżet. Wczytujesz go tutaj — bez podmieniania apki.</div>'+
    '<div class="packs">'+
      '<button class="tb-btn" id="pk-load">📦 Wczytaj pakiet</button>'+
      '<button class="tb-btn" id="pk-tpl">⬇ Szablon</button>'+
      (T().pack?'<button class="tb-btn" id="pk-exp">⬇ Eksportuj „'+esc(T().name)+'”</button>':'')+
      '<input type="file" id="pk-file" accept="application/json,.json" hidden>'+
    '</div>'+
    (Object.keys(userPacks).length?'<div class="pk-list">'+Object.keys(userPacks).map(k=>
      '<div class="pk-row"><span>'+esc(userPacks[k].emoji||'📦')+' <b>'+esc(userPacks[k].name)+'</b><small>'+esc(k)+' · wersja '+(userPacks[k].rev||1)+'</small></span>'+
      '<button class="t-x" data-pkdel="'+attr(k)+'" title="usuń pakiet">🗑</button></div>').join('')+'</div>':'');
  sheet.classList.add('on');sheetBg.classList.add('on');a11y(sheet);
}
sheet.addEventListener('click',e=>{
  const del=e.target.closest('[data-tdel]');
  if(del){e.stopPropagation();const t=trips.find(x=>x.id===del.dataset.tdel);
    if(!confirm('Usunąć wyprawę „'+t.name+'” razem z jej wydatkami i check-inami?'))return;
    trips=trips.filter(x=>x.id!==t.id);expenses=expenses.filter(x=>x.trip!==t.id);checkins=checkins.filter(x=>x.trip!==t.id);
    saveTrips();saveExp();saveCi();if(activeId===t.id)switchTrip(trips[0].id);else openTrips();return;}
  const dz=e.target.closest('[data-tdorm]');
  if(dz){e.stopPropagation();const t=trips.find(x=>x.id===dz.dataset.tdorm);if(!t)return;
    t.dormant=!t.dormant;t.dormantAt=t.dormant?Date.now():null;saveTrips();
    if(t.dormant&&t.id===activeId){const nx=trips.find(x=>!x.dormant);if(nx){switchTrip(nx.id);}}
    openTrips();toast(t.dormant?'Uśpiono „'+t.name+'”':'Obudzono „'+t.name+'”');return;}
  const tr=e.target.closest('[data-trip]');if(tr){const t=trips.find(x=>x.id===tr.dataset.trip);
    if(t&&t.dormant){t.dormant=false;t.dormantAt=null;saveTrips();toast('Obudzono „'+t.name+'”');}
    switchTrip(tr.dataset.trip);closeSheet();return;}
  if(e.target.id==='pk-tpl'){
    const blob=new Blob([JSON.stringify(packTemplate(),null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pakiet-szablon.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Pobrano szablon');return;}
  if(e.target.id==='pk-exp'){
    const p=P();if(!p)return;
    const blob=new Blob([JSON.stringify(p,null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pakiet-'+p.id+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Pobrano pakiet');return;}
  if(e.target.id==='pk-load'){$('#pk-file').click();return;}
  const pd=e.target.closest('[data-pkdel]');
  if(pd){const k=pd.dataset.pkdel;
    if(!confirm('Usunąć pakiet „'+(userPacks[k].name||k)+'”? Wyprawy już utworzone z tego pakietu zostaną, ale stracą opisy i przewodnik.'))return;
    delete userPacks[k];delete PACKS[k];savePacks();openTrips();toast('Pakiet usunięty');return;}
  if(e.target.id==='nt-go'){
    const name=$('#nt-name').value.trim();if(!name){$('#nt-name').focus();return;}
    const t=blankTrip({name,start:$('#nt-start').value,cur:$('#nt-cur').value,emoji:$('#nt-emoji').value||'🧭'});
    trips.push(t);saveTrips();switchTrip(t.id);
    if($('#nt-skel')&&$('#nt-skel').checked){COUNTRY_SKELETON.slice().reverse().forEach(([cat,ti,d])=>addIdea({trip:t.id,cat,t:ti,d}));}
    closeSheet();goTab($('#nt-skel')&&$('#nt-skel').checked?'pomysly':'plan');toast('Utworzono „'+name+'”');
  }
});
document.addEventListener('change',e=>{
  if(e.target.id!=='pk-file')return;
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    let o;try{o=JSON.parse(rd.result);}catch(err){toast('To nie jest poprawny plik JSON');return;}
    const r=installPack(o);
    if(r.err){toast(r.err);return;}
    const p=r.pack,had=trips.find(t=>t.pack===p.id);
    if(had){
      applyPackRev(had);saveTrips();switchTrip(had.id);closeSheet();
      toast('Zaktualizowano wyprawę „'+p.name+'”');
    }else{
      const t=patchTrip(freshTrip(p.id));trips.push(t);saveTrips();switchTrip(t.id);closeSheet();
      goTab('plan');toast('Wczytano pakiet „'+p.name+'”');
    }
  };
  rd.readAsText(f);
  e.target.value='';
});
function switchTrip(id){
  activeId=id;save(K.active,id);editMode={};planScrolled=false;guideTab=null;
  if(mapObj){mapObj.remove();mapObj=null;mapInited=false;}
  buildHeader();applyMode();refresh();
}

/* ============ MAPA ============ */
let mapInited=false,mapObj=null,routeLayer=null;
function mkIcon(cls,label){return L.divIcon({className:'',html:'<div class="map-marker '+cls+'"><span>'+label+'</span></div>',iconSize:[26,26],iconAnchor:[13,26],popupAnchor:[0,-24]});}
function initMap(){
  if(mapInited&&mapObj){setTimeout(()=>mapObj.invalidateSize(),100);return;}
  if(typeof L==='undefined'){$('#map').innerHTML='<div class="empty">Brak biblioteki map.</div>';return;}
  mapInited=true;
  mapObj=L.map('map',{scrollWheelZoom:false}).setView([40,40],5);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'© OpenStreetMap'}).addTo(mapObj);
  routeLayer=L.layerGroup().addTo(mapObj);
  drawRouteLayer(true);
  setTimeout(()=>mapObj.invalidateSize(),200);
  askTileInfo();
}
function stopNote(name){
  const p=P();if(!p||!p.stops)return'';
  const s=p.stops.find(x=>{const a=norm(x.n),b=norm(name);return a.includes(b.trim())||b.includes(norm(x.n.split(/[ (]/)[0]).trim());});
  return s?s.note:'';
}
function drawRouteLayer(fit){
  if(!mapObj||!routeLayer)return;
  routeLayer.clearLayers();
  const t=T(),pts=[],line=[];computeOffsets(t);
  const seen={};let n=0;
  t.stages.forEach(s=>{
    if(s.status==='skip')return;
    const c=stageCoord(s);if(!c)return;
    line.push(c);
    const k=c[0].toFixed(3)+','+c[1].toFixed(3);
    const d=dateFor(t.start,s._off).d;
    if(seen[k]){seen[k].dates.push(d);return;}
    n++;const where=(s.to&&s.to!=='—')?s.to:s.from;
    seen[k]={dates:[d],n,where,s,c};
  });
  Object.values(seen).forEach(o=>{
    const note=stopNote(o.where),lc=stageLocal(o.s);
    L.marker(o.c,{icon:mkIcon(o.s.mode==='ferry'?'sea':'',String(o.n))}).addTo(routeLayer)
      .bindPopup('<div class="map-pop"><div class="mp-date">'+esc(o.dates.join(', '))+'</div><b>'+esc(o.where)+'</b>'+(lc.loc&&norm(lc.loc)!==norm(o.where)?' · '+esc(lc.loc):'')+
        '<br>'+esc(note||o.s.see||'')+'</div>',{maxWidth:300});
    pts.push(o.c);
  });
  if(line.length>1)L.polyline(line,{color:'#6E1B24',weight:3,opacity:.6,dashArray:'6 8'}).addTo(routeLayer);
  // wybrany, niewstawiony wariant
  const g=(P()&&P().options||[]).find(x=>x.insert),v=g&&g.items.find(x=>x.id===t.picked[g.group]);
  if(v&&v.pts&&!t.stages.some(s=>s.vid===v.id)){
    const vl=line.length?[line[line.length-1]]:[];
    v.pts.forEach((p,i)=>{vl.push(p.c);pts.push(p.c);
      L.marker(p.c,{icon:mkIcon('var',String.fromCharCode(65+i))}).addTo(routeLayer).bindPopup('<div class="map-pop"><div class="mp-date">'+esc(p.tag||'')+'</div><b>'+esc(p.n)+'</b><br>'+esc(p.f||'')+'</div>',{maxWidth:300});});
    L.polyline(vl,{color:'#B45A2E',weight:3,opacity:.7,dashArray:'4 7'}).addTo(routeLayer);
  }
  // check-iny
  checkins.filter(x=>x.trip===t.id).forEach(x=>{
    L.marker([x.lat,x.lng],{icon:mkIcon('ci','📍')}).addTo(routeLayer)
      .bindPopup('<div class="map-pop"><div class="mp-date">'+new Date(x.ts).toLocaleString('pl-PL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+'</div><b>'+esc(x.note||'Check-in')+'</b>'+
        (x.acc?'<br><small>dokładność ±'+Math.round(x.acc)+' m</small>':'')+'</div>',{maxWidth:260});
    pts.push([x.lat,x.lng]);
  });
  if(fit!==false&&pts.length)try{mapObj.fitBounds(L.latLngBounds(pts).pad(0.15));}catch(e){}
}
/* kafelki offline */
function tileXY(lat,lon,z){const n=Math.pow(2,z),x=Math.floor((lon+180)/360*n),r=lat*Math.PI/180;
  return[x,Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n)];}
function askTileInfo(){if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage('CACHE_INFO');}
async function saveTiles(){
  if(!mapObj){toast('Poczekaj, aż mapa się załaduje');return;}
  const b=mapObj.getBounds(),z0=Math.round(mapObj.getZoom()),urls=[];
  for(let z=z0;z<=Math.min(18,z0+2);z++){const[x1,y1]=tileXY(b.getNorth(),b.getWest(),z),[x2,y2]=tileXY(b.getSouth(),b.getEast(),z);
    for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)urls.push('https://tile.openstreetmap.org/'+z+'/'+x+'/'+y+'.png');}
  const list=urls.slice(0,300),info=$('#tile-info');let done=0,failed=0;
  info.innerHTML='Zapisywanie: <b id="tile-cnt">0 / '+list.length+'</b><div class="prog" id="tile-prog"><i></i></div>';
  for(let i=0;i<list.length;i+=6){
    await Promise.all(list.slice(i,i+6).map(u=>fetch(u,{mode:'cors'}).then(r=>{done++;if(!r.ok)failed++;},()=>{done++;failed++;})));
    const c=$('#tile-cnt');if(c)c.textContent=done+' / '+list.length;const pi=$('#tile-prog i');if(pi)pi.style.width=Math.round(done/list.length*100)+'%';
  }
  info.innerHTML='Mapa offline: <b>zapisano '+(list.length-failed)+'</b>'+(urls.length>300?' — fragment był za duży, przybliż i powtórz':'');
  setTimeout(askTileInfo,700);
}
$('#save-tiles').addEventListener('click',saveTiles);
$('#clear-tiles').addEventListener('click',()=>{if(!confirm('Usunąć zapisane kafelki map?'))return;
  if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.controller.postMessage('CLEAR_TILES');});

/* ============ BACKUP ============ */
const ALL_KEYS=Object.values(K);
function doExport(){
  const dump={_app:'wyprawy',_v:1,_exported:new Date().toISOString()};
  ALL_KEYS.forEach(k=>{const v=lsGet(k);if(v!=null)try{dump[k]=JSON.parse(v);}catch(e){}});
  const blob=new Blob([JSON.stringify(dump,null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rihla-'+(T()?T().id:'backup')+'-'+isoToday()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  save(K.bak,Date.now());updateBackupAge();dataMsg('Backup pobrany ✓',true);
}
function dataMsg(t,ok){const m=$('#data-msg');m.textContent=t;m.style.color=ok?'var(--olive-deep)':'#C0392B';setTimeout(()=>m.textContent='',4000);}
function updateBackupAge(){
  const n=$('#backup-age'),t=load(K.bak,null);
  if(!t){n.className='backup-age warn';n.textContent='Nigdy nie robiłeś backupu. Dane są tylko w tym telefonie.';return;}
  const d=Math.floor((Date.now()-t)/86400000);
  n.className='backup-age'+(d>=7?' warn':'');n.textContent='Ostatni backup: '+(d===0?'dzisiaj':d===1?'wczoraj':plural(d,'dzień','dni','dni')+' temu');
}
$('#export-btn').addEventListener('click',doExport);
$('#import-btn').addEventListener('click',()=>$('#import-file').click());
$('#import-file').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=ev=>{try{
    const d=JSON.parse(ev.target.result);
    if(d._app==='wyprawy'){ALL_KEYS.forEach(k=>{if(d[k]!=null)lsSet(k,JSON.stringify(d[k]));});}
    else if(d._app==='powrot-2026'||d._app==='armenia-2026'){
      Object.keys(d).forEach(k=>{if(/^(ret|arm)-/.test(k))lsSet(k,JSON.stringify(d[k]));});
      const nt=d._app==='powrot-2026'?migratePowrot():migrateArmenia();
      trips=trips.filter(x=>x.id!==nt.id).concat([patchTrip(nt)]);saveTrips();save(K.visited,visited);
    }else{dataMsg('To nie jest backup tej apki.',false);return;}
    dataMsg('Zaimportowano ✓ Odświeżam…',true);setTimeout(()=>location.reload(),800);
  }catch(err){dataMsg('Plik uszkodzony.',false);}};
  r.readAsText(f);e.target.value='';
});

/* ============ SIEĆ, SERVICE WORKER ============ */
function netState(){const d=$('#netdot'),on=navigator.onLine;d.className='netdot'+(on?'':' off');d.innerHTML='<i></i>'+(on?'online':'offline — działa z pamięci');}
window.addEventListener('online',()=>{netState();refreshRates().then(ok=>{if(ok&&curTab==='dzis')buildToday();});});
window.addEventListener('offline',netState);
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').then(reg=>{
      askTileInfo();
      reg.addEventListener('updatefound',()=>{const nw=reg.installing;if(!nw)return;
        nw.addEventListener('statechange',()=>{if(nw.state==='installed'&&navigator.serviceWorker.controller){
          const sb=$('#sysbar');sb.className='sysbar info';sb.style.display='block';
          sb.innerHTML='Jest nowa wersja apki. <button id="sw-reload">Odśwież</button>';
          $('#sw-reload').onclick=()=>{nw.postMessage('SKIP_WAITING');setTimeout(()=>location.reload(),300);};}});});
    }).catch(()=>{});
  });
  navigator.serviceWorker.addEventListener('message',e=>{
    if(e.data&&e.data.type==='CACHE_INFO'){const n=e.data.tiles||0;save(K.tilesAsked,n);
      const i=$('#tile-info');if(i&&!$('#tile-prog'))i.innerHTML='Mapa offline: <b>'+(n?plural(n,'kafelek','kafelki','kafelków'):'nic nie zapisane')+'</b>';}
  });
}

/* ============ START ============ */
if(!LS_OK){const sb=$('#sysbar');sb.style.display='block';
  sb.innerHTML='<b>Uwaga:</b> ta przeglądarka blokuje zapis (tryb prywatny?). Możesz czytać, ale zmiany nie zostaną zapisane.';}
netState();updateBackupAge();buildHeader();applyMode();a11y();revDot();
goTab(effMode()==='travel'?'dzis':'plan');
refreshRates().then(ok=>{if(ok&&curTab==='dzis')buildToday();});
if(REV_NOTE)setTimeout(()=>toast(REV_NOTE),600);

/* ============ POMYSŁY / RESEARCH ============ */
let ideaFilter='all',ideaEdit=null;
function ideaCatLabel(c){const x=IDEA_CATS.find(k=>k[0]===c);return x?x[1]:'• Inne';}
function buildIdeas(){
  const w=$('#ideas'),t=T(),list=tripIdeas(t.id);
  const counts={};list.forEach(x=>counts[x.cat]=(counts[x.cat]||0)+1);
  let h='<div class="idea-top"><div class="idea-h"><b>'+esc(t.emoji)+' '+esc(t.name)+'</b>'+
    '<small>'+(list.length?plural(list.length,'pomysł','pomysły','pomysłów')+' · odhaczone '+list.filter(x=>x.done).length:'jeszcze nic tu nie ma')+'</small></div>'+
    '<button class="tb-btn" id="idea-add">+ Dodaj</button></div>';
  h+='<div class="chips"><button class="chip'+(ideaFilter==='all'?' on':'')+'" data-f="all">wszystko</button>'+
    IDEA_CATS.map(c=>'<button class="chip'+(ideaFilter===c[0]?' on':'')+'" data-f="'+c[0]+'">'+esc(c[1])+(counts[c[0]]?' '+counts[c[0]]:'')+'</button>').join('')+'</div>';
  if(!list.length){
    h+='<div class="empty">Miejsce na to, co chodzi Ci po głowie: miejsca, dania, linki, sprawy do sprawdzenia.<br><br>'+
      'Możesz też wstawić gotowy szkielet pytań o kraj i wypełniać go po kolei.</div>'+
      '<div class="idea-skel"><button class="tb-btn" id="idea-skel">+ Wstaw szkielet kraju (15 pytań)</button></div>';
  }else{
    const vis=list.filter(x=>ideaFilter==='all'||x.cat===ideaFilter);
    h+=vis.map(x=>'<div class="idea'+(x.done?' done':'')+'" data-id="'+x.id+'">'+
      '<div class="idea-row"><button class="tick'+(x.done?' on':'')+'" data-idone="'+x.id+'">'+(x.done?'✓':'○')+'</button>'+
      '<div class="idea-b"><b>'+esc(x.t||'(bez tytułu)')+'</b><small>'+esc(ideaCatLabel(x.cat))+'</small></div>'+
      '<span class="expand">⌄</span></div>'+
      '<div class="idea-body"><div class="idea-body-inner">'+
        (x.d?'<p>'+esc(x.d).replace(/\n/g,'<br>')+'</p>':'<p class="muted">Bez opisu.</p>')+
        (x.url?'<p><a href="'+attr(x.url)+'" target="_blank" rel="noopener">'+esc(x.url.replace(/^https?:\/\//,'').slice(0,46))+'</a></p>':'')+
        '<div class="idea-acts"><button class="tb-btn" data-iedit="'+x.id+'">✎ Edytuj</button>'+
        '<button class="tb-btn" data-iplan="'+x.id+'">→ Do planu</button>'+
        '<button class="tb-btn danger" data-idel="'+x.id+'">🗑</button></div>'+
      '</div></div></div>').join('');
    if(!vis.length)h+='<div class="empty">Nic w tej kategorii.</div>';
    h+='<div class="idea-skel"><button class="tb-btn" id="idea-skel">+ Dorzuć szkielet kraju</button></div>';
  }
  w.innerHTML=h;
  w.querySelectorAll('.idea-row').forEach(r=>r.onclick=e=>{if(e.target.closest('[data-idone]'))return;r.parentElement.classList.toggle('open');});
  a11y(w);
}
function ideaForm(x){
  const e=x||{cat:'miejsce',t:'',d:'',url:''};
  sheet.innerHTML='<h3>'+(x?'Edytuj pomysł':'Nowy pomysł')+' <button data-close>✕</button></h3>'+
    '<div class="newtrip"><div class="full"><label>Tytuł</label><input id="if-t" value="'+attr(e.t)+'" placeholder="np. Jezioro Ritsa"></div>'+
    '<div class="full"><label>Kategoria</label><select id="if-cat">'+IDEA_CATS.map(c=>'<option value="'+c[0]+'"'+(e.cat===c[0]?' selected':'')+'>'+esc(c[1])+'</option>').join('')+'</select></div>'+
    '<div class="full"><label>Opis</label><textarea id="if-d" rows="4" placeholder="co, gdzie, ile kosztuje, czego się dowiedzieć">'+esc(e.d)+'</textarea></div>'+
    '<div class="full"><label>Link</label><input id="if-url" value="'+attr(e.url)+'" placeholder="https://"></div>'+
    '<div class="full"><button class="tb-btn" id="if-go" style="width:100%">'+(x?'Zapisz':'Dodaj')+'</button></div></div>';
  sheet.classList.add('on');sheetBg.classList.add('on');a11y(sheet);
  $('#if-go').onclick=()=>{
    const o={t:$('#if-t').value.trim(),cat:$('#if-cat').value,d:$('#if-d').value.trim(),url:$('#if-url').value.trim()};
    if(!o.t){$('#if-t').focus();return;}
    if(x){Object.assign(x,o);saveIdeas();}else addIdea(o);
    closeSheet();buildIdeas();toast(x?'Zapisano':'Dodano pomysł');
  };
}
$('#ideas').addEventListener('click',e=>{
  const d=e.target.closest('[data-idone]');
  if(d){const x=ideas.find(i=>i.id===d.dataset.idone);if(!x)return;x.done=!x.done;saveIdeas();buildIdeas();return;}
  const ed=e.target.closest('[data-iedit]');
  if(ed){ideaForm(ideas.find(i=>i.id===ed.dataset.iedit));return;}
  const del=e.target.closest('[data-idel]');
  if(del){const x=ideas.find(i=>i.id===del.dataset.idel);if(!x||!confirm('Usunąć „'+x.t+'”?'))return;
    ideas=ideas.filter(i=>i.id!==x.id);saveIdeas();buildIdeas();return;}
  const pl=e.target.closest('[data-iplan]');
  if(pl){const x=ideas.find(i=>i.id===pl.dataset.iplan);if(!x)return;
    const t=T(),s=newStage();s.title=x.t;s.detail=x.d||'';s.src='user';s.nights=0;
    t.stages.push(s);saveTrips();toast('Dodano etap na końcu planu');goTab('plan');return;}
  if(e.target.id==='idea-add'){ideaForm(null);return;}
  if(e.target.id==='idea-skel'){
    const have=tripIdeas().map(x=>x.t);
    let n=0;COUNTRY_SKELETON.slice().reverse().forEach(([cat,t,d])=>{if(have.indexOf(t)<0){addIdea({cat,t,d});n++;}});
    buildIdeas();toast(n?'Dodano '+plural(n,'pytanie','pytania','pytań'):'Szkielet już tu jest');return;}
  const f=e.target.closest('[data-f]');
  if(f){ideaFilter=f.dataset.f;buildIdeas();}
});

/* ============ KOSZTORYS — wstępny plan wyjazdu ============ */
const CALC_CATS=[['lot','✈ Lot'],['transport','🚌 Transport'],['jedzenie','🍽 Jedzenie'],['atrakcje','🎟 Atrakcje'],['inne','• Inne']];
/* status płatności — wspólny dla pozycji tabeli i dla noclegów */
const PAY=[['','○','—'],['res','✓','zarezerwowane'],['paid','€','zapłacone'],['onsite','⌂','płatne na miejscu']];
function payNext(v){const i=PAY.findIndex(x=>x[0]===(v||''));return PAY[(i+1)%PAY.length][0];}
function payIco(v){const x=PAY.find(y=>y[0]===(v||''));return x?x[1]:'○';}
function payName(v){const x=PAY.find(y=>y[0]===(v||''));return x?x[2]:'—';}
/* jednorazowa migracja: nocleg wypada z tabeli, paid:true -> pay:'paid' */
function calcMigrate(t){
  let moved=0;
  if(Array.isArray(t.calc)){
    const before=t.calc.length;
    t.calc=t.calc.filter(r=>(r.cat||'')!=='nocleg');
    moved=before-t.calc.length;
    t.calc.forEach(r=>{if(r.paid&&!r.pay)r.pay='paid';delete r.paid;});
  }
  const m=(t.beds&&typeof t.beds==='object')?t.beds:null;
  if(m)Object.keys(m).forEach(k=>{const b=m[k];if(b&&b.paid&&!b.pay)b.pay='paid';if(b)delete b.paid;});
  if(moved){saveTrips();setTimeout(()=>toast('Noclegi prowadzisz teraz tylko w sekcji nocnej — usunąłem '+plural(moved,'starą pozycję','stare pozycje','starych pozycji')+' z tabeli'),400);}
  return moved;
}
function calcRows(t){if(!Array.isArray(t.calc))t.calc=[];return t.calc;}
function calcSum(t){return calcRows(t).filter(r=>!r.off).reduce((a,r)=>a+num(r.qty||1)*toPln(r.price,r.cur),0);}
function calcLine(r){return num(r.qty||1)*toPln(r.price,r.cur);}

/* ---------- noclegi noc po nocy ---------- */
function bedsMap(t){if(!t.beds||typeof t.beds!=='object')t.beds={};return t.beds;}
function bedKey(t,k){return(t.start&&!t.dateless)?dateFor(t.start,k).iso:('n'+k);}
function bedsNights(t){
  t=t||T();computeOffsets(t);
  const total=tripRange(t).days-1,out=[];
  for(let k=0;k<total;k++){
    const s=t.stages.find(x=>x.status!=='skip'&&x._off<=k&&k<x._off+Math.max(0,num(x.nights)));
    const d=(t.start&&!t.dateless)?dateFor(t.start,k):null;
    out.push({k:k,key:bedKey(t,k),iso:d?d.iso:'',d:d?d.d:('Dzień '+(k+1)),wd:d?d.wd:'',
      place:s?(s.stay||s.to||'—'):'—'});
  }
  return out;
}
function bedRec(t,key){const m=bedsMap(t);if(!m[key])m[key]={price:'',cur:'EUR',name:'',pay:'',payDate:''};return m[key];}
function bedLine(b){return toPln(b.price,b.cur);}
function bedsSum(t){return bedsNights(t).reduce((a,n)=>a+bedLine(bedRec(t,n.key)),0);}
function bedsBy(t,st){return bedsNights(t).reduce((a,n)=>{const b=bedRec(t,n.key);return a+(b.pay===st?bedLine(b):0);},0);}
function bedsCount(t,st){return bedsNights(t).filter(n=>{const p=bedRec(t,n.key).pay;return st?p===st:!!p;}).length;}
/* ile gotówki trzeba mieć na dany etap planu */
function onsiteForStage(t,s){
  t=t||T();if(!t.start||t.dateless)return 0;
  let a=0;const n=Math.max(0,num(s.nights));
  for(let k=0;k<n;k++){const b=(t.beds||{})[bedKey(t,(s._off||0)+k)];if(b&&b.pay==='onsite')a+=bedLine(b);}
  return a;
}

function calcGrand(t){return calcSum(t)+bedsSum(t);}
function calcBy(t,st){return calcRows(t).filter(r=>!r.off&&r.pay===st).reduce((a,r)=>a+calcLine(r),0)+bedsBy(t,st);}
function calcCountBy(t,st){return calcRows(t).filter(r=>!r.off&&r.pay===st).length+bedsCount(t,st);}
function calcPaidSum(t){return calcBy(t,'paid');}

function calcTiles(t){
  const sum=calcGrand(t),paid=calcBy(t,'paid'),onsite=calcBy(t,'onsite');
  return{sum:sum,paid:paid,onsite:onsite,left:sum-paid,cap:num(t.calcCap),days:tripRange(t).days};
}
function calcTilesHTML(t){
  const x=calcTiles(t);
  return'<div class="k"><div class="l">Razem</div><div class="v" data-kv="sum">'+fmt(x.sum)+' zł</div>'+
      '<div class="s" data-ks="sum">'+fmt2(x.sum/rate('EUR'))+' € · '+fmt(x.days?x.sum/x.days:0)+' zł/dzień</div></div>'+
    '<div class="k paid"><div class="l">Zapłacone</div><div class="v" data-kv="paid">'+fmt(x.paid)+' zł</div>'+
      '<div class="s" data-ks="paid">zostało '+fmt(x.left)+' zł</div></div>'+
    '<div class="k onsite"><div class="l">Na miejscu</div><div class="v" data-kv="onsite">'+fmt(x.onsite)+' zł</div>'+
      '<div class="s" data-ks="onsite">'+(calcCountBy(t,'onsite')?plural(calcCountBy(t,'onsite'),'pozycja','pozycje','pozycji')+' · gotówka':'nic do zapłaty w podróży')+'</div></div>'+
    '<div class="k cap"><div class="l">Mój limit</div><div class="v"><input id="calc-cap" type="number" inputmode="numeric" placeholder="—" value="'+(x.cap||'')+'"> zł</div>'+
      '<div class="s '+(x.cap?(x.sum<=x.cap?'ok':'over'):'')+'" data-ks="cap">'+
      (x.cap?(x.sum<=x.cap?'mieści się, zostaje '+fmt(x.cap-x.sum)+' zł':'przekroczone o '+fmt(x.sum-x.cap)+' zł'):'wpisz, żeby sprawdzić')+'</div></div>';
}
function buildCalc(){
  const t=T();calcMigrate(t);
  const w=$('#calc'),rows=calcRows(t),days=tripRange(t).days;
  let h='<div class="calc-top"><div class="calc-h"><b>'+esc(t.emoji)+' '+esc(t.name)+'</b>'+
    '<small>'+(t.dateless?'termin nieustalony · ':'')+plural(days,'dzień','dni','dni')+' · '+plural(rows.length,'pozycja','pozycje','pozycji')+'</small></div>'+
    '<button class="tb-btn" id="calc-add">+ Pozycja</button></div>';
  h+='<div class="calc-sum">'+calcTilesHTML(t)+'</div>';

  /* --- noclegi noc po nocy --- */
  const nights=bedsNights(t);
  if(nights.length){
    const bs=bedsSum(t),bk=bedsCount(t,'');
    h+='<div class="bed-sec"><div class="bed-top"><b>🛏 Noclegi — noc po nocy</b>'+
      '<span>'+bk+' / '+nights.length+' ustalone · '+fmt(bs)+' zł</span></div>';
    let last=null;
    nights.forEach(n=>{
      const b=bedRec(t,n.key);
      if(n.place!==last){
        const run=nights.filter(x=>x.place===n.place&&x.k>=n.k&&nights.slice(n.k,x.k+1).every(y=>y.place===n.place)).length;
        h+='<div class="bed-grp">'+esc(n.place)+'<em>'+plural(run,'noc','noce','nocy')+'</em></div>';
        last=n.place;
      }
      h+='<div class="bed-row pay-'+(b.pay||'none')+'" data-bk="'+attr(n.key)+'">'+
        '<div class="bed-d"><b>'+esc(n.d)+'</b><small>'+esc(n.wd)+'</small></div>'+
        '<input class="bed-n" data-bf="name" value="'+attr(b.name||'')+'" placeholder="gdzie — nazwa albo link">'+
        '<input class="bed-p" type="number" inputmode="decimal" data-bf="price" value="'+attr(b.price||'')+'" placeholder="cena">'+
        '<select class="bed-c" data-bf="cur">'+['EUR','PLN','GBP','USD',toCode(t.cur)].filter((v,i,a)=>a.indexOf(v)===i)
          .map(c=>'<option value="'+c+'"'+(toCode(b.cur)===c?' selected':'')+'>'+c+'</option>').join('')+'</select>'+
        '<button class="bed-ok" data-bpay="'+attr(n.key)+'" title="'+attr(payName(b.pay))+'">'+payIco(b.pay)+'</button>'+
        '<span class="bed-s">'+fmt(bedLine(b))+' zł</span>'+
        (b.pay==='res'?'<input class="bed-dt" type="date" data-bf="payDate" value="'+attr(b.payDate||'')+'" title="zapłata do">':'')+
      '</div>';
    });
    h+='<div class="pay-leg">Klikaj kółko, żeby zmienić status: '+
      PAY.slice(1).map(x=>'<span><b>'+x[1]+'</b> '+x[2]+'</span>').join('')+'</div>';
    h+='<div class="bed-acts"><button class="tb-btn" id="bed-fill">Wypełnij ceną orientacyjną</button>'+
      '<button class="tb-btn" id="bed-clear">Wyczyść noclegi</button></div></div>';
  }

  if(!rows.length){
    h+='<div class="empty">Reszta kosztorysu pusta. Wpisz loty, transport i jedzenie, a apka policzy, czy to się spina.<br><br>Możesz też wygenerować szkic z planu wyprawy.</div>';
  }else{
    const rowHtml=(r,i)=>'<div class="crow'+(r.off?' off':'')+' pay-'+(r.pay||'none')+'" data-ci="'+i+'">'+
      '<div class="cr-1"><input class="cr-d" data-cf="desc" value="'+attr(r.desc||'')+'" placeholder="opis, np. Lizbona → Sal"></div>'+
      '<div class="cr-2">'+
        '<select class="cr-c" data-cf="cat">'+CALC_CATS.map(c=>'<option value="'+c[0]+'"'+(r.cat===c[0]?' selected':'')+'>'+esc(c[1])+'</option>').join('')+'</select>'+
        '<input class="cr-w" type="date" data-cf="when" value="'+attr(r.when||'')+'">'+
      '</div>'+
      '<div class="cr-3">'+
        '<label>ile<input type="number" inputmode="decimal" data-cf="qty" value="'+attr(r.qty!=null?r.qty:1)+'"></label>'+
        '<label>cena<input type="number" inputmode="decimal" data-cf="price" value="'+attr(r.price||'')+'"></label>'+
        '<label>waluta<select data-cf="cur">'+['PLN','EUR','USD','GBP',toCode(t.cur)].filter((v,i2,a)=>a.indexOf(v)===i2)
          .map(c=>'<option value="'+c+'"'+(toCode(r.cur)===c?' selected':'')+'>'+c+'</option>').join('')+'</select></label>'+
        '<div class="cr-sum">'+fmt(calcLine(r))+' zł</div>'+
      '</div>'+
      '<div class="cr-5">'+PAY.slice(1).map(x=>'<button class="cr-p'+(r.pay===x[0]?' on '+x[0]:'')+'" data-cpay="'+i+'|'+x[0]+'">'+x[1]+' '+x[2]+'</button>').join('')+
        (r.pay==='res'?'<input class="cr-dt" type="date" data-cf="payDate" value="'+attr(r.payDate||'')+'" title="zapłata do">':'')+'</div>'+
      '<div class="cr-4"><button class="cr-b" data-coff="'+i+'">'+(r.off?'✓ wliczam':'○ pomijam')+'</button>'+
        '<button class="cr-b del" data-cdel="'+i+'">🗑</button></div>'+
    '</div>';
    const idx=rows.map((r,i)=>i);
    CALC_CATS.forEach(c=>{
      const mine=idx.filter(i=>(rows[i].cat||'inne')===c[0]);
      if(!mine.length)return;
      const sub=mine.filter(i=>!rows[i].off).reduce((a,i)=>a+calcLine(rows[i]),0);
      h+='<div class="csec" data-cat="'+c[0]+'"><div class="csec-h"><b>'+esc(c[1])+'</b>'+
        '<span>'+plural(mine.length,'pozycja','pozycje','pozycji')+'</span>'+
        '<em>'+fmt(sub)+' zł</em></div>'+
        mine.map(i=>rowHtml(rows[i],i)).join('')+'</div>';
    });
  }
  h+='<div class="calc-acts"><button class="tb-btn" id="calc-gen">⚙ Szkic z planu</button>'+
     '<button class="tb-btn" id="calc-imp">📥 Wczytaj</button><input type="file" id="calc-file" accept=".json,.csv,application/json,text/csv" hidden>'+
     '<button class="tb-btn" id="calc-csv">⬇ CSV do Excela</button>'+
     '<button class="tb-btn" id="calc-copy">📋 Kopiuj tabelę</button>'+
     (rows.length?'<button class="tb-btn danger" id="calc-clear">Wyczyść</button>':'')+'</div>';
  w.innerHTML=h;a11y(w);
}

/* szybkie odświeżenie kafelków bez przerysowania (żeby nie uciekał focus) */
function calcRefreshTiles(){
  const t=T(),x=calcTiles(t),q=s=>$('#calc [data-kv="'+s+'"]'),qs=s=>$('#calc [data-ks="'+s+'"]');
  if(q('sum')){q('sum').textContent=fmt(x.sum)+' zł';
    qs('sum').textContent=fmt2(x.sum/rate('EUR'))+' € · '+fmt(x.days?x.sum/x.days:0)+' zł/dzień';}
  if(q('paid')){q('paid').textContent=fmt(x.paid)+' zł';qs('paid').textContent=plural(calcPaidCount(t),'pozycja','pozycje','pozycji');}
  if(q('left')){q('left').textContent=fmt(x.left)+' zł';qs('left').textContent=fmt2(x.left/rate('EUR'))+' €';}
  const c=qs('cap');
  if(c){c.className='s '+(x.cap?(x.sum<=x.cap?'ok':'over'):'');
    c.textContent=x.cap?(x.sum<=x.cap?'mieści się, zostaje '+fmt(x.cap-x.sum)+' zł':'przekroczone o '+fmt(x.sum-x.cap)+' zł'):'wpisz, żeby sprawdzić';}
  const bt=$('#calc .bed-top span');
  if(bt)bt.textContent=bedsCount(t,'')+' / '+bedsNights(t).length+' ustalone · '+fmt(bedsSum(t))+' zł';
}

function calcGenerate(){
  const t=T(),p=P(),out=[];
  computeOffsets(t);
  t.stages.forEach(s=>{
    if(s.status==='skip')return;
    const when=t.dateless?'':dateFor(t.start,s._off).iso;
    if(s.price)out.push({cat:(s.mode==='plane'?'lot':'transport'),desc:stageTitle(s),when,qty:1,price:num(s.price),cur:toCode(s.curr)});
  });
  ((p&&p.budget)||[]).forEach(b=>{
    if(/nocleg/i.test(b.n))return;
    out.push({cat:/lot|przelot/i.test(b.n)?'lot':(/jedzen/i.test(b.n)?'jedzenie':(/transport|alugu|prom/i.test(b.n)?'transport':'inne')),
      desc:b.n,when:'',qty:1,price:num(b.v),cur:toCode(b.c)});
  });
  return out;
}
function calcTable(t){
  const head=['Kategoria','Opis','Data','Ilość','Cena','Waluta','Status','Zapłata do','Razem PLN'];
  const body=calcRows(t).map(r=>[(CALC_CATS.find(c=>c[0]===r.cat)||['','inne'])[1].replace(/^\S+\s/,''),r.desc||'',r.when||'',
    r.qty!=null?r.qty:1,r.price||0,toCode(r.cur),payName(r.pay),r.payDate||'',Math.round(calcLine(r))]);
  bedsNights(t).forEach(n=>{const b=bedRec(t,n.key);
    body.push(['Nocleg',n.place+(b.name?' — '+b.name:''),n.iso,1,b.price||0,toCode(b.cur),payName(b.pay),b.payDate||'',Math.round(bedLine(b))]);});
  body.push(['','ZAPŁACONE','','','','','','',Math.round(calcBy(t,'paid'))]);
  body.push(['','NA MIEJSCU','','','','','','',Math.round(calcBy(t,'onsite'))]);
  body.push(['','RAZEM','','','','','','',Math.round(calcGrand(t))]);
  return[head].concat(body);
}

$('#calc').addEventListener('input',e=>{
  const t=T();
  const bf=e.target.closest('[data-bf]');
  if(bf){const row=bf.closest('[data-bk]');if(!row)return;
    const b=bedRec(t,row.dataset.bk);
    b[bf.dataset.bf]=(bf.dataset.bf==='price')?num(bf.value):bf.value;
    saveTrips();row.querySelector('.bed-s').textContent=fmt(bedLine(b))+' zł';calcRefreshTiles();return;}
  const f=e.target.closest('[data-cf]');if(!f)return;
  const row=f.closest('[data-ci]');if(!row)return;
  const r=calcRows(t)[+row.dataset.ci];if(!r)return;
  r[f.dataset.cf]=(f.dataset.cf==='qty'||f.dataset.cf==='price')?num(f.value):f.value;
  saveTrips();
  if(f.dataset.cf==='cat'){buildCalc();return;}
  row.querySelector('.cr-sum').textContent=fmt(calcLine(r))+' zł';
  const sec=row.closest('.csec');
  if(sec){const cat=sec.dataset.cat;
    const sub=calcRows(t).filter(x=>!x.off&&(x.cat||'inne')===cat).reduce((a,x)=>a+calcLine(x),0);
    const em=sec.querySelector('.csec-h em');if(em)em.textContent=fmt(sub)+' zł';}
  calcRefreshTiles();
});
$('#calc').addEventListener('change',e=>{
  if(e.target.id==='calc-cap'){T().calcCap=num(e.target.value);saveTrips();calcRefreshTiles();}
  if(e.target.closest('.bed-c')){saveTrips();calcRefreshTiles();}
});
$('#calc').addEventListener('click',e=>{
  const t=T();
  const bp=e.target.closest('[data-bpay]');
  if(bp){const b=bedRec(t,bp.dataset.bpay);b.pay=payNext(b.pay);
    if(b.pay!=='res')b.payDate='';saveTrips();buildCalc();return;}
  if(e.target.id==='bed-fill'){
    const v=prompt('Cena za noc (zostanie wpisana tam, gdzie pusto). Waluta: EUR','19');
    if(v==null)return;const p=num(v);
    bedsNights(t).forEach(n=>{const b=bedRec(t,n.key);if(!num(b.price)){b.price=p;b.cur='EUR';}});
    saveTrips();buildCalc();toast('Wypełnione');return;}
  if(e.target.id==='bed-clear'){if(!confirm('Wyczyścić wszystkie noclegi?'))return;t.beds={};saveTrips();buildCalc();return;}
  if(e.target.id==='calc-add'){calcRows(t).push({cat:'inne',desc:'',when:'',qty:1,price:'',cur:'PLN'});saveTrips();buildCalc();
    const last=$$('#calc .crow').pop();if(last)last.querySelector('.cr-d').focus();return;}
  if(e.target.id==='calc-gen'){
    const gen=calcGenerate();
    if(calcRows(t).length&&!confirm('Dopisać '+gen.length+' pozycji ze szkicu planu do tego, co już masz?'))return;
    t.calc=calcRows(t).concat(gen);saveTrips();buildCalc();toast('Dopisano '+plural(gen.length,'pozycję','pozycje','pozycji'));return;}
  if(e.target.id==='calc-clear'){if(!confirm('Usunąć wszystkie pozycje kosztorysu?'))return;t.calc=[];saveTrips();buildCalc();return;}
  if(e.target.id==='calc-imp'){$('#calc-file').click();return;}
  if(e.target.id==='calc-csv'){
    const rows=calcTable(t).map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const blob=new Blob(['﻿'+rows],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kosztorys-'+t.id+'.csv';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Pobrano CSV');return;}
  if(e.target.id==='calc-copy'){
    const txt=calcTable(t).map(r=>r.join('\t')).join('\n');
    (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast('Skopiowano tabelę')).catch(()=>toast('Nie udało się skopiować'));return;}
  const pd=e.target.closest('[data-cpay]');
  if(pd){const q=pd.dataset.cpay.split('|'),r=calcRows(t)[+q[0]];
    r.pay=(r.pay===q[1])?'':q[1];if(r.pay!=='res')r.payDate='';saveTrips();buildCalc();return;}
  const off=e.target.closest('[data-coff]');
  if(off){const r=calcRows(t)[+off.dataset.coff];r.off=!r.off;saveTrips();buildCalc();return;}
  const del=e.target.closest('[data-cdel]');
  if(del){calcRows(t).splice(+del.dataset.cdel,1);saveTrips();buildCalc();return;}
});

/* ---- wczytywanie kosztorysu: JSON albo CSV z eksportu ---- */
function calcParse(txt){
  txt=String(txt||'').replace(/^﻿/,'').trim();
  if(txt[0]==='{'||txt[0]==='['){
    let o;try{o=JSON.parse(txt);}catch(e){return{err:'Plik JSON jest uszkodzony.'};}
    const arr=Array.isArray(o)?o:(Array.isArray(o.rows)?o.rows:null);
    if(!arr)return{err:'W pliku nie ma listy „rows”.'};
    return{rows:arr.map(r=>({cat:CALC_CATS.some(c=>c[0]===r.cat)?r.cat:'inne',desc:String(r.desc||''),when:String(r.when||''),
      qty:num(r.qty)||1,price:num(r.price)||0,cur:toCode(r.cur||'PLN'),off:!!r.off,
      pay:(PAY.some(x=>x[0]===r.pay)?r.pay:(r.paid?'paid':'')),payDate:String(r.payDate||'')}))};
  }
  const lines=txt.split(/\r?\n/).filter(x=>x.trim());
  if(lines.length<2)return{err:'Plik CSV jest pusty.'};
  const cell=l=>l.split(/[;\t]/).map(x=>x.replace(/^"|"$/g,'').replace(/""/g,'"').trim());
  const head=cell(lines[0]).map(x=>x.toLowerCase());
  const pi=head.indexOf('status')>=0?head.indexOf('status'):head.indexOf('kupione');
  const out=[];
  lines.slice(1).forEach(l=>{
    const c=cell(l);if(c.length<6)return;
    if(/^(razem|zapłacone)$/i.test(c[1])||!c[1]&&!c[4])return;
    const lab=(c[0]||'').toLowerCase();
    const cat=(CALC_CATS.find(x=>x[1].toLowerCase().indexOf(lab)>=0||x[0]===lab)||['inne'])[0];
    const raw=pi>=0?(c[pi]||''):'';
    const st=(PAY.find(x=>x[2]===raw)||[/^(tak|1|true|✓)$/i.test(raw)?'paid':''])[0];
    out.push({cat,desc:c[1],when:/^\d{4}-\d{2}-\d{2}$/.test(c[2])?c[2]:'',qty:num(c[3])||1,price:num(c[4])||0,
      cur:toCode(c[5]||'PLN'),pay:st||''});
  });
  return out.length?{rows:out}:{err:'Nie znalazłem w CSV żadnych wierszy.'};
}
document.addEventListener('change',e=>{
  if(e.target.id!=='calc-file')return;
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    const r=calcParse(rd.result);
    if(r.err){toast(r.err);return;}
    const t=T(),had=calcRows(t).length;
    if(had&&!confirm('Masz już '+plural(had,'pozycję','pozycje','pozycji')+'. OK zastąpi je wczytanymi, Anuluj dopisze na koniec.'))
      t.calc=calcRows(t).concat(r.rows);
    else t.calc=r.rows;
    saveTrips();buildCalc();toast('Wczytano '+plural(r.rows.length,'pozycję','pozycje','pozycji'));
  };
  rd.readAsText(f);e.target.value='';
});

/* ============ KLOCKI — modularny kreator trasy ============ */
const BLK_RISK=['','pewne','bywa','zawodne'];

function blkPack(){const p=P();return(p&&p.blocks)||null;}
function blkState(t){
  t=t||T();
  if(!t.blocks||!Array.isArray(t.blocks.sel)){
    const B=blkPack();
    t.blocks={sel:[],links:{}};
    if(B&&B.anchor&&Array.isArray(B.anchor.preset)&&B.anchor.preset.length){
      t.blocks.sel=JSON.parse(JSON.stringify(B.anchor.preset));
      t.blocks.links=Object.assign({},B.anchor.presetLinks||{});
    }else if(B&&B.anchor){
      const a=B.islands.find(i=>i.id===B.anchor.inIsl),b=B.islands.find(i=>i.id===B.anchor.outIsl);
      if(a)t.blocks.sel.push({id:a.id,nights:a.rec});
      if(b&&b!==a)t.blocks.sel.push({id:b.id,nights:b.rec});
    }
  }
  return t.blocks;
}
function blkIsl(id){const B=blkPack();return B?B.islands.find(i=>i.id===id):null;}
function blkPair(a,b){return[a,b].sort().join('|');}
function blkOpts(a,b){
  const B=blkPack();if(!B)return[];
  return B.links.filter(l=>(l.a===a&&l.b===b)||(l.a===b&&l.b===a));
}
function blkPick(a,b){
  const o=blkOpts(a,b);if(!o.length)return null;
  const st=blkState(),key=blkPair(a,b),want=st.links[key];
  if(want){const m=o.find(l=>l.mode===want);if(m)return m;}
  const f=o.find(l=>l.mode==='ferry');
  return f||o[0];
}
/* data wyjazdu z klocka nr k (po nocach wstępnych z kotwicy) */
function blkPreNights(){
  const B=blkPack();
  return((B&&B.anchor&&B.anchor.pre)||[]).reduce((a,s)=>a+Math.max(0,num(s.nights)),0);
}
function blkLegDate(t,k){
  t=t||T();if(!t.start||t.dateless)return null;
  const st=blkState(t);let off=blkPreNights();
  for(let i=0;i<=k;i++)off+=Math.max(0,num(st.sel[i].nights));
  return dateFor(t.start,off);
}
const DOW_PL=['nd','pn','wt','śr','czw','pt','sob'];
function blkDayOK(l,d){
  if(!l||!Array.isArray(l.days)||!l.days.length||!d||!d.iso)return null;
  return l.days.indexOf(dAt(d.iso).getDay())>=0;
}
/* najbliższe dozwolone daty dla połączenia, które nie kursuje codziennie */
function blkNextDays(l,d,n){
  const out=[];if(!d||!d.iso)return out;
  for(let i=-3;i<=6&&out.length<(n||2);i++){
    const iso=addDays(d.iso,i);
    if(l.days.indexOf(dAt(iso).getDay())>=0){const x=dateFor(iso,0);out.push(DOW_PL[dAt(iso).getDay()]+' '+x.d);}
  }
  return out;
}

/* najtańsza wyspa pośrednia łącząca a i b jednym przeskokiem w każdą stronę */
function blkVia(a,b){
  const B=blkPack();if(!B)return null;
  let best=null,bestP=Infinity;
  B.islands.forEach(i=>{
    if(i.id===a||i.id===b)return;
    const l1=blkPick(a,i.id),l2=blkPick(i.id,b);
    if(!l1||!l2)return;
    const p=num(l1.price)+num(l2.price);
    if(p<bestP){bestP=p;best=i.id;}
  });
  return best;
}
function blkTotals(t){
  t=t||T();const st=blkState(t),B=blkPack();
  const r={nights:0,stay:0,transport:0,flights:0,ferries:0,gaps:[],legs:[]};
  if(!B)return r;
  st.sel.forEach(s=>{
    const i=blkIsl(s.id);if(!i)return;
    const n=Math.max(0,num(s.nights));
    r.nights+=n;r.stay+=n*(num(i.bed)+num(i.food)+num(i.local));
  });
  for(let k=0;k<st.sel.length-1;k++){
    const a=st.sel[k].id,b=st.sel[k+1].id,l=blkPick(a,b);
    if(!l){r.gaps.push([a,b]);r.legs.push(null);continue;}
    r.legs.push(l);r.transport+=num(l.price);
    if(l.mode==='plane')r.flights++;else r.ferries++;
  }
  r.fees=(B.fees?num(B.fees.intl):0)+r.flights*(B.fees?num(B.fees.dom):0);
  r.total=r.stay+r.transport+r.fees;
  return r;
}

function blkWarnings(t){
  t=t||T();const st=blkState(t),B=blkPack(),w=[];
  if(!B)return w;
  const tot=blkTotals(t),cap=num(B.anchor.nights);
  const first=st.sel[0],last=st.sel[st.sel.length-1];
  if(!st.sel.length)w.push({lvl:'bad',t:'Nie wybrałeś żadnej wyspy.'});
  if(first&&first.id!==B.anchor.inIsl)
    w.push({lvl:'bad',t:'Trasa musi zaczynać się na wyspie, na której lądujesz: '+blkIsl(B.anchor.inIsl).name+'.'});
  if(last&&last.id!==B.anchor.outIsl)
    w.push({lvl:'bad',t:'Trasa musi kończyć się na wyspie wylotowej: '+blkIsl(B.anchor.outIsl).name+'.'});
  tot.gaps.forEach(g=>{
    const via=blkVia(g[0],g[1]);
    w.push({lvl:'bad',t:'Brak połączenia '+blkIsl(g[0]).name+' → '+blkIsl(g[1]).name+'.'+
      (via?' Trzeba wrócić przez '+blkIsl(via).name+'.':' Zmień kolejność wysp.'),
      fix:via?{via:via,after:g[0]}:null});});
  const d=tot.nights-cap;
  if(d>0)w.push({lvl:'bad',t:'Masz '+plural(d,'noc','noce','nocy')+' za dużo. Skróć pobyt albo wyrzuć wyspę.'});
  if(d<0)w.push({lvl:'warn',t:'Zostaje '+plural(-d,'wolna noc','wolne noce','wolnych nocy')+' do rozdania.'});
  if(d===0&&!tot.gaps.length)w.push({lvl:'ok',t:'Trasa się spina: '+plural(cap,'noc','noce','nocy')+' co do jednej.'});
  const ids=st.sel.map(s=>s.id);
  st.sel.forEach((s,k)=>{const i=blkIsl(s.id);if(!i)return;
    if(i.warn)w.push({lvl:'warn',t:i.name+': '+i.warn});
    /* przy powtórzonej wyspie krótki postój to przesiadka, nie błąd */
    const rep=ids.filter(x=>x===s.id).length>1, total=st.sel.filter(x=>x.id===s.id).reduce((a,x)=>a+num(x.nights),0);
    const nn=rep?total:num(s.nights);
    if(ids.indexOf(s.id)===k&&nn<num(i.min))
      w.push({lvl:'warn',t:i.name+' łącznie '+plural(nn,'noc','noce','nocy')+' to za mało — minimum sensowne to '+i.min+'.'});});
  tot.legs.forEach(l=>{if(l&&l.risk>=3)w.push({lvl:'warn',t:l.name+' ('+l.dur+'): '+BLK_RISK[l.risk]+'. Trzymaj dzień zapasu z każdej strony.'});});
  if(tot.flights===0&&st.sel.length>1)w.push({lvl:'warn',t:'Zero lotów krajowych — sprawdź, czy ostatni odcinek na wyspę wylotową da się zrobić promem.'});
  const seen={};return w.filter(x=>{const k=x.lvl+'|'+x.t;if(seen[k])return false;seen[k]=1;return true;});
}

function buildBlocks(){
  const t=T(),B=blkPack(),w=$('#blocks');
  if(!B){w.innerHTML='<div class="empty">Ta wyprawa nie ma jeszcze klocków. Kreator działa dla pakietów, które mają zdefiniowane wyspy i połączenia między nimi.</div>';return;}
  const st=blkState(t),tot=blkTotals(t),cap=num(B.anchor.nights),warns=blkWarnings(t);
  const used=st.sel.map(s=>s.id);
  const free=B.islands.slice();

  let h='<div class="blk-anchor"><div class="blk-a1">'+esc(B.anchor.inNote)+'</div>'+
    '<div class="blk-a1">'+esc(B.anchor.outNote)+'</div>'+
    '<div class="blk-a2">'+esc(B.anchor.note)+'</div></div>';

  const dn=tot.nights-cap;
  h+='<div class="blk-sum">'+
    '<div class="k'+(dn===0?' ok':(dn>0?' over':''))+'"><div class="l">Noce</div><div class="v">'+tot.nights+' / '+cap+'</div>'+
      '<div class="s">'+(dn===0?'równo':(dn>0?'+'+dn+' za dużo':(-dn)+' wolne'))+'</div></div>'+
    '<div class="k"><div class="l">Loty krajowe</div><div class="v">'+tot.flights+'</div><div class="s">'+plural(tot.ferries,'prom','promy','promów')+'</div></div>'+
    '<div class="k"><div class="l">Na miejscu</div><div class="v">'+fmt(tot.total)+' €</div><div class="s">'+fmt(tot.total*rate('EUR'))+' zł</div></div>'+
    '<div class="k"><div class="l">Z lotami</div><div class="v">'+fmt(tot.total+130)+' €</div><div class="s">+130 € kupione</div></div>'+
  '</div>';

  if(warns.length){
    h+='<div class="blk-warns">'+warns.map(x=>'<div class="blk-w '+x.lvl+'">'+esc(x.t)+
      (x.fix?' <button class="blk-fix" data-bfix="'+x.fix.after+'>'+x.fix.via+'">wstaw '+esc(blkIsl(x.fix.via).name)+'</button>':'')+
      '</div>').join('')+'</div>';
  }

  h+='<div class="blk-sec">Trasa</div>';
  if(!st.sel.length){
    h+='<div class="empty">Dodaj pierwszą wyspę z listy poniżej.</div>';
  }else{
    h+='<div class="blk-route">';
    st.sel.forEach((s,k)=>{
      const i=blkIsl(s.id);if(!i)return;
      const open=!!(st.open&&st.open[s.id]);
      h+='<div class="blk-card'+(open?' open':'')+'" data-bi="'+k+'">'+
        '<div class="blk-h">'+
          '<div class="blk-e">'+esc(i.emoji)+'</div>'+
          '<div class="blk-t"><b>'+esc(i.name)+'</b><small>'+esc(i.tag)+' · rekomendowane '+i.rec+'</small></div>'+
          '<div class="blk-n"><button class="blk-s" data-bnm="'+k+'">−</button>'+
            '<span>'+plural(num(s.nights),'noc','noce','nocy')+'</span>'+
            '<button class="blk-s" data-bnp="'+k+'">+</button></div>'+
        '</div>'+
        '<div class="blk-r">'+
          '<button class="blk-x" data-bup="'+k+'"'+(k===0?' disabled':'')+'>↑</button>'+
          '<button class="blk-x" data-bdn="'+k+'"'+(k===st.sel.length-1?' disabled':'')+'>↓</button>'+
          '<button class="blk-x" data-btog="'+s.id+'">'+(open?'▲ zwiń':'▼ co tu robić')+'</button>'+
          '<button class="blk-x del" data-bdel="'+k+'">usuń</button>'+
          '<span class="blk-cost">'+fmt(num(s.nights)*(num(i.bed)+num(i.food)+num(i.local)))+' €</span>'+
        '</div>'+
        (open?'<div class="blk-body"><p class="blk-d">'+esc(i.d)+'</p>'+
          i.todo.map(x=>'<div class="blk-td'+(x.must?' must':'')+'"><div class="blk-tt">'+(x.must?'★ ':'')+esc(x.t)+
            '<em>'+esc(x.h)+'</em></div><div class="blk-tx">'+esc(x.d)+'</div></div>').join('')+
          '</div>':'')+
      '</div>';
      if(k<st.sel.length-1){
        const b=st.sel[k+1].id,opts=blkOpts(s.id,b),cur=blkPick(s.id,b);
        h+='<div class="blk-link'+(cur?'':' bad')+'">';
        if(!cur){h+='<span class="blk-no">brak połączenia</span>';}
        else{
          h+='<div class="blk-lrow">'+opts.map(o=>'<button class="blk-mode'+(o===cur?' on':'')+'" data-blm="'+s.id+'>'+b+'>'+o.mode+'">'+
              (o.mode==='plane'?'✈':'⛴')+' '+esc(o.dur)+' · '+fmt(o.price)+' €</button>').join('')+'</div>'+
            '<div class="blk-ld">'+esc(cur.name)+' · '+esc(cur.freq)+' · '+BLK_RISK[cur.risk]+
              (cur.note?'<br><span class="blk-ln">'+esc(cur.note)+'</span>':'')+'</div>';
        }
        h+='</div>';
      }
    });
    h+='</div>';
  }

  if(free.length){
    h+='<div class="blk-sec">Dostępne klocki</div><div class="blk-pool">';
    free.forEach(i=>{
      const n=used.filter(u=>u===i.id).length;
      h+='<button class="blk-add'+(n?' in':'')+'" data-badd="'+i.id+'"><span class="e">'+esc(i.emoji)+'</span>'+
        '<b>'+esc(i.name)+(n?' <i>×'+n+'</i>':'')+'</b><small>'+esc(i.tag)+'</small>'+
        '<em>'+i.rec+' nocy · '+fmt(i.rec*(num(i.bed)+num(i.food)+num(i.local)))+' €</em></button>';
    });
    h+='</div><p class="blk-note">Wyspę możesz dołożyć drugi raz — tak robi się powrót przez São Vicente albo Praię.</p>';
  }

  h+='<div class="blk-foot">'+
    '<button class="tb-btn big" id="blk-apply">Zbuduj z tego plan</button>'+
    '<button class="tb-btn" id="blk-reset">Zacznij od nowa</button>'+
    '<p class="blk-note">„Zbuduj plan” nadpisze etapy w zakładce Plan. Daty policzą się same od '+esc(T().start)+'.</p></div>';

  w.innerHTML=h;
}

/* ---------- interakcje ---------- */
$('#blocks').addEventListener('click',e=>{
  const t=T(),st=blkState(t);
  const add=e.target.closest('[data-badd]');
  if(add){const i=blkIsl(add.dataset.badd);if(!i)return;
    const B=blkPack(),outI=B.anchor.outIsl;
    const li=st.sel.length-1;
    if(li>=0&&st.sel[li].id===outI)st.sel.splice(li,0,{id:i.id,nights:i.rec});
    else st.sel.push({id:i.id,nights:i.rec});
    saveTrips();buildBlocks();return;}
  const fx=e.target.closest('[data-bfix]');
  if(fx){const q=fx.dataset.bfix.split('>'),after=q[0],via=q[1],iv=blkIsl(via);
    const k=st.sel.map(x=>x.id).lastIndexOf(after);
    if(k>=0&&iv){st.sel.splice(k+1,0,{id:via,nights:1});saveTrips();buildBlocks();}
    return;}
  const del=e.target.closest('[data-bdel]');
  if(del){st.sel.splice(+del.dataset.bdel,1);saveTrips();buildBlocks();return;}
  const nm=e.target.closest('[data-bnm]');
  if(nm){const s=st.sel[+nm.dataset.bnm];s.nights=Math.max(0,num(s.nights)-1);saveTrips();buildBlocks();return;}
  const np=e.target.closest('[data-bnp]');
  if(np){const s=st.sel[+np.dataset.bnp];s.nights=num(s.nights)+1;saveTrips();buildBlocks();return;}
  const up=e.target.closest('[data-bup]');
  if(up){const k=+up.dataset.bup;if(k>0){[st.sel[k-1],st.sel[k]]=[st.sel[k],st.sel[k-1]];saveTrips();buildBlocks();}return;}
  const dn=e.target.closest('[data-bdn]');
  if(dn){const k=+dn.dataset.bdn;if(k<st.sel.length-1){[st.sel[k+1],st.sel[k]]=[st.sel[k],st.sel[k+1]];saveTrips();buildBlocks();}return;}
  const tg=e.target.closest('[data-btog]');
  if(tg){st.open=st.open||{};const id=tg.dataset.btog;st.open[id]=!st.open[id];saveTrips();buildBlocks();return;}
  const lm=e.target.closest('[data-blm]');
  if(lm){const p=lm.dataset.blm.split('>');st.links[blkPair(p[0],p[1])]=p[2];saveTrips();buildBlocks();return;}
  if(e.target.closest('#blk-reset')){
    if(confirm('Wyczyścić kreator i zacząć od zera?')){delete t.blocks;saveTrips();buildBlocks();}return;}
  if(e.target.closest('#blk-apply')){blkApply();return;}
});

/* ---------- generowanie planu ---------- */
function blkApply(){
  const t=T(),st=blkState(t),B=blkPack();
  if(!B||!st.sel.length){toast('Najpierw wybierz wyspy');return;}
  const tot=blkTotals(t);
  if(tot.gaps.length){toast('Najpierw uzupełnij brakujące połączenia');return;}
  if(!confirm('Zastąpić etapy w zakładce Plan trasą z kreatora? Dotychczasowe etapy przepadną.'))return;
  const mk=o=>Object.assign({title:'',from:'',to:'',via:'',mode:'bus',modeSug:o.mode||'bus',nights:1,status:'',
    dep:'',arr:'',carrier:'',price:'',curr:'€',stay:'',stayPrice:'',curr2:'€',src:'user',see:'',detail:'',note:''},o);
  const out=(B.anchor.pre||[]).map(mk);
  st.sel.forEach((s,k)=>{
    const i=blkIsl(s.id);if(!i)return;
    const prev=k>0?blkIsl(st.sel[k-1].id):null;
    const leg=k>0?tot.legs[k-1]:null;
    const must=i.todo.filter(x=>x.must).map(x=>x.t);
    out.push({
      title:prev?(prev.name+' → '+i.name):('Przylot · '+i.name),
      from:prev?prev.name:'',to:i.name,via:'',
      mode:leg?(leg.mode==='plane'?'plane':'ferry'):'plane',
      modeSug:leg?(leg.mode==='plane'?'plane':'ferry'):'plane',
      nights:Math.max(0,num(s.nights)),status:'',
      dep:'',arr:'',carrier:leg?(leg.name+', '+leg.dur):'',
      price:leg?String(leg.price):'',curr:'€',
      stay:i.name,stayPrice:'',curr2:'€',src:'user',
      see:i.tag.charAt(0).toUpperCase()+i.tag.slice(1)+'.'+(must.length?' '+must.join(', ')+'.':''),
      detail:i.d+(leg&&leg.note?' '+leg.note:''),
      note:i.todo.map(x=>x.t+' ('+x.h+')').join(' · ')+(i.warn?' — '+i.warn:'')
    });
  });
  (B.anchor.post||[]).forEach(o=>out.push(mk(o)));
  t.stages=out;t.packRev=null;saveTrips();
  toast('Plan zbudowany: '+plural(out.length,'etap','etapy','etapów'));
  goTab('plan');
}

