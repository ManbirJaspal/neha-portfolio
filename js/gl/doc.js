// Page type and images drawn in WebGL at their DOM positions, so glass in front of them can bend them.
// The DOM element stays in the page for layout, selection and screen readers.
import * as THREE from 'three';

const KW = [[50, 'ultra-condensed'], [62.5, 'extra-condensed'], [75, 'condensed'], [87.5, 'semi-condensed'], [100, 'normal'], [112.5, 'semi-expanded'], [125, 'expanded'], [150, 'extra-expanded'], [200, 'ultra-expanded']];
const stretch = v => { const p = parseFloat(v) || 100; return KW.reduce((a, b) => Math.abs(b[0] - p) < Math.abs(a[0] - p) ? b : a)[1]; };
// some canvas implementations reject a width keyword in the font shorthand; fall back to the plain face
export function setFont(ctx, font) { ctx.font = '10px serif'; ctx.font = font; if (ctx.font === '10px serif') ctx.font = font.replace(/ (ultra|extra|semi)-(condensed|expanded)| condensed| expanded/, ''); }
// drawn in the opaque pass (so glass refracts it) but alpha-blended, which keeps edges smooth without multisampling
export const BLEND = { transparent: false, blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor, depthWrite: false };

export function splitWords(el) {
  const walk = n => {
    if (n.nodeType === 3) {
      const f = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(' ')); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; f.appendChild(s); } });
      n.replaceWith(f);
    } else if (n.nodeType === 1 && !n.classList.contains('w')) [...n.childNodes].forEach(walk);
  };
  [...el.childNodes].forEach(walk);
  return [...el.querySelectorAll('.w')];
}

