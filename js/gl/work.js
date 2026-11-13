// The work exhibits: a Blender-modelled phone running the returns chat on its screen,
// and four glass blocks holding the other projects. Blocks are frosted until they come into focus.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FLOW } from '../chat.js';
import { src } from '../media.js';

export const PHONE = { w: 1.56, h: 3.22, d: .172, corner: .345, edge: .05 };
const LW = 320, LH = 681, INK = '#16161D', INDIGO = '#4F46E5';

/* ---- the phone screen: the same flow as the case study, drawn to a canvas texture ---- */
export class ChatScreen {
  constructor() {
    this.cv = document.createElement('canvas'); this.cv.width = LW * 2; this.cv.height = LH * 2; this.ctx = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.flipY = false; this.tex.anisotropy = 8; this.step = -1;
  }
  rr(x, y, w, h, r) { const c = this.ctx; c.beginPath(); c.roundRect(x, y, w, h, r); }
  wrap(text, max) { const c = this.ctx, out = []; let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
  set(step) { if (step === this.step) return; this.step = step; this.draw(); }
  draw() {
    const c = this.ctx, F = (w, s) => { c.font = `${w} ${s}px "Hanken Grotesk", system-ui, sans-serif`; };
    c.setTransform(2, 0, 0, 2, 0, 0); c.fillStyle = '#D4D4DA'; c.fillRect(0, 0, LW, LH);
    c.fillStyle = INK; F(600, 13); c.textBaseline = 'middle'; c.fillText('14:08', 26, 27);
    this.rr(108, 13, 104, 28, 14); c.fillStyle = '#0B0B0F'; c.fill(); this.rr(270, 21, 24, 12, 3); c.fillStyle = INK; c.fill();
    this.rr(0, 52, LW, LH, 22); c.fillStyle = '#fff'; c.fill();
    const st = FLOW[this.step];
    if (st.camera) {
      this.rr(0, 52, LW, LH, 22); c.fillStyle = '#000'; c.fill();
      c.fillStyle = '#fff'; F(500, 11); c.fillText('Flash off', 20, 80); c.fillStyle = '#8E84FF'; c.fillText('Done', 276, 80);
      const g = c.createRadialGradient(200, 330, 10, 200, 330, 230); g.addColorStop(0, '#3B2B25'); g.addColorStop(.35, '#8A7263'); g.addColorStop(.8, '#D9D2CC'); c.fillStyle = g; c.fillRect(0, 104, LW, 430);
      c.fillStyle = '#fff'; c.fillText('0 of 3', 34, 600); c.beginPath(); c.arc(160, 600, 30, 0, 7); c.fill(); c.beginPath(); c.arc(160, 600, 25, 0, 7); c.fillStyle = '#2F5BE0'; c.fill();
      this.tex.needsUpdate = true; return;
    }
    // header
    const ring = (x, t, col) => { c.beginPath(); c.arc(x, 76, 13, 0, 7); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = '#E3E3EA'; c.lineWidth = 1; c.stroke(); c.fillStyle = col; F(500, 13); c.textAlign = 'center'; c.fillText(t, x, 77); c.textAlign = 'left'; };
    ring(30, '+', INDIGO); ring(260, '···', INK); ring(292, '✕', INK); c.fillStyle = INK; F(700, 14); c.fillText('Chat with eBay.ai', 52, 77);
    // body blocks
    const X = 16, W = LW - 32, blocks = []; let y = 0;
    const add = (h, fn) => { blocks.push([y, h, fn]); y += h + 10; };
    add(26, t => { c.fillStyle = '#75758A'; F(400, 9.2); c.textAlign = 'center'; c.fillText('Chat with eBay.ai is experimental. Check our Privacy', LW / 2, t + 7); c.fillText('Notice and learn how eBay.ai processes your data.', LW / 2, t + 19); c.textAlign = 'left'; });
    add(60, t => { this.rr(X, t, W, 60, 12); c.fillStyle = '#F4F4F7'; c.fill(); this.rr(X + 10, t + 14, 44, 32, 5); const g = c.createLinearGradient(X + 10, t + 14, X + 54, t + 46); g.addColorStop(0, '#C9C9D4'); g.addColorStop(.55, '#C9C9D4'); g.addColorStop(.6, '#8C8C9B'); g.addColorStop(.66, '#DADAE2'); c.fillStyle = g; c.fill();
      c.fillStyle = INK; F(400, 10); c.fillText('Apple MacBook Air 13" M3', X + 64, t + 16); c.fillText('Order: 10-00271-71596', X + 64, t + 30); F(700, 11); c.fillText('$145.00', X + 64, t + 45); });
    FLOW.forEach((s, i) => { if (i > this.step) return; for (const [who, body] of s.msgs) {
      if (who === 'u') { F(400, 10.4); const tw = c.measureText(body).width; add(26, t => { this.rr(X + W - tw - 20, t, tw + 20, 26, 8); c.fillStyle = INDIGO; c.fill(); c.fillStyle = '#fff'; F(400, 10.4); c.fillText(body, X + W - tw - 10, t + 13.5); }); }
      else if (who === 'thumbs') add(74, t => { for (let k = 0; k < 3; k++) { this.rr(X + W - 22, t + k * 26, 22, 22, 4); const g = c.createLinearGradient(0, t + k * 26, 22, t + k * 26 + 22); g.addColorStop(.2, '#D9D2CB'); g.addColorStop(.6, '#9A8474'); g.addColorStop(1, '#5E4C41'); c.fillStyle = g; c.fill(); } });
      else if (who === 'photo') add(150, t => { const px = X + W - 150; this.rr(px, t, 150, 150, 7); c.fillStyle = '#A9814F'; c.fill(); this.rr(px + 16, t + 12, 118, 70, 3); const g = c.createLinearGradient(px + 16, t + 12, px + 134, t + 82); g.addColorStop(0, '#8E2DE2'); g.addColorStop(.55, '#D03A9C'); g.addColorStop(1, '#F27A54'); c.fillStyle = g; c.fill(); c.strokeStyle = '#1b1b20'; c.lineWidth = 3; c.stroke(); this.rr(px + 8, t + 86, 134, 50, 4); c.fillStyle = '#C9C9CF'; c.fill(); c.fillStyle = '#2A2A31'; for (let k = 0; k < 12; k++) c.fillRect(px + 13 + k * 10.6, t + 90, 8, 20); });
      else { F(400, 10.8); const rows = []; body.forEach(part => { if (Array.isArray(part)) part.forEach(li => this.wrap(li, W - 34).forEach((l, n) => rows.push([n ? '' : '•', l, 1]))); else { if (rows.length) rows.push(null); this.wrap(part.replace(/<\/?b>/g, ''), W - 18).forEach(l => rows.push(['', l])); } });
        let h = 0; rows.forEach(r => { h += r ? 14 : 5; }); add(h, t => { c.fillStyle = INK; F(400, 10.8); let yy = t + 7; rows.forEach(r => { if (!r) { yy += 5; return; } if (r[0]) c.fillText('•', X + 6, yy); c.fillText(r[1], X + (r[2] ? 16 : 0), yy); yy += 14; }); }); }
    } });
    if (st.chips) { F(400, 10); const rowsC = [[]]; let cx = 0; st.chips.forEach((t, j) => { const w = c.measureText(t).width + 20 + (st.cam && !j ? 14 : 0); if (st.stack ? rowsC[rowsC.length - 1].length : cx + w > W) { rowsC.push([]); cx = 0; } rowsC[rowsC.length - 1].push([t, w, j, cx]); cx += w + 7; });
      add(rowsC.length * 34 - 6, t => rowsC.forEach((r, k) => r.forEach(([txt, w, j, x0]) => { this.rr(X + x0 + .5, t + k * 34 + .5, w, 28, 8); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = j === st.pick ? INDIGO : '#B9B9C6'; c.lineWidth = j === st.pick ? 1.6 : 1; c.stroke(); c.fillStyle = INK; F(400, 10); c.fillText(txt, X + x0 + 10 + (st.cam && !j ? 14 : 0), t + k * 34 + 15); if (st.cam && !j) { c.strokeStyle = INK; c.lineWidth = 1; this.rr(X + x0 + 8, t + k * 34 + 10, 11, 8, 2); c.stroke(); } }))); }
    const top = 100, bottom = LH - 60, avail = bottom - top, off = Math.min(0, avail - y);
    c.save(); c.beginPath(); c.rect(0, top, LW, avail); c.clip(); blocks.forEach(([by, bh, fn]) => { if (by + off + bh > -20) fn(top + by + off); }); c.restore();
    c.fillStyle = '#EFEFF3'; c.fillRect(0, bottom, LW, 1); this.rr(X, bottom + 12, 244, 32, 16); c.fillStyle = '#F4F4F7'; c.fill();
    c.fillStyle = '#8A8A9C'; F(400, 10); c.fillText(st.input || 'Type here...', X + 16, bottom + 28.5); c.beginPath(); c.arc(288, bottom + 28, 15, 0, 7); c.fillStyle = '#C9C9D2'; c.fill();
    this.tex.needsUpdate = true;
  }
}

const REVEAL_V = ['#include <common>', '#include <common>\nvarying float vRy;'], REVEAL_V2 = ['#include <begin_vertex>', '#include <begin_vertex>\nvRy=position.y;'];
function revealable(mat, u, glow = true) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uReveal = u;
    sh.vertexShader = sh.vertexShader.replace(...REVEAL_V).replace(...REVEAL_V2);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vRy; uniform float uReveal;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif(vRy>uReveal) discard;');
    if (glow) sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.55,.45,1.)*smoothstep(.16,0.,uReveal-vRy)*step(uReveal,1.7)*4.;');
  };
  mat.customProgramCacheKey = () => 'reveal' + glow + mat.type;
  return mat;
}

