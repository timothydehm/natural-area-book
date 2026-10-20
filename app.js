(() => {
'use strict';
const D = window.BOOK_DATA;
const S = D.settings;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const pats = D.patterns, by = {};
pats.forEach(p => by[p.num] = p);
const partOf = n => by[n] ? by[n].part : 1;
const partName = k => S.parts[k].name;

// ---------- small helpers ----------
const WORDS = 'ZERO ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN TWELVE THIRTEEN FOURTEEN FIFTEEN SIXTEEN SEVENTEEN EIGHTEEN NINETEEN TWENTY'.split(' ');
const TENS = {2: 'TWENTY', 3: 'THIRTY', 4: 'FORTY', 5: 'FIFTY', 6: 'SIXTY', 7: 'SEVENTY', 8: 'EIGHTY', 9: 'NINETY'};
const numWord = n => n <= 20 ? WORDS[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + WORDS[n % 10] : '');
const partWord = k => k == 1 ? 'Part One' : 'Part Two';
function crop(s) {
  const c = {x: 50, y: 50, z: 1};
  String(s || '').toLowerCase().replace(/([xyz])\s*=?\s*(-?\d+(?:\.\d+)?)/g, (_, k, v) => c[k] = +v);
  return `--x:${Math.min(100, Math.max(0, c.x))}%;--y:${Math.min(100, Math.max(0, c.y))}%;--z:${Math.min(4, Math.max(1, c.z))}`;
}
const photoSrc = name => name ? (D.photos && D.photos[name]) || null : null;
const paras = text => String(text || '').split(/\n\s*\n|\n/).map(t => t.trim()).filter(Boolean).map(t => {
  const m = t.match(/^Therefore:\s*(.*)$/i);
  return m ? `<p class="tf"><b>Therefore:</b> ${esc(m[1])}</p>` : `<p>${esc(t)}</p>`;
}).join('');
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

// ---------- my book (selection) ----------
const BOOK_KEY = 'npb-mybook-v1';
let book = store.get(BOOK_KEY, {nums: [], title: '', cover: true});
book.nums = (book.nums || []).filter(n => by[n]);
const saveBook = () => { store.set(BOOK_KEY, book); updateCounts(); markNav(); };
const inBook = n => book.nums.includes(n);
function toggle(n) {
  book.nums = inBook(n) ? book.nums.filter(x => x !== n) : [...book.nums, n].sort((a, b) => a - b);
  saveBook(); return inBook(n);
}
function updateCounts() {
  $$('[data-count]').forEach(el => { el.textContent = book.nums.length; el.classList.toggle('has', book.nums.length > 0); });
}
let toastTimer;
function toast(msg) {
  let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

// ---------- sidebar ----------
function buildNav() {
  document.title = S.title;
  $('#brandKicker').textContent = S.kicker || '';
  $('#brandTitle').textContent = S.title;
  $('#topTitle').textContent = S.title;
  $('#navParts').innerHTML = ['1', '2'].map(k => `
    <div class="nav-part part${k}">
      <a class="nav-part-head" href="#/part/${k}" data-part="${k}"><span class="kicker">${partWord(k)}</span><span class="name">${esc(partName(k))}</span></a>
      <ol class="nav-list">${pats.filter(p => p.part == k).map(p =>
        `<li><a href="#/pattern/${p.num}" data-n="${p.num}"><span class="n">${p.num}</span><span class="t">${esc(p.name)}</span></a></li>`).join('')}</ol>
    </div>`).join('') + '<div class="side-legend" id="legend"><i></i>linked to this pattern</div>';
}
function markNav(route = current) {
  const cur = route.view === 'pattern' ? route.n : null;
  const rel = cur ? new Set([...by[cur].rc, ...by[cur].rp, ...pats.filter(p => p.rc.includes(cur) || p.rp.includes(cur)).map(p => p.num)]) : new Set();
  $$('.nav-list a').forEach(a => {
    const n = +a.dataset.n;
    if (n === cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    a.classList.toggle('related', rel.has(n) && n !== cur);
    a.classList.toggle('picked', inBook(n));
  });
  $$('.nav-part-head').forEach(a => route.view === 'part' && a.dataset.part == route.k ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const sb = $('.side-book'); route.view === 'book' ? sb.setAttribute('aria-current', 'page') : sb.removeAttribute('aria-current');
  $('#legend') && $('#legend').classList.toggle('show', rel.size > 0);
  const curA = cur && $(`.nav-list a[data-n="${cur}"]`);
  if (curA) { const r = curA.getBoundingClientRect(), sr = $('#side').getBoundingClientRect();
    if (r.top < sr.top + 80 || r.bottom > sr.bottom - 70) curA.scrollIntoView({block: 'center'}); }
}

// ---------- views ----------
function panelPhoto(name, cropCode, label) {
  const src = photoSrc(name);
  return src ? `<figure class="panel" style="${crop(cropCode)}"><img src="${esc(src)}" alt="${esc(label)}"></figure>`
             : `<figure class="panel empty" aria-hidden="true"><span>Photo to come</span></figure>`;
}
const linkItem = n => `<li><a href="#/pattern/${n}"><span class="n">${n}</span><span class="t">${esc(by[n].name)}</span></a></li>`;
const pickLabel = on => on ? '<span class="ic">✓</span> In my book' : '<span class="ic">+</span> Add to my book';

function viewHome() {
  const counts = k => pats.filter(p => p.part == k).length;
  return `<div class="split home">
    ${S.coverPhoto && photoSrc(S.coverPhoto) ? panelPhoto(S.coverPhoto, S.coverCrop, S.title) : `<div class="panel solid part2"><span class="kicker">${esc(S.kicker)}</span></div>`}
    <div class="copy"><div class="copy-inner">
      <div class="kicker" style="color:var(--muted);margin-bottom:12px">${esc(S.kicker)}</div>
      <h1 class="title">${esc(S.title)}</h1>
      <div class="prose">${paras(S.intro)}</div>
      ${S.howTo ? `<p class="home-how">${esc(S.howTo)}</p>` : ''}
      <div class="part-cards">${['1', '2'].map(k => `
        <a class="part-card part${k}" href="#/part/${k}"><span class="kicker">${partWord(k)}</span>
          <span class="name">${esc(partName(k))}</span><span class="meta">${counts(k)} patterns</span></a>`).join('')}</div>
      ${S.edition ? `<p class="edition">${esc(S.edition)}</p>` : ''}
    </div></div></div>`;
}

function viewPart(k) {
  const list = pats.filter(p => p.part == k);
  const allIn = list.every(p => inBook(p.num));
  return `<div class="split part${k}">
    <div class="panel solid"><span class="kicker">${partWord(k)}</span><h1 class="panel-title">${esc(partName(k))}</h1>
      <div class="panel-sub">${list.length} patterns</div></div>
    <div class="copy"><div class="copy-inner">
      <div class="prose">${paras(S.parts[k].intro) || ''}</div>
      <ul class="plist">${list.map(p => `<li><a href="#/pattern/${p.num}"><span class="n">${p.num}</span><span class="t">${esc(p.name)}</span></a>
        <button class="mini-pick" data-pick="${p.num}" aria-pressed="${inBook(p.num)}" aria-label="${inBook(p.num) ? 'Remove from' : 'Add to'} my book: ${esc(p.name)}">${inBook(p.num) ? '✓' : '+'}</button></li>`).join('')}</ul>
      <p style="margin-top:16px"><button class="textbtn" data-pickall="${k}">${allIn ? 'Remove all from my book' : `Add all ${list.length} to my book`}</button></p>
      ${pager(k == 1 ? {href: '#/', label: 'Introduction'} : {href: '#/part/1', label: partName(1)},
              {href: `#/pattern/${list[0].num}`, label: `${list[0].num} ${list[0].name}`})}
    </div></div></div>`;
}

function pager(prev, next) {
  return `<nav class="pager" aria-label="Previous and next">
    ${prev ? `<a class="prev" href="${prev.href}"><small>Previous</small>${esc(prev.label)}</a>` : '<span></span>'}
    ${next ? `<a class="next" href="${next.href}"><small>Next</small>${esc(next.label)}</a>` : ''}</nav>`;
}

function viewPattern(n) {
  const p = by[n], i = pats.indexOf(p);
  const prevP = pats[i - 1], nextP = pats[i + 1];
  const para = [p.see, p.why].filter(Boolean).join(' ');
  // Part 1 conditions list the design patterns that respond to them; Part 2 patterns list the conditions they respond to.
  const respondedBy = p.part === 1 ? pats.filter(q => q.rc.includes(n)).map(q => q.num) : [];
  const relatedNums = p.rp.filter(x => by[x]);
  const extra = respondedBy.filter(x => !relatedNums.includes(x));
  const prev = prevP ? (prevP.part !== p.part ? {href: `#/part/${p.part}`, label: partName(p.part)} : {href: `#/pattern/${prevP.num}`, label: `${prevP.num} ${prevP.name}`})
                     : {href: `#/part/${p.part}`, label: partName(p.part)};
  const next = nextP ? (nextP.part !== p.part ? {href: `#/part/${nextP.part}`, label: `${partWord(nextP.part)}: ${partName(nextP.part)}`} : {href: `#/pattern/${nextP.num}`, label: `${nextP.num} ${nextP.name}`})
                     : {href: '#/book', label: 'My book'};
  return `<article class="split part${p.part}">
    ${panelPhoto(p.photo, p.crop, p.name)}
    <div class="copy"><div class="copy-inner">
      <div class="label">${numWord(p.num)}</div>
      <h1 class="title">${esc(p.name)}</h1>
      <p class="lede">${esc(para)}</p>
      <p class="therefore"><b>Therefore:</b> ${esc(p.do)}</p>
      <div class="links">
        ${p.rc.length ? `<section><h2>Responds to</h2><ul>${p.rc.filter(x => by[x]).map(linkItem).join('')}</ul></section>` : ''}
        ${relatedNums.length || extra.length ? `<section><h2>Related patterns</h2><ul>${[...relatedNums, ...extra].map(linkItem).join('')}</ul></section>` : ''}
      </div>
      <div class="actions">
        <button class="pick" data-pick="${n}" aria-pressed="${inBook(n)}">${pickLabel(inBook(n))}</button>
        <span class="hint">${book.nums.length ? `${book.nums.length} in <a href="#/book">my book</a>` : 'Collect patterns, then print your own book.'}</span>
      </div>
      ${pager(prev, next)}
    </div></div></article>`;
}

let shared = null;  // a selection arriving through a shared link
function viewBook() {
  const sel = book.nums;
  const pageOf = n => sel.indexOf(n) + 1 + (book.cover ? 1 : 0);
  const banner = shared && shared.nums.join() !== sel.join() ? `<div class="banner">This link holds a book of ${shared.nums.length} pattern${shared.nums.length === 1 ? '' : 's'}${shared.title ? ` called “${esc(shared.title)}”` : ''}.
      <div class="row"><button class="btn" id="useShared">Use this selection</button><button class="btn ghost" id="keepMine">Keep mine${sel.length ? ` (${sel.length})` : ''}</button></div></div>` : '';
  return `<div class="split book">
    <div class="panel solid part2"><span class="kicker">Print your own</span><h1 class="panel-title">My book</h1>
      <div class="panel-sub">${sel.length ? `${sel.length} pattern${sel.length === 1 ? '' : 's'} · ${sel.length + (book.cover ? 1 : 0)} pages` : 'Nothing collected yet'}</div></div>
    <div class="copy"><div class="copy-inner">
      ${banner}
      <label class="field"><span>Title for the cover</span><input type="text" id="bookTitle" placeholder="${esc(S.title)}" value="${esc(book.title || '')}"></label>
      <label class="check"><input type="checkbox" id="bookCover" ${book.cover ? 'checked' : ''}> Include a cover with contents</label>
      <div class="actions" style="margin-top:18px">
        <button class="btn" id="printBook" ${sel.length ? '' : 'disabled'}>Print</button>
        <button class="btn ghost" id="shareBook" ${sel.length ? '' : 'disabled'}>Copy link to this book</button>
      </div>
      <p class="hint" style="margin-top:12px">Prints on letter paper, landscape, one pattern per page: photo on the left, text on the right.</p>
      ${sel.length ? `<ul class="book-list">${sel.map(n => `<li class="part${partOf(n)}"><a href="#/pattern/${n}"><span class="n">${n}</span><span class="t">${esc(by[n].name)}</span></a>
          <span class="pg">p. ${pageOf(n)}</span><button class="remove" data-remove="${n}" aria-label="Remove ${esc(by[n].name)}">×</button></li>`).join('')}</ul>
          <p style="margin-top:14px"><button class="textbtn" id="clearBook">Clear my book</button></p>`
        : `<p class="empty-note">Use “Add to my book” on any pattern, or add a whole part from its page. Your selection stays in this browser.</p>`}
    </div></div></div>`;
}

// ---------- print ----------
function sheetFor(n, sel, pageNo, pageOf) {
  const p = by[n];
  const src = photoSrc(p.photo);
  const ref = x => {
    const inc = sel.includes(x);
    return `<li class="${inc ? '' : 'out'}"><span class="n">${x}</span>${esc(by[x].name)}${inc ? ` <span class="pg">p. ${pageOf(x)}</span>` : ''}</li>`;
  };
  const respondedBy = p.part === 1 ? pats.filter(q => q.rc.includes(n)).map(q => q.num) : [];
  const related = [...p.rp.filter(x => by[x]), ...respondedBy.filter(x => !p.rp.includes(x))];
  return `<section class="sheet part${p.part}">
    ${src ? `<div class="s-photo" style="${crop(p.crop)}"><img src="${esc(src)}" alt=""></div>` : '<div class="s-photo empty">Photo to come</div>'}
    <div class="s-text">
      <div class="label">${numWord(n)}</div>
      <h1 class="title">${esc(p.name)}</h1>
      <p class="lede">${esc([p.see, p.why].filter(Boolean).join(' '))}</p>
      <p class="therefore"><b>Therefore:</b> ${esc(p.do)}</p>
      <div class="s-links">
        ${p.rc.length ? `<section><h2>Responds to</h2><ul>${p.rc.filter(x => by[x]).map(ref).join('')}</ul></section>` : ''}
        ${related.length ? `<section><h2>Related patterns</h2><ul>${related.map(ref).join('')}</ul></section>` : ''}
      </div>
    </div>
    ${pageNo ? `<div class="folio">${pageNo}</div>` : ''}
  </section>`;
}
function buildPrint(sel, withCover, title) {
  const pageOf = n => sel.indexOf(n) + 1 + (withCover ? 1 : 0);
  const cover = withCover ? `<section class="sheet cover">
      <div class="cv-top"><div class="kicker">${esc(S.title)}</div><h1>${esc(title || S.title)}</h1>
        <div class="cv-sub">${sel.length} pattern${sel.length === 1 ? '' : 's'}</div></div>
      <ol class="cv-toc">${sel.map(n => `<li class="part${partOf(n)}"><span class="n">${n}</span><span class="t">${esc(by[n].name)}</span><span class="pg">${pageOf(n)}</span></li>`).join('')}</ol>
      <div class="cv-foot">${esc(S.title)}${S.edition ? ' · ' + esc(S.edition) : ''} · ${esc(location.href.split('#')[0])}</div>
    </section>` : '';
  $('#printRoot').innerHTML = cover + sel.map(n => sheetFor(n, sel, withCover || sel.length > 1 ? pageOf(n) : 0, pageOf)).join('');
}
function printSet() {
  if (current.view === 'book') return {sel: book.nums, cover: book.cover, title: book.title};
  if (current.view === 'pattern') return {sel: [current.n], cover: false};
  if (current.view === 'part') return {sel: pats.filter(p => p.part == current.k).map(p => p.num), cover: false};
  return {sel: book.nums.length ? book.nums : pats.map(p => p.num), cover: true, title: book.title};
}
async function printNow(set) {
  buildPrint(set.sel, set.cover, set.title);
  const imgs = $$('#printRoot img');
  await Promise.race([Promise.all(imgs.map(im => im.complete ? 0 : new Promise(r => { im.onload = im.onerror = r; }))),
                      new Promise(r => setTimeout(r, 6000))]);
  window.print();
}
window.addEventListener('beforeprint', () => { if (!$('#printRoot').innerHTML.trim()) { const s = printSet(); buildPrint(s.sel, s.cover, s.title); } });
window.addEventListener('afterprint', () => { $('#printRoot').innerHTML = ''; });

// ---------- routing ----------
let current = {view: 'home'};
function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, query] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  const q = new URLSearchParams(query || '');
  if (parts[0] === 'pattern' && by[+parts[1]]) return {view: 'pattern', n: +parts[1]};
  if (parts[0] === 'part' && (parts[1] === '1' || parts[1] === '2')) return {view: 'part', k: parts[1]};
  if (parts[0] === 'book') return {view: 'book', q};
  return {view: 'home'};
}
function render() {
  const r = parseRoute(); current = r;
  if (r.view === 'book' && r.q && r.q.get('p')) {
    shared = {nums: r.q.get('p').split(/[.,]/).map(Number).filter(n => by[n]).sort((a, b) => a - b), title: r.q.get('t') || ''};
    if (!book.nums.length) { book.nums = shared.nums; if (shared.title) book.title = shared.title; saveBook(); shared = null; toast('Loaded the shared book'); }
    history.replaceState(null, '', '#/book');
  }
  const html = r.view === 'pattern' ? viewPattern(r.n) : r.view === 'part' ? viewPart(r.k) : r.view === 'book' ? viewBook() : viewHome();
  $('#main').innerHTML = html;
  document.title = r.view === 'pattern' ? `${by[r.n].num}. ${by[r.n].name} · ${S.title}`
    : r.view === 'part' ? `${partName(r.k)} · ${S.title}` : r.view === 'book' ? `My book · ${S.title}` : S.title;
  markNav(r); updateCounts(); bind();
  document.body.classList.remove('nav-open'); $('#menuBtn').setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
}
let firstRender = true;
function onRoute() { render(); if (!firstRender) $('#main').focus({preventScroll: true}); firstRender = false; }

function bind() {
  $$('[data-pick]').forEach(b => b.onclick = () => {
    const n = +b.dataset.pick, on = toggle(n);
    if (b.classList.contains('pick')) { b.setAttribute('aria-pressed', on); b.innerHTML = pickLabel(on);
      const h = $('.actions .hint'); if (h) h.innerHTML = book.nums.length ? `${book.nums.length} in <a href="#/book">my book</a>` : 'Collect patterns, then print your own book.'; }
    else { b.setAttribute('aria-pressed', on); b.textContent = on ? '✓' : '+'; }
    toast(on ? `Added ${by[n].name}` : `Removed ${by[n].name}`);
    if (current.view === 'part') { const k = current.k, list = pats.filter(p => p.part == k); const all = $(`[data-pickall="${k}"]`);
      if (all) all.textContent = list.every(p => inBook(p.num)) ? 'Remove all from my book' : `Add all ${list.length} to my book`; }
  });
  $$('[data-pickall]').forEach(b => b.onclick = () => {
    const list = pats.filter(p => p.part == b.dataset.pickall).map(p => p.num);
    const allIn = list.every(inBook);
    book.nums = allIn ? book.nums.filter(n => !list.includes(n)) : [...new Set([...book.nums, ...list])].sort((a, b) => a - b);
    saveBook(); render(); toast(allIn ? 'Removed from my book' : `Added ${list.length} patterns`);
  });
  $$('[data-remove]').forEach(b => b.onclick = () => { toggle(+b.dataset.remove); render(); });
  const t = $('#bookTitle'); if (t) t.oninput = () => { book.title = t.value; store.set(BOOK_KEY, book); };
  const c = $('#bookCover'); if (c) c.onchange = () => { book.cover = c.checked; saveBook(); render(); };
  const pb = $('#printBook'); if (pb) pb.onclick = () => printNow({sel: book.nums, cover: book.cover, title: book.title});
  const sh = $('#shareBook'); if (sh) sh.onclick = async () => {
    const url = `${location.href.split('#')[0]}#/book?p=${book.nums.join('.')}${book.title ? '&t=' + encodeURIComponent(book.title) : ''}`;
    try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { prompt('Copy this link:', url); }
  };
  const cl = $('#clearBook'); if (cl) cl.onclick = () => { if (confirm('Remove all patterns from your book?')) { book.nums = []; saveBook(); render(); } };
  const us = $('#useShared'); if (us) us.onclick = () => { book.nums = shared.nums; if (shared.title) book.title = shared.title; shared = null; saveBook(); render(); };
  const km = $('#keepMine'); if (km) km.onclick = () => { shared = null; render(); };
}

// ---------- mobile menu ----------
$('#menuBtn').onclick = () => { const open = !document.body.classList.contains('nav-open');
  document.body.classList.toggle('nav-open', open); $('#menuBtn').setAttribute('aria-expanded', open); };
$('#scrim').onclick = () => { document.body.classList.remove('nav-open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#scrim').click(); });

buildNav();
window.addEventListener('hashchange', onRoute);
onRoute();
})();
