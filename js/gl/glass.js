// Glass: the morphing form (blob, lens, slab), the light it carries inside, and the droplets around it.
import * as THREE from 'three';
import { NOISE } from './stage.js';

const HEAD = /* glsl */`
uniform float uTime,uMorph,uAmp,uFreq,uRadius,uR2,uRe,uFlow; uniform vec3 uBox;
attribute vec3 aTu; attribute vec3 aTv; vec3 gP0; varying float vLy;
${NOISE}
float warp1(float t){float a=abs(t);float w=a<=1.?mix(a,1.-(1.-a)*(1.-a),.75):1.+(a-1.)*.25;return sign(t)*w;}
vec3 blobf(vec3 p){
  vec3 p2=p*p; vec3 s=normalize(p*sqrt(max(1.-p2.yzx*.5-p2.zxy*.5+p2.yzx*p2.zxy/3.,.0001)));
  float t=uTime*uFlow;
  float n=snoise(s*uFreq+vec3(0.,t,t*.6))*.8+snoise(s*uFreq*2.1+vec3(t*1.3,3.,-t))*.12;
  return s*uRadius*(1.+uAmp*n);
}
vec3 slabf(vec3 p){
  vec3 q=vec3(warp1(p.x),warp1(p.y),warp1(p.z))*(uBox+vec3(uRe*.5));
  float ri=uR2-uRe; vec2 core=uBox.xy-vec2(uR2);
  vec2 c2=clamp(q.xy,-core,core); vec2 d2=q.xy-c2; float l2=length(d2);
  vec2 cxy=l2>ri?c2+d2/l2*ri:q.xy;
  float cz=clamp(q.z,-(uBox.z-uRe),uBox.z-uRe);
  vec3 c=vec3(cxy,cz); vec3 d=q-c; float l=length(d);
  return l>1e-5?c+d/l*uRe:q;
}
vec3 shapef(vec3 p){
  if(uMorph<=.0005) return blobf(p);
  if(uMorph>=.9995) return slabf(p);
  return mix(blobf(p),slabf(p),uMorph);
}`;
const NORMAL = /* glsl */`
gP0=shapef(position);
vec3 gPu=shapef(position+aTu*.014), gPv=shapef(position+aTv*.014);
vec3 objectNormal=normalize(cross(gPu-gP0,gPv-gP0));
#ifdef USE_TANGENT
vec3 objectTangent=vec3(tangent.xyz);
#endif`;

const geos = {};
function geometry(seg) {
  if (geos[seg]) return geos[seg];
  const geo = geos[seg] = new THREE.BoxGeometry(2, 2, 2, seg, seg, seg);
  const n = geo.attributes.normal, c = n.count, tu = new Float32Array(c * 3), tv = new Float32Array(c * 3);
  const T = { '1,0,0': [[0, 1, 0], [0, 0, 1]], '-1,0,0': [[0, 0, 1], [0, 1, 0]], '0,1,0': [[0, 0, 1], [1, 0, 0]], '0,-1,0': [[1, 0, 0], [0, 0, 1]], '0,0,1': [[1, 0, 0], [0, 1, 0]], '0,0,-1': [[0, 1, 0], [1, 0, 0]] };
  for (let i = 0; i < c; i++) { const t = T[`${Math.round(n.getX(i))},${Math.round(n.getY(i))},${Math.round(n.getZ(i))}`]; tu.set(t[0], i * 3); tv.set(t[1], i * 3); }
  geo.setAttribute('aTu', new THREE.BufferAttribute(tu, 3)); geo.setAttribute('aTv', new THREE.BufferAttribute(tv, 3));
  return geo;
}

