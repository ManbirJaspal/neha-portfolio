import * as THREE from 'three';
import { createStage } from './gl/stage.js';
import { GlassForm, Core, Droplets } from './gl/glass.js';
import { GLText, GLImage, GLTiles } from './gl/doc.js';
import { Field, Caustics, Marquee } from './gl/fx.js';
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
const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const MAIL = 'nehajaspal.nj@gmail.com';
const S = { view: 'home', intro: 0, started: false, homeY: 0, stop: -1, agit: 0, p: 0 };

hydrate();

/* ---------- content ---------- */
const FIGMA = 'https://www.figma.com/deck/q8uskOONzY0S48Ql02btCZ/Untitled?node-id=1-91&t=GSlvS4ApJKq6mCHk-1';
const PROJECTS = [
  { k: 'returns', img: null, cta: ['Read the case study', '#returns'] },
  { k: 'dashboard', img: 'QbFvKr3YCRXhAShcvKn38Nm6Ew.png', cta: ['Read the case study', '#dashboard'] },
  { k: 'seat', img: 'PBRSkRgwIXptv77c9TX0piZvEh8.png', cta: ['Ask for the walkthrough', `mailto:${MAIL}?subject=WestJet%20seat%20upgrade%20case%20study`], ghost: true },
  { k: 'flight', img: 'X0cmyqyURFjFL9P2Jk6PL3EXo.png', cta: ['Open the Figma deck', FIGMA], ghost: true },
  { k: 'ads', img: 'sbtmgBFQ1akFfxApXIFlcnGv8.png', cta: ['Read the case study', '#ads'] },
];
// six stops on the wheel: the phone holds two (the chat, then the system behind it)
const STOPS = [
  { pr: 0, co: 'eBay', title: 'AI <em>returns</em>', goal: 'Create an intelligent, streamlined returns experience that improves buyer and seller CSAT, simplifies return filing, and reduces SNAD claims and return fraud.', stats: [['130M+', 'buyers'], ['25M+', 'sellers'], ['$280M+', 'projected GMV']] },
  { pr: 0, co: 'eBay, behind the screen', title: 'The system <em>is</em> the design', goal: 'Designed intuitive flows informed by backend machine learning, computer vision, NLP, and generative AI: LLM constraints and guardrails, validation criteria and policy checks, translated into a conversation that guides users toward the right resolution.', stats: [['100%', 'task completion in A/B testing'], ['<1%', 'of users contacting customer service']] },
  { pr: 1, co: 'Shoppers Drug Mart', title: 'Dashboard <em>redesign</em>', goal: 'Enhance usability, incorporate status tracking, and ensure seamless navigation, ultimately aiming to improve user satisfaction and overall ease of use.', stats: [['80%', 'OSAT score'], ['8/10', 'ease of use'], ['2.5M+', 'dashboard users']] },
  { pr: 2, co: 'WestJet', title: 'Seat upgrade <em>experience</em>', goal: 'Optimized the check-in experience by enhancing seat change options and allowing users to upgrade their seats, resulting in increased ancillary revenue.', stats: [['75%', 'user engagement rate'], ['11.5%', 'increase in seat upgrades']] },
  { pr: 3, co: 'WestJet', title: 'Flight status <em>optimization</em>', goal: 'Enhance user confidence by prioritizing flight status visibility on the mobile app.', stats: [['80%', 'improvement in access to flight status'], ['40%', 'more engagement with the flight status widget']] },
  { pr: 4, co: 'Shoppers Drug Mart', title: 'Ad formats and promos on <em>digital health</em>', goal: 'Ads and promos integration on a digital health dashboard to cross-promote health, fitness, and wellness products, enhancing user engagement while providing relevant product recommendations for a holistic health experience.', stats: [['50%', 'increase in user engagement'], ['85%', 'said the ads were non-intrusive']] },
];
$('#workInfo').innerHTML = STOPS.map((s, i) => { const p = PROJECTS[s.pr]; return `<article class="wi" data-i="${i}" style="--tone:${PROJECT_TONES[s.pr]}"><p class="wi-co">${s.co}</p><h3>${s.title}</h3><p class="wi-goal">${s.goal}</p>
  <div class="wi-stats">${s.stats.map(x => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div>
  <a class="wi-cta${p.ghost ? ' ghost' : ''}" href="${p.cta[1]}"${/^https?:/.test(p.cta[1]) ? ' target="_blank" rel="noopener"' : ''}>${p.cta[0]}</a></article>`; }).join('');
