

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
/* HTML z pakietów: zostawia tylko b, strong, i, em, small, br; reszta staje się tekstem */
function safe(h){
  const tpl=document.createElement('template');tpl.innerHTML=String(h==null?'':h);
  const OK=['B','STRONG','I','EM','SMALL','BR'];
  [...tpl.content.querySelectorAll('*')].forEach(n=>{
    if(!n.isConnected&&!tpl.content.contains(n))return;
    if(!OK.includes(n.tagName)){n.replaceWith(document.createTextNode(n.textContent));return;}
    [...n.attributes].forEach(a=>n.removeAttribute(a.name));
  });
  return tpl.innerHTML;
}
const attr=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const num=v=>{const n=parseFloat(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return isNaN(n)?0:n;};
const fmt=n=>Math.round(n).toLocaleString('pl-PL');
const fmt2=n=>n.toLocaleString('pl-PL',{maximumFractionDigits:n<10?2:(n<100?1:0)});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
function pl(n,a,b,c){n=Math.abs(Math.round(n));if(n===1)return a;const d=n%10,h=n%100;return(d>=2&&d<=4&&!(h>=12&&h<=14))?b:c;}
function plural(n,a,b,c){return n+' '+pl(n,a,b,c);}
const norm=s=>' '+String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/ł/g,'l').replace(/ı/g,'i').replace(/[^a-z0-9]+/g,' ').trim()+' ';

