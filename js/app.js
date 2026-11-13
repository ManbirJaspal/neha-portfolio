import { createField } from './field.js';
import { src, hydrate } from './media.js';
import { Chat, FLOW } from './chat.js';
import { CASES } from './cases.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const MAIL = 'nehajaspal.nj@gmail.com';
const S = { view: 'home', intro: reduce ? 1 : 0, themeAlpha: 1, theme: 'ink', homeY: 0, contactTop: 1e9 };

hydrate();

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && Lenis) {
  lenis = new Lenis({ lerp: .11 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
}
const scrollToY = (y, immediate) => lenis ? lenis.scrollTo(y, { immediate, force: true }) : window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
window.__scrollTo = (el, offset = 0) => { const y = el.getBoundingClientRect().top + scrollY + offset; scrollToY(Math.max(0, y)); };

/* ---------- particle field + themes ---------- */
const field = createField($('#field'));
const THEME = { ink: [1, '#8E88C8', '#C4BEFF'], fog: [0, '#8E88C8', '#C4BEFF'], iris: [1, '#CFCBFF', '#FFFFFF'], paper: [0, '#8E88C8', '#C4BEFF'] };
function setTheme(t) {
  if (S.theme === t) return; S.theme = t; document.body.dataset.theme = t;
  const [a, ca, cb] = THEME[t]; if (field && a) field.colors(ca, cb);
  gsap.to(S, { themeAlpha: a, duration: a ? 1 : .45, ease: 'power2.out', overwrite: true });
}
gsap.ticker.add(() => {
  if (!field) return;
  if (S.view !== 'home') { field.state.alpha = 0; return; }
  const vh = innerHeight, heroP = clamp(scrollY / (vh * .75)), conP = clamp((scrollY + vh - S.contactTop) / (vh * .85));
  field.state.order = S.intro * (1 - heroP);
  field.state.order2 = conP;
  field.state.alpha = S.themeAlpha * (S.theme === 'ink' ? (innerWidth < 900 ? .5 : 1) * (1 - .55 * heroP) : 1);
});

/* ---------- hero headline: letters resolve from random weight and width ---------- */
const title = $('#heroTitle'); let chars = [];
$$('.ln', title).forEach(ln => {
  ln.innerHTML = ln.textContent.split(' ').map(w => `<span style="white-space:nowrap">${[...w].map(c => `<span class="ch" aria-hidden="true">${c}</span>`).join('')}</span>`).join(' ');
});
chars = $$('.ch', title);
function intro() {
  document.body.classList.remove('is-loading');
  if (reduce) return;
  chars.forEach(ch => gsap.fromTo(ch,
    { fontVariationSettings: `"wght" ${100 + Math.random() * 900 | 0}, "wdth" ${25 + Math.random() * 126 | 0}`, opacity: 0, filter: 'blur(7px)' },
    { fontVariationSettings: '"wght" 540, "wdth" 112', opacity: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out', delay: Math.random() * .7, clearProps: 'fontVariationSettings,filter' }));
  gsap.to(S, { intro: 1, duration: 2.8, ease: 'power2.inOut', delay: .15 });
}
Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 1800))]).then(() => requestAnimationFrame(intro));

/* ---------- work ---------- */
const FIGMA = 'https://www.figma.com/deck/q8uskOONzY0S48Ql02btCZ/Untitled?node-id=1-91&t=GSlvS4ApJKq6mCHk-1';
const PROJECTS = [
  { k: 'returns', co: 'eBay', title: 'AI returns', goal: 'Create an intelligent, streamlined returns experience that improves buyer and seller CSAT, simplifies return filing, and reduces SNAD claims and return fraud.', stats: [['130M+', 'buyers'], ['25M+', 'sellers'], ['$280M+', 'projected GMV']], tint: '#1A1546', glow: '#6B5BFF', cta: ['Read the case study', 'case:returns'] },
  { k: 'dashboard', co: 'Shoppers Drug Mart', title: 'Dashboard redesign', goal: 'Enhance usability, incorporate status tracking, and ensure seamless navigation, ultimately aiming to improve user satisfaction and overall ease of use.', stats: [['80%', 'OSAT score'], ['8/10', 'ease of use'], ['2.5M+', 'dashboard users']], img: 'QbFvKr3YCRXhAShcvKn38Nm6Ew.png', alt: 'Redesigned prescriptions dashboard on laptop and phone', tint: '#10291F', glow: '#3FAE7C', cta: ['Read the case study', 'case:dashboard'] },
  { k: 'seat', co: 'WestJet', title: 'Seat upgrade experience', goal: 'Optimized the check-in experience by enhancing seat change options and allowing users to upgrade their seats, resulting in increased ancillary revenue.', stats: [['75%', 'user engagement rate'], ['11.5%', 'increase in seat upgrades']], img: 'PBRSkRgwIXptv77c9TX0piZvEh8.png', alt: 'Two phones showing WestJet seat selection and upgrade screens', tint: '#2A1C12', glow: '#C98A4B', cta: ['Ask for the walkthrough', `mailto:${MAIL}?subject=WestJet%20seat%20upgrade%20case%20study`], ghost: true },
  { k: 'flight', co: 'WestJet', title: 'Flight status optimization', goal: 'Enhance user confidence by prioritizing flight status visibility on the mobile app.', stats: [['80%', 'improvement in access to flight status'], ['40%', 'more engagement with the flight status widget']], img: 'X0cmyqyURFjFL9P2Jk6PL3EXo.png', alt: 'WestJet app home with flight status and a flight information sheet', tint: '#0D2A33', glow: '#3FB6C8', cta: ['Open the Figma deck', FIGMA], ghost: true },
  { k: 'ads', co: 'Shoppers Drug Mart', title: 'Ad formats and promos on digital health', goal: 'Ads and promos integration on a digital health dashboard to cross-promote health, fitness, and wellness products, enhancing user engagement while providing relevant product recommendations for a holistic health experience.', stats: [['50%', 'increase in user engagement'], ['85%', 'said the ads were non-intrusive']], img: 'sbtmgBFQ1akFfxApXIFlcnGv8.png', alt: 'Promo cards for health and wellness products', tint: '#2B1426', glow: '#E0629A', cta: ['Read the case study', 'case:ads'] },
];
const list = $('#workList');
list.innerHTML = PROJECTS.map((p, i) => {
  const ext = /^https?:/.test(p.cta[1]);
  return `<article class="proj" id="work-${p.k}" data-k="${p.k}" style="--i:${i};--tint:${p.tint};--glow:${p.glow}">
    <div class="proj-copy"><p class="proj-co">${p.co}</p><h3>${p.title}</h3><p class="proj-goal">${p.goal}</p>
      <div class="proj-stats">${p.stats.map(s => `<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
      <a class="proj-cta${p.ghost ? ' ghost' : ''}" href="${p.cta[1].startsWith('case:') ? '#' + p.cta[1].slice(5) : p.cta[1]}"${ext ? ' target="_blank" rel="noopener"' : ''}>${p.cta[0]}</a></div>
    <div class="proj-visual">${p.img ? `<div class="shot"><img src="${src(p.img, 2048)}" alt="${p.alt}" loading="lazy"></div>` : '<div id="cardPhone"></div>'}</div>
  </article>`;
}).join('');

// live chat on the eBay card: plays through the flow while on screen
const cardChat = new Chat($('#cardPhone'), { onPick: () => { location.hash = 'returns'; } });
cardChat.setStep(reduce ? 2 : 0, true);
if (!reduce) {
  let timer = 0;
  new IntersectionObserver(([e]) => {
    clearInterval(timer);
    if (e.isIntersecting && S.view === 'home') timer = setInterval(() => { const n = cardChat.step + 1; n >= FLOW.length ? (cardChat.step = -1, cardChat.setStep(0, true)) : cardChat.setStep(n); }, 2500);
  }, { threshold: .4 }).observe($('#cardPhone'));
}
// screenshots lean toward the pointer
$$('.proj-visual').forEach(v => {
  const shot = $('.shot', v); if (!shot || reduce) return;
  v.addEventListener('pointermove', e => { const r = v.getBoundingClientRect(); shot.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 9 + 'deg'); shot.style.setProperty('--rx', -((e.clientY - r.top) / r.height - .5) * 7 + 'deg'); });
  v.addEventListener('pointerleave', () => { shot.style.setProperty('--ry', '0deg'); shot.style.setProperty('--rx', '0deg'); });
});
// stacked cards settle back as the next one covers them
const mm = gsap.matchMedia();
mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
  const cards = $$('.proj');
  cards.forEach((c, i) => { if (cards[i + 1]) gsap.fromTo(c, { scale: 1, filter: 'brightness(1)' }, { scale: .94, filter: 'brightness(.5)', ease: 'none', scrollTrigger: { trigger: cards[i + 1], start: 'top 72%', end: 'top 12%', scrub: true } }); });
});

const CL = ['eBay', 'PC Health', 'Shoppers Drug Mart', 'WestJet', 'VOSS', 'Cathay Pacific'];
$('#clients').innerHTML = [...CL, ...CL, ...CL, ...CL].map(c => `<span>${c}</span>`).join('');

/* ---------- skills graph ---------- */
const GROUPS = [
  ['AI', ['Agentic commerce', 'Gen AI', 'Prompt engineering', 'Systems thinking'], 215],
  ['Product', ['Product Design', 'Product Thinking', 'Consulting', 'Mentoring'], 325, 298],
  ['Craft', ['UX Design', 'UI Design', 'Visual Design', 'Interaction Design', 'Email Design', 'Ads Design', 'Marketing Design'], 38, 62],
  ['Research', ['Design Sprint', 'User Testing', 'UX Research'], 145],
];
$('#skillsList').innerHTML = GROUPS.flatMap(g => g[1]).map(s => `<li>${s}</li>`).join('');
(function graph() {
  const box = $('#graph'), svg = $('#graphLines'), nodes = [], edges = [];
  const add = (label, cls, extra = {}) => { const el = document.createElement('div'); el.className = 'node ' + cls; el.innerHTML = label; box.appendChild(el); const n = { el, x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, ...extra }; nodes.push(n); return n; };
  const me = add(`<img src="${src('QY1eoIt5hblXrP4kznTFHjNBjwg.png', 512)}" alt="">`, 'me');
  GROUPS.forEach(([name, skills, ang, fan], g) => {
    const hub = add(name, 'hub', { ang, g, fan }); hub.el.dataset.g = g; edges.push([me, hub, 1]);
    skills.forEach((s, j) => { const n = add(s, '', { hub, j, n: skills.length }); edges.push([hub, n, 0]); });
  });
  const lines = edges.map(([, , h]) => { const l = document.createElementNS('http://www.w3.org/2000/svg', 'line'); if (h) l.setAttribute('class', 'hub'); svg.appendChild(l); return l; });
  let W = 0, H = 0, placed = false;
  function layout() {
    const r = box.getBoundingClientRect(); W = r.width; H = r.height; const narrow = W < 700;
    nodes.forEach(n => { n.hw = n.el.offsetWidth / 2 + 4; });
    const cx = W / 2, cy = H / 2, rad = a => a * Math.PI / 180;
    me.ax = cx; me.ay = cy;
    nodes.forEach(n => {
      if (n.ang !== undefined) { const a = narrow ? [238, 302, 58, 122][n.g] : n.ang; n.a = a; n.ax = cx + Math.cos(rad(a)) * W * (narrow ? .23 : .2); n.ay = cy + Math.sin(rad(a)) * H * (narrow ? .25 : .2); }
    });
    nodes.forEach(n => {
      if (!n.hub) return; const spread = Math.min(narrow ? 44 : 40, (narrow ? 170 : 190) / n.n), a = (narrow || n.hub.fan === undefined ? n.hub.a : n.hub.fan) + (n.j - (n.n - 1) / 2) * spread, far = n.j % 2 ? 1.5 : 1;
      n.ax = n.hub.ax + Math.cos(rad(a)) * W * (narrow ? .2 : .155) * far; n.ay = n.hub.ay + Math.sin(rad(a)) * H * (narrow ? .13 : .2) * far;
    });
    if (!placed) { nodes.forEach(n => { n.x = cx + (Math.random() - .5) * 60; n.y = cy + (Math.random() - .5) * 60; }); placed = true; }
  }
  let drag = null, running = false;
  function step() {
    for (const n of nodes) { if (n === drag) continue; n.vx += (n.ax - n.x) * .012; n.vy += (n.ay - n.y) * .012; }
    for (const [a, b] of edges) { const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, rest = Math.hypot(b.ax - a.ax, b.ay - a.ay), f = (d - rest) * .02; const fx = dx / d * f, fy = dy / d * f; if (a !== drag) { a.vx += fx; a.vy += fy; } if (b !== drag) { b.vx -= fx; b.vy -= fy; } }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j]; let dx = (b.x - a.x) * .55, dy = b.y - a.y; const d = Math.hypot(dx, dy) || 1, min = 62; if (d > min) continue;
      const f = (min - d) * .04; dx = dx / d * f; dy = dy / d * f; if (a !== drag) { a.vx -= dx; a.vy -= dy; } if (b !== drag) { b.vx += dx; b.vy += dy; }
    }
    for (const n of nodes) { if (n === drag) continue; n.vx *= .86; n.vy *= .86; n.x = clamp(n.x + n.vx, n.hw, W - n.hw); n.y = clamp(n.y + n.vy, 26, H - 26); }
  }
  function draw() {
    for (const n of nodes) n.el.style.transform = `translate(${n.x}px,${n.y}px) translate(-50%,-50%)`;
    edges.forEach(([a, b], i) => { const l = lines[i]; l.setAttribute('x1', a.x); l.setAttribute('y1', a.y); l.setAttribute('x2', b.x); l.setAttribute('y2', b.y); });
  }
  function loop() { if (!running) return; step(); draw(); requestAnimationFrame(loop); }
  layout(); if (reduce) { nodes.forEach(n => { n.x = n.ax; n.y = n.ay; }); for (let i = 0; i < 200; i++) step(); } draw();
  addEventListener('resize', () => { layout(); draw(); });
  new IntersectionObserver(([e]) => { const on = e.isIntersecting; if (on && !running) { running = true; layout(); loop(); } else if (!on) running = false; }, { threshold: .05 }).observe(box);
  box.addEventListener('pointerdown', e => { const el = e.target.closest('.node'); if (!el) return; drag = nodes.find(n => n.el === el); box.setPointerCapture(e.pointerId); e.preventDefault(); });
  box.addEventListener('pointermove', e => { if (!drag) return; const r = box.getBoundingClientRect(); drag.x = clamp(e.clientX - r.left, 30, W - 30); drag.y = clamp(e.clientY - r.top, 20, H - 20); drag.vx = drag.vy = 0; });
  const up = () => { drag = null; }; box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
})();

/* ---------- trips ---------- */
(function trips() {
  const svg = $('#tripMap'), home = [44, 128], stops = [['LIS', 'Lisbon', 300, 172], ['VIE', 'Vienna', 404, 66], ['BUD', 'Budapest', 478, 112]];
  let h = ''; for (let x = 20; x < 520; x += 50) h += `<line class="grid" x1="${x}" y1="10" x2="${x}" y2="210"/>`; for (let y = 30; y < 220; y += 50) h += `<line class="grid" x1="0" y1="${y}" x2="520" y2="${y}"/>`;
  stops.forEach(([code, , x, y], i) => { const mx = (home[0] + x) / 2, my = Math.min(home[1], y) - 70 - i * 6; h += `<path class="route" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" d="M${home[0]} ${home[1]} Q${mx} ${my} ${x} ${y}"/><circle class="dot" cx="${x}" cy="${y}" r="4"/><text x="${x + 9}" y="${y + 4}">${code}</text>`; });
  h += `<circle class="home" cx="${home[0]}" cy="${home[1]}" r="5.5"/><text x="${home[0] - 12}" y="${home[1] + 22}">YYZ</text>`;
  svg.innerHTML = h;
  const routes = $$('.route', svg);
  if (reduce) routes.forEach(r => r.setAttribute('stroke-dashoffset', 0));
  else gsap.to(routes, { attr: { 'stroke-dashoffset': 0 }, duration: 1.6, ease: 'power2.inOut', stagger: .25, scrollTrigger: { trigger: svg, start: 'top 80%' } });
})();

/* ---------- section themes ---------- */
$$('#home section[data-theme]').forEach(sec => ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: s => { if (s.isActive && S.view === 'home') setTheme(sec.dataset.theme); } }));
const measure = () => { S.contactTop = $('#contact').offsetTop; };
ScrollTrigger.addEventListener('refresh', measure); measure();
addEventListener('load', () => ScrollTrigger.refresh());

