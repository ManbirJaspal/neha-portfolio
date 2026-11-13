// DOM-synced WebGL text and images. The DOM element stays in the page for layout, selection and screen readers;
// its pixels are drawn in WebGL behind the glass, so the glass can bend them.
import * as THREE from 'three';

const KW = [[50, 'ultra-condensed'], [62.5, 'extra-condensed'], [75, 'condensed'], [87.5, 'semi-condensed'], [100, 'normal'], [112.5, 'semi-expanded'], [125, 'expanded'], [150, 'extra-expanded'], [200, 'ultra-expanded']];
const stretch = v => { const p = parseFloat(v) || 100; return KW.reduce((a, b) => Math.abs(b[0] - p) < Math.abs(a[0] - p) ? b : a)[1]; };
// some canvas implementations reject a width keyword in the font shorthand; fall back to the plain face
export function setFont(ctx, font) { ctx.font = '10px serif'; ctx.font = font; if (ctx.font === '10px serif') ctx.font = font.replace(/ (ultra|extra|semi)-(condensed|expanded)| condensed| expanded/, ''); }
const VERT = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';

// wrap every word in a span so its exact position can be read back
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
  constructor(stage, el, { z = -1.6, color = '#F1EEFF', lines = 0 } = {}) {
    this.stage = stage; this.el = el; this.z = z; this.words = splitWords(el); this.pad = 0;
    this.canvas = document.createElement('canvas'); this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4; this.tex.generateMipmaps = true;
    this.u = { uMap: { value: this.tex }, uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uProg: { value: 2 }, uLines: { value: lines || 1 }, uDim: { value: lines ? .16 : 1 } };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, alphaToCoverage: true, fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity,uProg,uLines,uDim; varying vec2 vUv;
      void main(){ float a=texture2D(uMap,vUv).a; if(a<.03) discard;
        float order=(1.-vUv.y)*(1.-1./uLines)+vUv.x/uLines;
        float lit=mix(uDim,1.,smoothstep(order-.12,order+.02,uProg));
        gl_FragColor=vec4(uColor*uOpacity*lit,a); }` }));
    this.mesh.frustumCulled = false; stage.flat.add(this.mesh); this.pos = new THREE.Vector3();
    el.classList.add('gl-live');
  }
  raster() {
    const r = this.el.getBoundingClientRect(); if (r.width < 2) return;
    const fs = parseFloat(getComputedStyle(this.el).fontSize), pad = this.pad = Math.ceil(fs * .22);
    const scale = Math.min(2, (devicePixelRatio || 1) * 1.25, 4096 / (r.width + pad * 2), 4096 / (r.height + pad * 2));
    const cv = this.canvas; cv.width = Math.ceil((r.width + pad * 2) * scale); cv.height = Math.ceil((r.height + pad * 2) * scale);
    const ctx = cv.getContext('2d'); ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic';
    for (const w of this.words) {
      const wr = w.getBoundingClientRect(), cs = getComputedStyle(w);
      setFont(ctx, `${cs.fontStyle} ${cs.fontWeight} ${stretch(cs.fontStretch)} ${cs.fontSize} ${cs.fontFamily}`);
      try { ctx.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing; } catch (e) {}
      const m = ctx.measureText(w.textContent), asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      ctx.fillText(w.textContent, wr.left - r.left + pad, wr.top - r.top + pad + (wr.height - asc - desc) / 2 + asc);
    }
    this.tex.needsUpdate = true; this.w = r.width; this.h = r.height;
  }
  update() {
    const r = this.el.getBoundingClientRect(), st = this.stage;
    const vis = r.bottom > -80 && r.top < st.size.h + 80 && r.width > 2; this.mesh.visible = vis && this.u.uOpacity.value > .003; if (!vis) return;
    const s = st.place(r, this.z, this.pos); this.mesh.position.copy(this.pos);
    this.mesh.scale.set((r.width + this.pad * 2) * s, (r.height + this.pad * 2) * s, 1);
  }
}

export class GLImage {
  constructor(stage, el, { z = -1.2, radius = 24 } = {}) {
    this.stage = stage; this.el = el; this.z = z; this.hover = 0; this.hv = 0;
    this.u = { uMap: { value: null }, uSize: { value: new THREE.Vector2(1, 1) }, uImg: { value: new THREE.Vector2(1, 1) }, uRadius: { value: radius }, uVel: { value: 0 }, uHover: { value: 0 }, uShow: { value: 0 }, uTime: { value: 0 } };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 24, 24), new THREE.ShaderMaterial({ uniforms: this.u, alphaToCoverage: true,
      vertexShader: /* glsl */`varying vec2 vUv; uniform float uVel; void main(){vUv=uv; vec3 p=position; p.z+=sin(uv.x*3.14159)*uVel*.9; p.y+=sin(uv.x*3.14159)*uVel*.12; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform vec2 uSize,uImg; uniform float uRadius,uVel,uHover,uShow,uTime; varying vec2 vUv;
      void main(){
        vec2 px=(vUv-.5)*uSize; vec2 q=abs(px)-uSize*.5+uRadius; float d=length(max(q,0.))+min(max(q.x,q.y),0.)-uRadius;
        float a=1.-smoothstep(-1.,1.,d); if(a<.03) discard;
        float ra=uSize.x/uSize.y, ia=uImg.x/uImg.y; vec2 sc=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);
        vec2 uv=(vUv-.5)*sc*(1.-.04*uHover)+.5;
        uv.y+=(1.-uShow)*.08;
        float sh=uVel*.008+uHover*.0012*sin(uTime*2.+vUv.y*9.);
        vec3 c=vec3(texture2D(uMap,uv+vec2(0.,sh)).r,texture2D(uMap,uv).g,texture2D(uMap,uv-vec2(0.,sh)).b);
        float wipe=smoothstep(0.,.12,uShow*1.12-(1.-vUv.y)); if(wipe<.015) discard;
        gl_FragColor=vec4(c*wipe*(.92+.08*uHover),a);
      }` }));
    this.mesh.frustumCulled = false; this.mesh.visible = false; stage.flat.add(this.mesh); this.pos = new THREE.Vector3();
    const load = () => { new THREE.TextureLoader(stage.loading).load(el.currentSrc || el.src, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; this.u.uMap.value = t; this.u.uImg.value.set(t.image.width, t.image.height); el.classList.add('gl-live'); this.ready = true; }); };
    el.src ? load() : el.addEventListener('load', load, { once: true });
    el.addEventListener('pointerenter', () => { this.hover = 1; }); el.addEventListener('pointerleave', () => { this.hover = 0; });
  }
  update(time, vel) {
    const r = this.el.getBoundingClientRect(), st = this.stage;
    const vis = this.ready && r.bottom > -120 && r.top < st.size.h + 120; this.mesh.visible = vis; if (!vis) return;
    const s = st.place(r, this.z, this.pos); this.mesh.position.copy(this.pos); this.mesh.scale.set(r.width * s, r.height * s, 1);
    this.hv += (this.hover - this.hv) * .08; const u = this.u; u.uHover.value = this.hv; u.uVel.value += (vel - u.uVel.value) * .12; u.uTime.value = time;
    u.uSize.value.set(r.width, r.height);
    const target = r.top < st.size.h * .88 ? 1 : 0; u.uShow.value += (target - u.uShow.value) * .045;
  }
}
