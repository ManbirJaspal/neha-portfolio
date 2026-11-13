// The WebGL stage: renderer, studio environment (rendered in Blender), aurora backdrop, post-processing.
import * as THREE from 'three';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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

const BACKDROP_FRAG = /* glsl */`
precision highp float; varying vec2 vUv; uniform float uTime,uAspect,uLift; uniform vec3 uA,uB,uC; uniform vec2 uMouse;
${NOISE}
void main(){
  vec2 p=(vUv-.5)*vec2(uAspect,1.);
  float t=uTime*.035;
  vec2 w=p+.35*vec2(snoise(vec3(p*.7,t)),snoise(vec3(p*.7+7.,t+3.)));
  float n1=snoise(vec3(w*.55+vec2(.0,t*.7),t))*.5+.5;
  float n2=snoise(vec3(w*.8+4.,t*1.3+9.))*.5+.5;
  float n3=snoise(vec3(w*1.1-9.,t*.9+21.))*.5+.5;
  vec3 col=vec3(.008,.007,.02);
  col+=uA*pow(n1,2.6)*.4*smoothstep(1.25,.1,length(p-vec2(.55,.12)-uMouse*.08));
  col+=uB*pow(n2,3.)*.26*smoothstep(1.3,.0,length(p-vec2(-.75,-.35)));
  col+=uC*pow(n3,3.4)*.22*smoothstep(1.1,.0,length(p-vec2(.2,-.6)));
  col*=uLift;
  col*=smoothstep(1.35,.25,length(p*vec2(.8,1.)));
  gl_FragColor=vec4(col,1.);
}`;

const FINAL = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 1 }, uGrain: { value: .04 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime,uCA,uGrain; varying vec2 vUv;
    float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
    void main(){
      vec2 c=vUv-.5; float d=dot(c,c);
      vec2 off=c*d*.006*uCA;
      vec3 col=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);
      col*=mix(1.,.62,smoothstep(.12,.62,d));
      float g=hash(gl_FragCoord.xy+floor(uTime*24.)*17.13)-.5;
      col+=g*uGrain*(1.-.5*dot(col,vec3(.33)));
      gl_FragColor=vec4(col,1.);
    }`,
};

export function createStage(canvas, { onProgress } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
  if (!renderer.capabilities.isWebGL2) return null;
  const small = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer:coarse)').matches;
  let dpr = Math.min(devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x05040c, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 60); camera.position.set(0, 0, CAM_Z);
  const world = new THREE.Group(); scene.add(world);           // 3D objects that take the pointer parallax
  const flat = new THREE.Group(); scene.add(flat);             // DOM-synced text and images, no parallax

  // backdrop
  const bU = { uTime: { value: 0 }, uAspect: { value: 1 }, uLift: { value: 0 }, uMouse: { value: new THREE.Vector2() },
    uA: { value: new THREE.Color('#5B4BFF') }, uB: { value: new THREE.Color('#1F4BFF') }, uC: { value: new THREE.Color('#B03CFF') } };
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: bU, fragmentShader: BACKDROP_FRAG, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}' }));
  backdrop.position.z = -9; backdrop.renderOrder = -10; scene.add(backdrop);

  // environment
  const loading = new THREE.LoadingManager(); let total = 1, done = 0;
  loading.onProgress = (u, l, t) => { done = l; total = t; onProgress && onProgress(l / t); };
  new HDRLoader(loading).load('assets/studio.hdr', tex => { tex.mapping = THREE.EquirectangularReflectionMapping; scene.environment = tex; });
  scene.environmentIntensity = 1.0;

  // post
  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .42, .85, 1.0); composer.addPass(bloom);
  const fin = new ShaderPass(FINAL); composer.addPass(fin);
  composer.addPass(new OutputPass());

  const size = { w: 1, h: 1, vw: 1, vh: 1, unit: 1 };
  function resize() {
    const w = innerWidth, h = innerHeight; size.w = w; size.h = h;
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); composer.setPixelRatio(dpr); composer.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    size.vh = 2 * CAM_Z * TAN; size.vw = size.vh * camera.aspect; size.unit = THREE.MathUtils.clamp(size.vw / 9.5, .5, 1.08);
    const bh = 2 * (CAM_Z + 9) * TAN * 1.1; backdrop.scale.set(bh * camera.aspect, bh, 1); bU.uAspect.value = camera.aspect;
  }
  resize(); addEventListener('resize', resize);

  const pointer = { x: 0, y: 0, sx: 0, sy: 0, moved: -1e9 };
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; pointer.x = e.clientX / innerWidth * 2 - 1; pointer.y = -(e.clientY / innerHeight * 2 - 1); pointer.moved = performance.now(); }, { passive: true });

  const updaters = []; let frames = 0, running = true, last = performance.now(), time = 0, slow = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!running || document.hidden) return;
    time += dt;
    pointer.sx += (pointer.x - pointer.sx) * .06; pointer.sy += (pointer.y - pointer.sy) * .06;
    world.rotation.y = pointer.sx * .035; world.rotation.x = -pointer.sy * .022;
    bU.uTime.value = time; bU.uMouse.value.set(pointer.sx, pointer.sy); fin.uniforms.uTime.value = time;
    scene.environmentRotation.y = time * .02 + pointer.sx * .25;
    for (const u of updaters) u(time, dt);
    composer.render(dt); frames++;
    // drop resolution once if this machine cannot keep up
    if (dt > .045) { if (++slow > 90 && dpr > 1) { dpr = 1; bloom.enabled = false; resize(); slow = -1e9; } } else if (slow > 0) slow--;
  }
  requestAnimationFrame(frame);

  // world size of one CSS pixel at depth z, and DOM rect -> world position
  const k = z => 2 * (CAM_Z - z) * TAN / size.h;
  const place = (rect, z, out) => { const s = k(z); out.x = (rect.left + rect.width / 2 - size.w / 2) * s; out.y = -(rect.top + rect.height / 2 - size.h / 2) * s; out.z = z; return s; };

  return { THREE, renderer, scene, camera, world, flat, size, pointer, loading, backdrop: bU, bloom, fin, k, place, small,
    onFrame: f => updaters.push(f), setRunning: v => { running = v; }, get time() { return time; }, get frames() { return frames; } };
}
