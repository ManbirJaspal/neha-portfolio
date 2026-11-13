// The WebGL stage. One loop, one HDR render, a cheap post chain:
//   backdrop (low-res) -> scene (HDR, multisampled) -> bloom (quarter-size pyramid) -> tone map + grain, straight to the canvas
// The canvas is drawn at a working resolution that follows what the GPU can hold, so motion stays smooth.
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';

export const CAM_Z = 10, FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

export const NOISE = /* glsl */`
vec4 permute(vec4 x){return mod(((x*34.)+1.)*x,289.);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+2.*C.xxx;vec3 x3=x0-1.+3.*C.xxx;i=mod(i,289.);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=1./7.;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
`;

const FS_VERT = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';

// a dark studio: drifting haze in the chapter's colours, one key light with soft rays, a low horizon glow
const BACKDROP = /* glsl */`
precision highp float; varying vec2 vUv; uniform float uTime,uAspect,uLift,uRays; uniform vec3 uA,uB,uC; uniform vec2 uLight,uMouse;
${NOISE}
float fbm(vec3 p){return snoise(p)*.55+snoise(p*2.03+7.1)*.28+snoise(p*4.1-3.7)*.17;}
void main(){
  vec2 p=(vUv-.5)*vec2(uAspect,1.); float t=uTime*.03;
  vec2 w=p+.3*vec2(fbm(vec3(p*.6,t)),fbm(vec3(p*.6+5.,t+2.)));
  float h1=fbm(vec3(w*.55+vec2(0.,t),t*.8))*.5+.5, h2=fbm(vec3(w*.75+3.,t*1.2+9.))*.5+.5, h3=fbm(vec3(w*1.3-9.,t+21.))*.5+.5;
  vec3 col=vec3(.004,.004,.011);
  col+=uA*pow(h1,2.6)*.23*smoothstep(1.35,.05,length(p-vec2(.5,.1)-uMouse*.06));
  col+=uB*pow(h2,3.)*.2*smoothstep(1.3,0.,length(p-vec2(-.75,-.3)));
  col+=uC*pow(h3,3.4)*.13*smoothstep(1.05,0.,length(p-vec2(.15,-.62)));
  // key light and rays
  vec2 lp=uLight*vec2(uAspect,1.); vec2 d=p-lp; float r=length(d), ang=atan(d.y,d.x);
  float ray=pow(snoise(vec3(ang*5.,t*1.6,1.))*.5+.5,2.6)*.6+pow(snoise(vec3(ang*13.,t*2.4,4.))*.5+.5,3.)*.4;
  vec3 lc=mix(uA,vec3(1.,.96,.9),.55);
  col+=lc*(.2*exp(-r*r*7.)+.045*exp(-r*2.2))*(.75+.25*h1);
  col+=lc*ray*uRays*.06*exp(-r*1.5)*smoothstep(.04,.5,r);
  // horizon glow
  col+=mix(uB,uC,.5)*.07*exp(-pow((vUv.y-.02)*4.6,2.))*(.6+.4*h2);
  col*=uLift*smoothstep(1.5,.2,length(p*vec2(.78,1.)));
  gl_FragColor=vec4(col,1.);
}`;

const BRIGHT = /* glsl */`precision highp float; varying vec2 vUv; uniform sampler2D tMap; uniform vec2 uTexel; uniform float uThreshold;
void main(){ vec3 c=(texture2D(tMap,vUv+uTexel*vec2(-1.,-1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(1.,-1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(-1.,1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(1.,1.)).rgb)*.25;
  float l=max(c.r,max(c.g,c.b)); float k=smoothstep(uThreshold,uThreshold+.9,l); gl_FragColor=vec4(min(c,vec3(12.))*k,1.); }`;
const DOWN = /* glsl */`precision highp float; varying vec2 vUv; uniform sampler2D tMap; uniform vec2 uTexel;
void main(){ vec3 c=texture2D(tMap,vUv).rgb*4.; c+=texture2D(tMap,vUv+uTexel*vec2(-1.,-1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(1.,-1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(-1.,1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(1.,1.)).rgb; gl_FragColor=vec4(c/8.,1.); }`;
const UP = /* glsl */`precision highp float; varying vec2 vUv; uniform sampler2D tMap; uniform vec2 uTexel; uniform float uGain;
void main(){ vec3 c=texture2D(tMap,vUv+uTexel*vec2(-2.,0.)).rgb+texture2D(tMap,vUv+uTexel*vec2(2.,0.)).rgb+texture2D(tMap,vUv+uTexel*vec2(0.,-2.)).rgb+texture2D(tMap,vUv+uTexel*vec2(0.,2.)).rgb;
  c+=2.*(texture2D(tMap,vUv+uTexel*vec2(-1.,1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(1.,1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(-1.,-1.)).rgb+texture2D(tMap,vUv+uTexel*vec2(1.,-1.)).rgb); gl_FragColor=vec4(c/12.*uGain,1.); }`;