/* ---------- case studies ---------- */
const home = $('#home'), caseEl = $('#case'), curtain = $('#curtain');
let cleanup = null, busy = false;
function wipe(label, mid) {
  busy = true; $('#curtainLabel').textContent = label;
  const done = () => { busy = false; };
  if (reduce) { mid(); done(); return; }
  gsap.timeline({ onComplete: done }).set(curtain, { yPercent: 101 }).to(curtain, { yPercent: 0, duration: .55, ease: 'power3.inOut' }).add(mid).to(curtain, { yPercent: -101, duration: .6, ease: 'power3.inOut', delay: .15 }).set(curtain, { yPercent: 101 });
}
function mountCase(key) {
  const c = CASES[key], nx = CASES[c.next];
  if (cleanup) cleanup();
  caseEl.innerHTML = `<div class="case-bar"><button type="button" data-back>Back to work</button><span>${c.short}</span><a href="#contact" data-leave="contact">Get in touch</a><i id="caseProg"></i></div>${c.html()}
    <div class="cs-next"><div><div><small>Next case study</small><button type="button" data-case="${nx.key}">${nx.short}</button></div><a href="#work" data-leave="work">All work</a></div></div>`;
  home.hidden = true; caseEl.hidden = false; document.body.dataset.view = 'case'; S.view = 'case'; setTheme('paper'); $('#nav').hidden = true;
  scrollToY(0, true);
  cleanup = c.init(caseEl, { gsap, ScrollTrigger, reduce });
  $$('img', caseEl).forEach(im => im.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));
  requestAnimationFrame(() => ScrollTrigger.refresh());
  document.title = `${c.short} | Neha Jaspal`;
}
const themeAt = () => { const y = innerHeight * .55; const sec = $$('#home section[data-theme]').find(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }); return sec ? sec.dataset.theme : 'ink'; };
function unmountCase(target) {
  if (cleanup) cleanup(); cleanup = null; caseEl.hidden = true; caseEl.innerHTML = ''; home.hidden = false; delete document.body.dataset.view; S.view = 'home'; $('#nav').hidden = false;
  document.title = 'Neha Jaspal, AI product designer';
  ScrollTrigger.refresh();
  const el = target && document.getElementById(target);
  scrollToY(el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 80) : S.homeY, true);
  requestAnimationFrame(() => { ScrollTrigger.update(); setTheme(themeAt()); });
}
function route() {
  const key = location.hash.slice(1);
  if (CASES[key]) { if (S.view === 'home') S.homeY = scrollY; wipe(CASES[key].short, () => mountCase(key)); }
  else if (S.view === 'case') wipe('Neha Jaspal', () => unmountCase());
}
addEventListener('hashchange', route);
if (CASES[location.hash.slice(1)]) mountCase(location.hash.slice(1));
function goSection(id) {
  if (S.view === 'case') { try { history.pushState('', '', location.pathname + location.search); } catch (e) {} wipe('Neha Jaspal', () => unmountCase(id)); }
  else { const el = document.getElementById(id); if (el) id === 'top' ? scrollToY(0) : window.__scrollTo(el, id === 'contact' ? 0 : -70); }
}
document.addEventListener('click', e => {
  if (busy) { if (e.target.closest('a,button')) e.preventDefault(); return; }
  const nav = e.target.closest('[data-nav]'); if (nav) { e.preventDefault(); goSection(nav.dataset.nav); return; }
  const leave = e.target.closest('[data-leave]'); if (leave) { e.preventDefault(); goSection(leave.dataset.leave); return; }
  if (e.target.closest('[data-back]')) { goSection('work-' + location.hash.slice(1)); return; }
  const nc = e.target.closest('[data-case]'); if (nc) { location.hash = nc.dataset.case; return; }
  const z = e.target.closest('[data-zoom]'); if (z) openZoom(z.dataset.zoom, $('img', z)?.alt || '');
});
gsap.ticker.add(() => { if (S.view !== 'case') return; const p = $('#caseProg'); if (p) p.style.transform = `scaleX(${clamp(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight))})`; });

