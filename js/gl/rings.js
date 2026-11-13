// Skills as rings of type in orbit around the glass. The glass bends whatever passes behind it.
import * as THREE from 'three';
import { setFont } from './doc.js';

const VERT = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const FRAG = /* glsl */`uniform sampler2D uMap; uniform vec3 uColor; uniform float uOpacity; varying vec2 vUv;
void main(){ float a=texture2D(uMap,vUv).a; if(a<.04) discard; gl_FragColor=vec4(uColor*uOpacity*(gl_FrontFacing?1.:.16),a); }`;

function ringTexture(words, font, outline, maxW) {
  const H = 200, cv = document.createElement('canvas'), c = cv.getContext('2d'); setFont(c, font);
  const gap = 110, widths = words.map(w => c.measureText(w).width), total = widths.reduce((a, b) => a + b + gap, 0), k = Math.min(1, maxW / total);
  cv.width = Math.ceil(total * k); cv.height = Math.ceil(H * k); c.setTransform(k, 0, 0, k, 0, 0); setFont(c, font); c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 3;
  let x = 0; words.forEach((w, i) => { outline ? c.strokeText(w, x, H / 2 + 6) : c.fillText(w, x, H / 2 + 6); x += widths[i] + gap; c.beginPath(); c.arc(x - gap / 2, H / 2 + 4, 9, 0, 7); c.fill(); });
  const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return { t, aspect: total / H };
}

export class Rings {
  constructor(stage, groups) {
    this.stage = stage; this.group = new THREE.Group(); stage.world.add(this.group); this.group.visible = false; this.spin = 0; this.vel = 0; this.rings = [];
    const maxW = Math.min(stage.renderer.capabilities.maxTextureSize, stage.small ? 4096 : 8192);
    // three lines of type on one cylinder, turning against each other
    const R = 2.55, specs = [
      { font: '500 semi-expanded 150px "Roboto Flex", sans-serif', speed: .1 },
      { font: 'italic 400 176px "Instrument Serif", serif', speed: -.075 },
      { font: '500 semi-expanded 150px "Roboto Flex", sans-serif', speed: .09, outline: true },
    ];
    this.group.rotation.set(.17, 0, -.11);
    specs.forEach((sp, i) => {
      const { t, aspect } = ringTexture(groups[i], sp.font, sp.outline, maxW), h = 2 * Math.PI * R / aspect;
      const u = { uMap: { value: t }, uColor: { value: new THREE.Color('#F1EEFF') }, uOpacity: { value: 1 } };
      const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, h, 160, 1, true), new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, side: THREE.DoubleSide, alphaToCoverage: true }));
      m.position.y = (1 - i) * .66; m.rotation.y = i * 2.1; m.frustumCulled = false; this.group.add(m);
      this.rings.push({ m, sp, u, base: i * 2.1 });
    });
  }
  update(time, dt, scrollVel) {
    this.vel *= .94; this.spin += this.vel;
    this.rings.forEach(({ m, sp, base }) => { m.rotation.y = base + time * sp.speed + this.spin * (sp.speed > 0 ? 1 : -1); });
  }
}
