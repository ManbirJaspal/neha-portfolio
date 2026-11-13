import * as THREE from 'three';
import { createStage } from './gl/stage.js';
import { GlassForm } from './gl/glass.js';
import { GLText, GLImage } from './gl/doc.js';
import { Work, PHONE, PROJECT_TONES } from './gl/work.js';
import { Rings } from './gl/rings.js';
import { hydrate, src } from './media.js';
import { FLOW } from './chat.js';
import { CASES } from './cases.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const MAIL = 'nehajaspal.nj@gmail.com';
const S = { view: 'home', intro: 0, homeY: 0, active: -1, agit: 0 };

hydrate();

/* ---------- content ---------- */
const FIGMA = 'https://www.figma.com/deck/q8uskOONzY0S48Ql02btCZ/Untitled?node-id=1-91&t=GSlvS4ApJKq6mCHk-1';
const PROJECTS = [
  { k: 'returns', co: 'eBay', title: 'AI returns', goal: 'Create an intelligent, streamlined returns experience that improves buyer and seller CSAT, simplifies return filing, and reduces SNAD claims and return fraud.', stats: [['130M+', 'buyers'], ['25M+', 'sellers'], ['$280M+', 'projected GMV']], cta: ['Read the case study', '#returns'] },
  { k: 'dashboard', co: 'Shoppers Drug Mart', title: 'Dashboard redesign', goal: 'Enhance usability, incorporate status tracking, and ensure seamless navigation, ultimately aiming to improve user satisfaction and overall ease of use.', stats: [['80%', 'OSAT score'], ['8/10', 'ease of use'], ['2.5M+', 'dashboard users']], img: 'QbFvKr3YCRXhAShcvKn38Nm6Ew.png', cta: ['Read the case study', '#dashboard'] },
  { k: 'seat', co: 'WestJet', title: 'Seat upgrade experience', goal: 'Optimized the check-in experience by enhancing seat change options and allowing users to upgrade their seats, resulting in increased ancillary revenue.', stats: [['75%', 'user engagement rate'], ['11.5%', 'increase in seat upgrades']], img: 'PBRSkRgwIXptv77c9TX0piZvEh8.png', cta: ['Ask for the walkthrough', `mailto:${MAIL}?subject=WestJet%20seat%20upgrade%20case%20study`], ghost: true },
  { k: 'flight', co: 'WestJet', title: 'Flight status optimization', goal: 'Enhance user confidence by prioritizing flight status visibility on the mobile app.', stats: [['80%', 'improvement in access to flight status'], ['40%', 'more engagement with the flight status widget']], img: 'X0cmyqyURFjFL9P2Jk6PL3EXo.png', cta: ['Open the Figma deck', FIGMA], ghost: true },
  { k: 'ads', co: 'Shoppers Drug Mart', title: 'Ad formats and promos on digital health', goal: 'Ads and promos integration on a digital health dashboard to cross-promote health, fitness, and wellness products, enhancing user engagement while providing relevant product recommendations for a holistic health experience.', stats: [['50%', 'increase in user engagement'], ['85%', 'said the ads were non-intrusive']], img: 'sbtmgBFQ1akFfxApXIFlcnGv8.png', cta: ['Read the case study', '#ads'] },
];
$('#workInfo').innerHTML = PROJECTS.map((p, i) => `<article class="wi" data-i="${i}" style="--tone:${PROJECT_TONES[i]}"><p class="wi-co">${p.co}</p><h3>${p.title}</h3><p class="wi-goal">${p.goal}</p>
  <div class="wi-stats">${p.stats.map(s => `<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>
  <a class="wi-cta${p.ghost ? ' ghost' : ''}" href="${p.cta[1]}"${/^https?:/.test(p.cta[1]) ? ' target="_blank" rel="noopener"' : ''}>${p.cta[0]}</a></article>`).join('');
$('#workDots').innerHTML = PROJECTS.map(() => '<li></li>').join('');
function setActive(i) {
  if (i === S.active) return; S.active = i;
  $$('.wi').forEach((e, j) => e.classList.toggle('on', j === i)); $$('#workDots li').forEach((e, j) => e.classList.toggle('on', j === i));
  $('#workN').textContent = '0' + (i + 1);
  if (!document.body.classList.contains('gl-on') && PROJECTS[i].img) $('#workStage').style.background = `url(${src(PROJECTS[i].img, 1024)}) center/contain no-repeat`;
}
setActive(0);
function openProject(i) { const [, to] = PROJECTS[i].cta; if (to[0] === '#') location.hash = to.slice(1); else if (/^https?:/.test(to)) window.open(to, '_blank', 'noopener'); else location.href = to; }
$('#workStage').addEventListener('click', () => openProject(S.active));

const GROUPS = [
  ['AI', ['Agentic commerce', 'Gen AI', 'Prompt engineering', 'Systems thinking']],
  ['Product', ['Product Design', 'Product Thinking', 'Consulting', 'Mentoring']],
  ['Craft', ['UX Design', 'UI Design', 'Visual Design', 'Interaction Design', 'Email Design', 'Ads Design', 'Marketing Design']],
  ['Research', ['Design Sprint', 'User Testing', 'UX Research']],
];
$('#skillsCols').innerHTML = GROUPS.map(([g, list]) => `<div><h4>${g}</h4><ul>${list.map(s => `<li>${s}</li>`).join('')}</ul></div>`).join('');
const ALL = GROUPS.flatMap(g => g[1]), RING_WORDS = [ALL.filter((_, i) => i % 3 === 0), ALL.filter((_, i) => i % 3 === 1), ALL.filter((_, i) => i % 3 === 2)];

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduce && Lenis) { lenis = new Lenis({ lerp: .1 }); lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); lenis.stop(); }
const scrollToY = (y, immediate) => lenis ? lenis.scrollTo(y, { immediate, force: true }) : window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
window.__scrollTo = (el, offset = 0) => scrollToY(Math.max(0, el.getBoundingClientRect().top + scrollY + offset));

/* ---------- the WebGL world ---------- */
const loadState = { assets: 0, fonts: 0, shown: 0 };
const stage = createStage($('#gl'), { onProgress: v => { loadState.assets = v; } });
let texts = [], imgs = [], formA, formB, work, rings, T = {};
if (stage) {
  window.__stage = stage;
  document.body.classList.add('gl-on');
  formA = new GlassForm(stage); formB = new GlassForm(stage); formB.mesh.visible = false;
  work = new Work(stage, PROJECTS.slice(1).map(p => p.img));
  imgs = $$('.glimg').map(el => new GLImage(stage, el, { radius: 24 }));
  const A0 = new THREE.Vector3(), A1 = new THREE.Vector3(), C = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3();
  const qBlob = new THREE.Quaternion(), eul = new THREE.Euler(), toneA = new THREE.Color(), toneB = new THREE.Color(), IRIS = new THREE.Color('#5B4BFF'), BLUE = new THREE.Color('#1F4BFF');
  const el = { st: $('#statement'), work: $('#work'), stageBox: $('#workStage'), skills: $('#skills'), contact: $('#contact'), aHero: $('#aHero'), aSt: $('#aStatement'), aSk: $('#aSkills'), aCo: $('#aContact') };
  let chatT = 0, lastB = '';

  document.fonts.ready.then(() => Promise.all([document.fonts.load('500 semi-expanded 100px "Roboto Flex"'), document.fonts.load('italic 400 100px "Instrument Serif"'), document.fonts.load('400 20px "Hanken Grotesk"')]).catch(() => {})).then(() => {
    T.hero = new GLText(stage, $('#heroTitle')); T.st = new GLText(stage, $('#statementText'), { lines: 5 });
    T.skills = new GLText(stage, $('#skillsTitle'), { z: -3.2 }); T.contact = new GLText(stage, $('#contactTitle'));
    texts = Object.values(T); rasterAll(); rings = new Rings(stage, RING_WORDS); work.chat.step = -1; work.chat.set(0); loadState.fonts = 1;
  });
  const rasterAll = () => { texts.forEach(t => t.raster()); if (T.st) { const tops = new Set(T.st.words.map(w => Math.round(w.getBoundingClientRect().top))); T.st.u.uLines.value = Math.max(1, tops.size); } };
  let rz = 0; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(rasterAll, 180); });

  // drag the rings
  let drag = null;
  el.skills.addEventListener('pointerdown', e => { drag = e.clientX; });
  addEventListener('pointermove', e => { if (drag === null || !rings) return; rings.vel += (e.clientX - drag) * .00045; drag = e.clientX; }, { passive: true });
  addEventListener('pointerup', () => { drag = null; }); addEventListener('pointercancel', () => { drag = null; });
  let lpx = 0, lpy = 0;

  stage.onFrame((time, dt) => {
    if (S.view !== 'home') return;
    const vh = stage.size.h, unit = stage.size.unit, narrow = stage.size.w < 900, ptr = stage.pointer;
    const velN = lenis ? clamp(lenis.velocity / 55, -1, 1) : 0;
    texts.forEach(t => t.update()); imgs.forEach(g => g.update(time, velN * .5));
    S.agit += (Math.min(1, Math.hypot(ptr.x - lpx, ptr.y - lpy) * 14) - S.agit) * .05; lpx = ptr.x; lpy = ptr.y;
    stage.backdrop.uLift.value = S.intro;
    if (T.hero) T.hero.u.uOpacity.value = S.intro;

    const sr = el.st.getBoundingClientRect(), wr = el.work.getBoundingClientRect();
    if (T.st) T.st.u.uProg.value = clamp((vh * .8 - sr.top) / (vh * 1.0)) * 1.25;
    stage.place(el.aHero.getBoundingClientRect(), .5, A0); stage.place(el.aSt.getBoundingClientRect(), .5, A1);
    A0.x += ptr.sx * .22 * unit; A0.y += ptr.sy * .14 * unit;

    // work: arrival, then five exhibits
    const L = wr.height - vh, arrive = clamp((vh * .95 - wr.top) / (vh * 1.55)), s0 = vh * .75, stepL = (L - s0 - vh * .45) / 4;
    const p = clamp((-wr.top - s0) / stepL, 0, 4), pp = p >= 4 ? 4 : Math.floor(p) + smooth(.2, .8, p % 1);
    const inWork = wr.top < vh * 1.25 && wr.bottom > -vh * .35;
    work.group.visible = inWork; work.phone.visible = arrive > .6;
    if (inWork) {
      stage.place(el.stageBox.getBoundingClientRect(), 0, C);
      work.update({ p: pp, arrive, cx: C.x, cy: C.y, unit, time, pointer: ptr, narrow });
      setActive(Math.round(pp));
      if (!reduce && S.active === 0 && arrive >= 1 && time - chatT > 2.4) { chatT = time; work.chat.set((work.chat.step + 1) % FLOW.length); }
    }

    // glass form A: blob in the hero, lens over the statement, then the phone's glass
    const w01 = smooth(0, 1, (vh - sr.top) / (vh * .95)), m = smooth(.1, .7, arrive), ia = S.intro * S.intro * (3 - 2 * S.intro);
    formA.mesh.visible = arrive < 1 && S.intro > .001;
    if (formA.mesh.visible) {
      P.copy(A0).lerp(A1, w01); if (arrive > 0) P.lerp(work.phone.position, smooth(0, .85, arrive));
      formA.mesh.position.copy(P);
      eul.set(time * .11, time * .17, 0); qBlob.setFromEuler(eul); formA.mesh.quaternion.copy(qBlob).slerp(work.phone.quaternion, m);
      const ps = inWork ? work.phone.scale.x : unit, u = formA.u, mat = formA.mat;
      u.uTime.value = time; u.uMorph.value = m; u.uCut.value = arrive > .6 ? work.reveal.value * ps : -1e3;
      u.uRadius.value = unit * lerp(1.34, .98, w01) * lerp(2.1, 1, ia);
      u.uAmp.value = (lerp(.24, .04, w01) + S.agit * .16 + (1 - ia) * .45) * (1 - m);
      u.uBox.value.set((PHONE.w / 2 + .014) * ps, (PHONE.h / 2 + .014) * ps, (PHONE.d / 2 + .018) * ps); u.uR2.value = (PHONE.corner + .014) * ps; u.uRe.value = (PHONE.edge + .014) * ps;
      const k = smooth(.5, 1, m);
      mat.thickness = lerp(lerp(.62, .34, w01) * unit, .02, k); mat.iridescence = lerp(.8, .1, k); mat.dispersion = lerp(5, .2, k); mat.envMapIntensity = lerp(1.2, .55, k); mat.clearcoat = lerp(.5, .15, k);
    }

    // glass form B and the rings: skills, then contact
    const kr = el.skills.getBoundingClientRect(), cr = el.contact.getBoundingClientRect(), inContact = cr.top < vh * 1.3;
    const showSkills = kr.top < vh * 1.15 && kr.bottom > -vh * .25, showB = inContact ? cr.top < vh * 1.15 : showSkills;
    formB.mesh.visible = showB;
    if (showB) {
      stage.place((inContact ? el.aCo : el.aSk).getBoundingClientRect(), inContact ? .6 : 0, B);
      if (inContact) { B.x += ptr.sx * 1.5 * unit; B.y += ptr.sy * .8 * unit; }
      const mode = inContact ? 'c' : 's'; if (mode !== lastB) { formB.mesh.position.copy(B); lastB = mode; } else formB.mesh.position.lerp(B, inContact ? .07 : 1);
      formB.mesh.rotation.set(time * .09, time * .14, 0);
      const u = formB.u; u.uTime.value = time; u.uRadius.value = unit * (inContact ? (narrow ? 1.5 : 1.22) : (narrow ? 1.2 : 1.08)); u.uAmp.value = (inContact ? .2 : .08) + Math.abs(velN) * .12 + S.agit * .12; u.uMorph.value = 0;
    }
    if (rings) {
      rings.group.visible = showSkills;
      if (showSkills) { stage.place(el.aSk.getBoundingClientRect(), 0, B); rings.group.position.copy(B); rings.group.scale.setScalar(unit * (narrow ? 1 : .92)); rings.vel += velN * .0035; rings.update(time, dt, 0); }
    }

    // the light takes the colour of the project in focus
    toneA.set(inWork && arrive > .5 ? PROJECT_TONES[S.active] : '#5B4BFF'); toneB.copy(inWork && arrive > .5 ? toneA : BLUE);
    stage.backdrop.uA.value.lerp(toneA, .04); stage.backdrop.uB.value.lerp(toneB.lerp(BLUE, .6), .04);
  });
} else {
  loadState.assets = 1; loadState.fonts = 1;
}

/* ---------- loader, then the opening ---------- */
(function loader() {
  const n = $('#ldN'), bar = $('#ldBar'), t0 = performance.now(); let done = false;
  const tick = () => {
    const el = performance.now() - t0, target = el > 9000 ? 1 : Math.min(1, loadState.assets * .8 + loadState.fonts * .2);
    loadState.shown += (target - loadState.shown) * .09 + .002; loadState.shown = Math.min(loadState.shown, target);
    const v = Math.round(loadState.shown * 100); n.textContent = String(v).padStart(2, '0'); bar.style.transform = `scaleX(${loadState.shown})`;
    if (loadState.shown > .995 && !done) { done = true; start(); return; }
    requestAnimationFrame(tick);
  };
  tick();
})();
function warm() { // compile every shader behind the loader so the first scroll into each scene does not hitch
  if (!stage) return; const objs = [work.group, work.phone, formB.mesh, rings && rings.group, ...work.items].filter(Boolean), prev = objs.map(o => o.visible);
  objs.forEach(o => { o.visible = true; }); try { stage.renderer.compile(stage.scene, stage.camera); } catch (e) {} objs.forEach((o, i) => { o.visible = prev[i]; });
}
function start() {
  warm(); $('#loader').classList.add('done'); document.body.classList.remove('is-loading'); lenis && lenis.start();
  if (reduce) S.intro = 1; else gsap.to(S, { intro: 1, duration: 3.2, ease: 'power2.out', delay: .15 });
  window.__ready = true;
}

/* ---------- trips ---------- */
(function trips() {
  const svg = $('#tripMap'), home = [44, 128], stops = [['LIS', 300, 172], ['VIE', 404, 66], ['BUD', 478, 112]];
  let h = ''; for (let x = 20; x < 520; x += 50) h += `<line class="grid" x1="${x}" y1="10" x2="${x}" y2="210"/>`; for (let y = 30; y < 220; y += 50) h += `<line class="grid" x1="0" y1="${y}" x2="520" y2="${y}"/>`;
  stops.forEach(([code, x, y], i) => { const mx = (home[0] + x) / 2, my = Math.min(home[1], y) - 70 - i * 6; h += `<path class="route" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" d="M${home[0]} ${home[1]} Q${mx} ${my} ${x} ${y}"/><circle class="dot" cx="${x}" cy="${y}" r="4"/><text x="${x + 9}" y="${y + 4}">${code}</text>`; });
  h += `<circle class="home" cx="${home[0]}" cy="${home[1]}" r="5.5"/><text x="${home[0] - 12}" y="${home[1] + 22}">YYZ</text>`;
  svg.innerHTML = h; const routes = $$('.route', svg);
  if (reduce) routes.forEach(r => r.setAttribute('stroke-dashoffset', 0));
  else gsap.to(routes, { attr: { 'stroke-dashoffset': 0 }, duration: 1.6, ease: 'power2.inOut', stagger: .25, scrollTrigger: { trigger: svg, start: 'top 80%' } });
})();

