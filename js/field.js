// Particle field: noise that resolves into a UI system (a chat phone wired to a node map),
// scatters under the cursor, and re-forms as a dot lattice at the end of the page.
import * as THREE from 'three';

const TAU = Math.PI * 2;

function buildTargets(count) {
  // Shapes in design units. Phone at origin; system map and cards to the right.
  const shapes = [];
  const rr = (cx, cy, w, h, r, core = 0, wt = 1) => shapes.push({ t: 'rr', cx, cy, w, h, r, core, len: (2 * (w + h) - 8 * r + TAU * r) * wt });
  const fill = (cx, cy, w, h, r, core = 0, wt = 1) => shapes.push({ t: 'fill', cx, cy, w, h, r, core, len: w * h * 9 * wt });
  const line = (x1, y1, x2, y2, core = 0, dash = 0) => shapes.push({ t: 'line', x1, y1, x2, y2, core, dash, len: Math.hypot(x2 - x1, y2 - y1) * (dash ? .6 : 1) });
  const ring = (cx, cy, r, core = 0) => shapes.push({ t: 'ring', cx, cy, r, core, len: TAU * r });
  const disc = (cx, cy, r, core = 0) => shapes.push({ t: 'disc', cx, cy, r, core, len: Math.PI * r * r * 9 });

  // phone
  rr(0, 0, 3.4, 6.9, .52, 1, 1.5);
  fill(0, 3.02, .95, .2, .1, 1);
  const L = -1.35, R = 1.35;
  const textLines = (y, n, w = 2.1) => { for (let i = 0; i < n; i++) line(L, y - i * .2, L + w * (i === n - 1 ? .62 : 1), y - i * .2, 1); };
  rr(0, 2.25, 2.7, .62, .14, 1);            // order card
  fill(-1.0, 2.25, .42, .34, .06, 1);
  textLines(1.62, 2);
  fill(R - .75, 1.0, 1.5, .4, .12, 1);       // user bubble
  textLines(.42, 2);
  rr(L + .62, -.28, 1.24, .38, .1, 1); rr(L + 1.98, -.28, 1.3, .38, .1, 1);   // chips
  rr(L + .9, -.78, 1.8, .38, .1, 1);
  fill(R - .85, -1.42, 1.7, .4, .12, 1);     // user bubble
  textLines(-2.0, 2, 2.3);
  rr(-.28, -2.92, 2.3, .42, .2, 1); disc(1.25, -2.92, .2, 1);   // input + send

  // system map: prevent, understand, resolve, learn, and the loop back
  const N = [[3.5, 2.5], [5.3, 1.25], [3.9, -.35], [5.5, -1.9]];
  N.forEach(([x, y], i) => { ring(x, y, .34); if (i === 1) disc(x, y, .14); });
  line(1.7, 1.0, N[0][0] - .3, N[0][1] - .15);
  for (let i = 0; i < 3; i++) {
    const [ax, ay] = N[i], [bx, by] = N[i + 1], d = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / d, uy = (by - ay) / d;
    line(ax + ux * .34, ay + uy * .34, bx - ux * .34, by - uy * .34);
  }
  // dashed return loop
  shapes.push({ t: 'arc', cx: 5.6, cy: -.32, r: 1.62, a0: -1.2, a1: 1.2, core: 0, dash: 1, len: 1.62 * 2.4 * .6 });
  // results card with bars
  rr(4.2, -3.05, 2.5, 1.25, .16);
  [[3.35, .35], [3.9, .62], [4.45, .5], [5.0, .86]].forEach(([x, h]) => fill(x, -3.5 + h / 2, .3, h, .04));
  // status card
  rr(6.05, 3.0, 2.1, .82, .16); fill(5.5, 3.14, .7, .2, .1); line(5.2, 2.8, 6.8, 2.8);
  line(5.38, 1.58, 5.62, 2.58);

  const total = shapes.reduce((s, x) => s + x.len, 0);
  const pts = [];
  const inRR = (x, y, w, h, r) => { const qx = Math.abs(x) - (w / 2 - r), qy = Math.abs(y) - (h / 2 - r); return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) <= r; };
  for (const s of shapes) {
    const n = Math.max(6, Math.round(count * s.len / total));
    for (let i = 0; i < n; i++) {
      let x = 0, y = 0; const u = Math.random();
      if (s.t === 'rr') {
        const { w, h, r } = s, sw = w - 2 * r, sh = h - 2 * r, per = 2 * (sw + sh) + TAU * r; let d = u * per;
        const seg = [sw, TAU * r / 4, sh, TAU * r / 4, sw, TAU * r / 4, sh, TAU * r / 4]; let k = 0;
        while (d > seg[k]) { d -= seg[k]; k++; }
        const a = d / r;
        if (k === 0) { x = -sw / 2 + d; y = h / 2; }
        else if (k === 1) { x = sw / 2 + Math.sin(a) * r; y = sh / 2 + Math.cos(a) * r; }
        else if (k === 2) { x = w / 2; y = sh / 2 - d; }
        else if (k === 3) { x = sw / 2 + Math.cos(a) * r; y = -sh / 2 - Math.sin(a) * r; }
        else if (k === 4) { x = sw / 2 - d; y = -h / 2; }
        else if (k === 5) { x = -sw / 2 - Math.sin(a) * r; y = -sh / 2 - Math.cos(a) * r; }
        else if (k === 6) { x = -w / 2; y = -sh / 2 + d; }
        else { x = -sw / 2 - Math.cos(a) * r; y = sh / 2 + Math.sin(a) * r; }
        x += s.cx; y += s.cy;
      } else if (s.t === 'fill') {
        do { x = (Math.random() - .5) * s.w; y = (Math.random() - .5) * s.h; } while (!inRR(x, y, s.w, s.h, s.r));
        x += s.cx; y += s.cy;
      } else if (s.t === 'line') {
        let t = u; if (s.dash) t = (Math.floor(u * 14) + Math.random() * .5) / 14;
        x = s.x1 + (s.x2 - s.x1) * t; y = s.y1 + (s.y2 - s.y1) * t;
      } else if (s.t === 'ring') { const a = u * TAU; x = s.cx + Math.cos(a) * s.r; y = s.cy + Math.sin(a) * s.r; }
      else if (s.t === 'disc') { const a = u * TAU, r = Math.sqrt(Math.random()) * s.r; x = s.cx + Math.cos(a) * r; y = s.cy + Math.sin(a) * r; }
      else if (s.t === 'arc') { const t = (Math.floor(u * 22) + Math.random() * .5) / 22, a = s.a0 + (s.a1 - s.a0) * t; x = s.cx + Math.cos(a) * s.r; y = s.cy + Math.sin(a) * s.r; }
      pts.push(x + (Math.random() - .5) * .018, y + (Math.random() - .5) * .018, s.core);
    }
  }
  return pts;
}

