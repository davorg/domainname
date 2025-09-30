// ————— Utilities —————
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function mulberry32(a){
  return function(){let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296}
}

function seedFromString(s){
  if(!s) return Math.floor(Math.random()*2**31);
  let h = 2166136261 >>> 0; for(let i=0;i<s.length;i++){h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)}; return h >>> 0;
}

function pick(rng, arr){ return arr[Math.floor(rng()*arr.length)]; }

function copy(text){ navigator.clipboard.writeText(text).then(()=>toast(`Copied “${text}”`)) }

function toast(msg){
  const s = $('#status'); s.textContent = msg; clearTimeout(s._t); s._t = setTimeout(()=> s.textContent = '', 1800);
}

// Simple naughty-word guard (very small, not exhaustive)
const BLOCK = ["sex","porn","hitler","naz","kkk","fuck","shit","rape","slut","cunt","twat","prick","ass","arse","nazi","islam","jew","christ","allah"]; // avoid obvious baggage

// ————— Phonotactics —————
const ONSETS_CORE = [
  'b','br','bl','c','ch','cl','cr','d','dr','f','fl','fr','g','gl','gr','h','j','k','kl','kr','l','m','n','p','pl','pr','ph','qu','r','s','sc','scr','sh','sk','sl','sm','sn','sp','spr','st','str','sw','t','tr','tw','v','w','y','z','thr','th'
];

const ONSETS_SOFT = ['m','n','l','r','w','y','fl','pl','sl','sm','sn','sw','sh','ch','gl','cl'];

const NUCLEI = ['a','e','i','o','u','aa','ai','au','ea','ee','ei','ia','ie','io','oa','oe','oi','oo','ou','ua','ue','ui'];

const CODAS = [
  '', '', '', // open syllables more common
  'b','c','ck','ct','d','f','ft','g','gh','k','ks','l','ld','lf','lk','lm','lp','ls','lt','m','mp','n','nd','ng','nk','ns','nt','p','pt','r','rb','rc','rd','rf','rk','rl','rm','rn','rp','rs','rt','rv','s','sk','st','t','th','ts','v','x','z'
];

const BRAND_SUFFIXES = ['ly','io','ify','able'];

// Flavour presets (lightweight)
const FLAVOURS = {
  english: {
    onset: ONSETS_CORE,
    soft: ONSETS_SOFT,
    nuclei: NUCLEI,
    coda: CODAS,
    suffixBias: ['ly','io','ify','able']
  },
  romance: {
    onset: [...ONSETS_CORE, 'pr','tr','bl','pl','gr'],
    soft: [...ONSETS_SOFT, 'br','tr'],
    nuclei: [...NUCLEI, 'ia','io','ea','oa','ua','eau','au'],
    coda: ['', '', '', 'l','n','r','s','m','t','o'],
    suffixBias: ['io','a','o','ify']
  },
  nordic: {
    onset: [...ONSETS_CORE, 'sk','st','kv','fj','sv'],
    soft: ['l','r','n','m','sk','st','sv'],
    nuclei: [...NUCLEI, 'y','ey','oy'],
    coda: [...CODAS, 'rn','rk','rs','rt'],
    suffixBias: ['ly','ify','able']
  }
};

function isPronounceable(s, opts){
  if(opts.noTriple){ if(/[bcdfghjklmnpqrstvwxyz]{3}/i.test(s) || /[aeiou]{3}/i.test(s)) return false; }
  if(opts.noDouble){ if(/([a-z])\1/i.test(s)) return false; }
  if(/q[^u]/i.test(s)) return false;
  if(/[^s]h[bcdfgjklmnpqrtvwxyz]/i.test(s)) return false;
  if(/^x/i.test(s)) return false;
  if(/zz[^aoueiy]/i.test(s)) return false;
  return true;
}

function banned(name, extra){
  const low = name.toLowerCase();
  for(const b of BLOCK) if(low.includes(b)) return true;
  for(const b of extra) { const x=b.trim().toLowerCase(); if(x && low.includes(x)) return true; }
  return false;
}