/* ---------- case studies ---------- */
const home = $('#home'), caseEl = $('#case'), curtain = $('#curtain');
let cleanup = null, busy = false;
function wipe(label, mid) {
  busy = true; $('#curtainLabel').textContent = label; const done = () => { busy = false; };
  if (reduce) { mid(); done(); return; }
  gsap.timeline({ onComplete: done }).set(curtain, { yPercent: 101 }).to(curtain, { yPercent: 0, duration: .6, ease: 'power3.inOut' }).add(mid).to(curtain, { yPercent: -101, duration: .65, ease: 'power3.inOut', delay: .15 }).set(curtain, { yPercent: 101 });
}
function mountCase(key) {
  const c = CASES[key], nx = CASES[c.next]; if (cleanup) cleanup();
  caseEl.innerHTML = `<div class="case-bar"><button type="button" data-back>Back to work</button><span>${c.short}</span><a href="#contact" data-leave="contact">Get in touch</a><i id="caseProg"></i></div>${c.html()}
    <div class="cs-next"><div><div><small>Next case study</small><button type="button" data-case="${nx.key}">${nx.short}</button></div><a href="#work" data-leave="work">All work</a></div></div>`;
  home.hidden = true; caseEl.hidden = false; document.body.dataset.view = 'case'; S.view = 'case'; $('#nav').hidden = true; stage && stage.setRunning(false);
  scrollToY(0, true); lenis && lenis.start();
  cleanup = c.init(caseEl, { gsap, ScrollTrigger, reduce });
  $$('img', caseEl).forEach(im => im.addEventListener('load', () => ScrollTrigger.refresh(), { once: true }));
  requestAnimationFrame(() => ScrollTrigger.refresh()); document.title = `${c.short} | Neha Jaspal`;
}
function unmountCase(target) {
  if (cleanup) cleanup(); cleanup = null; caseEl.hidden = true; caseEl.innerHTML = ''; home.hidden = false; delete document.body.dataset.view; S.view = 'home'; $('#nav').hidden = false; stage && stage.setRunning(true);
  document.title = 'Neha Jaspal, AI product designer'; ScrollTrigger.refresh();
  const t = target && document.getElementById(target);
  scrollToY(t ? Math.max(0, t.getBoundingClientRect().top + scrollY) : S.homeY, true);
}
function route() {
  const key = location.hash.slice(1);
  if (CASES[key]) { if (S.view === 'home') S.homeY = scrollY; wipe(CASES[key].short, () => mountCase(key)); }
  else if (S.view === 'case') wipe('Neha Jaspal', () => unmountCase());
}
addEventListener('hashchange', route);
if (CASES[location.hash.slice(1)]) { mountCase(location.hash.slice(1)); if (!reduce) S.intro = 1; }
function goSection(id) {
  if (S.view === 'case') { try { history.pushState('', '', location.pathname + location.search); } catch (e) {} wipe('Neha Jaspal', () => unmountCase(id)); }
  else { const t = document.getElementById(id); if (t) id === 'top' ? scrollToY(0) : window.__scrollTo(t, 0); }
}
document.addEventListener('click', e => {
  if (busy) { if (e.target.closest('a,button')) e.preventDefault(); return; }
  const nav = e.target.closest('[data-nav]'); if (nav) { e.preventDefault(); goSection(nav.dataset.nav); return; }
  const leave = e.target.closest('[data-leave]'); if (leave) { e.preventDefault(); goSection(leave.dataset.leave); return; }
  if (e.target.closest('[data-back]')) { goSection(null); return; }
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
  [/westjet|flight|seat|travel|airline|aviation/i, 'Two <b>WestJet</b> projects: seat upgrades at check-in (75% engagement, 11.5% more upgrades) and flight status on the mobile app (80% better access, 40% more widget engagement).', [['See the work', 'go:work', 1]]],
  [/number|metric|impact|result|outcome|kpi/i, 'A few she can point to: <b>100%</b> task completion in the eBay A/B test, <b>80%</b> OSAT on the Shoppers dashboard, <b>11.5%</b> more seat upgrades at WestJet, and <b>50%</b> more engagement after ads on digital health.', [['See the work', 'go:work', 1]]],
  [/process|principle|approach|how (does )?she|method|think/i, 'Three principles from the eBay returns work sum it up: <b>understand before asking</b>, <b>guide, never gate</b>, and <b>match effort to risk</b>.', [['See them in context', 'case:returns', 1], ['Skills', 'go:skills']]],
  [/skill|tool|strength/i, 'Eighteen skills in four groups: AI, product, craft and research.', [['See the skills', 'go:skills', 1]]],
  [/contact|e-?mail|hire|linkedin|reach|talk|coffee|touch|project/i, `She’s up for a project or a coffee chat: <b>${MAIL}</b>.`, [['Go to contact', 'go:contact', 1], ['LinkedIn', 'https://www.linkedin.com/in/nehajaspal/']]],
  [/who|about|neha|background|toronto|hobb|outside|person/i, 'Neha is an AI product designer with 10+ years across e-commerce, travel and healthtech. Born and raised in the Middle East, now in Toronto, currently at eBay. Off the clock: travel, cafés, pickleball, painting and F1.', [['Read more', 'go:about', 1]]],
];
const say = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
const opts = list => `<div class="opts">${list.map(([t, to, go]) => /^https?:/.test(to) ? `<a href="${to}" target="_blank" rel="noopener">${t}</a>` : `<button type="button" data-to="${to}"${go ? ' class="go"' : ''}>${t}</button>`).join('')}</div>`;
const chips = () => say('opts', START.map(c => `<button type="button" data-q="${c}">${c}</button>`).join(''));
function answer(q) {
  say('u', q.replace(/</g, '&lt;')); const hit = INTENTS.find(i => i[0].test(q));
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

/* ---------- cursor ---------- */
if (matchMedia('(pointer:fine)').matches && !reduce) {
  const cur = $('#cur'), lab = $('span', cur); let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
  document.documentElement.classList.add('has-cursor');
  addEventListener('pointermove', e => {
    tx = e.clientX; ty = e.clientY; const t = e.target.closest ? e.target : null; if (!t) return;
    const hot = t.closest('a,button,.work-stage,[data-zoom],.skills'); cur.classList.toggle('act', !!hot && !t.closest('.skills'));
    const text = t.closest('.work-stage') ? (PROJECTS[S.active].cta[0]) : t.closest('.skills') ? 'Drag to spin' : t.closest('[data-zoom]') ? 'Enlarge' : '';
    cur.classList.toggle('lab', !!text); if (text) lab.textContent = text;
  }, { passive: true });
  gsap.ticker.add(() => { x += (tx - x) * .22; y += (ty - y) * .22; cur.style.transform = `translate(${x}px,${y}px)`; });
}