const VERT = /* glsl */`
attribute vec3 aSeed; attribute vec3 aTarget; attribute vec2 aGrid; attribute float aKind;
uniform float uTime,uOrder,uOrder2,uPR,uScale,uMobile,uMouseK; uniform vec2 uOff,uMouse,uView;
varying float vA; varying float vK;
vec3 chaos(vec3 s,float t){
  vec3 p=(s-.5)*vec3(uView.x*1.3,uView.y*1.35,7.);
  p.x+=sin(t*.11+s.y*12.+s.z*5.)*.9+sin(t*.07+s.x*9.)*.5;
  p.y+=cos(t*.09+s.x*11.+s.z*7.)*.8+sin(t*.05+s.z*13.)*.4;
  p.z+=sin(t*.13+s.x*6.+s.y*8.)*.9;
  return p;
}
void main(){
  vec3 c=chaos(aSeed,uTime); vec3 pos=c; float k=0.;
  if(aKind>.5){
    float on=aKind>1.5?1.:(1.-uMobile);
    vec3 tg=vec3(aTarget.xy*uScale+uOff,(aSeed.z-.5)*.22);
    tg.xy+=.014*vec2(sin(uTime*1.3+aSeed.x*40.),cos(uTime*1.1+aSeed.y*40.));
    float dl=clamp(length(aTarget.xy)/7.5,0.,1.)*.62+aSeed.x*.08;
    k=smoothstep(dl,dl+.3,uOrder)*on;
    vec2 dv=tg.xy-uMouse; float sc=exp(-dot(dv,dv)/1.5)*uMouseK;
    k*=1.-sc*.92; k=k*k*(3.-2.*k);
    pos=mix(c,tg,k);
    pos.xy+=normalize(dv+1e-4)*sc*.55;
  }
  float k2=0.;
  if(aGrid.x>-5.){
    vec3 lat=vec3(aGrid*uView*1.08,0.);
    float rip=sin(length(lat.xy-uMouse)*1.6-uTime*1.4);
    lat.z=rip*.28;
    k2=smoothstep(aSeed.y*.55,aSeed.y*.55+.45,uOrder2); k2=k2*k2*(3.-2.*k2);
    pos=mix(pos,lat,k2);
  }
  vec4 mv=modelViewMatrix*vec4(pos,1.);
  gl_Position=projectionMatrix*mv;
  float sz=mix(mix(1.1,2.5,aSeed.z)*(1.+k*.25),1.9,k2);
  gl_PointSize=uPR*sz*(16./-mv.z);
  float base=mix(.22,.5,aSeed.x);
  vA=mix(mix(base,.95,k),.85,k2);
  if(aGrid.x<-5.) vA*=1.-uOrder2;
  vK=max(k,k2);
}`;
const FRAG = /* glsl */`
precision mediump float;
uniform vec3 uColA,uColB; uniform float uAlpha;
varying float vA; varying float vK;
void main(){
  float d=length(gl_PointCoord-.5);
  float a=smoothstep(.5,.12,d)*vA*uAlpha;
  if(a<.004) discard;
  gl_FragColor=vec4(mix(uColA,uColB,vK),a);
}`;