/* Ikony: Lucide (lucide.dev), licencja ISC. Wszystkie w jednym stylu, kolor = kolor tekstu. */
const SVG_I=b=>'<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+b+'</svg>';
const ICO={
  dzis:SVG_I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
  plan:SVG_I('<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>'),
  mapa:SVG_I('<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>'),
  wydatki:SVG_I('<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>'),
  przew:SVG_I('<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>'),
  klocki:SVG_I('<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>'),
  kosztorys:SVG_I('<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>'),
  insta:SVG_I('<path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/>'),
  lista:SVG_I('<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>'),
  szkolenie:SVG_I('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  more:SVG_I('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  pin:SVG_I('<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'),
  raport:SVG_I('<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>'),
  bagaz:SVG_I('<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"/><path d="M10 20h4"/><circle cx="16" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>'),
};
document.querySelectorAll('[data-i]').forEach(x=>{if(ICO[x.dataset.i])x.innerHTML=ICO[x.dataset.i];});

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
/* status płatności: musi być zdefiniowany przed pierwszym renderem Planu */
const PAY=[['','○','—'],['res','✓','zarezerwowane'],['paid','💳','zapłacone'],['onsite','⌂','płatne na miejscu']];
/* tempo układacza dni (godziny zwiedzania w dzień i wieczorem) */
const PACE={easy:{l:'Spokojnie',d:5,e:2.5},normal:{l:'Normalnie',d:7,e:3},hard:{l:'Intensywnie',d:9,e:5}};
const SLOT_RANK={morning:0,day:1,evening:3};
const MODES={
  plane:{l:'Samolot',s:'lot',i:'✈'},train:{l:'Pociąg',s:'pociąg',i:'🚆'},bus:{l:'Autobus',s:'autobus',i:'🚌'},
  dolmus:{l:'Marszrutka / dolmusz',s:'minibus',i:'🚐'},ferry:{l:'Prom',s:'prom',i:'⚓'},car:{l:'Auto / transfer',s:'transfer',i:'🚗'},
  taxi:{l:'Taxi',s:'taxi',i:'🚕'},tour:{l:'Wycieczka / kolejka',s:'wycieczka',i:'🎟'},walk:{l:'Pieszo',s:'pieszo',i:'🚶'},
  stay:{l:'Bez przejazdu',s:'na miejscu',i:'⏸'},med:{l:'Wizyta / sprawa',s:'sprawa',i:'⚕'}
};
const SYM={PLN:'zł',EUR:'€',USD:'$',TRY:'₺',AMD:'֏',GEL:'₾',GBP:'£',BGN:'лв',RON:'lei',HUF:'Ft',CZK:'Kč',CHF:'CHF',AZN:'₼',IRR:'﷼',UAH:'₴',RSD:'din',ALL:'L',MKD:'ден',BAM:'KM',THB:'฿',JPY:'¥',INR:'₹',VND:'₫',IDR:'Rp',MAD:'DH',EGP:'E£',ILS:'₪',JOD:'JD',MXN:'MX$',CVE:'$'};
const CODE=Object.fromEntries(Object.entries(SYM).map(([c,s])=>[s,c]));
const toCode=x=>SYM[x]?x:(CODE[x]||x);
/* etykieta waluty w UI: trzyliterowy kod (EUR, USD…) — symbole jak $ bywają niejednoznaczne; tylko PLN zostaje jako „zł” */
const toSym=x=>{const c=toCode(x);return c==='PLN'?'zł':c;};
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
/* wydatek w złotych po kursie z dnia zapisu (stare wpisy bez e.pln: kurs bieżący) */
function expPln(e){return e.pln!=null?e.pln:toPln(e.amt,e.cur);}
async function refreshRates(){
  if(!navigator.onLine)return false;
  try{
    const r=await fetch('https://open.er-api.com/v6/latest/PLN',{cache:'no-store'});
    if(!r.ok)return false;
    const j=await r.json();if(j.result!=='success'||!j.rates)return false;
    const p={PLN:1};Object.keys(j.rates).forEach(c=>{if(j.rates[c]>0)p[c]=1/j.rates[c];});
    rates={ts:(j.time_last_update_unix||Date.now()/1000)*1000,src:'na żywo (open.er-api.com)',pln:p};
    save(K.rates,rates);
    let fix=0;expenses.forEach(e=>{if(e.pln===null&&rate(e.cur)){e.pln=Math.round(toPln(e.amt,e.cur)*100)/100;fix++;}});if(fix)saveExp();
    return true;
  }catch(e){return false;}
}

/* ---------- stan ---------- */
let trips=load(K.trips,null);
const FIRST_RUN=trips==null;   // pierwsze uruchomienie na tym telefonie — pokaż samouczek
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
/* wbudowane pakiety, które pokazujemy innym użytkownikom do dodania */
const PUBLIC_PACKS=[];
const GUIDE_FIELDS=['visa','seasons','regions','links','transport'];
let packsVer=1;
const PACK_FIELDS=['stops','places','food','lang','culture','ig','checks','budget','info','events','windows','options'];
function normalizePack(o){
  if(!o||typeof o!=='object')return{err:'To nie jest obiekt JSON.'};
  const id=String(o.id||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  if(!id)return{err:'Brak pola „id” (krótka nazwa bez spacji, np. gruzja27).'};
  if(!o.name)return{err:'Brak pola „name” — nazwy wyprawy.'};
  const isGuide=o.kind==='guide';
  if(!isGuide&&!Array.isArray(o.stages))return{err:'Brak listy „stages” — etapów. Może być pusta: [].'};
  const p=Object.assign({},o);
  if(isGuide){p.kind='guide';if(!Array.isArray(o.stages))o.stages=[];}
  p.id=id;
  p.emoji=o.emoji||'🧭';
  p.cur=toCode(o.cur||'EUR');
  p.sym=o.sym||toSym(p.cur);
  p.extra=Array.isArray(o.extra)?o.extra:[];
  p.start=/^\d{4}-\d{2}-\d{2}$/.test(o.start||'')?o.start:isoToday();
  p.rev=num(o.rev)||1;
  PACK_FIELDS.concat(GUIDE_FIELDS).forEach(f=>{if(!Array.isArray(p[f]))p[f]=[];});
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
  userPacks[n.pack.id]=n.pack;PACKS[n.pack.id]=n.pack;packsVer++;savePacks();
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
function guideTemplate(){
  return{
   _opis:'PRZEWODNIK PO KRAJU dla apki Rihla (mini-pakiet). Wypełnij WSZYSTKIE pola prawdziwymi, sprawdzonymi danymi; jeśli czegoś nie wiesz, zostaw puste pole albo [] — NIE zgaduj. W każdym wpisie visa i seasons podaj w polu checked datę sprawdzenia (RRRR-MM-DD) i w polu src źródło (oficjalna strona). Zasady wizowe dotyczą obywatela Polski. Pola zaczynające się od _ są ignorowane. Zwróć wyłącznie poprawny JSON.',
   kind:'guide',id:'gruzja',name:'Gruzja',emoji:'🇬🇪',cur:'GEL',extra:['EUR','PLN'],rev:1,checked:'2026-01-01',
   visa:[{who:'Obywatele Polski',rule:'Bez wizy do 1 roku',cost:'0',how:'Paszport lub dowód osobisty',url:'',checked:'2026-01-01',src:''}],
   seasons:[
    {name:'Maj–czerwiec',months:[5,6],level:'high',why:'Ciepło, zielono, góry otwarte.',checked:'2026-01-01',start:'2027-05-10',festivals:'Tbilisoba (październik, poza sezonem)'},
    {name:'Listopad–marzec',months:[11,12,1,2,3],level:'low',why:'Tanio, ale przełęcze zamknięte.',checked:'2026-01-01',start:'',festivals:''}],
   regions:[
    {name:'Tbilisi',nights:3,note:'Stolica, baza na start.',hub:true,arrive:{mode:'plane',from:'Kraków',price:'250',cur:'EUR',dur:'4 h 30'}},
    {name:'Kazbegi',nights:2,note:'Góry, 3 h od Tbilisi.',arrive:{mode:'dolmus',from:'Tbilisi',price:'5',cur:'GEL',dur:'3 h'}}],
   transport:[{t:'Marszrutka',d:'Główny transport między miastami; płatność gotówką.'}],
   links:[{t:'e-visa / MSZ',url:''}],
   places:[],food:[],lang:[],culture:[],events:[],checks:[{cat:'Przed wyjazdem',t:'Ubezpieczenie',w:'dok'}],
   info:[{title:'Praktycznie',rows:[['Gniazdka','Typ C/F, 230 V']]}]
  };
}
function mergedPack(t){
  const base=t.pack&&PACKS[t.pack];
  const gs=(t.guides||[]).map(i=>PACKS[i]).filter(g=>g&&g.kind==='guide');
  if(!gs.length)return base||null;
  const key=t.id+'|'+packsVer+'|'+(t.pack||'')+'|'+gs.map(g=>g.id).join(',');
  if(mergedPack._k===key)return mergedPack._v;
  const m=Object.assign({id:'g-'+t.id,name:t.name,emoji:t.emoji,cur:t.cur,sym:toSym(t.cur),extra:[],stages:[],alphabet:null,ferry:null,rev:1},base||{});
  PACK_FIELDS.concat(GUIDE_FIELDS).forEach(f=>{
    m[f]=(base&&Array.isArray(base[f])?base[f]:[]).concat.apply([],gs.map(g=>Array.isArray(g[f])?g[f]:[]));});
  if(!m.alphabet){const g=gs.find(g=>g.alphabet);if(g)m.alphabet=g.alphabet;}
  mergedPack._k=key;mergedPack._v=m;return m;
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
    cur:o.cur||'EUR',extra:o.cur==='EUR'?['USD']:['EUR'],stages:[],dateless:!o.start,
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
    if(PACKS.armenia&&PACKS.armenia.booking&&i===PACKS.armenia.booking.stageIdx)s.extra='booking';
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
  if(t.pack==='powrot'&&PACKS.powrot){
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
  if(t.pack==='armenia'&&PACKS.armenia&&PACKS.armenia.booking&&!t.stages.some(s=>s.extra==='booking')){
    const b=t.stages.find(s=>s.armIdx===PACKS.armenia.booking.stageIdx);if(b)b.extra='booking';}
  if(!t.extra)t.extra=[];
  if(!t.picked)t.picked={};
  t.stages.forEach(s=>{if(s.mode&&!MODES[s.mode])s.mode='bus';});
  return t;
}

/* uszkodzone wpisy (np. z ręcznie edytowanego backupu) nie mogą wywrócić apki */
if(Array.isArray(trips))trips=trips.filter(t=>t&&typeof t==='object'&&t.id!=null).map(t=>{
  if(!Array.isArray(t.stages))t.stages=[];if(!Array.isArray(t.checks))t.checks=[];
  if(!Array.isArray(t.budget))t.budget=[];if(!t.name)t.name='Wyprawa';if(!t.start)t.start=isoToday();return t;});
if(!Array.isArray(expenses))expenses=[];
if(!Array.isArray(checkins))checkins=[];
/* stare dane Wojtka z apek Armenia/Powrót — tylko wtedy migrujemy i dokładamy jego wyprawy */
const LEGACY=lsGet('arm-dayedits')!=null||lsGet('ret-stages2')!=null||lsGet(K.migrated)!=null;
if(!Array.isArray(trips)||!trips.length){
  if(LEGACY&&PACKS.armenia&&PACKS.powrot){
    trips=[migrateArmenia(),migratePowrot()];
    save(K.visited,visited);
    save(K.migrated,Date.now());
  }else{
    trips=[Object.assign(blankTrip({name:'Moja pierwsza wyprawa'}),{dateless:true})];
  }
}
/* wyprawa „Powrót do domu” — dodawana raz */
if(LEGACY&&PACKS.dom&&!load(K.domAdded,false)&&!trips.some(t=>t.id==='dom')){
  trips.push(freshTrip('dom'));save(K.domAdded,true);
  const pw=trips.find(t=>t.id==='powrot');if(pw&&!pw.dormant){pw.dormant=true;pw.dormantAt=Date.now();}
}
/* wyprawa „Cabo Verde” — dodawana raz */
if(LEGACY&&PACKS.cabo&&!load(K.caboAdded,false)&&!trips.some(t=>t.id==='cabo')){
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
const P=()=>mergedPack(T());

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
function currOpts(){const t=T();return[...new Set([toSym(t.cur),...t.extra.map(toSym),'EUR','USD','zł'])];}
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
    if(f.rows)h+=f.rows.map(r=>'<div class="frow"><span class="fk">'+safe(r[0])+'</span><span class="fv">'+safe(r[1])+'</span></div>').join('');
    if(f.tl)h+='<ul class="tl">'+f.tl.map(x=>'<li class="'+(x.c||'')+'"><b>'+esc(x.t)+'</b>'+esc(x.x)+'</li>').join('')+'</ul>';
    if(f.after)h+='<div class="frow" style="border:0;padding-top:12px"><span class="fv" style="font-size:13px;color:var(--muted)">'+safe(f.after)+'</span></div>';
    if(f.call&&/^(tel:|https:)/.test(f.call.href||''))h+='<a class="callbtn" href="'+attr(f.call.href)+'">'+esc(f.call.txt)+'</a>';
    h+='</div>';
  });
  h+='<div class="var-sect">'+esc(F.plansTitle||'Plany na ten dzień')+'</div><div class="plan-grid">';
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
  const n=num(s.nights);
  const mr=stageMoneyRows(t,s);
  const priceTxt=mr.length?mr.map(r=>fmt(calcLine(r))+' zł'+(isLocked(r)?' · 🔒 '+payName(r.pay):' · jeszcze niepotwierdzone')).join('  |  '):'— wpisz w Kosztorysie';
  const si=stageStayInfo(t,s);
  const stayTxt=si.txt?(si.txt+' · '+(si.conf?'🔒 potwierdzone '+si.conf+'/'+si.total:'jeszcze niepotwierdzone')):(n?plural(n,'noc','noce','nocy')+' — wpisz w Kosztorysie':'—');
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
    '<div class="dv-row"><span class="dv-k">Nocleg</span><span class="dv-v">'+esc(stayTxt)+(s.stayUrl?' <a href="'+attr(s.stayUrl)+'" target="_blank" rel="noopener">↗</a>':'')+' <button class="tb-btn" data-gokalk="1">💶 Kosztorys</button></span></div>'+
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
      '<div class="edit-note">💶 Ceny, loty, noclegi i potwierdzenia wpisujesz <b>tylko w Kosztorysie</b> — dzięki temu nic się nie rozjedzie. Tu zostaje sam plan: trasa, godziny, program. <button class="tb-btn" data-gokalk="1">Otwórz Kosztorys</button></div>'+
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
        '<span class="chip day-chip">'+m.i+' '+esc(m.s)+'</span>'+
        (function(){const c=(typeof onsiteForStage==='function')?onsiteForStage(T(),s):0;
          return c?'<div class="day-cash">⌂ Płatność na miejscu: <b>'+fmt(c)+' zł</b></div>':'';})()+
        '</div>'+
      '<span class="expand">⌄</span>'+
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
  const inner='<div class="wins">'+list.map((x,i)=>
    '<button class="win'+(!t.dateless&&t.start===x.start?' on':'')+'" data-win="'+i+'">'+
    '<b>'+esc(x.name)+'</b><span>'+esc(x.when)+'</span><small>'+esc(x.why)+'</small></button>').join('')+'</div>';
  /* termin ustalony → sugestie schowane w zwijanej sekcji */
  w.innerHTML=t.dateless?'<div class="win-h">Sugerowane terminy</div>'+inner
    :'<details class="win-more"><summary>Inne terminy z pakietu ('+list.length+')</summary>'+inner+'</details>';
}
$('#windows').addEventListener('click',e=>{
  const b=e.target.closest('[data-win]');if(!b)return;
  const x=(P().windows||[])[+b.dataset.win];if(!x)return;
  const t=T();if(!t.dateless&&t.start!==x.start&&!dateGuard(t))return;
  t.start=x.start;t.dateless=false;saveTrips();buildStages();
  toast('Start ustawiony na '+dateFor(x.start,0).full);
});
$('.trip-bar').addEventListener('click',e=>{
  const sh=e.target.closest('[data-shift]');
  if(sh){const t=T();if(t.dateless)return;if(!dateGuard(t))return;t.start=addDays(t.start,+sh.dataset.shift);saveTrips();buildStages();return;}
});
$('#trip-nodate').addEventListener('change',e=>{
  const t=T();t.dateless=e.target.checked;saveTrips();buildStages();
  toast(t.dateless?'Daty ukryte — zostają numery dni':'Daty włączone');
});

/* ---- zdarzenia etapów ---- */
$('#trip-start').addEventListener('change',e=>{
  const v=e.target.value;if(!v||isNaN(dAt(v))){e.target.value=T().start;return;}
  if(v!==T().start&&!T().dateless&&!dateGuard(T())){e.target.value=T().start;return;}
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
  if(e.target.closest('[data-gokalk]')){goTab('kosztorys');return;}
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
  const t=T();if(!t.pack||!PACKS[t.pack]){toast(t.pack?'Brak pakietu „'+t.pack+'” — zaimportuj plik z pakietami.':'Własna wyprawa nie ma wersji domyślnej.');return;}
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
          '<div class="var-body"><div class="var-body-inner">'+(v.short?'<div class="fact" style="margin:0 0 4px;padding:14px 16px;border-left:4px solid var(--olive)"><span style="font-size:13.5px">'+safe(v.short)+'</span></div>':'')+
          '<div class="var-sect">Odcinki</div>'+(v.legs||[]).map((l,n)=>'<div class="leg"><span class="leg-n">'+(n+1)+'</span><span class="leg-t"><b>'+esc(l.t)+'</b>'+
            (l.mode?'<span>'+MODES[l.mode].i+' '+esc(MODES[l.mode].l)+' · '+esc(l.dur||'')+' · ~'+l.price+toSym(l.curr||'')+(l.nights?' · '+plural(l.nights,'noc','noce','nocy'):'')+'</span>':'')+
            '<span>'+safe(l.s)+'</span></span></div>').join('')+
          (v.pros?'<div class="pc-grid"><div class="pc pro"><h5>Za</h5><ul>'+v.pros.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul></div><div class="pc con"><h5>Przeciw</h5><ul>'+v.cons.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ul></div></div>':'')+
          '</div></div></div>';
      }else{
        inner+='<div class="ropt '+(v.k||'')+(on?' open':'')+'"><div class="ropt-top"><div class="ropt-n"><b>'+esc(v.n)+(on?' ✓':'')+'</b><span>'+esc(v.sub||'')+'</span></div>'+
          '<div class="ropt-m"><b>'+esc(v.m||'')+'</b>'+esc(v.c||'')+'</div><span class="expand">⌄</span></div>'+
          '<div class="ropt-body"><div class="ropt-body-inner">'+(v.legs||[]).map((l,n)=>'<div class="rleg"><span class="rleg-n">'+(n+1)+'</span><span class="rleg-t"><b>'+esc(l.t)+'</b><span>'+safe(l.s)+'</span></span></div>').join('')+
          (v.v?'<div class="rverdict">'+safe(v.v)+'</div>':'')+'<button class="var-pick" style="margin-top:12px" data-pick="'+gi+'|'+v.id+'">'+(on?'✓ Tak wracam':'Tak wracam')+'</button></div></div></div>';
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
    '<button class="tb-btn" id="rev-skip">Zostaw mój plan</button></div>';
  w.appendChild(r);
  r.querySelector('#rev-apply').onclick=()=>{
    applyPackRev(T());saveTrips();buildRevBar();revDot();buildStages();buildOptions();buildInfos();
    if(typeof buildHeader==='function')buildHeader();toast('Plan zaktualizowany');
    window.scrollTo({top:0,behavior:'smooth'});};
  r.querySelector('#rev-skip').onclick=()=>{const t=T(),Pk=t.pack&&PACKS[t.pack];t.pendingRev=false;if(Pk)t.packRev=Pk.rev;saveTrips();w.innerHTML='';revDot();toast('Zostaje Twój plan');};
  setTimeout(()=>{try{r.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){}},200);
}
function buildInfos(){
  const w=$('#infos');w.innerHTML='';
  const info=(P()&&P().info)||[];if(!info.length)return;
  info.forEach((x,i)=>{
    const f=el('div','fold');
    const rows=Array.isArray(x.rows)?x.rows:[];
    const body=rows.length
      ? rows.map(r=>'<div class="irow"><span class="ik">'+esc(r[0])+'</span><div class="iv">'+safe(r[1])+'</div></div>').join('')
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
    '<div class="d-meta"><span>'+esc(stageTitle(st))+'</span>'+(nn>1?'<span>dzień '+dayN+' z '+nn+'</span>':'')+(stageStayTxt(t,st)?'<span>🛏 '+esc(stageStayTxt(t,st))+'</span>':'')+'</div>'+
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
      (stageStayTxt(t,s)?'<span>🛏 '+esc(stageStayTxt(t,s))+'</span>':'')+'</div>'+
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
    '<div class="conv"><div class="col"><div class="ch">złoty → '+esc(sym)+'</div>'+plnV.map(v=>'<div class="r"><span>'+v+' zł</span><b>'+(v*per<10?fmt2(v*per):fmt(v*per))+' '+sym+'</b></div>').join('')+'</div>'+
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

/* ---- „Do domknięcia”: kluczowe rzeczy, które jeszcze nie są załatwione ---- */
let openAll=false;
function isKeyCheck(t,x){
  if(typeof x.key==='boolean')return x.key;
  const Pk=t.pack&&PACKS[t.pack];
  return!!(Pk&&Array.isArray(Pk.keyChecks)&&Pk.keyChecks.indexOf(x.t)>=0);
}
function openItems(c){
  const t=c.t,travel=effMode()==='travel',today=isoToday(),out=[];
  computeOffsets(t);
  /* 1. odprawa online: otwiera się ~24 h przed lotem */
  if(!t.dateless)t.stages.forEach((s,i)=>{
    if(s.mode!=='plane'||s.status==='skip'||s.status==='done'||s.ckin)return;
    const m=/(\d{1,2})[:.](\d{2})/.exec(s.dep||'');if(!m)return;
    const iso=dateFor(t.start,s._off).iso;if(!iso)return;
    const dt=new Date(iso+'T'+('0'+m[1]).slice(-2)+':'+m[2]+':00'),diff=dt-Date.now();
    if(diff<=0||diff>48*3600000)return;
    const left=diff-24*3600000;
    out.push({p:0,ico:'✈',t:'Odprawa online: '+stageTitle(s),sub:left<=0?'otwarta — zrób ją teraz (lot ok. '+m[1]+':'+m[2]+')':'otworzy się za ok. '+Math.ceil(left/3600000)+' h',ckin:i,urgent:left<=0});
  });
  /* 2. kluczowe pozycje z Listy, nieodhaczone */
  t.checks.forEach((x,i)=>{
    if(x.done||x.on||!isKeyCheck(t,x))return;
    out.push({p:1,ico:'★',t:x.t,sub:x.cat||'',tick:i});
  });
  if(!t.dateless){
    /* 3. loty i promy bez potwierdzenia w Kosztorysie */
    t.stages.forEach(s=>{
      if((s.mode!=='plane'&&s.mode!=='ferry')||s.status==='skip'||s.status==='done')return;
      const d=dateFor(t.start,s._off);if(!d.iso||d.iso<today)return;
      const rows=stageMoneyRows(t,s);
      if(rows.length&&rows.every(isLocked))return;
      out.push({p:2,when:d.iso,ico:MODES[s.mode].i,t:stageTitle(s)+' · '+d.d,sub:rows.length?(MODES[s.mode].s+' niepotwierdzony(a) w Kosztorysie'):('brak w Kosztorysie — wpisz i potwierdź'),go:'kosztorys'});
    });
    /* 4. noce bez potwierdzonego noclegu (w podróży tylko dziś i 2 najbliższe noce) */
    const lim=addDays(today,2),bm=(t.beds&&typeof t.beds==='object')?t.beds:{};
    let grp=null;
    bedsNights(t).forEach(n=>{
      const ok=!n.iso||n.place==='—'||n.iso<today||(travel&&n.iso>lim)||isLocked(bm[n.key]);
      if(ok){grp=null;return;}
      if(grp&&grp.place===n.place){grp.n++;return;}
      grp={p:2,when:n.iso,ico:'🛏',place:n.place,n:1,go:'kosztorys'};out.push(grp);
    });
    out.forEach(x=>{if(x.place){x.t=x.place+': '+plural(x.n,'noc','noce','nocy')+' bez potwierdzonego noclegu';x.sub='od '+dateFor(x.when,0).d;}});
  }
  out.sort((a,b)=>a.p-b.p||String(a.when||'').localeCompare(String(b.when||'')));
  return out;
}
function openCard(c){
  const t=c.t;
  if(t.dateless&&!t.checks.some(x=>isKeyCheck(t,x)))return'';
  const items=openItems(c),travel=effMode()==='travel';
  if(!items.length)return(!travel&&t.stages.length)?'<div class="card open-ok">✓ Wszystko kluczowe jest domknięte</div>':'';
  let vis=items;
  if(!openAll){
    const first=items.filter(x=>x.p===0),keys=items.filter(x=>x.p===1),bk=items.filter(x=>x.p===2);
    const room=Math.max(0,5-first.length),kn=Math.min(keys.length,Math.max(Math.min(3,room),room-bk.length));
    vis=first.concat(keys.slice(0,kn),bk.slice(0,Math.max(0,room-kn)));
  }
  const rows=vis.map(x=>{
    const btn=x.ckin!=null?'<button class="tb-btn" data-ckin="'+x.ckin+'">✓ zrobione</button>':(x.go?'<button class="tb-btn" data-go="'+x.go+'">Kosztorys</button>':'');
    const tick=x.tick!=null?' data-tick="'+x.tick+'"':'';
    return '<div class="open-row'+(x.urgent?' urgent':'')+'"'+tick+'><span class="oi">'+(x.tick!=null?'○':x.ico)+'</span><span class="ot"><b>'+esc(x.t)+'</b>'+(x.sub?'<small>'+esc(x.sub)+'</small>':'')+'</span>'+btn+'</div>';
  }).join('');
  const more=items.length>vis.length||openAll?'<button class="tb-btn" data-openall="1">'+(openAll?'Pokaż mniej':'Pokaż wszystkie ('+items.length+')')+'</button>':'';
  return '<div class="card open-card"><h4>'+(travel?'Jeszcze nie domknięte':'Do domknięcia przed wyjazdem')+' <small>'+items.length+'</small></h4>'+rows+more+
    '<div class="open-hint">Klik w ○ odhacza pozycję z Listy. Kluczowe oznaczasz gwiazdką ★ w Liście.</div></div>';
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
    const sp=expenses.filter(e=>e.trip===t.id).reduce((a,e)=>a+expPln(e),0);
    h+='<div class="card dest stay-day"><h4>Wyprawa zakończona</h4><div class="d-to">'+fmt(sp)+' zł</div>'+
      '<div class="d-meta"><span>'+plural(c.total+1,'dzień','dni','dni')+'</span><span>'+plural(checkins.filter(x=>x.trip===t.id).length,'check-in','check-iny','check-inów')+'</span></div>'+
      '<div class="d-note">Podsumowanie wydatków znajdziesz w zakładce Wydatki.</div></div>';
  }else if(c.openPlan){
    h+='<div class="card dest stay-day"><h4>Plan się urwał</h4><div class="d-to">Wybierz wariant</div>'+
      '<div class="d-note">Zaplanowane etapy się skończyły, a wyprawa trwa. Wejdź w Plan, wybierz wariant i wstaw jego odcinki — dni policzą się dalej.</div>'+
      '<div class="tm-prep"><button class="tb-btn" data-go="plan">Otwórz Plan</button></div></div>';
  }else{h+=destCard(c);h+=dayPlanCard(c);h+=cityTodayCard(c);}

  h+='<div class="acts"><button class="act exp" data-open="exp"><span>'+ICO.wydatki+'</span>Wydatek</button><button class="act chk" data-open="ci"><span>'+ICO.pin+'</span>Check-in</button></div>';
  h+=openCard(c);

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
      (ex.length?'<div class="conv-mini" style="margin-bottom:8px">Wydane: <b>'+fmt(ex.reduce((a,e)=>a+expPln(e),0))+' zł</b> · '+plural(ex.length,'pozycja','pozycje','pozycji')+'</div>':'')+
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
  const ck=e.target.closest('[data-ckin]');if(ck){const s=t.stages[+ck.dataset.ckin];if(s){s.ckin=true;saveTrips();buildToday();toast('Odprawa zaznaczona ✓');}return;}
  if(e.target.closest('[data-openall]')){openAll=!openAll;buildToday();return;}
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
const BUILD={dzis:buildToday,plan:()=>{buildRevBar();buildStages();cityPlanSummary();buildOptions();buildInfos();if(!planScrolled&&!T().pendingRev){planScrolled=true;setTimeout(scrollToToday,120);}},
  mapa:()=>setTimeout(initMap,60),wydatki:buildExpenses,przew:buildGuide,insta:buildIG,lista:buildChecks,kosztorys:buildCalc,klocki:()=>{(cityPack()?buildCity:blkPack()?buildBlocks:buildZarys)();buildIdeas();}};
let curTab=null;
/* które zakładki są „główne” (dolny pasek na telefonie) zależy od trybu */
const TAB_SETS={travel:['dzis','mapa','wydatki','insta'],plan:['dzis','klocki','plan','kosztorys']};
function applyTabs(){
  const main=TAB_SETS[effMode()]||TAB_SETS.plan;
  tabs.forEach(b=>{const i=main.indexOf(b.dataset.p);b.classList.toggle('nav-main',i>=0);b.style.order=i>=0?i:20;});
}
function moreTabs(){
  return tabs.filter(b=>!b.classList.contains('nav-main')&&b.style.display!=='none').map(b=>{
    const ti=b.querySelector('.ti');return[b.dataset.p,ti?ti.innerHTML:'•',b.textContent.replace(ti?ti.textContent:'','').trim()];});
}
tabs.forEach(b=>b.addEventListener('click',()=>{
  tabs.forEach(t=>t.classList.remove('active'));$$('.panel').forEach(p=>p.classList.remove('active'));
  b.classList.add('active');$('#'+b.dataset.p).classList.add('active');curTab=b.dataset.p;
  document.body.classList.toggle('compact',b.dataset.p!=='dzis');
  $('#more-btn').classList.toggle('active',!b.classList.contains('nav-main'));
  if(b.dataset.p!=='plan')window.scrollTo({top:0,behavior:'smooth'});
  BUILD[b.dataset.p]&&BUILD[b.dataset.p]();
}));
function goTab(id){if(id==='pomysly')id='klocki';const b=tabs.find(t=>t.dataset.p===id);if(b)b.click();}

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
  b.innerHTML='<span class="seg'+(m==='plan'?' on':'')+'">✎ Plan</span><span class="seg'+(m==='travel'?' on':'')+'">✈ Podróż</span>';
  b.setAttribute('aria-label','Tryb: '+(m==='travel'?'podróż':'planowanie')+'. Dotknij, żeby przełączyć.');
  $$('.plan-only').forEach(x=>x.style.display=m==='plan'?'':'none');
  applyTabs();
  $('#fab').style.display=m==='travel'?'':'none';
  $('#mode-note').innerHTML=m==='travel'
    ?'<b>Tryb podróży.</b> Apka otwiera się na „Dziś”. Plan dalej możesz zmieniać: noce, pomijanie, ✎ w karcie, ⇅ kolejność i ＋ wstawianie etapu.'
    :'<b>Tryb planowania.</b> Na dole masz Zarys, Plan i Kosztorys, resztę pod „Więcej”. W dniu wyjazdu apka sama przełączy się na tryb podróży.';
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
$('#more-btn').addEventListener('click',()=>openSheet('more'));
let exDraft={};
function openSheet(kind){
  const t=T();
  if(kind==='pick'){
    sheet.innerHTML='<h3>Dodaj <button data-close>✕</button></h3><div class="acts" style="margin:0"><button class="act exp" data-open="exp"><span>'+ICO.wydatki+'</span>Wydatek</button><button class="act chk" data-open="ci"><span>'+ICO.pin+'</span>Check-in</button></div>';
  }else if(kind==='more'){
    sheet.innerHTML='<h3>Więcej <button data-close>✕</button></h3><div class="more-list">'+
      moreTabs().map(m=>'<button class="more-item'+(curTab===m[0]?' on':'')+'" data-gotab="'+m[0]+'"><span>'+m[1]+'</span>'+m[2]+'</button>').join('')+
      '<button class="more-item" data-train-open><span>'+ICO.szkolenie+'</span>Szkolenie</button></div>';
  }else if(kind==='exp'){
    const curs=[...new Set([toCode(t.cur),...t.extra.map(toCode),'PLN'])];
    exDraft={cur:exDraft.cur&&curs.includes(exDraft.cur)?exDraft.cur:curs[0],cat:exDraft.cat||'food'};
    sheet.innerHTML='<h3>Wydatek <button data-close>✕</button></h3>'+
      '<div class="amt-row"><input id="ex-amt" inputmode="decimal" placeholder="0" autocomplete="off"></div>'+
      '<div class="cur-pills">'+curs.map(c=>'<button class="pill'+(c===exDraft.cur?' on':'')+'" data-cur="'+c+'">'+esc(c)+'</button>').join('')+'</div>'+
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
  const gt=e.target.closest('[data-gotab]');if(gt){closeSheet();goTab(gt.dataset.gotab);return;}
  const o=e.target.closest('[data-open]');if(o){openSheet(o.dataset.open);return;}
  const cu=e.target.closest('[data-cur]');if(cu){exDraft.cur=cu.dataset.cur;$$('#sheet [data-cur]').forEach(x=>x.classList.toggle('on',x===cu));updPln();return;}
  const ca=e.target.closest('[data-cat]');if(ca){exDraft.cat=ca.dataset.cat;$$('#sheet [data-cat]').forEach(x=>x.classList.toggle('on',x===ca));return;}
  if(e.target.id==='ex-save'){
    const amt=num($('#ex-amt').value);if(!amt){$('#ex-amt').focus();toast('Wpisz kwotę');return;}
    const t=T(),c=todayCtx(),s=c.starting[0]||c.cover;
    expenses.push({id:uid(),trip:t.id,ts:Date.now(),day:isoToday(),amt,cur:exDraft.cur,pln:rate(exDraft.cur)?Math.round(toPln(amt,exDraft.cur)*100)/100:null,cat:exDraft.cat,note:$('#ex-note').value.trim(),
      place:s?((s.to&&s.to!=='—')?s.to:s.from):''});
    saveExp();closeSheet();toast(rate(exDraft.cur)?'Zapisano: '+fmt2(amt)+' '+toSym(exDraft.cur)+' ≈ '+fmt(toPln(amt,exDraft.cur))+' zł':'Zapisano w '+exDraft.cur+'. Brak kursu offline — przeliczę po połączeniu.');
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
  $('#ex-pln').textContent=v&&exDraft.cur!=='PLN'?(rate(exDraft.cur)?'≈ '+fmt2(toPln(v,exDraft.cur))+' zł':'brak kursu offline — przeliczę później'):'';}
function refresh(){if(curTab&&BUILD[curTab])BUILD[curTab]();if(mapObj)drawRouteLayer();}

/* ============ WYDATKI ============ */
/* Kosztorys (jeśli ma pozycje) to dokładniejsze źródło niż domyślny budżet pakietu — inaczej loty i promy liczyłyby się podwójnie */
function plannedFromCalc(t){return Array.isArray(t.calc)&&t.calc.length>0;}
function plannedPln(t){
  if(plannedFromCalc(t))return calcGrand(t);
  let s=0;t.stages.forEach(x=>{if(x.status==='skip')return;s+=toPln(x.price,x.curr)+toPln(x.stayPrice,x.curr2);});
  (t.budget||[]).forEach(b=>{s+=toPln(b.v,b.c);});return s;
}
function buildExpenses(){
  const t=T(),w=$('#expenses');
  const ex=expenses.filter(e=>e.trip===t.id).sort((a,b)=>b.ts-a.ts);
  const tot=ex.reduce((a,e)=>a+expPln(e),0);
  const days=[...new Set(ex.map(e=>e.day))];
  const today=ex.filter(e=>e.day===isoToday()).reduce((a,e)=>a+expPln(e),0);
  const plan=plannedPln(t),r=tripRange(t);
  let h='<div class="acts"><button class="act exp" data-open="exp"><span>'+ICO.wydatki+'</span>Dodaj wydatek</button><button class="act chk" data-report><span>'+ICO.raport+'</span>Kopiuj raport</button></div>';
  h+='<div class="exp-sum">'+
    '<div class="k"><div class="l">Razem</div><div class="v">'+fmt(tot)+' zł</div><div class="s">'+plural(ex.length,'pozycja','pozycje','pozycji')+'</div></div>'+
    '<div class="k"><div class="l">Dziennie</div><div class="v">'+fmt(days.length?tot/days.length:0)+' zł</div><div class="s">średnio z '+plural(days.length,'dnia','dni','dni')+'</div></div>'+
    '<div class="k"><div class="l">Dziś</div><div class="v">'+fmt(today)+' zł</div><div class="s">'+esc(dateFor(isoToday(),0).d)+'</div></div>'+
    (plan?'<div class="k"><div class="l">Plan</div><div class="v">'+fmt(plan)+' zł</div><div class="s">'+(tot?Math.round(tot/plan*100)+'% wydane':(plannedFromCalc(t)?'z kosztorysu':'z etapów i budżetu'))+'</div></div>':'')+
  '</div>';
  if(!ex.length){w.innerHTML=h+'<div class="empty">Jeszcze nic. Dodawaj na bieżąco przyciskiem „Dodaj wydatek” — kwota, waluta, kategoria, trzy dotknięcia.</div>';return;}
  const byCat={};ex.forEach(e=>{byCat[e.cat]=(byCat[e.cat]||0)+expPln(e);});
  h+='<div class="card"><h4>Według kategorii</h4>'+CATS.filter(c=>byCat[c.id]).sort((a,b)=>byCat[b.id]-byCat[a.id]).map(c=>
    '<div class="cat-bar"><div class="cb-h"><span>'+c.i+' '+c.l+'</span><span><b>'+fmt(byCat[c.id])+' zł</b> · '+Math.round(byCat[c.id]/tot*100)+'%</span></div>'+
    '<div class="cb-t"><i style="width:'+(byCat[c.id]/tot*100)+'%;background:'+c.c+'"></i></div></div>').join('')+'</div>';
  days.forEach(d=>{
    const de=ex.filter(e=>e.day===d),ds=de.reduce((a,e)=>a+expPln(e),0);
    const off=dayDiff(t.start,d);
    h+='<div class="exp-day">'+esc(dateFor(d,0).d)+(off>=0&&off<r.days?' · dzień '+(off+1):'')+'<span>'+fmt(ds)+' zł</span></div>';
    de.forEach(e=>{const c=CATM[e.cat]||CATM.other;
      h+='<div class="exp"><div class="e-ic">'+c.i+'</div><div class="e-m"><b>'+esc(e.note||c.l)+'</b><small>'+esc(c.l)+(e.place?' · '+esc(e.place):'')+' · '+
        new Date(e.ts).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})+'</small></div>'+
        '<div class="e-v"><b>'+fmt2(e.amt)+' '+esc(toSym(e.cur))+'</b>'+(toCode(e.cur)!=='PLN'?'<small>'+fmt2(expPln(e))+' zł</small>':'')+'</div>'+
        '<button class="e-x" data-exdel="'+e.id+'" title="usuń">✕</button></div>';});
  });
  h+='<div id="rep-slot"></div>';
  w.innerHTML=h;
}
function reportText(){
  const t=T(),ex=expenses.filter(e=>e.trip===t.id).sort((a,b)=>a.ts-b.ts);
  const tot=ex.reduce((a,e)=>a+expPln(e),0),days=[...new Set(ex.map(e=>e.day))];
  const byCat={};ex.forEach(e=>{byCat[e.cat]=(byCat[e.cat]||0)+expPln(e);});
  let s=t.emoji+' '+t.name+' — wydatki\n'+'='.repeat(28)+'\n';
  s+='Razem: '+fmt(tot)+' zł ('+plural(ex.length,'pozycja','pozycje','pozycji')+', '+plural(days.length,'dzień','dni','dni')+')\n';
  s+='Średnio dziennie: '+fmt(days.length?tot/days.length:0)+' zł\n\nKategorie:\n';
  CATS.filter(c=>byCat[c.id]).forEach(c=>{s+='  '+c.l.padEnd(10)+fmt(byCat[c.id]).padStart(8)+' zł  '+Math.round(byCat[c.id]/tot*100)+'%\n';});
  s+='\nDni:\n';
  days.forEach(d=>{const de=ex.filter(e=>e.day===d);s+='  '+dateFor(d,0).d+'  '+fmt(de.reduce((a,e)=>a+expPln(e),0))+' zł\n';
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
          '<div class="pc-h"><div class="pc-n">'+esc(x.name)+'</div><div class="pc-w">'+esc(x.where||'')+'</div>'+
          '<span class="pc-tag">'+({must:'must see',worth:'warto',detour:'objazd'}[x.tag]||'')+'</span></div>'+tickDot(x.key,'Odwiedzone')+'<span class="expand">⌄</span></div>'+
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
    p.lang.forEach(s=>{h+='<div class="area-h">'+esc(s.sec)+'</div>'+(s.note?'<div class="lang-note">'+safe(s.note)+'</div>':'')+
      '<div class="lang-grid">'+s.items.map(x=>'<div class="phrase"><div class="pl">'+esc(x.pl)+'</div><div class="tr">'+esc(x.local)+'</div><div class="ph">['+esc(x.say)+']</div></div>').join('')+'</div>';});
    if(p.alphabet)h+='<div class="area-h">Alfabet</div><div class="abc">'+p.alphabet.map(x=>'<div><b>'+esc(x.c)+'</b><span>'+esc(x.t)+'</span></div>').join('')+'</div>';
  }else if(guideTab==='events'){
    const t=T(),r=tripRange(t),inTrip=d=>!t.dateless&&d&&d>=r.start&&d<=r.end;
    const g=groupBy(p.events,'cat');
    if(p.eventsNote)h+='<div class="ev-note">'+esc(p.eventsNote)+'</div>';
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
      const kk=isKeyCheck(t,c);
      d.innerHTML='<span class="box">'+(c.done?'✓':'')+'</span><span class="task">'+esc(c.t)+(c.w?'<small class="when">'+esc(c.w)+'</small>':'')+'</span>'+
        '<button class="ord-btn star'+(kk?' on':'')+'" data-ckey="'+i+'" title="kluczowe — pokaże się w Dziś, dopóki nie odhaczone" style="flex:0 0 auto;margin-left:8px">'+(kk?'★':'☆')+'</button>'+
        '<button class="ord-btn del" data-cdel="'+i+'" style="flex:0 0 auto;margin-left:4px">✕</button>';
      d.onclick=ev=>{if(ev.target.closest('[data-cdel]')||ev.target.closest('[data-ckey]'))return;c.done=!c.done;saveTrips();buildChecks();};
      w.appendChild(d);});
  });
  $('#chk-progress').innerHTML='<span>Odhaczone: <b>'+done+'</b> z <b>'+t.checks.length+'</b></span>';a11y(w);
}
$('#checks').addEventListener('click',e=>{
  const ks=e.target.closest('[data-ckey]');
  if(ks){const t=T(),x=t.checks[+ks.dataset.ckey];if(x){x.key=!isKeyCheck(t,x);saveTrips();buildChecks();}return;}
  const d=e.target.closest('[data-cdel]');if(!d)return;T().checks.splice(+d.dataset.cdel,1);saveTrips();buildChecks();});
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
    '<button class="t-x" data-tdel="'+t.id+'" title="usuń">🗑</button></div>';
}
function openTrips(){
  const today=isoToday();
  const awakeAll=trips.filter(t=>!t.dormant),sleep=trips.filter(t=>t.dormant);
  const ended=t=>!t.dateless&&tripRange(t).end<today;
  const awake=awakeAll.filter(t=>!ended(t)).sort((a,b)=>(a.dateless?'9':a.start)<(b.dateless?'9':b.start)?-1:1);
  const past=awakeAll.filter(ended).sort((a,b)=>a.start<b.start?1:-1);
  sheet.innerHTML='<h3>Wyprawy <button data-close>✕</button></h3>'+
    awake.map(t=>tripRow(t,today)).join('')+
    (past.length?'<div class="area-h" style="margin-top:18px">Zakończone<span>'+past.length+'</span></div>'+past.map(t=>tripRow(t,today)).join(''):'')+
    (sleep.length?'<div class="area-h" style="margin-top:18px">Uśpione<span>wracasz jednym kliknięciem</span></div>'+sleep.map(t=>tripRow(t,today)).join(''):'')+
    '<div class="unconf" style="margin-top:10px">☾ usypia wyprawę: znika z przełącznika i z ekranu Dziś, ale nic nie tracisz — wydatki, check-iny i etapy zostają.</div>'+
    '<div class="area-h" style="margin-top:20px">Nowa wyprawa</div>'+
    '<div class="newtrip"><div class="full"><label>Nazwa albo kraj</label><input id="nt-name" placeholder="np. Gruzja 2027"></div>'+
    '<div><label>Start (opcjonalnie)</label><input id="nt-start" type="date" value=""></div>'+
    '<div><label>Waluta</label><select id="nt-cur">'+['EUR','USD','GEL','TRY','AMD','BGN','RON','HUF','CZK','GBP','THB','JPY','MAD','EGP','ILS','AZN','UAH','RSD','ALL','MKD','BAM','INR','IDR','VND','MXN','PLN']
      .map(c=>'<option value="'+c+'">'+c+'</option>').join('')+'</select></div>'+
    '<div><label>Emoji</label><input id="nt-emoji" value="🧭" maxlength="4"></div>'+
    '<div class="full"><label class="cbx"><input type="checkbox" id="nt-skel" checked> Dodaj szkielet researchu: 15 pytań o kraj do wypełnienia</label></div>'+
    '<div class="full"><button class="tb-btn" id="nt-go" style="width:100%">+ Utwórz</button></div></div>'+
    '<div class="unconf">Nowa wyprawa dostaje listę „pierwszego dnia”: SIM, bankomat, dojazd z lotniska, mapa offline. Etapy dodajesz w Planie, pomysły w zakładce Pomysły.</div>'+
    '<div class="area-h" style="margin-top:20px">Pakiety treści</div>'+
    '<div class="unconf">Pakiet to jeden plik JSON z gotową wyprawą: etapy, miejsca, smaki, zwroty, lista spraw i budżet. Wczytujesz go tutaj — bez podmieniania apki.</div>'+
    '<div class="packs">'+
      PUBLIC_PACKS.filter(k=>PACKS[k]&&!trips.some(t=>t.pack===k)).map(k=>'<button class="tb-btn" data-pkadd="'+k+'">＋ '+esc(PACKS[k].emoji+' '+PACKS[k].name)+'</button>').join('')+
      '<button class="tb-btn" id="pk-load">📦 Wczytaj pakiet</button>'+
      '<button class="tb-btn" id="pk-tpl">⬇ Szablon wyprawy</button>'+
      '<button class="tb-btn" id="pk-gtpl">⬇ Szablon przewodnika (dla AI)</button>'+
      (T().pack?'<button class="tb-btn" id="pk-exp">⬇ Eksportuj „'+esc(T().name)+'”</button>':'')+
      '<input type="file" id="pk-file" accept="application/json,.json" hidden>'+
    '</div>'+
    (Object.keys(userPacks).length?'<div class="pk-list">'+Object.keys(userPacks).map(k=>{
      const g=userPacks[k].kind==='guide',on=g&&(T().guides||[]).includes(k);
      return '<div class="pk-row"><span>'+esc(userPacks[k].emoji||'📦')+' <b>'+esc(userPacks[k].name)+'</b><small>'+(g?'przewodnik':'wyprawa')+' · '+esc(k)+' · wersja '+(userPacks[k].rev||1)+(g&&userPacks[k].checked?' · sprawdzony '+esc(userPacks[k].checked):'')+'</small></span>'+
      (g?'<button class="tb-btn" data-gatt="'+attr(k)+'">'+(on?'✓ dołączony — odłącz':'＋ dołącz do tej wyprawy')+'</button>':'')+
      '<button class="t-x" data-pkdel="'+attr(k)+'" title="usuń pakiet">🗑</button></div>';}).join('')+'</div>':'');
  sheet.classList.add('on');sheetBg.classList.add('on');a11y(sheet);
}
sheet.addEventListener('click',e=>{
  const del=e.target.closest('[data-tdel]');
  if(del){e.stopPropagation();const t=trips.find(x=>x.id===del.dataset.tdel);
    if(!confirm('Usunąć wyprawę „'+t.name+'” razem z jej wydatkami i check-inami?'))return;
    trips=trips.filter(x=>x.id!==t.id);expenses=expenses.filter(x=>x.trip!==t.id);checkins=checkins.filter(x=>x.trip!==t.id);
    if(!trips.length)trips.push(Object.assign(blankTrip({name:'Nowa wyprawa'}),{dateless:true}));
    saveTrips();saveExp();saveCi();if(activeId===t.id||!trips.some(x=>x.id===activeId))switchTrip(trips[0].id);openTrips();return;}
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
  if(e.target.id==='pk-gtpl'){
    const blob=new Blob([JSON.stringify(guideTemplate(),null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='przewodnik-szablon.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Pobrano szablon przewodnika — wklej go do AI z nazwą kraju');return;}
  const ga=e.target.closest('[data-gatt]');
  if(ga){const t=T(),k=ga.dataset.gatt;t.guides=t.guides||[];
    if(t.guides.includes(k)){t.guides=t.guides.filter(x=>x!==k);toast('Odłączono przewodnik');}
    else{t.guides.push(k);toast('Dołączono przewodnik „'+PACKS[k].name+'”');}
    packsVer++;saveTrips();openTrips();refresh();return;}
  if(e.target.id==='pk-exp'){
    const p=T().pack&&PACKS[T().pack];if(!p)return;
    const blob=new Blob([JSON.stringify(p,null,1)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pakiet-'+p.id+'.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);toast('Pobrano pakiet');return;}
  const pa=e.target.closest('[data-pkadd]');
  if(pa){const t=patchTrip(freshTrip(pa.dataset.pkadd));trips.push(t);saveTrips();switchTrip(t.id);closeSheet();goTab('plan');toast('Dodano „'+t.name+'”');return;}
  if(e.target.id==='pk-load'){$('#pk-file').click();return;}
  const pd=e.target.closest('[data-pkdel]');
  if(pd){const k=pd.dataset.pkdel;
    if(!confirm('Usunąć pakiet „'+(userPacks[k].name||k)+'”? Wyprawy już utworzone z tego pakietu zostaną, ale stracą opisy i przewodnik.'))return;
    delete userPacks[k];delete PACKS[k];packsVer++;trips.forEach(t=>{if(t.guides)t.guides=t.guides.filter(x=>x!==k);});saveTrips();savePacks();openTrips();toast('Pakiet usunięty');return;}
  if(e.target.id==='nt-go'){
    const name=$('#nt-name').value.trim();if(!name){$('#nt-name').focus();return;}
    const t=blankTrip({name,start:$('#nt-start').value,cur:$('#nt-cur').value,emoji:$('#nt-emoji').value||'🧭'});
    trips.push(t);saveTrips();switchTrip(t.id);
    if($('#nt-skel')&&$('#nt-skel').checked){COUNTRY_SKELETON.slice().reverse().forEach(([cat,ti,d])=>addIdea({trip:t.id,cat,t:ti,d}));}
    closeSheet();goTab($('#nt-skel')&&$('#nt-skel').checked?'klocki':'plan');toast('Utworzono „'+name+'”');
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
    if(p.kind==='guide'){
      const t=T();
      if(t&&!(t.guides||[]).includes(p.id)&&confirm('Wczytano przewodnik „'+p.name+'”. Dołączyć do wyprawy „'+t.name+'”?')){
        t.guides=(t.guides||[]).concat(p.id);saveTrips();}
      packsVer++;closeSheet();refresh();toast('Wczytano przewodnik „'+p.name+'”');return;
    }
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
  // miejsca z przewodnika, które mają współrzędne (pole c:[lat,lng]) — mniejsze pinezki
  (P()&&P().places||[]).forEach(x=>{
    if(!Array.isArray(x.c)||x.c.length!==2)return;
    const v=!!visited[t.id+'|'+x.key];
    L.marker(x.c,{icon:mkIcon('poi'+(x.tag==='must'?' must':'')+(v?' done':''),esc(x.icon||'◇'))}).addTo(routeLayer)
      .bindPopup('<div class="map-pop"><div class="mp-date">'+esc(x.area||'')+'</div><b>'+esc(x.name)+'</b><br>'+esc(x.desc||'')+'</div>',{maxWidth:300});
    pts.push(x.c);
  });
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
  const name='rihla-'+(T()?T().id:'backup')+'-'+isoToday()+'.json';
  const blob=new Blob([JSON.stringify(dump,null,1)],{type:'application/json'});
  const done=msg=>{save(K.bak,Date.now());updateBackupAge();dataMsg(msg,true);};
  const download=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();a.remove();done('Backup pobrany ✓');};
  let file=null;try{file=new File([blob],name,{type:'application/json'});}catch(e){}
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:'Backup Rihla'}).then(()=>done('Backup udostępniony ✓'),err=>{if(err&&err.name!=='AbortError')download();});
  }else download();
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
/* Import: zawsze pyta, robi kopię obecnych danych (wy-preimport) i pozwala cofnąć.
   Pakiety treści (wy-packs) są DOKŁADANE do Twoich, nie podmieniane. */
const PRE='wy-preimport';
function snapshotNow(){
  const snap={_app:'wyprawy',_v:1,_exported:new Date().toISOString(),_snapshot:true};
  ALL_KEYS.forEach(k=>{const v=lsGet(k);if(v!=null)try{snap[k]=JSON.parse(v);}catch(e){}});
  return lsSet(PRE,JSON.stringify(snap));
}
function cleanTrips(a){
  if(!Array.isArray(a))return null;
  return a.filter(t=>t&&typeof t==='object'&&t.id!=null&&typeof t.name==='string')
          .map(t=>Object.assign({},t,{stages:Array.isArray(t.stages)?t.stages:[]}));
}
function updateUndo(){
  const b=$('#undo-import');if(!b)return;
  const snap=load(PRE,null);b.style.display=snap?'':'none';
  if(snap&&snap._exported){const d=new Date(snap._exported);
    b.textContent='↶ Cofnij import z '+d.toLocaleDateString('pl-PL')+' '+d.toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});}
}
function importData(d){
  if(!d||typeof d!=='object'){dataMsg('To nie jest backup tej apki.',false);return;}
  if(d._app==='powrot-2026'||d._app==='armenia-2026'){
    const need=d._app==='powrot-2026'?'powrot':'armenia';
    if(!PACKS[need]){dataMsg('Najpierw zaimportuj plik z pakietami (brak „'+need+'”).',false);return;}
    if(!confirm('Zaimportować starą wyprawę z pliku? Obecne dane zapiszę jako kopię — import da się cofnąć.'))return;
    if(!snapshotNow()&&!confirm('Nie udało się zapisać kopii (brak miejsca?). Importować mimo to?'))return;
    Object.keys(d).forEach(k=>{if(/^(ret|arm)-/.test(k))lsSet(k,JSON.stringify(d[k]));});
    const nt=d._app==='powrot-2026'?migratePowrot():migrateArmenia();
    trips=trips.filter(x=>x.id!==nt.id).concat([patchTrip(nt)]);saveTrips();save(K.visited,visited);
    dataMsg('Zaimportowano ✓ Odświeżam…',true);setTimeout(()=>location.reload(),800);return;
  }
  if(d._app!=='wyprawy'){dataMsg('To nie jest backup tej apki.',false);return;}
  const inTrips=d[K.trips]!=null?cleanTrips(d[K.trips]):null;
  if(d[K.trips]!=null&&(!inTrips||!inTrips.length)){dataMsg('W pliku nie ma żadnej poprawnej wyprawy.',false);return;}
  const inPacks=d[K.packs]&&typeof d[K.packs]==='object'&&!Array.isArray(d[K.packs])?d[K.packs]:null;
  const packNames=inPacks?Object.keys(inPacks).map(k=>(inPacks[k]&&inPacks[k].name)||k):[];
  let msg;
  if(inTrips){
    const cur=trips.map(t=>t.name);
    msg='Import ZASTĄPI Twoje dane danymi z pliku.\n\nTeraz masz ('+cur.length+'): '+cur.join(', ')+
        '\nW pliku ('+inTrips.length+'): '+inTrips.map(t=>t.name).join(', ')+
        (packNames.length?'\nPakiety treści do dodania: '+packNames.join(', '):'')+
        '\n\nObecne dane zapiszę jako kopię — import da się cofnąć. Kontynuować?';
  }else if(packNames.length){
    msg='Plik zawiera tylko pakiety treści: '+packNames.join(', ')+'.\nDodać je? Twoje wyprawy i wydatki zostaną bez zmian.';
  }else{dataMsg('W pliku nie ma wypraw ani pakietów.',false);return;}
  if(!confirm(msg))return;
  if(!snapshotNow()&&!confirm('Nie udało się zapisać kopii obecnych danych (brak miejsca?). Najlepiej najpierw zrób Backup. Importować mimo to?'))return;
  if(inTrips){
    ALL_KEYS.forEach(k=>{
      if(k===K.packs||k===K.trips||d[k]==null)return;
      if((k===K.exp||k===K.ci||k===K.ideas)&&!Array.isArray(d[k]))return;
      lsSet(k,JSON.stringify(d[k]));});
    lsSet(K.trips,JSON.stringify(inTrips));
  }
  if(inPacks){
    const mine=load(K.packs,{});const merged=Object.assign({},mine&&typeof mine==='object'&&!Array.isArray(mine)?mine:{});
    Object.keys(inPacks).forEach(k=>{if(inPacks[k]&&typeof inPacks[k]==='object')merged[k]=inPacks[k];});
    if(!lsSet(K.packs,JSON.stringify(merged))){dataMsg('Brak miejsca w pamięci na pakiety.',false);return;}
  }
  dataMsg('Zaimportowano ✓ Odświeżam…',true);setTimeout(()=>location.reload(),800);
}
$('#import-file').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=ev=>{let d;try{d=JSON.parse(ev.target.result);}catch(err){dataMsg('Plik uszkodzony.',false);return;}
    try{importData(d);}catch(err){dataMsg('Import się nie udał: '+err.message,false);}};
  r.readAsText(f);e.target.value='';
});
$('#undo-import').addEventListener('click',()=>{
  const snap=load(PRE,null);if(!snap)return;
  if(!confirm('Przywrócić dane sprzed ostatniego importu? To, co zmieniłeś od tamtej pory, przepadnie.'))return;
  ALL_KEYS.forEach(k=>{if(snap[k]!=null)lsSet(k,JSON.stringify(snap[k]));else{try{localStorage.removeItem(k);}catch(e){}}});
  try{localStorage.removeItem(PRE);}catch(e){}
  dataMsg('Przywrócono ✓ Odświeżam…',true);setTimeout(()=>location.reload(),800);
});
updateUndo();

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

/* ============ SZKOLENIE: chmurki krok po kroku, w rozdziałach ============
   „Pierwsze kroki” pokazują się same przy pierwszym uruchomieniu (także z linku z pakietem).
   Całe szkolenie: stopka albo „Więcej” → Szkolenie. Krok, którego elementu nie ma na ekranie, jest pomijany.
   Pola kroku: tab (zakładka), sel (co podświetlić), alt (zapasowy element), t (tytuł), d (opis), altd,
   sheet:'exp' (otwórz arkusz wydatku), trips:true (otwórz listę wypraw). */
const TRAIN=[
 {id:'start',n:'Pierwsze kroki',d:'Najważniejsze rzeczy w minutę.',steps:[
  {sel:'#trip-btn',t:'Twoje wyprawy',d:'Tu przełączasz się między wyprawami, dodajesz nową albo wczytujesz gotowy pakiet.'},
  {sel:'#mode-btn',t:'Plan i Podróż',d:'„Plan” to przygotowania przed wyjazdem. „Podróż” to tryb na miejscu. W dniu wyjazdu apka przełączy się sama.'},
  {sel:'#tabs',t:'Zakładki',d:'Na dole są najważniejsze zakładki dla danego trybu. Reszta, czyli Przewodnik, Lista i Insta, jest pod „Więcej”.'},
  {tab:'plan',sel:'#stages .day',alt:'#add-stage',t:'Etapy dzień po dniu',d:'Dotknij etapu, żeby zobaczyć szczegóły. Przyciskami − i + zmieniasz liczbę nocy, a „pomijam” wyłącza etap. Daty reszty przeliczą się same.',altd:'Tu dodajesz kolejne etapy podróży. Daty przeliczają się z liczby nocy.'},
  {tab:'klocki',sel:'.cy-ctrls',t:'Układacz dni',d:'W mieście nie ma przejazdów, więc dni układa apka. Wybierasz tempo i liczbę dni, a każde miejsce możesz przenieść na inny dzień albo usunąć. Przy deszczu włącz „Plan B”.'},
  {tab:'plan',sel:'.trip-bar',t:'Termin',d:'Ustaw datę startu albo wybierz jeden z sugerowanych terminów. Do tego czasu wyprawa ma „termin nieustalony”.'},
  {tab:'przew',sel:'#subtabs',t:'Przewodnik',d:'Miejsca, jedzenie, zwroty, kultura i święta. Kółkiem przy miejscu odhaczasz to, co już zobaczone.'},
  {tab:'dzis',sel:'#today .acts',t:'W podróży',d:'„Wydatek” wpisujesz w lokalnej walucie, apka przeliczy na złote. „Check-in” zapisuje miejsce i godzinę na mapie, także bez internetu.'},
  {sel:'#export-btn',t:'Twoje dane',d:'Wszystko zapisuje się tylko w tym telefonie. Co jakiś czas zrób backup i zachowaj plik, np. w mailu albo na Dysku.'}
]},
 {id:'dni',n:'Układanie dni w mieście',d:'Tempo, liczba dni, przenoszenie miejsc, plan B na deszcz.',need:()=>!!cityPack(),steps:[
  {tab:'klocki',sel:'.cy-days',t:'Liczba dni',d:'− i + zmieniają liczbę nocy w mieście. Przy mniejszej liczbie dni apka nie wycina atrakcji, tylko upycha je gęściej. To, co się nie zmieści, pokaże osobno, z podpowiedzią „+1 dzień” albo „Intensywniej”.'},
  {tab:'klocki',sel:'.cy-pace',t:'Tempo',d:'Spokojnie to ok. 5 godzin zwiedzania dziennie, Normalnie ok. 7, Intensywnie ok. 9. Do tego wieczór na kolację, pintxos albo koncert. Dzień przylotu i dzień wylotu są krótsze.'},
  {tab:'klocki',sel:'.cy-day',t:'Jeden dzień',d:'Pasek pokazuje, jak bardzo dzień jest wypełniony. Miejsca idą po kolei: rano, w ciągu dnia, wieczorem (☾), pogrupowane dzielnicami, żeby nie krążyć po mieście.'},
  {tab:'klocki',sel:'.cy-day .cy-move',t:'Przenoszenie',d:'Wybierz inny dzień, a miejsce zostanie tam przypięte (📌). Przy kolejnym układaniu apka go nie ruszy. „Niech apka wybierze” odpina.'},
  {tab:'klocki',sel:'.cy-day .cy-x',t:'Usuwanie',d:'✕ zdejmuje miejsce z planu. Nie znika: czeka na dole w „Poza planem”, skąd dodasz je z powrotem jednym wyborem dnia.'},
  {tab:'klocki',sel:'.cy-day .cy-rain',t:'Plan B na deszcz',d:'Włączony zostawia na ten dzień tylko miejsca pod dachem (☂), a spacery przenosi na inne dni. W podróży ten sam przycisk jest na ekranie Dziś.'},
  {tab:'klocki',sel:'#blocks .blk-sec',t:'Poza planem',d:'Rzeczy, które nie są domyślnie w planie: wycieczki za miasto, góry, mecz, koncert. Dodajesz je, wybierając dzień z listy.'},
  {tab:'klocki',sel:'.cy-legend',t:'Daty i zamknięcia',d:'Gdy ustawisz datę startu w Planie, apka sprawdzi dni tygodnia i nie wstawi muzeum na dzień, w który jest zamknięte.'}]},
 {id:'plan',n:'Etapy, noce i termin',d:'Jak działa Plan i jak przesuwają się daty.',steps:[
  {tab:'plan',sel:'.trip-bar',t:'Data startu',d:'Wpisz datę albo przesuń ją przyciskami ±1 i ±7 dni. „Termin nieustalony” znaczy, że plan jest gotowy, ale jeszcze bez kalendarza.'},
  {tab:'plan',sel:'#windows .win',t:'Sugerowane terminy',d:'Dotknij okna, żeby ustawić start na proponowaną datę. Opis mówi, czego się spodziewać o tej porze roku.'},
  {tab:'plan',sel:'#stages .day',t:'Etap',d:'Na karcie jest data, tytuł i środek transportu. Dotknij, żeby rozwinąć: godziny, nocleg, opis i uwagi praktyczne.'},
  {tab:'plan',sel:'#stages .day .st-nights',t:'Noce',d:'− i + zmieniają liczbę nocy na etapie. Wszystkie daty poniżej przesuną się same.'},
  {tab:'plan',sel:'#stages .day .status-bar',t:'Odbyło się / pomijam',d:'„Pomijam” wyłącza etap bez kasowania, a daty reszty się przesuwają. „Odbyło się” odhaczasz w trakcie podróży.'},
  {tab:'plan',sel:'#add-stage',t:'Własny etap',d:'Dodajesz etap od siebie, np. wypad za miasto. Zostaje nawet wtedy, gdy autor pakietu wyda nową wersję.'},
  {tab:'plan',sel:'#order-mode',t:'Kolejność',d:'Włącza strzałki do przestawiania etapów.'},
  {tab:'plan',sel:'#city-plan .cy-sum',t:'Dni w mieście',d:'Skrót z układacza dni. Szczegóły zmieniasz w Zarysie.'}]},
 {id:'przew',n:'Przewodnik i mapa',d:'Miejsca, odhaczanie, pinezki i mapy bez internetu.',steps:[
  {tab:'przew',sel:'#subtabs',t:'Działy',d:'Miejsca, smaki, zwroty z wymową, kultura i święta w terminie wyjazdu.'},
  {tab:'przew',sel:'#guide .pcard',t:'Karta miejsca',d:'Dotknij, żeby rozwinąć opis i praktyczne wskazówki: ceny, godziny, dojazd.'},
  {tab:'przew',sel:'#guide .pcard .tick',t:'Odhaczanie',d:'Kółko oznacza miejsce jako zobaczone. Licznik na górze pokazuje postęp, a „ukryj odhaczone” chowa to, co już zaliczone.'},
  {tab:'mapa',sel:'#map',t:'Mapa',d:'Duże numerowane pinezki to etapy, małe to miejsca z przewodnika, pomarańczowe to must see. Dotknij pinezki, żeby zobaczyć opis.'},
  {tab:'mapa',sel:'#save-tiles',t:'Mapa offline',d:'Na wifi przybliż okolicę i dotknij „Zapisz”. Potem ten fragment działa bez internetu. Zrób to przed wyjazdem dla centrum i dla miejsc poza miastem.'},
  {tab:'insta',sel:'#igcards',t:'Insta',d:'Pomysły na zdjęcia: co, skąd i o jakiej porze najlepiej wychodzi.'}]},
 {id:'podroz',n:'W podróży: wydatki i check-in',d:'Wpisywanie wydatków, waluty, podsumowanie, ślad na mapie.',steps:[
  {tab:'dzis',sel:'#today .acts',t:'Dwa przyciski na co dzień',d:'Na ekranie Dziś zawsze masz pod ręką „Wydatek” i „Check-in”. W trybie Podróż jest też okrągły „+” na innych zakładkach.'},
  {tab:'dzis',sheet:'exp',sel:'#ex-amt',t:'Kwota',d:'Wpisz kwotę tak, jak na paragonie albo terminalu.'},
  {tab:'dzis',sheet:'exp',sel:'.cur-pills',t:'Waluta',d:'Wybierz walutę. Apka przeliczy na złote po aktualnym kursie, a bez internetu po ostatnio pobranym.'},
  {tab:'dzis',sheet:'exp',sel:'.cat-pills',t:'Kategoria',d:'Jedzenie, nocleg, transport, atrakcje… Z kategorii powstaje podsumowanie wydatków.'},
  {tab:'wydatki',sel:'.exp-sum',t:'Podsumowanie',d:'Ile wydane razem i średnio dziennie, w porównaniu z planem. „Kopiuj raport” daje gotowy tekst do wysłania.'},
  {tab:'dzis',sel:'#today [data-open="ci"]',t:'Check-in',d:'Zapisuje, gdzie jesteś i o której. GPS działa też bez internetu. Check-iny pojawiają się na mapie jako złote pinezki i tworzą ślad podróży.'},
  {sel:'#mode-btn',t:'Tryb Podróż',d:'W dniu wyjazdu apka sama przełączy się na Podróż: na dole Dziś, Mapa i Wydatki. Przełączyć możesz też ręcznie.'}]},
 {id:'koszt',n:'Kosztorys przed wyjazdem',d:'Ile wyjdzie wyprawa i co jest już zapłacone.',steps:[
  {tab:'kosztorys',sel:'.calc-sum',t:'Kosztorys',d:'Planowane koszty przed wyjazdem: ile razem, ile zapłacone, ile do zapłaty na miejscu.'},
  {tab:'kosztorys',sel:'#calc-cap',t:'Twój limit',d:'Wpisz budżet, a apka pokaże, czy się w nim mieścisz.'},
  {tab:'kosztorys',sel:'#calc-add',t:'Pozycje',d:'Dodaj lot, nocleg albo bilet. Przy każdej pozycji ustawiasz status: zarezerwowane, zapłacone albo płatne na miejscu.'},
  {tab:'kosztorys',sel:'#calc-gen',t:'Szkic z planu',d:'Tworzy pozycje z etapów i noclegów, żeby nie wpisywać wszystkiego ręcznie.'}]},
 {id:'dane',n:'Wyprawy, backup i import',d:'Nowa wyprawa, pakiety, kopia zapasowa, nowy telefon.',steps:[
  {trips:true,sel:'#sheet .newtrip',t:'Nowa wyprawa',d:'Wpisz nazwę albo kraj, opcjonalnie datę i walutę. Apka doda listę spraw na pierwszy dzień: karta SIM, bankomat, dojazd z lotniska.'},
  {trips:true,sel:'#sheet .packs',t:'Pakiety',d:'Gotowe wyprawy z przewodnikiem wczytujesz z pliku albo dostajesz linkiem. Autor może je później poprawiać, a poprawki przyjdą same.'},
  {trips:true,sel:'#sheet .trip .t-z',t:'Usypianie',d:'☾ chowa wyprawę z przełącznika i ekranu Dziś. Nic nie ginie, a obudzisz ją jednym dotknięciem.'},
  {sel:'#export-btn',t:'Backup',d:'Zapisuje wszystkie wyprawy, wydatki i check-iny do jednego pliku. Na telefonie od razu wyślesz go mailem albo zapiszesz na Dysku.'},
  {sel:'#import-btn',t:'Import',d:'Wczytuje backup, np. na nowym telefonie. Przed importem apka robi kopię obecnych danych, a „Cofnij import” przywraca poprzedni stan.'},
  {sel:'#backup-age',t:'Przypomnienie',d:'Tu widać, kiedy był ostatni backup. Po tygodniu bez kopii apka przypomni o tym na ekranie Dziś.'}]}
];
let tourI=-1,tourBack=null,tourShown=0,tourCh=null,tourSheet=null;
const tourSteps=()=>tourCh?tourCh.steps:[];
function trainDone(){try{return JSON.parse(localStorage.getItem('wy-train')||'{}')||{};}catch(e){return{};}}
function tourVisible(n){if(!n)return false;const r=n.getBoundingClientRect();return r.width>0&&r.height>0;}
function tourClose(){
  tourI=-1;const o=$('#tour');if(o)o.remove();
  document.removeEventListener('keydown',tourKey);window.removeEventListener('resize',tourPlace);window.removeEventListener('scroll',tourPlace,true);
}
function tourEnd(finished){
  const ch=tourCh;tourClose();tourSheet=null;closeSheet();
  try{localStorage.setItem('wy-tour','1');if(finished&&ch){const d=trainDone();d[ch.id]=1;localStorage.setItem('wy-train',JSON.stringify(d));}}catch(e){}
  if(tourBack&&tourBack!==curTab)goTab(tourBack);window.scrollTo({top:0});
  if(ch&&ch.id==='start'&&!ch.fromMenu){toast('Więcej szczegółów: Więcej → Szkolenie');return;}
  if(finished)openTraining();
}
function tourKey(e){if(e.key==='Escape')tourEnd(false);if(e.key==='ArrowRight'||e.key==='Enter')tourStep(tourI+1);}
function tourTarget(s){
  let n=$(s.sel),d=s.d;
  if(!tourVisible(n)&&s.alt){n=$(s.alt);d=s.altd||d;}
  return tourVisible(n)?{n,d}:null;
}
function tourPlace(){
  const o=$('#tour');if(!o||tourI<0)return;
  const s=tourSteps()[tourI],tg=s&&tourTarget(s);if(!tg)return;
  const r=tg.n.getBoundingClientRect(),pad=6,hole=o.querySelector('.tour-hole'),bub=o.querySelector('.tour-bub');
  Object.assign(hole.style,{left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+pad*2)+'px',height:(r.height+pad*2)+'px'});
  const vw=window.innerWidth,vh=window.innerHeight,bw=Math.min(320,vw-32);
  bub.style.width=bw+'px';
  const bh=bub.offsetHeight,below=vh-r.bottom,above=r.top;
  let top=below>=bh+20||below>above?r.bottom+pad+12:r.top-pad-12-bh;
  top=Math.max(12,Math.min(top,vh-bh-12));
  let left=r.left+r.width/2-bw/2;left=Math.max(16,Math.min(left,vw-bw-16));
  bub.style.top=top+'px';bub.style.left=left+'px';
}
function tourPrep(s){
  // właściwy arkusz albo zakładka pod krok
  const want=s.sheet?'exp':s.trips?'trips':null;
  if(want!==tourSheet){closeSheet();tourSheet=null;}
  if(s.tab&&curTab!==s.tab)goTab(s.tab);
  if(want==='exp'&&tourSheet!=='exp'){openSheet('exp');tourSheet='exp';setTimeout(()=>{const a=document.activeElement;if(a&&a.blur)a.blur();},300);}
  if(want==='trips'&&tourSheet!=='trips'){openTrips();tourSheet='trips';}
}
function tourStep(i){
  const steps=tourSteps();
  while(i<steps.length){tourPrep(steps[i]);if(tourTarget(steps[i])){tourI=i;break;}i++;}
  if(i>=steps.length){tourEnd(true);return;}
  tourShown++;
  const s=steps[tourI],tg=tourTarget(s);
  if(!tg.n.closest('header,nav,.sysbar'))tg.n.scrollIntoView({block:'center'});
  let o=$('#tour');
  if(!o){o=el('div','tour');o.id='tour';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
    o.innerHTML='<div class="tour-hole"></div><div class="tour-bub"></div>';document.body.appendChild(o);
    o.addEventListener('click',e=>{
      if(e.target.closest('[data-tnext]'))tourStep(tourI+1);
      else if(e.target.closest('[data-tskip]'))tourEnd(false);});
    document.addEventListener('keydown',tourKey);window.addEventListener('resize',tourPlace);window.addEventListener('scroll',tourPlace,true);}
  const last=!steps.slice(tourI+1).length;
  o.querySelector('.tour-bub').innerHTML='<div class="tour-n">'+esc(tourCh.n.toUpperCase())+' · KROK '+tourShown+'</div><b>'+esc(s.t)+'</b><p>'+esc(tg.d)+'</p>'+
    '<div class="tour-btns"><button type="button" class="tour-skip" data-tskip>Zakończ</button><button type="button" class="tour-next" data-tnext>'+(last?'Gotowe':'Dalej')+'</button></div>';
  // arkusz wysuwa się z animacją — dopasuj podświetlenie jeszcze kilka razy
  requestAnimationFrame(()=>{tourPlace();[150,350,600,900].forEach(ms=>setTimeout(tourPlace,ms));const b=o.querySelector('[data-tnext]');if(b)b.focus({preventScroll:true});});
}
function startChapter(id,fromMenu){
  const ch=TRAIN.find(c=>c.id===id);if(!ch)return;
  closeSheet();tourClose();tourCh=Object.assign({},ch,{fromMenu:!!fromMenu});tourSheet=null;
  if(!fromMenu)tourBack=curTab;tourShown=0;tourStep(0);
}
function startTour(){tourBack=curTab;startChapter('start',false);}
function openTraining(){
  const done=trainDone(),list=TRAIN.filter(c=>!c.need||c.need());
  sheet.innerHTML='<h3>Szkolenie <button data-close>✕</button></h3>'+
    '<div class="train-intro">Krótkie rozdziały, każdy pokazuje na ekranie, gdzie co jest. Możesz je przerabiać w dowolnej kolejności i wracać do nich.</div>'+
    '<div class="train-list">'+list.map(c=>'<button class="train-ch'+(done[c.id]?' done':'')+'" data-train="'+c.id+'">'+
      '<span class="train-ok">'+(done[c.id]?'✓':'')+'</span><span class="train-tx"><b>'+esc(c.n)+'</b><small>'+esc(c.d)+' · '+plural(c.steps.length,'krok','kroki','kroków')+'</small></span><span class="train-go">›</span></button>').join('')+'</div>';
  sheet.classList.add('on');sheetBg.classList.add('on');a11y(sheet);
}
sheet.addEventListener('click',e=>{
  const b=e.target.closest('[data-train]');if(b){tourBack=curTab;startChapter(b.dataset.train,true);return;}
  if(e.target.closest('[data-train-open]')){openTraining();}
});
$('#tour-btn').addEventListener('click',openTraining);