$('#workDots').innerHTML = PROJECTS.map(() => '<li></li>').join('');
function setStop(i) {
  if (i === S.stop) return; const prev = S.stop; S.stop = i; const pr = STOPS[i].pr;
  $$('.wi').forEach((e, j) => { e.classList.toggle('on', j === i); e.classList.toggle('below', j > i); });
  $$('#workDots li').forEach((e, j) => e.classList.toggle('on', j === pr)); $('#workN').textContent = '0' + (pr + 1);
  if (!document.body.classList.contains('gl-on') && PROJECTS[pr].img) $('#workStage').style.background = `url(${src(PROJECTS[pr].img, 1024)}) center/contain no-repeat`;
}
setStop(0);
const activeProject = () => PROJECTS[STOPS[Math.max(0, S.stop)].pr];
function openProject() { const to = activeProject().cta[1]; if (to[0] === '#') location.hash = to.slice(1); else if (/^https?:/.test(to)) window.open(to, '_blank', 'noopener'); else location.href = to; }
$('#workStage').addEventListener('click', openProject);

const GROUPS = [
  ['AI', ['Agentic commerce', 'Gen AI', 'Prompt engineering', 'Systems thinking']],
  ['Product', ['Product Design', 'Product Thinking', 'Consulting', 'Mentoring']],
  ['Craft', ['UX Design', 'UI Design', 'Visual Design', 'Interaction Design', 'Email Design', 'Ads Design', 'Marketing Design']],
  ['Research', ['Design Sprint', 'User Testing', 'UX Research']],
];
$('#skillsCols').innerHTML = GROUPS.map(([g, list]) => `<div><h4>${g}</h4><ul>${list.map(s => `<li>${s}</li>`).join('')}</ul></div>`).join('');
const ALL = GROUPS.flatMap(g => g[1]), RING_WORDS = [0, 1, 2].map(k => ALL.filter((_, i) => i % 3 === k));
const OUTCOMES = [['100%', 'task completion in the eBay A/B test'], ['$280M+', 'projected GMV from AI returns'], ['80%', 'OSAT on the Shoppers dashboard'], ['2.5M+', 'dashboard users'], ['11.5%', 'more seat upgrades at WestJet'], ['80%', 'better access to flight status'], ['50%', 'more engagement after ads on digital health'], ['130M+', 'buyers served']];
$('#impactList').innerHTML = OUTCOMES.map(o => `<li><b>${o[0]}</b><span>${o[1]}</span></li>`).join('');
const CHAPTERS = [['top', 'Intro'], ['work', 'Work'], ['impact', 'Outcomes'], ['skills', 'Skills'], ['about', 'About'], ['contact', 'Contact']];
$('#rail').innerHTML = CHAPTERS.map(([id, n]) => `<a href="#${id}" data-nav="${id}"><span>${n}</span><i></i></a>`).join('');

/* ---------- smooth scroll: one clock drives the page and the scene ---------- */
let lenis = null;
if (!reduce && Lenis) { lenis = new Lenis({ lerp: .09, wheelMultiplier: .95 }); lenis.on('scroll', ScrollTrigger.update); lenis.stop(); }
window.__lenis = lenis;
const scrollToY = (y, immediate) => lenis ? lenis.scrollTo(y, { immediate, force: true, duration: 1.4 }) : window.scrollTo({ top: y, behavior: immediate || reduce ? 'auto' : 'smooth' });
window.__scrollTo = (el, offset = 0) => scrollToY(Math.max(0, el.getBoundingClientRect().top + scrollY + offset));