const COMPOSITE = /* glsl */`precision highp float; varying vec2 vUv; uniform sampler2D tScene,tBloom; uniform float uBloom,uCA,uExposure,uTime,uGrain;
float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec3 neutral(vec3 c){ float x=min(c.r,min(c.g,c.b)); float o=x<.08?x-6.25*x*x:.04; c-=o; float pk=max(c.r,max(c.g,c.b)); if(pk<.76) return c;
  float d=.24; float np=1.-d*d/(pk+d-.76); c*=np/pk; float g=1.-1./(.15*(pk-np)+1.); return mix(c,vec3(np),g); }
void main(){
  vec2 c=vUv-.5; float d=dot(c,c); vec2 off=c*d*.006*uCA;
  vec3 col=vec3(texture2D(tScene,vUv+off).r,texture2D(tScene,vUv).g,texture2D(tScene,vUv-off).b);
  col+=texture2D(tBloom,vUv).rgb*uBloom;
  col*=uExposure*mix(1.,.6,smoothstep(.1,.62,d));
  col=neutral(col); col=pow(clamp(col,0.,1.),vec3(1./2.2));
  float g=hash(gl_FragCoord.xy+floor(uTime*24.)*17.13)-.5; col+=g*uGrain*(1.-.55*dot(col,vec3(.33)));
  gl_FragColor=vec4(col,1.);
}`;