/* ============ START ============ */
if(!LS_OK){const sb=$('#sysbar');sb.style.display='block';
  sb.innerHTML='<b>Uwaga:</b> ta przeglądarka blokuje zapis (tryb prywatny?). Możesz czytać, ale zmiany nie zostaną zapisane.';}
(function(){const miss=[...new Set(trips.filter(t=>t.pack&&!PACKS[t.pack]).map(t=>t.name))];
  const sb=$('#sysbar');if(!miss.length||sb.style.display==='block')return;
  sb.className='sysbar info';sb.style.display='block';
  sb.innerHTML='Brakuje opisów i przewodnika dla: <b>'+esc(miss.join(', '))+'</b>. Etapy i wydatki są całe — zaimportuj plik z pakietami (stopka → Importuj).';})();
/* iPhone/iPad w zwykłym Safari: dane w pamięci przeglądarki mogą zniknąć po kilku dniach bez wizyty.
   Zainstalowana na ekranie głównym apka tego problemu nie ma. Przypomnienie wraca co 7 dni. */
(function(){
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const inst=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
  if(!ios||inst)return;
  let later=0;try{later=+localStorage.getItem('wy-iosbar')||0;}catch(e){}
  if(Date.now()-later<7*86400000)return;
  const b=el('div','sysbar info ios-bar','<b>Dodaj Rihlę do ekranu głównego.</b> W samym Safari iPhone może po kilku dniach bez wizyty skasować Twoje wyprawy i wydatki. '+
    'Dotknij <b>Udostępnij</b> (kwadrat ze strzałką) → <b>Do ekranu początkowego</b>. <button type="button">Później</button>');
  b.querySelector('button').onclick=()=>{try{localStorage.setItem('wy-iosbar',String(Date.now()));}catch(e){}b.remove();};
  $('#sysbar').after(b);
})();
/* ============ PAKIET Z LINKU: index.html?pack=bilbao ============
   Pakiet leży w repo w packs/<id>.json. Link przy pierwszym otwarciu tworzy wyprawę
   i ustawia ją jako aktywną; nietkniętą „Moją pierwszą wyprawę” usuwa.
   Pakiety z linku same się aktualizują, gdy w pliku wzrośnie „rev”. */