export class GLText {
  constructor(stage, el, { z = -1.6, color = '#F2EFFF', lines = 0 } = {}) {
    this.stage = stage; this.el = el; this.z = z; this.words = splitWords(el); this.pad = 0; this.show = 0; this.showTarget = 1;
    this.canvas = document.createElement('canvas'); this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.u = { uMap: { value: this.tex }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uProg: { value: 2 }, uLines: { value: lines || 1 }, uDim: { value: lines ? .15 : 1 }, uVel: { value: 0 }, uShow: { value: 1 } };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 8, 4), new THREE.ShaderMaterial({ uniforms: this.u, ...BLEND,
      vertexShader: 'varying vec2 vUv; uniform float uVel; void main(){vUv=uv; vec3 p=position; p.x+=p.y*uVel*.11; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader: /* glsl */`uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity,uProg,uLines,uDim,uShow; varying vec2 vUv;
      void main(){ vec2 uv=vUv; uv.y-=(1.-uShow)*.07; float a=texture2D(uMap,uv).a; 
        float wipe=smoothstep(0.,.22,uShow*1.22-vUv.x*.12-(1.-vUv.y)*.1); a*=wipe; if(a<.012) discard;
        float order=(1.-vUv.y)*(1.-1./uLines)+vUv.x/uLines;
        float lit=mix(uDim,1.,smoothstep(order-.12,order+.02,uProg));
        gl_FragColor=vec4(uColor*lit,a*uOpacity); }` }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = -6; stage.flat.add(this.mesh); this.pos = new THREE.Vector3();
    el.classList.add('gl-live');
  }
  raster() {
    const r = this.el.getBoundingClientRect(); if (r.width < 2) return;
    const fs = parseFloat(getComputedStyle(this.el).fontSize), pad = this.pad = Math.ceil(fs * .24);
    const scale = Math.min(2, (devicePixelRatio || 1) * 1.1, 4096 / (r.width + pad * 2), 4096 / (r.height + pad * 2));
    const cv = this.canvas; cv.width = Math.ceil((r.width + pad * 2) * scale); cv.height = Math.ceil((r.height + pad * 2) * scale);
    const ctx = cv.getContext('2d'); ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
    for (const w of this.words) {
      const wr = w.getBoundingClientRect(), cs = getComputedStyle(w);
      setFont(ctx, `${cs.fontStyle} ${cs.fontWeight} ${stretch(cs.fontStretch)} ${cs.fontSize} ${cs.fontFamily}`);
      try { ctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing; } catch (e) {}
      const m = ctx.measureText(w.textContent), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      ctx.fillText(w.textContent, wr.left - r.left + pad, wr.top - r.top + pad + (wr.height - asc - desc) / 2 + asc);
    }
    this.tex.needsUpdate = true;
  }
  // r: the element's rect in viewport pixels
  update(r, vel, dt) {
    const st = this.stage, u = this.u;
    const vis = r.top + r.height > -120 && r.top < st.size.h + 120 && r.width > 2;
    if (vis && r.top < st.size.h * .92) this.show += (this.showTarget - this.show) * (1 - Math.exp(-dt * 2.6));
    u.uShow.value = this.show; u.uVel.value += (vel - u.uVel.value) * .1;
    this.mesh.visible = vis && u.uOpacity.value > .003 && this.show > .002; if (!this.mesh.visible) return;
    const s = st.place(r, this.z, this.pos); this.mesh.position.copy(this.pos);
    this.mesh.scale.set((r.width + this.pad * 2) * s, (r.height + this.pad * 2) * s, 1);
  }
}

const IMG_FRAG = /* glsl */`
uniform sampler2D uMap; uniform vec2 uSize,uImg; uniform vec4 uCrop; uniform float uRadius,uVel,uHover,uShow,uTime,uDim; varying vec2 vUv;
void main(){
  vec2 px=(vUv-.5)*uSize; vec2 q=abs(px)-uSize*.5+uRadius; float d=length(max(q,0.))+min(max(q.x,q.y),0.)-uRadius;
  float a=1.-smoothstep(-1.2,.6,d);
  float ra=uSize.x/uSize.y, ia=(uImg.x*uCrop.z)/(uImg.y*uCrop.w); vec2 sc=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);
  vec2 uv=(vUv-.5)*sc*(1.-.05*uHover)+.5; uv.y+=(1.-uShow)*.07;
  uv=uCrop.xy+uv*uCrop.zw;
  float sh=uVel*.006+uHover*.001*sin(uTime*2.+vUv.y*9.);
  vec3 c=vec3(texture2D(uMap,uv+vec2(0.,sh)).r,texture2D(uMap,uv).g,texture2D(uMap,uv-vec2(0.,sh)).b);
  float wipe=smoothstep(0.,.14,uShow*1.14-(1.-vUv.y)); a*=wipe; if(a<.012) discard;
  gl_FragColor=vec4(c*uDim*(.94+.06*uHover),a);
}`;
const IMG_VERT = 'varying vec2 vUv; uniform float uVel; void main(){vUv=uv; vec3 p=position; p.z+=sin(uv.x*3.14159)*uVel*.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}';
const imgUniforms = radius => ({ uMap: { value: null }, uSize: { value: new THREE.Vector2(1, 1) }, uImg: { value: new THREE.Vector2(1, 1) }, uCrop: { value: new THREE.Vector4(0, 0, 1, 1) }, uRadius: { value: radius }, uVel: { value: 0 }, uHover: { value: 0 }, uShow: { value: 0 }, uTime: { value: 0 }, uDim: { value: 1 } });

export class GLImage {
  constructor(stage, el, { z = -1.2, radius = 24 } = {}) {
    this.stage = stage; this.el = el; this.z = z; this.hover = 0; this.hv = 0; this.u = imgUniforms(radius);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 16, 8), new THREE.ShaderMaterial({ uniforms: this.u, ...BLEND, vertexShader: IMG_VERT, fragmentShader: IMG_FRAG }));
    this.mesh.frustumCulled = false; this.mesh.visible = false; this.mesh.renderOrder = -5; stage.flat.add(this.mesh); this.pos = new THREE.Vector3();
    const load = () => new THREE.TextureLoader(stage.loading).load(el.currentSrc || el.src, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; this.u.uMap.value = t; this.u.uImg.value.set(t.image.width, t.image.height); el.classList.add('gl-live'); this.ready = true; });
    el.src ? load() : el.addEventListener('load', load, { once: true });
    el.addEventListener('pointerenter', () => { this.hover = 1; }); el.addEventListener('pointerleave', () => { this.hover = 0; });
  }
  update(r, time, vel, dt) {
    const st = this.stage, vis = this.ready && r.top + r.height > -140 && r.top < st.size.h + 140; this.mesh.visible = vis; if (!vis) return;
    const s = st.place(r, this.z, this.pos); this.mesh.position.copy(this.pos); this.mesh.scale.set(r.width * s, r.height * s, 1);
    const u = this.u, k = 1 - Math.exp(-dt * 6); this.hv += (this.hover - this.hv) * k; u.uHover.value = this.hv; u.uVel.value += (vel - u.uVel.value) * k; u.uTime.value = time; u.uSize.value.set(r.width, r.height);
    u.uShow.value += ((r.top < st.size.h * .86 ? 1 : 0) - u.uShow.value) * (1 - Math.exp(-dt * 2.4));
  }
}

// one image cut into a grid of tiles that float at different depths and settle into place
export class GLTiles {
  constructor(stage, el, { cols = 3, rows = 3, z = -1.0 } = {}) {
    this.stage = stage; this.el = el; this.z = z; this.cols = cols; this.rows = rows; this.tiles = []; this.t = 0; this.pos = new THREE.Vector3();
    const geo = new THREE.PlaneGeometry(1, 1, 4, 4);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const u = imgUniforms(10); u.uCrop.value.set(x / cols, 1 - (y + 1) / rows, 1 / cols, 1 / rows); u.uShow.value = 1;
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, ...BLEND, vertexShader: IMG_VERT, fragmentShader: IMG_FRAG })); m.frustumCulled = false; m.visible = false; stage.world.add(m);
      const i = y * cols + x, h = n => { const s = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return s - Math.floor(s); };
      m.renderOrder = -5 + (h(1) - .5) * .5;
      this.tiles.push({ m, u, x, y, dz: (h(1) - .5) * 1.5, rx: (h(2) - .5) * .5, ry: (h(3) - .5) * .7, sx: (h(4) - .5) * 3.2, sy: (h(5) - .5) * 2.4, ph: h(6) * 6.28 });
    }
    const load = () => new THREE.TextureLoader(stage.loading).load(el.currentSrc || el.src, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; this.tiles.forEach(o => { o.u.uMap.value = t; o.u.uImg.value.set(t.image.width, t.image.height); }); el.classList.add('gl-live'); this.ready = true; });
    el.src ? load() : el.addEventListener('load', load, { once: true });
  }
  update(r, time, dt, pointer) {
    const st = this.stage, vis = this.ready && r.top + r.height > -200 && r.top < st.size.h + 200; this.tiles.forEach(o => { o.m.visible = vis; }); if (!vis) return;
    const s = st.place(r, this.z, this.pos), gap = 8, tw = (r.width - gap * (this.cols - 1)) / this.cols, th = (r.height - gap * (this.rows - 1)) / this.rows;
    const settle = Math.min(1, Math.max(0, (st.size.h * .95 - r.top) / (st.size.h * .6))); this.t += (settle - this.t) * (1 - Math.exp(-dt * 3)); const e = this.t * this.t * (3 - 2 * this.t), f = 1 - e;
    for (const o of this.tiles) {
      const cx = (o.x - (this.cols - 1) / 2) * (tw + gap) * s, cy = -(o.y - (this.rows - 1) / 2) * (th + gap) * s, bob = Math.sin(time * .6 + o.ph) * .03;
      o.m.position.set(this.pos.x + cx + o.sx * f + pointer.sx * o.dz * .12, this.pos.y + cy + o.sy * f + bob + pointer.sy * o.dz * .08, this.z + o.dz * (.25 + f * 1.4));
      o.m.rotation.set(o.rx * (f + .12) + pointer.sy * .05, o.ry * (f + .12) + pointer.sx * .08, 0);
      const k = 1 - (o.dz * (.25 + f * 1.4)) / (10 - this.z); o.m.scale.set(tw * s * k, th * s * k, 1); o.u.uSize.value.set(tw, th); o.u.uTime.value = time; o.u.uDim.value = .55 + .45 * e;
    }
  }
}
