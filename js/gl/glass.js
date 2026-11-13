// The glass form: one mesh that is a restless blob, a calm lens, or a crisp rounded slab.
// Shape and normals are computed in the vertex shader so it can morph between them continuously.
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

let geo = null;
function geometry(seg) {
  if (geo) return geo;
  geo = new THREE.BoxGeometry(2, 2, 2, seg, seg, seg);
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
    this.mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: .6, ior: 1.42, roughness: .035, metalness: 0,
      dispersion: 6, iridescence: .7, iridescenceIOR: 1.35,  clearcoat: .5, clearcoatRoughness: .06,
      attenuationColor: new THREE.Color('#d6d0ff'), attenuationDistance: 5, envMapIntensity: 1.2, ...opts });
    this.mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + HEAD).replace('#include <beginnormal_vertex>', NORMAL).replace('#include <begin_vertex>', 'vec3 transformed=gP0; vLy=gP0.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLy; uniform float uCut;').replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif(vLy<uCut) discard;');
    };
    this.mat.customProgramCacheKey = () => 'glassform';
    this.mesh = new THREE.Mesh(geometry(stage.small ? 44 : 76), this.mat); this.mesh.frustumCulled = false;
    stage.world.add(this.mesh);
  }
}