function packUrl(id){return 'packs/'+id+'.json';}
async function fetchPack(id){
  const r=await fetch(packUrl(id),{cache:'no-store'});
  if(!r.ok)throw new Error(r.status===404?'Nie ma takiego pakietu: '+id:'Błąd serwera '+r.status);
  const o=await r.json();o.id=id;o._url=packUrl(id);return o;
}
function isUntouchedDefault(t){
  return t&&!t.pack&&/^t/.test(t.id)&&t.name==='Moja pierwsza wyprawa'&&!(t.stages||[]).length&&
    !expenses.some(x=>x.trip===t.id)&&!checkins.some(x=>x.trip===t.id)&&!ideas.some(x=>x.trip===t.id);
}
async function openPackLink(){
  const q=new URLSearchParams(location.search).get('pack');if(!q)return;
  const id=q.toLowerCase().replace(/[^a-z0-9_-]/g,'');
  try{history.replaceState(null,'',location.pathname);}catch(e){}
  if(!id)return;
  const had=trips.find(t=>t.pack===id);
  let o;
  try{o=await fetchPack(id);}catch(err){
    if(had){switchTrip(had.id);return;}
    const sb=$('#sysbar');sb.className='sysbar';sb.style.display='block';
    sb.innerHTML=navigator.onLine?'Nie udało się wczytać pakietu: '+esc(err.message):'Brak internetu — otwórz link jeszcze raz, gdy będziesz online.';return;}
  const prev=userPacks[id];
  const r=installPack(o);if(r.err){toast(r.err);return;}
  if(had){if((had.packRev||1)<(r.pack.rev||1))updateLinkedTrip(had,prev,r.pack);saveTrips();switchTrip(had.id);toast('„'+had.name+'” jest aktualna');return;}
  const t=patchTrip(freshTrip(r.pack.id));
  trips=trips.filter(x=>!isUntouchedDefault(x));trips.push(t);saveTrips();
  switchTrip(t.id);goTab(effMode()==='travel'?'dzis':'przew');
  toast('Dodano wyprawę „'+t.name+'”');
}
/* Nowa wersja pakietu z linku: bierze nowe etapy, ale zostawia to, co użytkownik sam zmienił
   (pole różne od poprzedniej wersji pakietu). Etapy dopasowuje po armIdx, a bez niego po kolejności. */