export function createField(canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { canvas.style.display = 'none'; return null; }
  const small = Math.min(innerWidth, innerHeight) < 700;
  const COUNT = small ? 12000 : 26000, TARGETS = Math.round(COUNT * .72);
  const PR = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(PR);
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(35, 1, .1, 100); cam.position.z = 16;
  const viewH = 2 * 16 * Math.tan(THREE.MathUtils.degToRad(17.5));

  const tg = buildTargets(TARGETS), nT = tg.length / 3;
  const seed = new Float32Array(COUNT * 3), target = new Float32Array(COUNT * 3), grid = new Float32Array(COUNT * 2), kind = new Float32Array(COUNT);
  const nGrid = Math.round(COUNT * .34), cols = Math.round(Math.sqrt(nGrid * 1.78)), rows = Math.ceil(nGrid / cols);
  for (let i = 0; i < COUNT; i++) {
    seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random();
    if (i < nT) { target[i * 3] = tg[i * 3]; target[i * 3 + 1] = tg[i * 3 + 1]; kind[i] = tg[i * 3 + 2] ? 2 : 1; }
    // lattice members are spread across both target and ambient particles
    const g = i % 3 === 0 ? i / 3 : -1;
    if (g >= 0 && g < cols * rows) { grid[i * 2] = (g % cols) / (cols - 1) - .5; grid[i * 2 + 1] = Math.floor(g / cols) / (rows - 1) - .5; }
    else { grid[i * 2] = -9; grid[i * 2 + 1] = -9; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aGrid', new THREE.BufferAttribute(grid, 2));
  geo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  const U = {
    uTime: { value: 0 }, uOrder: { value: 0 }, uOrder2: { value: 0 }, uPR: { value: PR }, uScale: { value: 1 }, uMobile: { value: 0 },
    uMouseK: { value: 0 }, uOff: { value: new THREE.Vector2() }, uMouse: { value: new THREE.Vector2(99, 99) }, uView: { value: new THREE.Vector2(18, viewH) },
    uColA: { value: new THREE.Color('#8E88C8') }, uColB: { value: new THREE.Color('#B9B2FF') }, uAlpha: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: U, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false; scene.add(points);

  function resize() {
    const w = innerWidth, h = innerHeight, asp = w / h;
    renderer.setSize(w, h, false); cam.aspect = asp; cam.updateProjectionMatrix();
    const vw = viewH * asp; U.uView.value.set(vw, viewH);
    if (asp < 1.05) { // phone only, centred low
      U.uMobile.value = 1; const s = Math.min(vw * .6 / 3.4, viewH * .5 / 6.9); U.uScale.value = s; U.uOff.value.set(0, -viewH * .16);
    } else {
      U.uMobile.value = 0; const s = Math.min(viewH * .7 / 7.6, vw * .46 / 8.9); U.uScale.value = s; U.uOff.value.set(vw * .5 - vw * .03 - 7.22 * s, .1);
    }
  }
  resize(); addEventListener('resize', resize);

  const state = { order: 0, order2: 0, alpha: 1, running: true };
  let mx = 99, my = 99, lastMove = -1e9, tilt = 0;
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    mx = (e.clientX / innerWidth * 2 - 1) * U.uView.value.x / 2; my = -(e.clientY / innerHeight * 2 - 1) * viewH / 2;
    tilt = e.clientX / innerWidth - .5; lastMove = performance.now();
  }, { passive: true });

  let t0 = performance.now(), time = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - t0) / 1000); t0 = now;
    if (!state.running || state.alpha < .01 || document.hidden) return;
    if (!reduce) time += dt;
    U.uTime.value = time; U.uOrder.value = state.order; U.uOrder2.value = state.order2; U.uAlpha.value = state.alpha;
    U.uMouse.value.x += (mx - U.uMouse.value.x) * .18; U.uMouse.value.y += (my - U.uMouse.value.y) * .18;
    const active = now - lastMove < 650 ? 1 : 0;
    U.uMouseK.value += (active - U.uMouseK.value) * (active ? .2 : .035);
    points.rotation.y += (tilt * .1 - points.rotation.y) * .04;
    renderer.render(scene, cam);
  }
  raf = requestAnimationFrame(frame);

  return {
    state,
    colors(a, b) { U.uColA.value.set(a); U.uColB.value.set(b); },
    blend(additive) { mat.blending = additive ? THREE.AdditiveBlending : THREE.NormalBlending; mat.needsUpdate = true; },
  };
}