export const PROJECT_TONES = ['#6B5BFF', '#2FBF86', '#E59A4C', '#35B8CE', '#EE5FA0'];

export class Work {
  constructor(stage, images) {
    this.stage = stage; this.group = new THREE.Group(); stage.world.add(this.group); this.group.visible = false;
    this.reveal = { value: -2 }; this.chat = new ChatScreen();
    // phone
    this.phone = new THREE.Group(); this.group.add(this.phone); this.items = [this.phone];
    const M = {
      Titanium: revealable(new THREE.MeshStandardMaterial({ color: 0x9a96a6, metalness: 1, roughness: .26, envMapIntensity: 1.35 }), this.reveal),
      BackGlass: revealable(new THREE.MeshPhysicalMaterial({ color: 0x0b0a18, roughness: .14, clearcoat: 1, clearcoatRoughness: .05, envMapIntensity: 1.2 }), this.reveal),
      Black: revealable(new THREE.MeshStandardMaterial({ color: 0x030306, roughness: .4 }), this.reveal),
      Lens: revealable(new THREE.MeshPhysicalMaterial({ color: 0x05050c, roughness: .03, clearcoat: 1, metalness: .3 }), this.reveal),
      Screen: revealable(new THREE.MeshBasicMaterial({ map: this.chat.tex, color: 0xdcdce4 }), this.reveal, false),
    };
    new GLTFLoader(stage.loading).load('assets/phone.glb', g => {
      let screen = null; g.scene.traverse(o => { if (o.isMesh) { if (o.material.name === 'Screen') screen = o; o.material = M[o.material.name] || M.Titanium; o.frustumCulled = false; } });
      if (screen) { // cover glass: studio reflections drawn over the lit screen
        const glare = new THREE.Mesh(screen.geometry, revealable(new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: .07, envMapIntensity: .13, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), this.reveal, false));
        glare.position.copy(screen.position); glare.quaternion.copy(screen.quaternion); glare.scale.copy(screen.scale); glare.position.z += .004; glare.frustumCulled = false; screen.parent.add(glare);
      }
      this.phone.add(g.scene); this.chat.set(0);
    });
    // glass blocks
    const geo = new RoundedBoxGeometry(4.08, 2.38, .26, 6, .09), plane = new THREE.PlaneGeometry(3.78, 2.08), loader = new THREE.TextureLoader(stage.loading);
    this.blocks = images.map((id, i) => {
      const g = new THREE.Group(); this.group.add(g); this.items.push(g);
      const glass = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .4, ior: 1.5, roughness: .5, dispersion: 1.2, clearcoat: 1, clearcoatRoughness: .04, iridescence: .3, iridescenceIOR: 1.3, envMapIntensity: 1.15, attenuationColor: new THREE.Color(PROJECT_TONES[i + 1]).lerp(new THREE.Color('#fff'), .72), attenuationDistance: 2.2 }));
      // the picture sits inside the glass (so frost blurs it) and a crisp copy comes forward when the block is in focus
      const img = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: 0xffffff })); img.position.z = -.07;
      const front = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })); front.position.z = .1315;
      loader.load(src(id, 2048), t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; img.material.map = front.material.map = t; img.material.needsUpdate = front.material.needsUpdate = true; });
      g.add(img, glass, front); return { g, glass, img, front };
    });
    this.q = new THREE.Quaternion(); this.e = new THREE.Euler();
  }
  // p: which exhibit is in focus (0..4, fractional while travelling). arrive: 0..1 as the section comes in.
  update({ p, arrive, cx, cy, unit, time, pointer, narrow }) {
    const ease = t => t * t * (3 - 2 * t), slide = (1 - ease(Math.min(1, Math.max(0, (arrive - .35) / .65)))) * 9;
    this.reveal.value = THREE.MathUtils.lerp(-1.8, 1.78, Math.min(1, Math.max(0, (arrive - .62) / .38)));
    this.items.forEach((g, i) => {
      const d = i - p, ad = Math.abs(d), near = Math.max(0, 1 - ad);
      g.visible = ad < 1.9; if (!g.visible) return;
      const s = unit * (i ? (narrow ? 1.14 : 1) : (narrow ? 1.3 : 1.16)) * (1 - .16 * Math.min(ad, 1)), bob = Math.sin(time * .7 + i * 1.7) * .05 * unit;
      // on wide screens the exhibits turn past like a wheel (the copy sits to the left); on narrow ones they pass sideways
      if (narrow) { g.position.set(cx + d * 5.6 * unit + (i ? slide : 0), cy + bob, -Math.min(ad, 2) * 1.5); g.rotation.set(pointer.sy * .07 * near, (i ? -.1 : -.3) * near - d * .5 + Math.sin(time * .5 + i) * .03, 0); }
      else { g.position.set(cx + ad * ad * .22 * unit, cy - d * 3.75 * unit * (1 - .06 * Math.min(ad, 2)) + bob - (i ? slide : 0), -Math.min(ad, 2) * 1.7);
        g.rotation.set(d * .5 + pointer.sy * .06 * near + (i ? 0 : .04), ((i ? -.2 : -.44) + pointer.sx * .16 + Math.sin(time * .5 + i) * .03) * (.35 + .65 * near), 0); }
      g.scale.setScalar(s);
      if (i) { const b = this.blocks[i - 1]; b.glass.material.roughness = Math.min(.62, ad * .8); b.img.material.color.setScalar(1 - Math.min(.55, ad * .6)); const o = Math.min(1, Math.max(0, 1 - ad * 2.6)); b.front.material.opacity = o; b.front.visible = o > .01; b.img.visible = o < .985; }
    });
  }
}