const REV_FIELDS=['title','from','to','via','mode','nights','dep','arr','carrier','price','curr','stay','stayUrl','stayPrice','curr2','see','detail','note','star','food','status','lat','lng'];
function updateLinkedTrip(t,oldP,newP){
  // klucz etapu: armIdx z pakietu, a bez niego kolejność wśród etapów z pakietu (własne etapy się nie liczą)
  const keyed=list=>{let n=0;return list.map(s=>({s,k:s.src==='user'?null:(s.armIdx!=null?'a'+s.armIdx:'i'+(n++))}));};
  const mineL=keyed(t.stages),mine={},base={};
  mineL.forEach(x=>{if(x.k)mine[x.k]=x.s;});
  keyed((oldP&&oldP.stages)||[]).forEach(x=>{if(x.k)base[x.k]=x.s;});
  // własne etapy zapamiętują, za którym etapem z pakietu stały
  const own=[];let prev=null;
  mineL.forEach(x=>{if(x.k)prev=x.k;else own.push({s:x.s,after:prev});});
  const fresh=keyed(JSON.parse(JSON.stringify(newP.stages))).map(({s,k})=>{
    const o=mine[k],b=base[k]||{};if(!o)return{s,k};
    REV_FIELDS.forEach(f=>{const v=o[f];if(v==null||v==='')return;
      if(JSON.stringify(v)!==JSON.stringify(b[f]))s[f]=v;});
    return{s,k};});
  const out=[];
  own.filter(x=>x.after===null).forEach(x=>out.push(x.s));
  fresh.forEach(({s,k})=>{out.push(s);own.filter(x=>x.after===k).forEach(x=>out.push(x.s));});
  // własne etapy, których poprzednik zniknął z pakietu — przed ostatnim etapem
  const lost=own.filter(x=>x.after!==null&&!fresh.some(f=>f.k===x.after)).map(x=>x.s);
  if(lost.length)out.splice(Math.max(0,out.length-1),0,...lost);
  t.stages=out;
  const had={};(t.checks||[]).forEach(c=>had[c.t]=1);
  (newP.checks||[]).forEach(c=>{if(!had[c.t])t.checks.push(Object.assign({done:false},c));});
  t.packRev=newP.rev||1;delete t.pendingRev;
}
async function syncLinkedPacks(){
  if(!navigator.onLine)return;
  for(const id of Object.keys(userPacks)){
    const p=userPacks[id];if(!p||!p._url)continue;
    try{
      const o=await fetchPack(id);if((num(o.rev)||1)<=(p.rev||1))continue;
      const r=installPack(o);if(r.err)continue;
      trips.filter(t=>t.pack===id).forEach(t=>updateLinkedTrip(t,p,r.pack));
      saveTrips();refresh();buildHeader();toast('Zaktualizowano przewodnik „'+(o.name||id)+'”');
    }catch(e){}
  }
}