/* ---------- layout cache: positions are read once and offset by scroll, so the scene never forces layout ---------- */
const tracked = [];
const track = (el, live = false) => { const o = { el, live, x: 0, y: 0, w: 0, h: 0, r: { left: 0, top: 0, width: 0, height: 0 } }; tracked.push(o); return o; };
function measure() { const sy = scrollY; for (const o of tracked) { const b = o.el.getBoundingClientRect(); o.x = b.left; o.y = b.top + sy; o.w = b.width; o.h = b.height; } }
const rectOf = (o, sy) => { const r = o.r; if (o.live) { const b = o.el.getBoundingClientRect(); r.left = b.left; r.top = b.top; r.width = b.width; r.height = b.height; } else { r.left = o.x; r.top = o.y - sy; r.width = o.w; r.height = o.h; } return r; };

/* ---------- the WebGL world ---------- */
const loadState = { assets: 0, fonts: 0, shown: 0 };
const stage = createStage($('#gl'), { onProgress: v => { loadState.assets = v; } });
let T = {}, rings = null, work = null, formB = null, rasterAll = () => {};
if (stage) {
  window.__stage = stage; document.body.classList.add('gl-on');
  const small = stage.small, V = () => new THREE.Vector3();
  const formA = new GlassForm(stage), coreA = new Core(stage); formB = new GlassForm(stage); const coreB = new Core(stage); formB.mesh.visible = coreB.mesh.visible = false;
  const drops = new Droplets(stage, small ? 5 : 7), field = new Field(stage, +new URLSearchParams(location.search).get('p') || (small ? 70000 : 190000)), caustics = new Caustics(stage);
  work = new Work(stage, PROJECTS.slice(1).map(p => p.img));
  const imgs = $$('.glimg').map(el => ({ gl: new GLImage(stage, el, { radius: 24 }), L: track(el) }));
  const tiles = { gl: new GLTiles(stage, $('#tilesImg')), L: track($('#tilesImg')) };
  let marquee = null;
  const L = { hero: track($('#heroTitle')), stText: track($('#statementText')), skTitle: track($('#skillsTitle')), coTitle: track($('#contactTitle')),
    st: track($('#statement')), work: track($('#work')), impact: track($('#impact')), skills: track($('#skills')), about: track($('#about')), contact: track($('#contact')),
    aHero: track($('#aHero')), aSt: track($('#aStatement')), aIm: track($('#aImpact')), aSk: track($('#aSkills')), aCo: track($('#aContact')), stageBox: track($('#workStage'), true) };
  const A0 = V(), A1 = V(), C = V(), B = V(), P = V(), M = V(), qBlob = new THREE.Quaternion(), eul = new THREE.Euler();
  const col = { a: new THREE.Color(), b: new THREE.Color(), c: new THREE.Color() }, light = new THREE.Vector2();
  const PAL = { hero: ['#5B4BFF', '#1B3BFF', '#FF6A4D', .3, .32, 1], st: ['#3D5BFF', '#152C9A', '#B03CFF', .34, .18, .8], impact: ['#7A4BFF', '#3A1C8F', '#F4B740', 0, .44, 1.1], skills: ['#2F6BFF', '#141A7A', '#35D0E0', -.05, .12, .6], about: ['#6B5BFF', '#24135A', '#F4B740', -.36, .36, .45], contact: ['#6B5BFF', '#FF5FA2', '#F4B740', .28, .24, 1.1] };
  let chatT = 0, lastB = '', lastMode = '', rays = 1;

  document.fonts.ready.then(() => Promise.all([document.fonts.load('500 semi-expanded 100px "Roboto Flex"'), document.fonts.load('italic 400 100px "Instrument Serif"'), document.fonts.load('400 20px "Hanken Grotesk"'), document.fonts.load('600 20px "Hanken Grotesk"')]).catch(() => {})).then(() => {
    T.hero = new GLText(stage, $('#heroTitle')); T.hero.showTarget = 0; T.st = new GLText(stage, $('#statementText'), { lines: 5 });
    T.skills = new GLText(stage, $('#skillsTitle'), { z: -3.2 }); T.contact = new GLText(stage, $('#contactTitle'));
    measure(); rasterAll();
    rings = new Rings(stage, RING_WORDS);
    marquee = new Marquee(stage, [
      { items: OUTCOMES.slice(0, 4).map(o => o[0] + ' ' + o[1]), font: '500 semi-expanded 150px "Roboto Flex", sans-serif', speed: .012 },
      { items: OUTCOMES.slice(4).map(o => o[0] + ' ' + o[1]), font: 'italic 400 178px "Instrument Serif", serif', speed: .016, color: '#F4B740' },
      { items: OUTCOMES.slice(2, 6).map(o => o[0] + ' ' + o[1]), font: '500 semi-expanded 150px "Roboto Flex", sans-serif', speed: .01, outline: true },
    ]);
    work.chat.step = -1; work.chat.set(0); loadState.fonts = 1;
  });
  rasterAll = () => { Object.values(T).forEach(t => t.raster()); if (T.st) { const tops = new Set(T.st.words.map(w => Math.round(w.getBoundingClientRect().top))); T.st.u.uLines.value = Math.max(1, tops.size); } };
  stage.onResize(widthChanged => { measure(); if (widthChanged) rasterAll(); });
  addEventListener('load', measure); if (window.ResizeObserver) new ResizeObserver(() => measure()).observe(document.body);

  // drag the rings
  let drag = null;
  $('#skills').addEventListener('pointerdown', e => { drag = e.clientX; });
  addEventListener('pointermove', e => { if (drag === null || !rings) return; rings.vel += (e.clientX - drag) * .0005; drag = e.clientX; }, { passive: true });
  addEventListener('pointerup', () => { drag = null; }); addEventListener('pointercancel', () => { drag = null; });
  let lpx = 0, lpy = 0, navY = 0;

  stage.onFrame((time, dt) => {
    if (S.view !== 'home') return;
    const H = stage.size.h, unit = stage.size.unit, narrow = stage.size.narrow, ptr = stage.pointer, sy = lenis ? lenis.animatedScroll : scrollY;
    const velN = lenis ? clamp(lenis.velocity / 55, -1, 1) : 0, R = k => rectOf(L[k], sy);
    S.agit = damp(S.agit, Math.min(1, Math.hypot(ptr.x - lpx, ptr.y - lpy) * 14), 3, dt); lpx = ptr.x; lpy = ptr.y;
    const ia = S.intro * S.intro * (3 - 2 * S.intro);
    stage.backdrop.uLift.value = ia;

    // type and pictures
    if (T.hero) { T.hero.showTarget = S.started ? 1 : 0; T.hero.update(R('hero'), velN, dt); T.st.update(R('stText'), velN, dt); T.skills.update(R('skTitle'), velN, dt); T.contact.update(R('coTitle'), velN, dt); }
    for (const o of imgs) o.gl.update(rectOf(o.L, sy), time, velN * .5, dt);
    tiles.gl.update(rectOf(tiles.L, sy), time, dt, ptr);

    const rSt = R('st'), rWork = R('work');
    if (T.st) T.st.u.uProg.value = clamp((H * .82 - rSt.top) / H) * 1.25;
    stage.place(R('aHero'), .5, A0); stage.place(R('aSt'), .5, A1);
    A0.x += ptr.sx * .22 * unit; A0.y += ptr.sy * .14 * unit;

    // work: arrival, then six stops
    const Lw = rWork.height - H, arrive = clamp((H * .95 - rWork.top) / (H * 1.5)), s0 = H * .7, stepL = (Lw - s0 - H * .4) / 5;
    const praw = clamp((-rWork.top - s0) / stepL, 0, 5), pp = praw >= 5 ? 5 : Math.floor(praw) + smooth(.18, .82, praw % 1);
    S.p = Math.abs(pp - S.p) > 2.2 ? pp : damp(S.p, pp, 8, dt);
    const inWork = rWork.top < H * 1.25 && rWork.top + rWork.height > -H * .35;
    work.group.visible = inWork; work.phone.visible = arrive > .6;
    if (inWork) {
      stage.place(R('stageBox'), 0, C);
      work.update({ p: S.p, arrive, cx: C.x, cy: C.y, unit, time, pointer: ptr, narrow, pr: stage.size.pr * stage.size.scale });
      setStop(Math.round(S.p));
      if (!reduce && S.stop === 0 && arrive >= 1 && time - chatT > 2.4) { chatT = time; work.chat.set((work.chat.step + 1) % FLOW.length); }
    }

    // glass form A: blob in the hero, lens over the statement, then the phone's glass
    const w01 = smooth(0, 1, (H - rSt.top) / (H * .95)), m = smooth(.1, .7, arrive);
    const showA = arrive < 1 && S.intro > .001; formA.mesh.visible = showA; let radA = 0;
    if (showA) {
      P.copy(A0).lerp(A1, w01); if (arrive > 0) P.lerp(work.phone.position, smooth(0, .85, arrive));
      formA.mesh.position.copy(P);
      eul.set(time * .11, time * .17, 0); qBlob.setFromEuler(eul); formA.mesh.quaternion.copy(qBlob).slerp(work.phone.quaternion, m);
      const ps = inWork ? work.phone.scale.x : unit, u = formA.u, mat = formA.mat;
      radA = unit * lerp(narrow ? 1.5 : 1.34, narrow ? 1.15 : .98, w01) * lerp(2.1, 1, ia);
      u.uTime.value = time; u.uMorph.value = m; u.uCut.value = arrive > .6 ? work.reveal.value * ps : -1e3; u.uRadius.value = radA;
      u.uAmp.value = (lerp(.24, .04, w01) + S.agit * .14 + (1 - ia) * .45) * (1 - m);
      u.uBox.value.set((PHONE.w / 2 + .014) * ps, (PHONE.h / 2 + .014) * ps, (PHONE.d / 2 + .018) * ps); u.uR2.value = (PHONE.corner + .014) * ps; u.uRe.value = (PHONE.edge + .014) * ps;
      const k = smooth(.5, 1, m);
      mat.thickness = lerp(lerp(.62, .36, w01) * unit, .02, k); mat.iridescence = lerp(.75, .1, k); mat.dispersion = lerp(6, .2, k); mat.envMapIntensity = lerp(1.25, .55, k); mat.clearcoat = lerp(.5, .15, k);
    }
    // its core
    const coreOn = showA && m < .5; coreA.mesh.visible = coreOn;
    if (coreOn) { coreA.mesh.position.copy(P); coreA.mesh.scale.setScalar(radA * lerp(.34, .26, w01) * (1 - smooth(.05, .5, m))); coreA.mesh.rotation.set(time * .2, time * .31, 0); coreA.u.uTime.value = time; coreA.u.uPower.value = ia * lerp(1, .8, w01) * (.9 + .12 * Math.sin(time * 1.3)); }

    // glass form B: skills, then contact
    const rSk = R('skills'), rCo = R('contact'), rIm = R('impact'), inContact = rCo.top < H * 1.3;
    const showSkills = rSk.top < H * 1.15 && rSk.top + rSk.height > -H * .25, showB = inContact ? rCo.top < H * 1.15 : showSkills; let radB = 0;
    formB.mesh.visible = coreB.mesh.visible = showB;
    if (showB) {
      stage.place(R(inContact ? 'aCo' : 'aSk'), inContact ? .6 : 0, B);
      if (inContact) { B.x += ptr.sx * 1.5 * unit; B.y += ptr.sy * .8 * unit; }
      const mode = inContact ? 'c' : 's'; if (mode !== lastB) { formB.mesh.position.copy(B); lastB = mode; } else formB.mesh.position.lerp(B, inContact ? 1 - Math.exp(-dt * 4) : 1);
      formB.mesh.rotation.set(time * .09, time * .14, 0);
      const u = formB.u; radB = unit * (inContact ? (narrow ? 1.5 : 1.22) : (narrow ? 1.2 : 1.08)); u.uTime.value = time; u.uRadius.value = radB; u.uAmp.value = (inContact ? .2 : .08) + Math.abs(velN) * .1 + S.agit * .1; u.uMorph.value = 0;
      coreB.mesh.position.copy(formB.mesh.position); coreB.mesh.scale.setScalar(radB * (inContact ? .32 : .26)); coreB.mesh.rotation.set(time * .2, time * .31, 0); coreB.u.uTime.value = time; coreB.u.uPower.value = inContact ? 1 : .7;
    }
    if (rings) { rings.group.visible = showSkills; if (showSkills) { stage.place(R('aSk'), 0, M); rings.group.position.copy(M); rings.group.scale.setScalar(unit * (narrow ? 1 : .92)); rings.vel += velN * .004; rings.update(time, dt); } }

    // outcomes marquee
    const showIm = rIm.top < H * 1.1 && rIm.top + rIm.height > -H * .1;
    if (marquee) { marquee.group.visible = showIm; if (showIm) { const z = -1.6, s = stage.place(R('aIm'), z, M), rowH = (narrow ? 62 : 118) * s * Math.min(1.3, H / 800); marquee.update(0, M.y, z, rowH, rowH * .16, stage.size.w * s * 1.04, time, sy * .00042); } }

    // caustics follow whichever form is on stage
    const cf = showA && m < .95 ? formA : (showB ? formB : null), cg = cf === formA ? ia * (1 - smooth(.2, .9, m)) * lerp(1, .6, w01) : .8;
    caustics.mesh.visible = !!cf;
    if (cf) { const z = -3.4, k = (10 - z) / (10 - cf.mesh.position.z), rad = (cf === formA ? radA : radB) * 5.2; caustics.mesh.position.set(cf.mesh.position.x * k + .25 * rad * .2, cf.mesh.position.y * k - .2 * rad * .2, z); caustics.mesh.scale.set(rad, rad, 1); caustics.u.uTime.value = time; caustics.u.uGain.value = damp(caustics.u.uGain.value, cg * .55, 4, dt); }

    // droplets: around the hero form, across the outcomes, around the contact form
    const mode = showA && m < .25 ? 'a' : showIm ? 'i' : (showB && inContact) ? 'c' : '';
    drops.items.forEach((d, i) => {
      const a = time * (.16 + (i % 3) * .05) * (i % 2 ? 1 : -1) + d.ph;
      if (mode === 'a') { const rr = radA * (1.35 + .55 * Math.sin(a * .7 + i)) * (1 - w01 * .92); drops.target(i, P.x + Math.cos(a) * rr * 1.25, P.y + Math.sin(a * 1.31) * rr * .78, P.z + Math.sin(a) * rr * .7, d.r * unit * ia * (1 - smooth(.25, .95, w01)) * (1 - m * 4)); }
      else if (mode === 'i') { stage.place(R('aIm'), .8, M); const on = i < (narrow ? 3 : 5); drops.target(i, M.x + Math.sin(time * .13 + d.ph) * stage.size.vw * .4, M.y + Math.cos(time * .17 + d.ph * 2.3) * (narrow ? .9 : 1.25) * unit * 1.6, .8 + Math.sin(a) * .8, on ? (.34 + d.r * 2.4) * unit * (narrow ? 1.5 : 1) : 0); }
      else if (mode === 'c') { const rr = radB * (1.5 + .5 * Math.sin(a * .7 + i)); drops.target(i, formB.mesh.position.x + Math.cos(a) * rr * 1.3, formB.mesh.position.y + Math.sin(a * 1.31) * rr * .8, formB.mesh.position.z + Math.sin(a) * rr * .7, d.r * unit); }
      else drops.target(i, d.m.position.x, d.m.position.y, d.m.position.z, 0);
    });
    drops.step(dt, mode !== lastMode && mode !== ''); if (mode) lastMode = mode;

    // atmosphere: the light takes the colour of the chapter or project in focus
    const mid = H * .5, rAb = R('about');
    let pal = PAL.hero, tone = null;
    if (rCo.top < mid) pal = PAL.contact; else if (rAb.top < mid) pal = PAL.about; else if (rSk.top < mid) pal = PAL.skills; else if (rIm.top < mid) pal = PAL.impact; else if (rWork.top < mid) { pal = PAL.st; tone = PROJECT_TONES[STOPS[Math.max(0, S.stop)].pr]; } else if (rSt.top < mid) pal = PAL.st;
    col.a.set(tone || pal[0]); col.b.set(pal[1]); col.c.set(tone ? '#6B5BFF' : pal[2]); if (tone) col.b.copy(col.a).multiplyScalar(.45);
    const kc = 1 - Math.exp(-dt * 2.2), bd = stage.backdrop; bd.uA.value.lerp(col.a, kc); bd.uB.value.lerp(col.b, kc); bd.uC.value.lerp(col.c, kc);
    light.set(pal[3], pal[4]); bd.uLight.value.lerp(light, kc); rays = damp(rays, pal[5], 2, dt); bd.uRays.value = rays * ia;

    // the field takes the order of the chapter on screen: halo, streams, floor, rising floor, globe, still air, spiral
    const fk = r => clamp((H * .9 - r.top) / (H * .6)), fc = Math.min(5.999, fk(rSt) + fk(rWork) + fk(rIm) + fk(rSk) + fk(rAb) + fk(rCo)), fu = field.u;
    fu.uFrom.value = Math.floor(fc); fu.uTo.value = Math.floor(fc) + 1; fu.uMix.value = fc % 1;
    fu.uTime.value = time; fu.uPR.value = stage.size.pr; fu.uVW.value = stage.size.vw; fu.uVH.value = stage.size.vh; fu.uVert.value = narrow ? 1 : 0;
    fu.uVel.value = Math.abs(velN); fu.uScroll.value = sy * stage.kz(0) * .55; fu.uPtr.value.set(ptr.sx, ptr.sy); fu.uPtrOn.value = ptr.touch ? 0 : 1; fu.uIntro.value = ia;
    if (showA) fu.uFA.value.set(P.x, P.y, P.z, radA); if (showB) fu.uFB.value.set(formB.mesh.position.x, formB.mesh.position.y, formB.mesh.position.z, radB);
    fu.uSplit.value = showA && m < .5 ? P.z : showB ? formB.mesh.position.z : 99;
    fu.uA.value.lerp(col.a, kc); fu.uB.value.lerp(col.c, kc); fu.uGain.value = damp(fu.uGain.value, pal[6] || 1, 2, dt);
    caustics.u.uA.value.lerp(col.a, kc); coreA.u.uA.value.lerp(col.a, kc); coreB.u.uA.value.lerp(col.a, kc);

    // page chrome
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight); $('#prog').style.transform = `scaleX(${clamp(sy / max)})`;
    if (Math.abs(sy - navY) > 6) { $('#nav').classList.toggle('away', sy > navY && sy > 160); navY = sy; }
    const ch = rCo.top < mid ? 5 : rAb.top < mid ? 4 : rSk.top < mid ? 3 : rIm.top < mid ? 2 : rWork.top < mid ? 1 : 0;
    if (ch !== S.ch) { S.ch = ch; $$('#rail a').forEach((a, i) => a.classList.toggle('on', i === ch)); }
  });
} else {
  loadState.assets = 1; loadState.fonts = 1; $('#rail').hidden = true;
}