export class GlassForm {
  constructor(stage, opts = {}) {
    this.u = { uTime: { value: 0 }, uMorph: { value: 0 }, uAmp: { value: .22 }, uFreq: { value: .72 }, uRadius: { value: 1.25 }, uFlow: { value: .16 },
      uBox: { value: new THREE.Vector3(.8, 1.62, .1) }, uR2: { value: .36 }, uRe: { value: .055 }, uCut: { value: -1e3 } };
    this.mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .6, ior: 1.42, roughness: .03, metalness: 0,
      dispersion: 6, iridescence: .75, iridescenceIOR: 1.35, clearcoat: .5, clearcoatRoughness: .06,
      attenuationColor: new THREE.Color('#d9d3ff'), attenuationDistance: 5, envMapIntensity: 1.25, ...opts });
    this.mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HEAD).replace('#include <beginnormal_vertex>', NORMAL).replace('#include <begin_vertex>', 'vec3 transformed=gP0; vLy=gP0.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLy; uniform float uCut;').replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif(vLy<uCut) discard;');
    };
    this.mat.customProgramCacheKey = () => 'glassform';
    this.mesh = new THREE.Mesh(geometry(stage.small ? 40 : 64), this.mat); this.mesh.frustumCulled = false;
    stage.world.add(this.mesh);
  }
}

// the light inside the glass: an opalescent core the glass refracts and the bloom picks up
export class Core {
  constructor(stage) {
    this.u = { uTime: { value: 0 }, uPower: { value: 1 }, uA: { value: new THREE.Color('#6B5BFF') }, uB: { value: new THREE.Color('#FF7A59') } };
    this.mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 5), new THREE.ShaderMaterial({ uniforms: this.u,
      vertexShader: /* glsl */`varying vec3 vN,vV,vP; uniform float uTime; ${NOISE}
        void main(){ vP=position; vec3 p=position*(1.+.14*snoise(position*1.4+vec3(0.,uTime*.3,uTime*.2))); vec4 mv=modelViewMatrix*vec4(p,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: /* glsl */`varying vec3 vN,vV,vP; uniform float uTime,uPower; uniform vec3 uA,uB; ${NOISE}
        void main(){ float f=1.-max(dot(normalize(vN),normalize(vV)),0.);
          float n=snoise(vP*1.5+vec3(0.,uTime*.22,uTime*.16))*.5+.5, n2=snoise(vP*3.2-vec3(uTime*.2))*.5+.5;
          vec3 col=mix(uA,uB,smoothstep(.25,.8,n)); col=mix(col,vec3(1.,.94,.84),pow(n2,3.)*.75);
          col=col*(.8+2.6*pow(1.-f,2.))+vec3(1.,.97,.92)*pow(1.-f,7.)*2.2;
          gl_FragColor=vec4(col*uPower,1.); }` }));
    this.mesh.frustumCulled = false; stage.world.add(this.mesh);
  }
}

// small glass droplets: they orbit the form, get absorbed, and come back
export class Droplets {
  constructor(stage, n) {
    const geo = new THREE.SphereGeometry(1, 40, 28);
    this.mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .5, ior: 1.4, roughness: .02, dispersion: 5, iridescence: .7, iridescenceIOR: 1.3, clearcoat: .4, envMapIntensity: 1.3, attenuationColor: new THREE.Color('#d9d3ff'), attenuationDistance: 4 });
    this.items = Array.from({ length: n }, (_, i) => { const m = new THREE.Mesh(geo, this.mat); m.frustumCulled = false; m.visible = false; stage.world.add(m);
      return { m, i, ph: i * 2.399, r: .06 + ((i * 37) % 10) / 10 * .13, tx: 0, ty: 0, tz: 0, ts: 0, s: 0 }; });
  }
  // call target(i, x, y, z, size) for each droplet, then step(dt)
  target(i, x, y, z, s) { const d = this.items[i]; if (!d) return; d.tx = x; d.ty = y; d.tz = z; d.ts = s; }
  step(dt, snap) {
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.2);
    for (const d of this.items) { d.s += (d.ts - d.s) * k; d.m.visible = d.s > .004; if (!d.m.visible) { d.m.position.set(d.tx, d.ty, d.tz); continue; }
      d.m.position.x += (d.tx - d.m.position.x) * k; d.m.position.y += (d.ty - d.m.position.y) * k; d.m.position.z += (d.tz - d.m.position.z) * k; d.m.scale.setScalar(d.s); }
  }
}