netState();updateBackupAge();buildHeader();applyMode();a11y();revDot();
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
goTab(effMode()==='travel'?'dzis':'plan');
refreshRates().then(ok=>{if(ok&&curTab==='dzis')buildToday();});
let tourDone=false;try{tourDone=!!localStorage.getItem('wy-tour');}catch(e){}
if(new URLSearchParams(location.search).get('pack'))openPackLink().then(()=>{if(!tourDone&&FIRST_RUN)setTimeout(startTour,900);});
else{syncLinkedPacks();if(!tourDone&&FIRST_RUN)setTimeout(startTour,900);}
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
/* status płatności — wspólny dla pozycji tabeli i dla noclegów (PAY jest na górze pliku) */
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

/* ---------- potwierdzone = zablokowane; Plan tylko czyta z Kosztorysu ---------- */
function isLocked(x){return!!x&&(x.pay==='res'||x.pay==='paid');}
function lockedCount(t){return(t.calc||[]).filter(isLocked).length+Object.values((t.beds&&typeof t.beds==='object')?t.beds:{}).filter(isLocked).length;}
function dateGuard(t){const n=lockedCount(t);
  return!n||confirm('W Kosztorysie masz '+n+' potwierdzonych pozycji (loty, noclegi) na konkretne daty. Zmiana startu przesunie plan, ale ich dat nie zmieni — noclegi mogą „odpiąć się” od nocy. Na pewno przesunąć?');}
function stageBedList(t,s){
  const n=Math.max(0,num(s.nights)),out=[];
  if(!Array.isArray(t.stages)||s._off==null)return out;
  const m=(t.beds&&typeof t.beds==='object')?t.beds:{};
  for(let k=0;k<n;k++){out.push(m[bedKey(t,(s._off||0)+k)]||null);}
  return out;
}
function stageStayInfo(t,s){
  const list=stageBedList(t,s),names=[];
  list.forEach(b=>{if(b&&b.name&&names.indexOf(b.name)<0)names.push(b.name);});
  return{txt:names.join(' · '),conf:list.filter(isLocked).length,total:list.length};
}
function stageStayTxt(t,s){const i=stageStayInfo(t,s);return i.txt||s.stay||'';}
function stageMoneyRows(t,s){
  if(t.dateless||!t.start||s._off==null)return[];
  const iso=dateFor(t.start,s._off).iso;
  return calcRows(t).filter(r=>!r.off&&r.when===iso&&(r.cat==='lot'||r.cat==='transport'));
}
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
      '<div class="s" data-ks="sum">'+fmt2(x.sum/rate('EUR'))+' EUR · '+fmt(x.days?x.sum/x.days:0)+' zł/dzień</div></div>'+
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
      const lk=isLocked(b),dis=lk?' disabled':'';
      h+='<div class="bed-row pay-'+(b.pay||'none')+(lk?' locked':'')+'" data-bk="'+attr(n.key)+'">'+
        '<div class="bed-d"><b>'+esc(n.d)+'</b><small>'+esc(n.wd)+'</small></div>'+
        '<input class="bed-n" data-bf="name"'+dis+' value="'+attr(b.name||'')+'" placeholder="gdzie — nazwa albo link">'+
        '<input class="bed-p" type="number" inputmode="decimal" data-bf="price"'+dis+' value="'+attr(b.price||'')+'" placeholder="cena">'+
        '<select class="bed-c" data-bf="cur"'+dis+'>'+['EUR','PLN','GBP','USD',toCode(t.cur)].filter((v,i,a)=>a.indexOf(v)===i)
          .map(c=>'<option value="'+c+'"'+(toCode(b.cur)===c?' selected':'')+'>'+c+'</option>').join('')+'</select>'+
        '<button class="bed-ok" data-bpay="'+attr(n.key)+'" title="'+attr(payName(b.pay))+'">'+(lk?'🔒':'')+payIco(b.pay)+'</button>'+
        '<span class="bed-s">'+fmt(bedLine(b))+' zł</span>'+
        (b.pay==='res'?'<input class="bed-dt" type="date" data-bf="payDate" value="'+attr(b.payDate||'')+'" title="zapłata do">':'')+
      '</div>';
    });
    h+='<div class="pay-leg">Klikaj kółko, żeby zmienić status. ✓ i 💳 = potwierdzone: pozycja się blokuje, dopóki nie anulujesz potwierdzenia (klik w 🔒). '+
      PAY.slice(1).map(x=>'<span><b>'+x[1]+'</b> '+x[2]+'</span>').join('')+'</div>';
    h+='<div class="bed-acts"><button class="tb-btn" id="bed-fill">Wypełnij ceną orientacyjną</button>'+
      '<button class="tb-btn" id="bed-clear">Wyczyść noclegi</button></div></div>';
  }

  if(!rows.length){
    h+='<div class="empty">Reszta kosztorysu pusta. Wpisz loty, transport i jedzenie, a apka policzy, czy to się spina.<br><br>Możesz też wygenerować szkic z planu wyprawy.</div>';
  }else{
    const rowHtml=(r,i)=>{const dis=isLocked(r)?' disabled':'';return'<div class="crow'+(r.off?' off':'')+' pay-'+(r.pay||'none')+(isLocked(r)?' locked':'')+'" data-ci="'+i+'">'+
      '<div class="cr-1"><input class="cr-d" data-cf="desc"'+dis+' value="'+attr(r.desc||'')+'" placeholder="opis, np. Lizbona → Sal"></div>'+
      '<div class="cr-2">'+
        '<select class="cr-c" data-cf="cat"'+dis+'>'+CALC_CATS.map(c=>'<option value="'+c[0]+'"'+(r.cat===c[0]?' selected':'')+'>'+esc(c[1])+'</option>').join('')+'</select>'+
        '<input class="cr-w" type="date" data-cf="when"'+dis+' value="'+attr(r.when||'')+'">'+
      '</div>'+
      '<div class="cr-3">'+
        '<label>ile<input type="number" inputmode="decimal" data-cf="qty"'+dis+' value="'+attr(r.qty!=null?r.qty:1)+'"></label>'+
        '<label>cena<input type="number" inputmode="decimal" data-cf="price"'+dis+' value="'+attr(r.price||'')+'"></label>'+
        '<label>waluta<select data-cf="cur"'+dis+'>'+['PLN','EUR','USD','GBP',toCode(t.cur)].filter((v,i2,a)=>a.indexOf(v)===i2)
          .map(c=>'<option value="'+c+'"'+(toCode(r.cur)===c?' selected':'')+'>'+c+'</option>').join('')+'</select></label>'+
        '<div class="cr-sum">'+fmt(calcLine(r))+' zł</div>'+
      '</div>'+
      '<div class="cr-5">'+PAY.slice(1).map(x=>'<button class="cr-p'+(r.pay===x[0]?' on '+x[0]:'')+'" data-cpay="'+i+'|'+x[0]+'">'+x[1]+' '+x[2]+'</button>').join('')+
        (r.pay==='res'?'<input class="cr-dt" type="date" data-cf="payDate" value="'+attr(r.payDate||'')+'" title="zapłata do">':'')+'</div>'+
      '<div class="cr-4">'+(isLocked(r)?'<span class="cr-lock">🔒 potwierdzone — żeby zmienić, anuluj potwierdzenie (klik w aktywny status)</span>':
        '<button class="cr-b" data-coff="'+i+'">'+(r.off?'✓ wliczam':'○ pomijam')+'</button>'+
        '<button class="cr-b del" data-cdel="'+i+'">🗑</button>')+'</div>'+
    '</div>';};
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
    qs('sum').textContent=fmt2(x.sum/rate('EUR'))+' EUR · '+fmt(x.days?x.sum/x.days:0)+' zł/dzień';}
  if(q('paid')){q('paid').textContent=fmt(x.paid)+' zł';qs('paid').textContent='zostało '+fmt(x.left)+' zł';}
  if(q('onsite')){q('onsite').textContent=fmt(x.onsite)+' zł';
    const n=calcCountBy(t,'onsite');
    qs('onsite').textContent=n?plural(n,'pozycja','pozycje','pozycji')+' · gotówka':'nic do zapłaty w podróży';}
  const c=qs('cap');
  if(c){c.className='s '+(x.cap?(x.sum<=x.cap?'ok':'over'):'');
    c.textContent=x.cap?(x.sum<=x.cap?'mieści się, zostaje '+fmt(x.cap-x.sum)+' zł':'przekroczone o '+fmt(x.sum-x.cap)+' zł'):'wpisz, żeby sprawdzić';}
  const bt=$('#calc .bed-top span');
  if(bt)bt.textContent=bedsCount(t,'')+' / '+bedsNights(t).length+' ustalone · '+fmt(bedsSum(t))+' zł';
}

function calcGenerate(){
  const t=T(),p=P(),out=[];
  computeOffsets(t);
  const real=t.stages.filter(s=>s.status!=='skip');
  t.stages.forEach(s=>{
    if(s.status==='skip'||s.mode==='walk')return;
    const when=t.dateless?'':dateFor(t.start,s._off).iso;
    const first=s===real[0],tail=s.src==='tail'||s===real[real.length-1]&&real.length>1;
    const isMove=s.from&&s.to&&s.from!==s.to||s.price||s.mode==='plane';
    if(!isMove)return;
    /* także pozycje bez ceny: puste wiersze „do uzupełnienia” (loty/transfery wyprawy) */
    out.push({cat:(s.mode==='plane'?'lot':'transport'),desc:(first&&s.mode==='plane'?'Wylot: ':tail&&s.mode==='plane'?'Powrót: ':'')+stageTitle(s),
      when,qty:1,price:s.price?num(s.price):'',cur:toCode(s.curr||t.cur)});
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
  if(bp){const b=bedRec(t,bp.dataset.bpay);
    if(isLocked(b)){
      const v=prompt('Nocleg potwierdzony (zablokowany).\n1 = zarezerwowane\n2 = zapłacone\n0 = anuluj potwierdzenie i odblokuj',b.pay==='res'?'1':'2');
      if(v===null)return;
      const x=String(v).trim();
      if(x==='1'){b.pay='res';}else if(x==='2'){b.pay='paid';b.payDate='';}else if(x==='0'){b.pay='';b.payDate='';}else{toast('Wpisz 1, 2 albo 0');return;}
      saveTrips();buildCalc();return;}
    b.pay=payNext(b.pay);
    if(b.pay!=='res')b.payDate='';saveTrips();buildCalc();return;}
  if(e.target.id==='bed-fill'){
    const v=prompt('Cena za noc (zostanie wpisana tam, gdzie pusto). Waluta: EUR','19');
    if(v==null)return;const p=num(v);
    bedsNights(t).forEach(n=>{const b=bedRec(t,n.key);if(!isLocked(b)&&!num(b.price)){b.price=p;b.cur='EUR';}});
    saveTrips();buildCalc();toast('Wypełnione');return;}
  if(e.target.id==='bed-clear'){
    const keep=Object.keys(bedsMap(t)).filter(k=>isLocked(t.beds[k]));
    if(!confirm('Wyczyścić noclegi?'+(keep.length?' Potwierdzone ('+keep.length+') zostaną — najpierw anuluj ich potwierdzenie.':'')))return;
    const nb={};keep.forEach(k=>nb[k]=t.beds[k]);t.beds=nb;saveTrips();buildCalc();return;}
  if(e.target.id==='calc-add'){calcRows(t).push({cat:'inne',desc:'',when:'',qty:1,price:'',cur:'PLN'});saveTrips();buildCalc();
    const last=$$('#calc .crow').pop();if(last)last.querySelector('.cr-d').focus();return;}
  if(e.target.id==='calc-gen'){
    const have=new Set(calcRows(t).map(r=>(r.desc||'')+'|'+(r.when||'')));
    const gen=calcGenerate().filter(r=>!have.has(r.desc+'|'+r.when));
    if(!gen.length){toast('Wszystkie loty i transfery z planu już są w Kosztorysie');return;}
    if(calcRows(t).length&&!confirm('Dopisać '+gen.length+' brakujących pozycji (loty, transfery, ceny do uzupełnienia) do tego, co już masz?'))return;
    t.calc=calcRows(t).concat(gen);saveTrips();buildCalc();toast('Dopisano '+plural(gen.length,'pozycję','pozycje','pozycji'));return;}
  if(e.target.id==='calc-clear'){
    const keep=calcRows(t).filter(isLocked);
    if(!confirm('Usunąć pozycje kosztorysu?'+(keep.length?' Potwierdzone ('+keep.length+') zostaną — najpierw anuluj ich potwierdzenie.':'')))return;
    t.calc=keep;saveTrips();buildCalc();return;}
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
    const next=(r.pay===q[1])?'':q[1];
    if(isLocked(r)&&!(next==='res'||next==='paid')&&!confirm('Anulować potwierdzenie tej pozycji? Pola zostaną odblokowane.'))return;
    r.pay=next;if(r.pay!=='res')r.payDate='';saveTrips();buildCalc();return;}
  const off=e.target.closest('[data-coff]');
  if(off){const r=calcRows(t)[+off.dataset.coff];if(isLocked(r))return;r.off=!r.off;saveTrips();buildCalc();return;}
  const del=e.target.closest('[data-cdel]');
  if(del){if(isLocked(calcRows(t)[+del.dataset.cdel]))return;calcRows(t).splice(+del.dataset.cdel,1);saveTrips();buildCalc();return;}
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
  const out=[],beds=[];
  lines.slice(1).forEach(l=>{
    const c=cell(l);if(c.length<6)return;
    if(/^(razem|zapłacone|na miejscu)$/i.test(c[1])||!c[1]&&!c[4])return;
    const lab=(c[0]||'').toLowerCase();
    if(lab==='nocleg'){
      const raw0=pi>=0?(c[pi]||''):'';
      beds.push({iso:/^\d{4}-\d{2}-\d{2}$/.test(c[2])?c[2]:'',desc:c[1],
        price:num(c[4])||'',cur:toCode(c[5]||'EUR'),pay:(PAY.find(x=>x[2]===raw0)||[''])[0],payDate:c[7]||''});
      return;}
    const cat=(CALC_CATS.find(x=>x[1].toLowerCase().indexOf(lab)>=0||x[0]===lab)||['inne'])[0];
    const raw=pi>=0?(c[pi]||''):'';
    const st=(PAY.find(x=>x[2]===raw)||[/^(tak|1|true|✓)$/i.test(raw)?'paid':''])[0];
    out.push({cat,desc:c[1],when:/^\d{4}-\d{2}-\d{2}$/.test(c[2])?c[2]:'',qty:num(c[3])||1,price:num(c[4])||0,
      cur:toCode(c[5]||'PLN'),pay:st||''});
  });
  return(out.length||beds.length)?{rows:out,beds:beds}:{err:'Nie znalazłem w CSV żadnych wierszy.'};
}
document.addEventListener('change',e=>{
  if(e.target.id!=='calc-file')return;
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    const r=calcParse(rd.result);
    if(r.err){toast(r.err);return;}
    const t=T(),had=calcRows(t).length;
    if(had&&r.rows.length&&!confirm('Masz już '+plural(had,'pozycję','pozycje','pozycji')+'. OK zastąpi je wczytanymi (potwierdzone zostają), Anuluj dopisze na koniec.'))
      t.calc=calcRows(t).concat(r.rows);
    else if(r.rows.length){
      const keep=calcRows(t).filter(isLocked);
      t.calc=keep.concat(r.rows.filter(x=>!keep.some(k=>k.desc===x.desc&&k.when===x.when)));}
    let bedsOk=0,bedsLost=0;
    (r.beds||[]).forEach((b,i)=>{
      const nights=bedsNights(t);
      const n=(b.iso&&nights.find(x=>x.iso===b.iso))||(!nights.some(x=>x.iso)?nights[i]:null);
      if(!n){bedsLost++;return;}
      /* opis w eksporcie to „miejsce — nazwa noclegu”; miejsce bierzemy z tej wyprawy, resztę zostawiamy jako nazwę */
      let nm=b.desc||'';
      if(nm===n.place)nm='';else if(nm.indexOf(n.place+' — ')===0)nm=nm.slice(n.place.length+3);
      if(isLocked(bedRec(t,n.key))){bedsLost++;return;}
      Object.assign(bedRec(t,n.key),{price:b.price,cur:b.cur,name:nm,pay:b.pay,payDate:b.payDate});bedsOk++;
    });
    saveTrips();buildCalc();
    toast('Wczytano '+plural(r.rows.length,'pozycję','pozycje','pozycji')+(r.beds&&r.beds.length?' i '+plural(bedsOk,'nocleg','noclegi','noclegów')+(bedsLost?' ('+bedsLost+' bez pasującej daty — sprawdź datę startu wyprawy)':''):''));
  };
  rd.readAsText(f);e.target.value='';
});