// one loop for scroll and scene, so they can never be a frame apart
let lastNow = performance.now();
gsap.ticker.lagSmoothing(0);
gsap.ticker.add(() => { const now = performance.now(), dt = (now - lastNow) / 1000; lastNow = now; lenis && lenis.raf(now); stage && stage.frame(dt); });

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
  if (!stage) return; const objs = []; stage.scene.traverse(o => { if (o.isMesh || o.isPoints || o.isLine || o.isGroup) objs.push(o); }); const prev = objs.map(o => o.visible);
  objs.forEach(o => { o.visible = true; }); stage.warm(); objs.forEach((o, i) => { o.visible = prev[i]; }); stage.settle(100);
}
function start() {
  warm(); $('#loader').classList.add('done'); document.body.classList.remove('is-loading'); lenis && lenis.start(); S.started = true;
  if (reduce) S.intro = 1; else gsap.to(S, { intro: 1, duration: 3.4, ease: 'power2.out', delay: .1 });
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
    const text = t.closest('.work-stage') ? activeProject().cta[0] : t.closest('.skills') ? 'Drag to spin' : t.closest('[data-zoom]') ? 'Enlarge' : '';
    cur.classList.toggle('lab', !!text); if (text) lab.textContent = text;
  }, { passive: true });
  gsap.ticker.add(() => { x += (tx - x) * .3; y += (ty - y) * .3; cur.style.transform = `translate3d(${x}px,${y}px,0)`; });
}