export function createStage(canvas, { onProgress } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
  if (!renderer.capabilities.isWebGL2) return null;
  const gl = renderer.getContext(), small = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer:coarse)').matches;
  renderer.toneMapping = THREE.NoToneMapping; renderer.setClearColor(0x020206, 1);
  renderer.transmissionResolutionScale = .6;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 60); camera.position.set(0, 0, CAM_Z);
  const world = new THREE.Group(); scene.add(world);      // 3D objects: take pointer parallax
  const flat = new THREE.Group(); scene.add(flat);        // DOM-synced type and images: stay locked to the page

  // fullscreen helper
  const fsScene = new THREE.Scene(), fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsTri = new THREE.Mesh(new THREE.PlaneGeometry(2, 2)); fsTri.frustumCulled = false; fsScene.add(fsTri);
  const mk = (frag, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, ...extra });
  const pass = (mat, target) => { fsTri.material = mat; renderer.setRenderTarget(target); renderer.render(fsScene, fsCam); };

  // backdrop rendered small, shown large
  const half = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const bgRT = new THREE.WebGLRenderTarget(384, 216, half);
  const bU = { uTime: { value: 0 }, uAspect: { value: 1 }, uLift: { value: 0 }, uRays: { value: 1 }, uMouse: { value: new THREE.Vector2() }, uLight: { value: new THREE.Vector2(.3, .34) },
    uA: { value: new THREE.Color('#5B4BFF') }, uB: { value: new THREE.Color('#1B3BFF') }, uC: { value: new THREE.Color('#FF6A4D') } };
  const bgMat = mk(BACKDROP, bU);
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bgRT.texture, depthWrite: false, toneMapped: false }));
  backdrop.position.z = -9; backdrop.renderOrder = -10; backdrop.frustumCulled = false; scene.add(backdrop);

  // environment (rendered in Blender)
  const loading = new THREE.LoadingManager();
  loading.onProgress = (u, l, t) => onProgress && onProgress(l / t);
  new HDRLoader(loading).load('assets/studio.hdr', tex => { tex.mapping = THREE.EquirectangularReflectionMapping; scene.environment = tex; });

  // render targets: the scene in HDR with multisampling (type stays sharp, edges stay clean), bloom on a quarter-size pyramid
  const mainRT = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: true, samples: 4, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const bl = [0, 1, 2, 3].map(() => new THREE.WebGLRenderTarget(4, 4, half));
  const mBright = mk(BRIGHT, { tMap: { value: mainRT.texture }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 1.0 } });
  const mDown = mk(DOWN, { tMap: { value: null }, uTexel: { value: new THREE.Vector2() } });
  const mUp = mk(UP, { tMap: { value: null }, uTexel: { value: new THREE.Vector2() }, uGain: { value: 1 } }, { blending: THREE.AdditiveBlending, transparent: true });
  const mComp = mk(COMPOSITE, { tScene: { value: mainRT.texture }, tBloom: { value: bl[0].texture }, uBloom: { value: .5 }, uCA: { value: 1 }, uExposure: { value: 1 }, uTime: { value: 0 }, uGrain: { value: .034 } });

  // resolution: the canvas itself is drawn at the working resolution, so every pass gets cheaper when it drops.
  // It starts inside a pixel budget and then follows what this machine can hold (see pace()).
  const size = { w: 1, h: 1, vw: 1, vh: 1, unit: 1, pr: 1, scale: 1, narrow: false };
  const PRMAX = Math.min(devicePixelRatio || 1, 2), PRMIN = Math.min(PRMAX, small ? 1.2 : 1.25), START = small ? 1.3e6 : 2.6e6, MOST = small ? 1.9e6 : 4.4e6;
  let scale = 1, ceiling = 1, lastW = 0, dirty = false;
  const fit = px => Math.min(1, Math.sqrt(px / (size.w * size.h * PRMAX * PRMAX))), lowest = () => Math.min(1, PRMIN / PRMAX);
  renderer.setPixelRatio(1);
  function applyScale() {
    const W = Math.max(2, Math.round(size.w * PRMAX * scale)), H = Math.max(2, Math.round(size.h * PRMAX * scale));
    renderer.setSize(W, H, false); mainRT.setSize(W, H); bl.forEach((r, i) => r.setSize(Math.max(2, W >> (i + 2)), Math.max(2, H >> (i + 2))));
    mBright.uniforms.uTexel.value.set(1 / W, 1 / H); size.pr = PRMAX * scale; size.rw = W; size.rh = H; dirty = false;
  }
  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; size.w = w; size.h = h; size.narrow = w < 900;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    size.vh = 2 * CAM_Z * TAN; size.vw = size.vh * camera.aspect; size.unit = THREE.MathUtils.clamp(size.vw / 9.5, .5, 1.08);
    const bh = 2 * (CAM_Z + 9) * TAN * 1.12; backdrop.scale.set(bh * camera.aspect, bh, 1); bU.uAspect.value = camera.aspect;
    if (w !== lastW) { scale = Math.max(lowest(), fit(START)); ceiling = Math.max(scale, fit(MOST)); lastW = w; hold = Math.max(hold, 90); }
    applyScale();
  }
  const listeners = []; let rzT = 0, hold = 150;
  resize();
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { const w0 = size.w; resize(); listeners.forEach(f => f(size.w !== w0)); }, 120); });

  // pointer (on touch screens the scene sways gently by itself)
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, touch: matchMedia('(pointer:coarse)').matches };
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; pointer.touch = false; pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = -(e.clientY / innerHeight * 2 - 1); }, { passive: true });

  // Pacing. A frame has to land inside the display's beat: when frames arrive late (or the GPU timer, where the browser
  // has one, says a frame costs most of the beat) the resolution steps down; with steady headroom it steps back up, and a
  // step up that does not hold is undone for good. Without a GPU timer a steady low rate could be a browser power cap,
  // so it is probed once: drop the resolution, and if the rate does not recover, give the pixels back.
  const tq = gl.getExtension('EXT_disjoint_timer_query_webgl2'); let query = null, pending = null, gpuMs = 0;
  const dts = new Float32Array(48); let di = 0, calm = 0, trial = false, good = 1, probe = 0, capped = false, fps = 60;
  const step = v => { scale = v; dirty = true; hold = 36; di = 0; calm = 0; };
  function pace(ms) {
    if (ms > 250) { hold = Math.max(hold, 24); return; }
    if (hold > 0) { hold--; return; }
    dts[di++] = ms; if (di < dts.length) return; di = 0;
    const s = Array.from(dts).sort((a, b) => a - b), base = s[6], beat = Math.min(Math.max(base, 8.3), 16.8), lo = lowest(); let late = 0; for (const v of s) if (v > base * 1.6) late++;
    const lateF = late / s.length, timed = !!tq && gpuMs > 0; fps = 1000 / s[24];
    const slow = lateF > .2 || (timed && gpuMs > beat * .8), roomy = lateF < .05 && (!timed || gpuMs < beat * .42);
    if (probe) { if (base < 21) { probe = 0; ceiling = scale; } else if (--probe === 0) { capped = true; step(good); } return; }
    if (trial) { trial = false; if (slow) { ceiling = good; step(good); return; } }
    if (slow) { if (scale > lo + .005) { ceiling = Math.max(lo, scale * .87); step(ceiling); } }
    else if (!timed && !capped && base > 21 && scale > lo + .005) { good = scale; probe = 2; step(Math.max(lo, scale * .75)); }
    else if (roomy) { if (++calm >= 3 && scale < ceiling - .005) { good = scale; trial = true; step(Math.min(ceiling, scale * 1.13)); } }
    else calm = 0;
  }

  const updaters = []; let running = true, time = 0, frames = 0;
  function frame(dt) {
    if (!running || document.hidden) return;
    pace(dt * 1000); if (dirty) applyScale();
    dt = Math.min(.05, dt); time += dt; frames++;
    if (pointer.touch) { pointer.x = Math.sin(time * .31) * .35; pointer.y = Math.cos(time * .23) * .25; }
    const k = 1 - Math.exp(-dt * 4.2); pointer.sx += (pointer.x - pointer.sx) * k; pointer.sy += (pointer.y - pointer.sy) * k;
    world.rotation.y = pointer.sx * .04; world.rotation.x = -pointer.sy * .024;
    bU.uTime.value = time; bU.uMouse.value.set(pointer.sx, pointer.sy); mComp.uniforms.uTime.value = time;
    scene.environmentRotation.y = time * .025 + pointer.sx * .3;
    for (const u of updaters) u(time, dt);

    if (tq && !pending) { query = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, query); }
    pass(bgMat, bgRT);
    renderer.setRenderTarget(mainRT); renderer.render(scene, camera);
    pass(mBright, bl[0]);
    for (let i = 1; i < 4; i++) { mDown.uniforms.tMap.value = bl[i - 1].texture; mDown.uniforms.uTexel.value.set(1 / bl[i - 1].width, 1 / bl[i - 1].height); pass(mDown, bl[i]); }
    renderer.autoClear = false;
    for (let i = 3; i > 0; i--) { mUp.uniforms.tMap.value = bl[i].texture; mUp.uniforms.uTexel.value.set(1 / bl[i].width, 1 / bl[i].height); pass(mUp, bl[i - 1]); }
    renderer.autoClear = true;
    pass(mComp, null);
    if (query) { gl.endQuery(tq.TIME_ELAPSED_EXT); pending = query; query = null; }
    else if (pending && gl.getQueryParameter(pending, gl.QUERY_RESULT_AVAILABLE)) {
      if (!gl.getParameter(tq.GPU_DISJOINT_EXT)) { const ms = gl.getQueryParameter(pending, gl.QUERY_RESULT) / 1e6; gpuMs = gpuMs ? gpuMs * .85 + ms * .15 : ms; }
      gl.deleteQuery(pending); pending = null;
    }
  }

  const kz = z => 2 * (CAM_Z - z) * TAN / size.h;
  // rect in viewport CSS pixels -> world position at depth z; returns world units per CSS pixel
  const place = (r, z, out) => { const s = kz(z); out.x = (r.left + r.width / 2 - size.w / 2) * s; out.y = -(r.top + r.height / 2 - size.h / 2) * s; out.z = z; return s; };

  return { THREE, renderer, scene, camera, world, flat, size, pointer, loading, backdrop: bU, post: { comp: mComp.uniforms, bright: mBright.uniforms }, kz, place, small, frame, settle: n => { hold = Math.max(hold, n); },
    // compile every program and upload every texture for the real target, so no scene hitches the first time it scrolls in
    warm: () => { try { renderer.setRenderTarget(mainRT); renderer.compile(scene, camera); renderer.render(scene, camera); } catch (e) {} renderer.setRenderTarget(null); },
    onFrame: f => updaters.push(f), onResize: f => listeners.push(f), setRunning: v => { running = v; },
    get time() { return time; }, get frames() { return frames; }, get gpuMs() { return gpuMs; }, get scale() { return scale; }, get fps() { return fps; } };
}