/* ============ UKŁADACZ DNI DLA MIASTA ============
   Pakiet miejski ma pole city: {stay, zones[], acts[]}. Każdy klocek (act):
   {id, t, d, dur (h), slot: morning|day|evening, zone, indoor, closed:[dni tyg. 0=nd], tag: must|worth|detour, pick:false = domyślnie poza planem, pl: klucz miejsca z przewodnika}
   Stan w wyprawie: t.city = {pace, pick:{id:bool}, pin:{id:dzień}, rain:{dzień:true}}
   Apka układa dni sama; użytkownik może przypiąć klocek do dnia, usunąć go albo zmienić tempo i liczbę dni. */
function cityPack(){const p=P();return p&&p.city&&Array.isArray(p.city.acts)?p.city:null;}
function cityState(t){
  if(!t.city||typeof t.city!=='object')t.city={};
  const s=t.city;if(!PACE[s.pace])s.pace='normal';
  ['pick','pin','rain'].forEach(k=>{if(!s[k]||typeof s[k]!=='object')s[k]={};});
  return s;
}
function cityPicked(C,s,a){return s.pick[a.id]!=null?!!s.pick[a.id]:a.pick!==false&&a.tag!=='detour';}
function cityStayStage(t){const C=cityPack();const i=C&&C.stay!=null?C.stay:0;return t.stages[i]||t.stages[0];}
function cityDayCount(t){return Math.max(1,tripRange(t).days);}
function cityWeekday(t,i){if(t.dateless)return null;return dAt(addDays(t.start,i)).getDay();}
function cityZoneName(C,z){const x=(C.zones||[]).find(q=>q.id===z);return x?x.n:'';}
function cityLayout(t){
  const C=cityPack(),s=cityState(t),N=cityDayCount(t),P0=PACE[s.pace];
  const days=[];
  for(let i=0;i<N;i++){
    let fd=1,fe=1;
    if(N>1&&i===0)fd=C.firstDay!=null?C.firstDay:.55;
    if(N>1&&i===N-1){fd=C.lastDay!=null?C.lastDay:.45;fe=0;}
    if(N===1)fd=.7;
    days.push({i,wd:cityWeekday(t,i),rain:!!s.rain[i],capD:P0.d*fd,capE:P0.e*fe,useD:0,useE:0,items:[]});
  }
  const acts=C.acts.filter(a=>a&&a.id);
  const picked=acts.filter(a=>cityPicked(C,s,a)),unpicked=acts.filter(a=>!cityPicked(C,s,a));
  const fits=(a,d,force)=>{
    if(!force){
      if(d.wd!=null&&Array.isArray(a.closed)&&a.closed.includes(d.wd))return false;
      if(d.rain&&!a.indoor)return false;
    }
    if(a.slot==='evening')return force||d.useE+a.dur<=d.capE+.01;
    return force||d.useD+a.dur<=d.capD+.01;
  };
  const put=(a,d)=>{d.items.push(a);if(a.slot==='evening')d.useE+=a.dur;else d.useD+=a.dur;};
  const over=[];
  // 1. przypięte — zostają tam, gdzie je postawiono
  picked.filter(a=>s.pin[a.id]!=null&&s.pin[a.id]<N).forEach(a=>put(a,days[s.pin[a.id]]));
  // 2. reszta: najpierw must, potem dłuższe; dzień z tą samą dzielnicą ma pierwszeństwo
  const rank={must:0,worth:1,detour:2};
  picked.filter(a=>!(s.pin[a.id]!=null&&s.pin[a.id]<N))
    .sort((a,b)=>(rank[a.tag]||1)-(rank[b.tag]||1)||b.dur-a.dur)
    .forEach(a=>{
      const ok=days.filter(d=>fits(a,d));
      if(!ok.length){over.push(a);return;}
      const score=d=>(d.items.some(x=>x.zone&&x.zone===a.zone)?10:0)-(d.capD<P0.d*.9?1:0)-(a.slot==='evening'?d.useE/d.capE:d.useD/Math.max(d.capD,.1))*4-d.i*.01;
      ok.sort((x,y)=>score(y)-score(x));put(a,ok[0]);
    });
  // 2b. „must” bez miejsca wypychają z dnia nieprzypięte „warto” (te trafiają gdzie indziej albo do „nie mieści się”)
  over.filter(a=>a.tag==='must').forEach(a=>{
    const isEve=a.slot==='evening';
    for(const d of days){
      if(d.wd!=null&&Array.isArray(a.closed)&&a.closed.includes(d.wd))continue;
      if(d.rain&&!a.indoor)continue;
      const cap=isEve?d.capE:d.capD,use=isEve?d.useE:d.useD;
      if(a.dur>cap+.01)continue;
      const cand=d.items.filter(x=>x.tag!=='must'&&s.pin[x.id]==null&&(x.slot==='evening')===isEve).sort((x,y)=>y.dur-x.dur);
      let free=cap-use;const out=[];
      for(const x of cand){if(free+.01>=a.dur)break;out.push(x);free+=x.dur;}
      if(free+.01<a.dur)continue;
      out.forEach(x=>{d.items.splice(d.items.indexOf(x),1);if(isEve)d.useE-=x.dur;else d.useD-=x.dur;});
      put(a,d);over.splice(over.indexOf(a),1);
      out.forEach(x=>{const ok=days.filter(q=>q!==d&&fits(x,q));if(ok.length)put(x,ok.sort((p,q)=>(p.useD/p.capD)-(q.useD/q.capD))[0]);else over.push(x);});
      break;
    }
  });
  over.sort((a,b)=>(rank[a.tag]||1)-(rank[b.tag]||1));
  // 3. kolejność w dniu: rano → w ciągu dnia → wieczór, a w środku pogrupowane dzielnicami
  days.forEach(d=>{
    const zo=[];d.items.forEach(a=>{if(!zo.includes(a.zone))zo.push(a.zone);});
    d.items.sort((a,b)=>(SLOT_RANK[a.slot]??1)-(SLOT_RANK[b.slot]??1)||zo.indexOf(a.zone)-zo.indexOf(b.zone));
  });
  return{C,s,N,days,over,unpicked,pace:P0};
}
function hrs(x){return fmt2(Math.round(x*2)/2)+' h';}
function cityDayLabel(t,i){
  if(t.dateless)return'Dzień '+(i+1);
  const f=dateFor(t.start,i);return'Dzień '+(i+1)+' · '+f.wd+' '+f.d;
}
function cityActRow(L,a,i,opts){
  const t=T(),pinned=L.s.pin[a.id]!=null;
  const closed=Array.isArray(a.closed)&&a.closed.length?'zamknięte: '+a.closed.map(x=>DOW[x]).join(', '):'';
  const meta=[hrs(a.dur),cityZoneName(L.C,a.zone),a.indoor?'☂ pod dachem':'☀ na zewnątrz',closed].filter(Boolean).join(' · ');
  let ctl='';
  if(opts.edit){
    const sel='<select class="cy-move" data-cymove="'+attr(a.id)+'" aria-label="Przenieś na dzień">'+
      (i==null?'<option value="">dodaj do dnia…</option>':'')+
      L.days.map(d=>'<option value="'+d.i+'"'+(d.i===i?' selected':'')+'>'+(d.i===i?'':'→ ')+'dzień '+(d.i+1)+'</option>').join('')+
      (i!=null&&pinned?'<option value="auto">↺ niech apka wybierze</option>':'')+'</select>';
    ctl='<div class="cy-ctl">'+sel+
      (i!=null?'<button class="cy-x" data-cyoff="'+attr(a.id)+'" title="Usuń z planu" aria-label="Usuń z planu">✕</button>':'')+'</div>';
  }
  return'<div class="cy-act'+(a.tag==='must'?' must':'')+(a.slot==='evening'?' eve':'')+'">'+
    '<div class="cy-main"><div class="cy-t">'+(pinned?'<span class="cy-pin" title="przypięte">📌</span> ':'')+esc(a.t)+(a.tag==='must'?' <span class="cy-must">must see</span>':'')+'</div>'+
    '<div class="cy-m">'+esc(meta)+'</div>'+(a.d&&opts.desc!==false?'<div class="cy-d">'+esc(a.d)+'</div>':'')+'</div>'+ctl+'</div>';
}
function cityDayHTML(L,d,opts){
  const t=T();
  const load=d.capD?Math.min(1,d.useD/d.capD):1;
  const full=d.useD>d.capD+.01||d.useE>d.capE+.01;
  return'<div class="cy-day'+(d.rain?' rain':'')+'" id="cy-day-'+d.i+'">'+
    '<div class="cy-dh"><div><b>'+esc(cityDayLabel(t,d.i))+'</b>'+
      '<small>'+hrs(d.useD)+' z '+hrs(d.capD)+(d.capE?' · wieczór '+hrs(d.useE):'')+(full?' · ponad plan':'')+'</small></div>'+
      '<button class="cy-rain'+(d.rain?' on':'')+'" data-cyrain="'+d.i+'" aria-pressed="'+(d.rain?'true':'false')+'">☂ '+(d.rain?'Plan B włączony':'Pada? Plan B')+'</button></div>'+
    '<div class="cy-bar"><i style="width:'+Math.round(load*100)+'%"></i></div>'+
    (d.i===0&&L.N>1?'<div class="cy-note">Dzień przylotu — krótszy.</div>':'')+
    (d.i===L.N-1&&L.N>1?'<div class="cy-note">Dzień wylotu — tylko rano i w południe.</div>':'')+
    (d.items.length?d.items.map(a=>cityActRow(L,a,d.i,opts)).join(''):'<div class="cy-empty">Wolne. Dobre na odpoczynek albo coś spoza listy.</div>')+
  '</div>';
}
function buildCity(){
  const t=T(),w=$('#blocks'),L=cityLayout(t),s=L.s;
  let h='<div class="cy-head"><div class="cy-intro"><b>Układacz dni</b>Wybierasz tempo i liczbę dni, apka sama rozkłada miejsca po dniach i dzielnicach. Każde miejsce możesz przenieść na inny dzień albo usunąć.</div>'+
    '<div class="cy-ctrls"><div class="cy-days"><span>Dni</span><button class="nb" data-cydays="-1" aria-label="Mniej dni">−</button><b>'+L.N+'</b><button class="nb" data-cydays="1" aria-label="Więcej dni">+</button></div>'+
    '<div class="cy-pace" role="group" aria-label="Tempo">'+Object.keys(PACE).map(k=>'<button class="'+(s.pace===k?'on':'')+'" data-cypace="'+k+'">'+PACE[k].l+'</button>').join('')+'</div></div>'+
    '<div class="cy-legend">'+esc(PACE[s.pace].l)+': ok. '+PACE[s.pace].d+' h zwiedzania dziennie + wieczór. '+(t.dateless?'Gdy ustawisz datę startu, apka ominie dni, w które coś jest zamknięte.':'Dni zamknięcia muzeów są już uwzględnione.')+'</div></div>';
  if(L.over.length)h+='<div class="cy-over"><b>Nie mieści się ('+L.over.length+')</b><span>Dodaj dzień albo przełącz na „Intensywnie”. Możesz też przenieść coś ręcznie.</span>'+
    L.over.map(a=>cityActRow(L,a,null,{edit:true,desc:false})).join('')+
    '<div class="cy-over-btns"><button class="tb-btn" data-cydays="1">+ 1 dzień</button>'+(s.pace!=='hard'?'<button class="tb-btn" data-cypace="hard">Intensywniej</button>':'')+'</div></div>';
  h+=L.days.map(d=>cityDayHTML(L,d,{edit:true})).join('');
  if(L.unpicked.length)h+='<div class="blk-sec">Poza planem — dodaj, jeśli chcesz</div>'+L.unpicked.map(a=>cityActRow(L,a,null,{edit:true})).join('');
  w.innerHTML=h;a11y(w);
}
function cityApply(fn){const t=T();cityState(t);fn(t,t.city);saveTrips();refresh();}
function cityClick(e){
  const g=k=>e.target.closest('['+k+']');
  let b;
  if((b=g('data-cypace'))){cityApply((t,s)=>{s.pace=b.dataset.cypace;});return true;}
  if((b=g('data-cydays'))){cityApply(t=>{const st=cityStayStage(t);if(!st)return;
      st.nights=Math.max(0,num(st.nights)+num(b.dataset.cydays));});
    buildHeader();toast(plural(cityDayCount(T()),'dzień','dni','dni'));return true;}
  if((b=g('data-cyrain'))){cityApply((t,s)=>{const i=b.dataset.cyrain;if(s.rain[i])delete s.rain[i];else s.rain[i]=true;});
    toast(T().city.rain[b.dataset.cyrain]?'Plan B: na ten dzień tylko miejsca pod dachem':'Wróciło słońce');return true;}
  if((b=g('data-cyoff'))){cityApply((t,s)=>{s.pick[b.dataset.cyoff]=false;delete s.pin[b.dataset.cyoff];});return true;}
  return false;
}
function cityChange(e){
  const sel=e.target.closest('[data-cymove]');if(!sel)return false;
  const id=sel.dataset.cymove,v=sel.value;if(v==='')return true;
  cityApply((t,s)=>{s.pick[id]=true;if(v==='auto')delete s.pin[id];else s.pin[id]=+v;});
  if(v!=='auto')toast('Przypięte do dnia '+(+v+1));
  return true;
}
$('#blocks').addEventListener('click',e=>{if(cityPack())cityClick(e);});
$('#blocks').addEventListener('change',e=>{if(cityPack())cityChange(e);});
/* Dziś: plan dnia z układacza */
function cityTodayCard(c){
  if(!cityPack()||c.d<0||c.d>c.total)return'';
  const L=cityLayout(c.t),d=L.days[c.d];if(!d)return'';
  return'<div class="card cy-today"><h4>Plan na dziś</h4>'+cityDayHTML(L,d,{edit:false})+
    '<div class="cy-today-ft"><button class="tb-btn" data-go="klocki">Zmień plan</button></div></div>';
}
/* Plan: skrót dni pod etapami */
function cityPlanSummary(){
  const box=$('#city-plan');if(!box)return;
  if(!cityPack()){box.innerHTML='';return;}
  const t=T(),L=cityLayout(t);
  box.innerHTML='<div class="blk-sec">Dni w mieście</div>'+L.days.map(d=>
    '<div class="cy-sum"><b>'+esc(cityDayLabel(t,d.i))+'</b><span>'+(d.items.length?esc(d.items.map(a=>a.t).join(' · ')):'wolne')+'</span></div>').join('')+
    (L.over.length?'<div class="cy-sum warn"><b>Nie mieści się</b><span>'+esc(L.over.map(a=>a.t).join(' · '))+'</span></div>':'')+
    '<button class="tb-btn" data-go="klocki" style="margin-top:8px">Ułóż dni w Zarysie</button>';
}
$('#city-plan')&&$('#city-plan').addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b)goTab(b.dataset.go);});
$('#today').addEventListener('click',e=>{if(cityPack()&&e.target.closest('[data-cyrain]')){cityClick(e);}});

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
  const free=st.locked?[]:B.islands.slice();
  w.classList.toggle('blk-locked',!!st.locked);

  let h=st.locked?'<div class="blk-lock"><b>🔒 Plan zatwierdzony</b><span>Klocki są zablokowane — nic się nie zmieni przez przypadek.</span><button class="tb-btn" id="blk-unlock">Odblokuj</button></div>':'';
  h+='<div class="blk-anchor"><div class="blk-a1">'+esc(B.anchor.inNote)+'</div>'+
    '<div class="blk-a1">'+esc(B.anchor.outNote)+'</div>'+
    '<div class="blk-a2">'+esc(B.anchor.note)+'</div></div>';

  const dn=tot.nights-cap;
  h+='<div class="blk-sum">'+
    '<div class="k'+(dn===0?' ok':(dn>0?' over':''))+'"><div class="l">Noce</div><div class="v">'+tot.nights+' / '+cap+'</div>'+
      '<div class="s">'+(dn===0?'równo':(dn>0?'+'+dn+' za dużo':(-dn)+' wolne'))+'</div></div>'+
    '<div class="k"><div class="l">Loty krajowe</div><div class="v">'+tot.flights+'</div><div class="s">'+plural(tot.ferries,'prom','promy','promów')+'</div></div>'+
    '<div class="k"><div class="l">Na miejscu</div><div class="v">'+fmt(tot.total)+' EUR</div><div class="s">'+fmt(tot.total*rate('EUR'))+' zł</div></div>'+
    (B.fees&&num(B.fees.bought)?'<div class="k"><div class="l">Z lotami</div><div class="v">'+fmt(tot.total+num(B.fees.bought))+' EUR</div><div class="s">+'+fmt(num(B.fees.bought))+' EUR kupione</div></div>':'')+
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
          '<span class="blk-cost">'+fmt(num(s.nights)*(num(i.bed)+num(i.food)+num(i.local)))+' EUR</span>'+
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
              (o.mode==='plane'?'✈':'⛴')+' '+esc(o.dur)+' · '+fmt(o.price)+' EUR</button>').join('')+'</div>'+
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
        '<em>'+i.rec+' nocy · '+fmt(i.rec*(num(i.bed)+num(i.food)+num(i.local)))+' EUR</em></button>';
    });
    h+='</div>'+(B.repeatNote?'<p class="blk-note">'+esc(B.repeatNote)+'</p>':'');
  }

  h+=st.locked?'':'<div class="blk-foot">'+
    '<button class="tb-btn big" id="blk-apply">Zbuduj z tego plan</button>'+
    '<button class="tb-btn" id="blk-lock">🔒 Zatwierdź plan</button>'+
    '<button class="tb-btn" id="blk-reset">Zacznij od nowa</button>'+
    '<p class="blk-note">„Zbuduj plan” nadpisze etapy w zakładce Plan. „Zatwierdź plan” blokuje klocki, żeby nic nie zmienić przez przypadek. Daty policzą się same od '+esc(T().start)+'.</p></div>';

  w.innerHTML=h;
}