function buildSyllable(rng, opts){
  const onsetPool = opts.preferSoft ? [...opts.flavour.onset, ...opts.flavour.soft, ...opts.flavour.soft] : opts.flavour.onset;
  const onset = rng() < .85 ? pick(rng, onsetPool) : '';

  const nuclei = [...opts.flavour.nuclei];
  if(opts.yVowel){ nuclei.push('y'); if(rng()<.3) nuclei.push('ey','ay','oy','uy'); }
  const nucleus = pick(rng, nuclei);

  const coda = pick(rng, opts.flavour.coda);
  return onset + nucleus + coda;
}

function titlecase(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

function scoreName(n){
  const len = n.length;
  const syl = (n.match(/[aeiouy]+/g)||[]).length;
  const vowels = (n.match(/[aeiouy]/g)||[]).length;
  const cons = len - vowels;
  let s = 100;
  if(len < 5 || len > 10) s -= 10;
  if(syl < 2 || syl > 3) s -= 10;
  const ratio = vowels / Math.max(cons,1);
  if(ratio < 0.4 || ratio > 0.8) s -= 10;
  if(/[bcdfghjklmnpqrstvwxyz]{3}/.test(n) || /[aeiou]{3}/.test(n)) s -= 8;
  if(/q[^u]/.test(n)) s -= 5;
  return Math.max(0, Math.min(100, s));
}

function generateOne(rng, cfg){
  let tries = 0;
  for(; tries < 200; tries++){
    const syls = Math.floor(rng()*(cfg.maxSyl-cfg.minSyl+1)) + cfg.minSyl;
    let name = '';
    for(let i=0;i<syls;i++) name += buildSyllable(rng, cfg);

    if(cfg.useSuffix && rng() < 0.35){
      const suf = pick(rng, cfg.flavour.suffixBias);
      name += suf;
    }

    name = name.toLowerCase();
    name = name.replace(/quu/g,'qu').replace(/iii/g,'ii').replace(/([aeiou])\1{2,}/g,'$1$1');

    if(name.length < cfg.minLen || name.length > cfg.maxLen) continue;
    if(!isPronounceable(name, {noTriple: cfg.noTriple, noDouble: cfg.noDouble})) continue;

    // Pattern anchoring
    if(cfg.patStart && !name.startsWith(cfg.patStart)) continue;
    if(cfg.patContain && !name.includes(cfg.patContain)) continue;
    if(cfg.patEnd && !name.endsWith(cfg.patEnd)) continue;

    if(banned(name, cfg.banList)) continue;

    // Quality gate
    const sc = scoreName(name);
    if((cfg.quality==='med' && sc < 70) || (cfg.quality==='high' && sc < 82)){
      continue;
    }

    return name;
  }
  return null;
}

function buildList(){
  const count = clamp(+$('#count').value, 1, 100);
  const minSyl = clamp(+$('#minSyl').value, 1, 4);
  const maxSyl = clamp(+$('#maxSyl').value, 1, 4);
  const minLen = clamp(+$('#minLen').value, 3, 16);
  const maxLen = clamp(+$('#maxLen').value, 3, 16);
  const preferSoft = $('#ruleSoft').checked;
  const noTriple = $('#ruleNoTriple').checked;
  const noDouble = $('#ruleNoDouble').checked;
  const useSuffix = $('#ruleSuffix').checked;
  const yVowel = $('#ruleYvowel').checked;
  const seedStr = $('#seed').value.trim();
  const rng = mulberry32(seedFromString(seedStr || `${Date.now()}-${Math.random()}`));
  const banList = $('#ban').value.split(',');

  const flavourKey = ($('#flavour')?.value || 'english');
  const flavour = FLAVOURS[flavourKey] || FLAVOURS.english;

  const quality = ($('input[name="quality"]:checked')?.value) || 'med';

  const patStart = ($('#patStart')?.value || '').trim().toLowerCase();
  const patContain = ($('#patContain')?.value || '').trim().toLowerCase();
  const patEnd = ($('#patEnd')?.value || '').trim().toLowerCase();

  const _minSyl = Math.min(minSyl, maxSyl), _maxSyl = Math.max(minSyl, maxSyl);
  const _minLen = Math.min(minLen, maxLen), _maxLen = Math.max(minLen, maxLen);

  const cfg = {minSyl:_minSyl, maxSyl:_maxSyl, minLen:_minLen, maxLen:_maxLen,
    preferSoft, noTriple, noDouble, useSuffix, yVowel, banList,
    flavour, quality, patStart, patContain, patEnd};

  const out = new Set();
  let guard = 0;
  while(out.size < count && guard < count*60){
    const n = generateOne(rng, cfg); if(n) out.add(n); guard++;
  }
  return [...out];
}

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function selectedTLDs(){
  return Array.from($('#tlds').selectedOptions).map(o=>o.value);
}

function render(list){
  const tlds = selectedTLDs();
  const frag = document.createDocumentFragment();
  list.forEach(name => {
    const card = document.createElement('article');
    card.className = 'card';

    const domRow = document.createElement('div');
    domRow.className = 'row';
    const span = document.createElement('button');
    span.className = 'domain secondary';
    span.textContent = titlecase(name);
    span.title = 'Click to copy the bare name';
    span.onclick = () => copy(name);
    domRow.appendChild(span);

    const fav = document.createElement('button');
    fav.className = 'fav'; fav.setAttribute('aria-pressed','false'); fav.textContent = '★';
    fav.title = 'Pin to favourites';
    fav.onclick = () => {
      const on = fav.getAttribute('aria-pressed') === 'true';
      fav.setAttribute('aria-pressed', String(!on));
      toggleFavourite(name, !on);
    };
    domRow.appendChild(fav);
    card.appendChild(domRow);

    const chips = document.createElement('div'); chips.className = 'chips';
    for(const t of tlds){
      const chip = document.createElement('span'); chip.className = 'chip';
      chip.textContent = name + t; chip.style.cursor='pointer'; chip.title = 'Click to copy with TLD';
      chip.onclick = () => copy(name + t);
      chips.appendChild(chip);
    }
    card.appendChild(chips);

    const actions = document.createElement('div'); actions.className = 'row';
    const a = document.createElement('a'); a.href = registrarUrl(name); a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Check availability';
    const small = document.createElement('span'); small.className = 'tiny'; small.textContent = 'Not an affiliate link';
    actions.appendChild(a); actions.appendChild(small);
    card.appendChild(actions);

    frag.appendChild(card);
  });
  const res = $('#results'); res.setAttribute('aria-busy','true'); res.innerHTML=''; res.appendChild(frag); res.setAttribute('aria-busy','false');
}

function registrarUrl(name){
  const q = encodeURIComponent(name);
  return `https://www.123-reg.co.uk/domain-names/search/?domain=${q}`;
}

function exportCSV(){
  const rows = $$('#results .card .domain').map(btn => btn.textContent.toLowerCase());
  if(!rows.length){ toast('Nothing to export'); return; }
  const tlds = selectedTLDs();
  const header = ['name', ...tlds].join(',');
  const lines = [header];
  for(const name of rows){
    const cols = [name, ...tlds.map(t => name+t)];
    lines.push(cols.join(','));
  }
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='brandable-names.csv'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2500);
}

// ——— favourites ———
const FAV_KEY = 'brandable:favs';
function loadFavs(){ try{ return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }catch{ return new Set(); } }
function saveFavs(set){ localStorage.setItem(FAV_KEY, JSON.stringify([...set])); }
const favs = loadFavs();
function toggleFavourite(name, on){ if(on) favs.add(name); else favs.delete(name); saveFavs(favs); }

function showFavs(){
  if(!favs.size){ toast('No favourites yet'); return; }
  render([...favs]);
}

// ——— Bindings ———
$('#btnGen').addEventListener('click', ()=>{ render(buildList()); });
$('#btnClear').addEventListener('click', ()=>{ $('#results').innerHTML=''; toast('Cleared'); });
$('#btnExport').addEventListener('click', exportCSV);
$('#showFavs').addEventListener('click', showFavs);

// Generate an initial batch
render(buildList());