/* ---------- lightbox ---------- */
const lb = $('#lightbox');
function openZoom(url, alt) { const im = $('img', lb); im.src = url; im.alt = alt; lb.hidden = false; lenis && lenis.stop(); }
function closeZoom() { lb.hidden = true; lenis && lenis.start(); }
lb.addEventListener('click', closeZoom);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!lb.hidden) closeZoom(); else if (!ask.hidden) toggleAsk(false); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('figure[data-zoom]')) { e.preventDefault(); openZoom(e.target.dataset.zoom, ''); }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); toggleAsk(); }
});

/* ---------- ask the portfolio: chips first, free text second, a decision tree underneath ---------- */
const ask = $('#ask'), log = $('#askLog');
const START = ['AI and agentic work', 'Results and numbers', 'How she works', 'Who is Neha?', 'Get in touch'];
const INTENTS = [
  [/\bads?\b|promo|advert|ctr/i, 'For <b>Shoppers Drug Mart</b> she was the sole designer bringing ads and promos into the digital health dashboard. Four formats went to pilot; 85% of users said the ads were non-intrusive and engagement rose 50%.', [['Open the case study', 'case:ads', 1]]],
  [/ebay|\bai\b|agent|return|snad|fraud|chat|conversational|llm|gen ai/i, 'Her most recent work is <b>AI powered returns at eBay</b>: a conversational agent that understands buyer intent, validates photo evidence with computer vision, and explains its verdict. It serves 130M+ buyers and is projected to drive $280M+ in GMV.', [['Open the case study', 'case:returns', 1]]],
  [/shopper|dashboard|refill|prescription|pharma|health/i, 'At <b>Shoppers Drug Mart</b> she led the redesign of the prescriptions dashboard for 2.5M+ users (80% OSAT, 100% task success), then designed ad formats and promos for the same dashboard.', [['Dashboard redesign', 'case:dashboard', 1], ['Ads and promos', 'case:ads']]],
  [/westjet|flight|seat|travel|airline|aviation/i, 'Two <b>WestJet</b> projects: seat upgrades at check-in (75% engagement, 11.5% more upgrades) and flight status on the mobile app (80% better access, 40% more widget engagement).', [['Show both', 'go:work-seat', 1]]],
  [/number|metric|impact|result|outcome|kpi/i, 'A few she can point to: <b>100%</b> task completion in the eBay A/B test, <b>80%</b> OSAT on the Shoppers dashboard, <b>11.5%</b> more seat upgrades at WestJet, and <b>50%</b> more engagement after ads on digital health.', [['See the work', 'go:work', 1]]],
  [/process|principle|approach|how (does )?she|method|think/i, 'Three principles from the eBay returns work sum it up: <b>understand before asking</b>, <b>guide, never gate</b>, and <b>match effort to risk</b>.', [['See them in context', 'case:returns', 1], ['Skills map', 'go:skills']]],
  [/skill|tool|strength/i, 'Eighteen skills in four groups: AI, product, craft and research. The map is draggable.', [['Open the skills map', 'go:skills', 1]]],
  [/contact|e-?mail|hire|linkedin|reach|talk|coffee|touch|project/i, `She’s up for a project or a coffee chat: <b>${MAIL}</b>.`, [['Go to contact', 'go:contact', 1], ['LinkedIn', 'https://www.linkedin.com/in/nehajaspal/']]],
  [/who|about|neha|background|toronto|hobb|outside|person/i, 'Neha is an AI product designer with 10+ years across e-commerce, travel and healthtech. Born and raised in the Middle East, now in Toronto, currently at eBay. Off the clock: travel, cafés, pickleball, painting and F1.', [['Read more', 'go:about', 1]]],
];
const say = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
const opts = list => `<div class="opts">${list.map(([t, to, go]) => /^https?:/.test(to) ? `<a href="${to}" target="_blank" rel="noopener">${t}</a>` : `<button type="button" data-to="${to}"${go ? ' class="go"' : ''}>${t}</button>`).join('')}</div>`;
const chips = () => say('opts', START.map(c => `<button type="button" data-q="${c}">${c}</button>`).join(''));
function answer(q) {
  say('u', q.replace(/</g, '&lt;'));
  const hit = INTENTS.find(i => i[0].test(q));
  setTimeout(() => { if (hit) { say('a', hit[1]); say('a', opts(hit[2])); } else { say('a', 'I only know what’s in this portfolio. One of these should get you closer:'); chips(); } }, reduce ? 0 : 380);
}
function toggleAsk(on = ask.hidden) {
  ask.hidden = !on;
  if (on) { if (!log.children.length) { say('a', 'Hi, I’m a guide to Neha’s portfolio. What are you here for?'); chips(); } if (matchMedia('(pointer:fine)').matches) $('#askInput').focus(); }
}
$('#askOpen').addEventListener('click', () => toggleAsk());
$('#askClose').addEventListener('click', () => toggleAsk(false));
$('#askForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#askInput'), q = i.value.trim(); if (q) { answer(q); i.value = ''; } });
log.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
  if (b.dataset.q) return answer(b.dataset.q);
  const to = b.dataset.to; toggleAsk(false);
  if (to.startsWith('case:')) location.hash = to.slice(5); else goSection(to.slice(3));
});

/* ---------- contact ---------- */
$('#copyMail').addEventListener('click', async () => {
  const lab = $('#copyMail .mail-do');
  try { await navigator.clipboard.writeText(MAIL); lab.textContent = 'Copied'; } catch (e) { lab.textContent = 'Select to copy'; }
  setTimeout(() => { lab.textContent = 'Copy address'; }, 2200);
});