/* ---------- ZARYS: wstępne planowanie uniwersalnej wyprawy ---------- */
const LVL={high:['wysoki sezon','#b4532a'],low:['niski sezon','#5a7d9a'],shoulder:['przejściowy','#7a8f4a']};
function outline(t){
  if(!t.outline||typeof t.outline!=='object')t.outline={home:'',blocks:[],ret:{mode:'plane',price:'',cur:toCode(t.cur)},locked:false};
  if(!Array.isArray(t.outline.blocks))t.outline.blocks=[];
  if(!t.outline.ret)t.outline.ret={mode:'plane',price:'',cur:toCode(t.cur)};
  return t.outline;
}
function staleDays(iso){if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return null;return Math.floor((Date.now()-new Date(iso+'T00:00:00').getTime())/864e5);}
function checkedBadge(iso){
  const d=staleDays(iso);
  if(d==null)return'<span class="zr-chk bad">niesprawdzone</span>';
  return'<span class="zr-chk'+(d>180?' bad':'')+'">sprawdzone '+esc(iso)+(d>180?' — sprawdź ponownie':'')+'</span>';
}
function buildZarys(){
  const t=T(),o=outline(t),w=$('#blocks'),p=P(),lk=!!o.locked,dis=lk?' disabled':'';
  const guides=(t.guides||[]).map(i=>PACKS[i]).filter(Boolean);
  let h='';
  /* --- przewodniki --- */
  h+='<div class="blk-sec">Przewodniki krajów</div><div class="zr-guides">'+
    (guides.length?guides.map(g=>'<span class="zr-chip">'+esc(g.emoji||'📦')+' '+esc(g.name)+'</span>').join(''):'<span class="zr-none">brak — dołącz przewodnik albo wypełnij trasę ręcznie</span>')+
    '<button class="tb-btn" data-z="guides">＋ Przewodniki / szablon dla AI</button></div>';
  /* --- kiedy jechać --- */
  const seasons=(p&&p.seasons)||[];
  h+='<div class="blk-sec">Kiedy jechać</div>';
  h+='<div class="zr-date">'+(t.dateless?'Termin <b>nieustalony</b>':'Start: <b>'+esc(dateFor(t.start,0).full)+'</b>')+
    ' · <button class="tb-btn" data-z="setdate">'+(t.dateless?'ustaw start':'zmień')+'</button></div>';
  if(seasons.length){
    h+='<div class="zr-seasons">'+seasons.map((x,i)=>{const l=LVL[x.level]||['','#888'];
      return'<div class="zr-card"><div class="zr-h"><b>'+esc(x.name)+'</b>'+(l[0]?'<span class="zr-lvl" style="background:'+l[1]+'">'+l[0]+'</span>':'')+checkedBadge(x.checked)+'</div>'+
        '<div class="zr-b">'+esc(x.why||'')+(x.festivals?'<div class="zr-f">🎉 '+esc(x.festivals)+'</div>':'')+'</div>'+
        (x.start?'<button class="tb-btn" data-z="season" data-i="'+i+'">Ustaw start '+esc(x.start)+'</button>':'')+'</div>';}).join('')+'</div>';
  }else h+='<div class="zr-none">Brak sezonów — dodaj je w przewodniku (pole „seasons”).</div>';
  /* --- wizy --- */
  const visa=(p&&p.visa)||[];
  h+='<div class="blk-sec">Wizy i formalności</div>';
  h+=visa.length?visa.map(x=>'<div class="zr-card"><div class="zr-h"><b>'+esc(x.who||'Wiza')+'</b>'+checkedBadge(x.checked)+'</div>'+
    '<div class="zr-b"><b>'+esc(x.rule||'')+'</b>'+(x.cost?' · koszt: '+esc(x.cost):'')+(x.how?'<br>'+esc(x.how):'')+
    (x.url?'<br><a href="'+attr(x.url)+'" target="_blank" rel="noopener">oficjalna strona ↗</a>':'')+'</div></div>').join(''):
    '<div class="zr-none">Brak danych o wizach. Zawsze sprawdź na oficjalnej stronie MSZ / ambasady.</div>';
  /* --- trasa --- */
  h+='<div class="blk-sec">Trasa — bloki</div>';
  if(lk)h+='<div class="blk-lock"><b>🔒 Zarys zatwierdzony</b><span>Zmiana bloków jest wyłączona.</span><button class="tb-btn" data-z="unlock">Odblokuj</button></div>';
  h+='<div class="zr-home"><label>Skąd wyruszasz (miasto / lotnisko)</label><input data-zf="home"'+dis+' value="'+attr(o.home||'')+'" placeholder="np. Kraków"></div>';
  const modeOpt=(m)=>Object.keys(MODES).map(k=>'<option value="'+k+'"'+(m===k?' selected':'')+'>'+MODES[k].i+' '+MODES[k].l+'</option>').join('');
  const curOpt=(c)=>[toCode(t.cur),'EUR','USD','PLN','GBP'].filter((v,i,a)=>a.indexOf(v)===i).map(x=>'<option value="'+x+'"'+(toCode(c)===x?' selected':'')+'>'+x+'</option>').join('');
  let nights=0,tr=0;
  o.blocks.forEach((b,i)=>{
    nights+=Math.max(0,num(b.nights));tr+=toPln(num(b.price),b.cur||t.cur);
    const prev=i?o.blocks[i-1].name:(o.home||'start');
    h+='<div class="zr-blk"><div class="zr-blk-h"><span class="zr-n">'+(i+1)+'</span>'+
      '<input class="zr-name" data-zf="name" data-i="'+i+'"'+dis+' value="'+attr(b.name||'')+'" placeholder="nazwa bloku: wyspa / kraj / region">'+
      '<label class="zr-nt">nocy<input type="number" min="0" data-zf="nights" data-i="'+i+'"'+dis+' value="'+attr(b.nights!=null?b.nights:2)+'"></label>'+
      (lk?'':'<button class="blk-x" data-z="up" data-i="'+i+'" title="wyżej">↑</button><button class="blk-x" data-z="down" data-i="'+i+'" title="niżej">↓</button><button class="blk-x" data-z="del" data-i="'+i+'" title="usuń">✕</button>')+'</div>'+
      '<div class="zr-leg"><span>dojazd: '+esc(prev)+' →</span><select data-zf="mode" data-i="'+i+'"'+dis+'>'+modeOpt(b.mode||'plane')+'</select>'+
      '<input type="number" inputmode="decimal" data-zf="price" data-i="'+i+'"'+dis+' value="'+attr(b.price||'')+'" placeholder="cena"><select data-zf="cur" data-i="'+i+'"'+dis+'>'+curOpt(b.cur)+'</select></div>'+
      '<input class="zr-note" data-zf="note" data-i="'+i+'"'+dis+' value="'+attr(b.note||'')+'" placeholder="notatka (opcjonalnie)"></div>';
  });
  if(!o.blocks.length)h+='<div class="zr-none">Brak bloków. Dodaj z przewodnika albo wpisz własny.</div>';
  const R=o.ret;tr+=toPln(num(R.price),R.cur||t.cur);
  const last=o.blocks.length?o.blocks[o.blocks.length-1].name:'';
  h+='<div class="zr-blk zr-ret"><div class="zr-blk-h"><span class="zr-n">↩</span><b>Powrót</b></div><div class="zr-leg"><span>'+esc(last||'ostatni blok')+' → '+esc(o.home||'start')+'</span>'+
    '<select data-zf="rmode"'+dis+'>'+modeOpt(R.mode||'plane')+'</select><input type="number" inputmode="decimal" data-zf="rprice"'+dis+' value="'+attr(R.price||'')+'" placeholder="cena"><select data-zf="rcur"'+dis+'>'+curOpt(R.cur)+'</select></div></div>';
  if(!lk){
    const regs=((p&&p.regions)||[]).filter(r=>!o.blocks.some(b=>norm(b.name)===norm(r.name)));
    h+='<div class="zr-add">'+regs.map(r=>'<button class="tb-btn" data-z="addreg" data-n="'+attr(r.name)+'">＋ '+esc(r.name)+'</button>').join('')+
      '<button class="tb-btn" data-z="addblk">＋ Własny blok</button></div>';
  }
  h+='<div class="zr-sum">'+plural(o.blocks.length,'blok','bloki','bloków')+' · '+plural(nights,'noc','noce','nocy')+' · dojazdy razem ok. <b>'+fmt(tr)+' zł</b>'+
    (o.blocks.some(b=>!num(b.price))||!num(R.price)?' <small>(część cen jeszcze pusta)</small>':'')+'</div>';
  h+='<div class="zr-acts">'+(lk?'':'<button class="tb-btn" data-z="lock">🔒 Zatwierdź zarys</button>')+
    '<button class="tb-btn pri" data-z="build"'+(o.blocks.length?'':' disabled')+'>Zbuduj z tego plan →</button></div>';
  h+='<div class="unconf">Plan zastępuje etapy trasy z tego zarysu (potwierdzone pozycje w Kosztorysie zostają). Potem w Kosztorysie użyj „⚙ Szkic z planu”, żeby dostać wiersze lotów i transferów do uzupełnienia.</div>';
  w.innerHTML=h;
}
function zarysBuild(){
  const t=T(),o=outline(t);
  if(!o.blocks.length){toast('Dodaj przynajmniej jeden blok');return;}
  if(t.stages.length&&!confirm('Zastąpić etapy w Planie trasą z Zarysu? Dotychczasowe etapy przepadną (Kosztorys zostaje).'))return;
  const mk=x=>Object.assign({title:'',from:'',to:'',via:'',mode:'bus',modeSug:x.mode||'bus',nights:1,status:'',dep:'',arr:'',carrier:'',
    price:'',curr:toSym(t.cur),stay:'',stayPrice:'',curr2:toSym(t.cur),src:'user',see:'',detail:'',note:''},x);
  const out=o.blocks.map((b,i)=>{const prev=i?o.blocks[i-1].name:(o.home||'');
    return mk({title:(prev?prev+' → ':'Przylot · ')+b.name,from:prev,to:b.name,mode:b.mode||'plane',modeSug:b.mode||'plane',
      nights:Math.max(0,num(b.nights)),price:b.price?String(b.price):'',curr:toSym(b.cur||t.cur),stay:b.name,see:b.note||''});});
  const last=o.blocks[o.blocks.length-1].name;
  out.push(mk({title:last+' → '+(o.home||'start'),from:last,to:o.home||'start',mode:o.ret.mode||'plane',nights:0,src:'tail',
    price:o.ret.price?String(o.ret.price):'',curr:toSym(o.ret.cur||t.cur)}));
  t.stages=out;o.locked=true;saveTrips();goTab('plan');toast('Plan zbudowany: '+plural(out.length,'etap','etapy','etapów'));
}
$('#blocks').addEventListener('input',e=>{
  if(blkPack())return;
  const f=e.target.dataset.zf;if(!f)return;
  const t=T(),o=outline(t),i=e.target.dataset.i,v=e.target.value;
  if(f==='home')o.home=v;
  else if(f==='rmode')o.ret.mode=v;else if(f==='rprice')o.ret.price=v;else if(f==='rcur')o.ret.cur=v;
  else if(i!=null&&o.blocks[+i])o.blocks[+i][f]=(f==='nights')?Math.max(0,num(v)):v;
  saveTrips();
  if(f==='home'||f==='name'||f==='nights'||f==='price'||f==='rprice'){clearTimeout(window._zt);window._zt=setTimeout(()=>{const a=document.activeElement,k=a&&a.dataset&&a.dataset.zf,ix=a&&a.dataset&&a.dataset.i;buildZarys();
    const n=k&&document.querySelector('#blocks [data-zf="'+k+'"]'+(ix!=null?'[data-i="'+ix+'"]':''));if(n){n.focus();try{n.setSelectionRange(n.value.length,n.value.length);}catch(_){}}},700);}
});
$('#blocks').addEventListener('change',e=>{if(!blkPack()&&e.target.dataset.zf){buildZarys();}});
$('#blocks').addEventListener('click',e=>{
  if(blkPack())return;
  const b=e.target.closest('[data-z]');if(!b)return;
  const t=T(),o=outline(t),z=b.dataset.z,i=+b.dataset.i;
  if(z==='guides'){openTrips();return;}
  if(z==='setdate'){goTab('plan');const el=$('#trip-start');if(el){el.scrollIntoView({block:'center'});el.focus();}return;}
  if(z==='season'){const x=((P()||{}).seasons||[])[i];if(!x||!x.start)return;
    if(!t.dateless&&t.start!==x.start&&!dateGuard(t))return;
    t.start=x.start;t.dateless=false;saveTrips();buildZarys();toast('Start ustawiony na '+dateFor(x.start,0).full);return;}
  if(z==='unlock'){o.locked=false;saveTrips();buildZarys();return;}
  if(z==='lock'){o.locked=true;saveTrips();buildZarys();toast('Zarys zatwierdzony 🔒');return;}
  if(o.locked&&z!=='build')return;
  if(z==='addblk'){o.blocks.push({name:'',nights:2,mode:'plane',price:'',cur:toCode(t.cur),note:''});}
  else if(z==='addreg'){const r=((P()||{}).regions||[]).find(x=>x.name===b.dataset.n);if(!r)return;
    const a=r.arrive||{};o.blocks.push({name:r.name,nights:num(r.nights)||2,mode:MODES[a.mode]?a.mode:'plane',price:a.price||'',cur:toCode(a.cur||t.cur),note:r.note||''});}
  else if(z==='del'){o.blocks.splice(i,1);}
  else if(z==='up'&&i>0){[o.blocks[i-1],o.blocks[i]]=[o.blocks[i],o.blocks[i-1]];}
  else if(z==='down'&&i<o.blocks.length-1){[o.blocks[i+1],o.blocks[i]]=[o.blocks[i],o.blocks[i+1]];}
  else if(z==='build'){zarysBuild();return;}
  saveTrips();buildZarys();
});

/* ---------- interakcje ---------- */
$('#blocks').addEventListener('click',e=>{
  const t=T(),st=blkState(t);
  if(e.target.closest('#blk-unlock')){st.locked=false;saveTrips();buildBlocks();toast('Klocki odblokowane');return;}
  if(e.target.closest('#blk-lock')){st.locked=true;saveTrips();buildBlocks();toast('Plan zatwierdzony 🔒');return;}
  if(st.locked){if(!e.target.closest('[data-btog]')){if(e.target.closest('button'))toast('Plan zatwierdzony — najpierw „Odblokuj”');return;}}
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
  if(st.locked){toast('Plan zatwierdzony — najpierw „Odblokuj”');return;}
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
  t.stages=out;t.packRev=(PACKS[t.pack]&&PACKS[t.pack].rev)||1;delete t.pendingRev;st.locked=true;saveTrips();
  toast('Plan zbudowany: '+plural(out.length,'etap','etapy','etapów'));
  goTab('plan');
}

