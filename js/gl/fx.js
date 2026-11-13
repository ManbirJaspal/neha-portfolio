// Atmosphere and set pieces: the field of light, caustics thrown by the glass, the outcomes marquee.
import * as THREE from 'three';
import { setFont, BLEND } from './doc.js';

/* The field: points of light that take a new order in every chapter. Each point's place is worked out in the vertex
   shader from its seed, so a couple of hundred thousand of them move for free. It is drawn twice: behind the glass,
   where the glass bends it, and in front. */
const FIELD_VERT = /* glsl */`
attribute vec4 aS;
uniform float uTime,uPR,uFrom,uTo,uMix,uVW,uVH,uVert,uSide,uSplit,uVel,uScroll,uPtrOn,uIntro;
uniform vec4 uFA,uFB; uniform vec2 uPtr; uniform vec3 uA,uB;
varying float vA; varying float vSoft; varying vec3 vCol;
const float TAU=6.2831853;
float gD;
float h1(float n){return fract(sin(n*127.1)*43758.5453);}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 flow(vec3 p,float t){return vec3(sin(p.y*1.7+t)+sin(p.z*1.3-t*.7),sin(p.z*1.5+t*.8)+sin(p.x*1.1+t*.6),sin(p.x*1.9-t*.9)+sin(p.y*1.2+t*.5))*.5;}
// 0 intro: rings of light turning around the lens, the far side seen through it; a little dust further out
vec3 f0(vec4 s,float t){ float R=uFA.w;
  if(s.w>.87){ vec3 d=(s.xyz-.5)*vec3(uVW*1.9,uVH*1.7,11.); d.z-=2.5; d+=flow(d*.3,t*.2)*.25; gD=.28; return d; }
  float r=R*(1.3+1.2*s.x), a=s.y*TAU+t*.22/(.7+s.x); gD=(.3+1.1*pow(.5+.5*sin(s.x*52.+1.),2.))*(1.-.45*s.x);
  vec3 p=vec3(cos(a)*r,(s.z-.5)*R*.03,sin(a)*r); p+=flow(p*.8,t*.3)*.028*R;
  p.yz=rot(.36)*p.yz; p.xy=rot(-.3)*p.xy; return uFA.xyz+p; }
// 1 statement: streams arrive tangled, are drawn through the lens and leave in order
vec3 f1(vec4 s,float t){ float R=uFA.w, lanes=58., lane=floor(s.y*lanes), ly=(lane+.5)/lanes-.5;
  float span=mix(uVW,uVH,uVert)*1.5, breadth=mix(uVH,uVW,uVert); vec2 L=mix(uFA.xy,vec2(-uFA.y,uFA.x),uVert);
  float al=(fract(s.x-t*(.01+.014*h1(lane)))-.5)*span, k=smoothstep(L.x+R*.15,L.x+R*.15+span*.3,al); k*=k;
  float ac=ly*breadth*.96+(s.z-.5)*.014, z=-1.5+(h1(lane+3.7)-.5)*2.8;
  ac+=.06*sin(al*1.1+t*.5+lane*.19);
  vec3 tg=flow(vec3(al*.7,ly*11.+s.z*2.,s.w*5.),t*.45); ac+=tg.x*breadth*.17*k; z+=tg.y*1.2*k; al+=tg.z*.5*k;
  float c=exp(-pow((al-L.x)/(R*1.5),2.)); ac=mix(ac,L.y+(ac-L.y)*.3,c); z=mix(z,uFA.z-.8,c*.8);
  return vec3(mix(vec2(al,ac),vec2(ac,-al),uVert),z); }
// 2, 3 work and outcomes: a floor of points with a slow swell; for the outcomes it climbs
vec3 f2(vec4 s,float t,float rise){ vec2 n=vec2(250.,130.), g=(floor(s.xy*n)+.5)/n; float x=(g.x-.5)*max(uVW*2.7,13.), z=3.-g.y*27.;
  float d=length(vec2(x*.8,z+4.)), y=-uVH*.5+.13*sin(d*1.15-t*.9)+.08*sin(x*.9+z*.6+t*.5);
  y+=rise*uVH*.3*pow(smoothstep(-uVW*.45,uVW*.8,x),1.6)*(1.+.12*sin(z*.7+t*.6));
  return vec3(x+(s.z-.5)*.03,y,z+(s.w-.5)*.03); }
// 4 skills: a globe of points inside the rings of type
vec3 f4(vec4 s,float t){ float R=uFB.w*1.62, rows=34., row=floor(s.x*rows), v=(row+.5)/rows*2.-1., c=sqrt(1.-v*v);
  float a=s.y*TAU+t*(.03+.09*(h1(row)-.5)); vec3 p=vec3(c*cos(a),v,c*sin(a))*R*(1.+.012*sin(s.z*50.+t*2.));
  p.xy=rot(.32)*p.xy; p.yz=rot(.22)*p.yz; return uFB.xyz+p; }
// 5 about: still air, a few points adrift
vec3 f5(vec4 s,float t){ vec3 p=(s.xyz-.5)*vec3(uVW*1.8,uVH*1.6,13.); p.z-=1.5; p.y=mod(p.y+uScroll*(.3+s.w*.8)+t*.03+uVH*.8,uVH*1.6)-uVH*.8; p.x+=sin(t*.1+s.w*20.)*.3; return p; }
// 6 contact: everything falls toward one point
vec3 f6(vec4 s,float t){ float R=uFB.w, q=fract(s.x-t*.018*(.5+s.w)), r=R*(1.22+4.8*q*q), a=floor(s.y*5.)/5.*TAU+(s.z-.5)*(.45+q*.8)+(1.-q)*4.6+t*.06;
  vec3 p=vec3(cos(a)*r,sin(a)*r,-1.1+(s.w-.5)*.6*q); p.yz=rot(-.62)*p.yz; return uFB.xyz+p; }
float dimOf(float id){ return id<.5?1.:id<1.5?.7:id<3.5?1.15:id<4.5?.62:id<5.5?.4:1.; }
vec3 form(float id,vec4 s,float t){ gD=dimOf(id); if(id<.5) return f0(s,t); if(id<1.5) return f1(s,t); if(id<2.5) return f2(s,t,0.); if(id<3.5) return f2(s,t,1.); if(id<4.5) return f4(s,t); if(id<5.5) return f5(s,t); return f6(s,t); }
void main(){
  float t=uTime, e=clamp(uMix*1.45-aS.w*.45,0.,1.); e=e*e*(3.-2.*e);
  vec3 pa=form(uFrom,aS,t); float da=gD; vec3 pb=form(uTo,aS,t); float db=gD; vec3 p=mix(pa,pb,e);
  p+=flow(pa*.45+aS.xyz*3.,t*.6)*sin(e*3.14159)*(.55+uVel*.5)*vec3(.9,.7,.9);
  p.xy*=mix(2.3,1.,uIntro);
  vec2 pt=uPtr*vec2(uVW,uVH)*.5*(10.-p.z)/10., dd=p.xy-pt; float pd=dot(dd,dd); p.xy+=dd/(sqrt(pd)+.001)*.28*exp(-pd*2.4)*uPtrOn;
  vec4 mv=modelViewMatrix*vec4(p,1.); float depth=-mv.z;
  if((p.z-uSplit)*uSide<0.||depth<.7){ gl_Position=vec4(2.,2.,2.,1.); gl_PointSize=0.; return; }
  float coc=abs(depth-9.6), tw=.62+.38*sin(t*(1.+aS.z*2.)+aS.w*40.), sz=min(.95+aS.z*aS.z*1.7+coc*1.1,14.);
  gl_PointSize=max(1.,uPR*sz*(10./depth)); vSoft=clamp(coc*.5,0.,1.);
  vA=mix(da,db,e)*tw*(.45+.55*aS.x)/(1.+coc*coc*.9)*smoothstep(.8,2.6,depth)*uIntro;
  vCol=mix(uA,uB,smoothstep(.25,.85,aS.w+.22*sin(p.x*.4+t*.1)))+vec3(.3)*step(.94,aS.z);
  gl_Position=projectionMatrix*mv; }`;
const FIELD_FRAG = /* glsl */`uniform float uGain; varying float vA; varying float vSoft; varying vec3 vCol;
void main(){ float d=length(gl_PointCoord-.5)*2.; if(d>1.) discard;
  float disc=mix(exp(-d*d*3.4),smoothstep(1.,.74,d)*(.5+.5*smoothstep(.25,.95,d)),vSoft); gl_FragColor=vec4(vCol*disc*vA*uGain,1.); }`;
export class Field {
  constructor(stage, n) {
    const seed = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aS', new THREE.BufferAttribute(seed, 4));
    const f = v => ({ value: v });
    this.u = { uTime: f(0), uPR: f(1), uFrom: f(0), uTo: f(0), uMix: f(0), uVW: f(10), uVH: f(5), uVert: f(0), uSplit: f(99), uVel: f(0), uScroll: f(0), uPtrOn: f(1), uIntro: f(0), uGain: f(1),
      uFA: f(new THREE.Vector4(0, 0, 0, 1)), uFB: f(new THREE.Vector4(0, 0, 0, 1)), uPtr: f(new THREE.Vector2()), uA: f(new THREE.Color('#6B5BFF')), uB: f(new THREE.Color('#FF8A5C')) };
    const mk = (side, extra) => { const p = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { ...this.u, uSide: f(side) }, vertexShader: FIELD_VERT, fragmentShader: FIELD_FRAG, depthWrite: false, ...extra })); p.frustumCulled = false; stage.world.add(p); return p; };
    this.back = mk(-1, { transparent: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor }); this.back.renderOrder = -7;
    this.front = mk(1, { transparent: true, blending: THREE.AdditiveBlending }); this.front.renderOrder = 6;
  }
}

/* light focused through the glass onto the wall behind it */
export class Caustics {
  constructor(stage) {
    this.u = { uTime: { value: 0 }, uGain: { value: 0 }, uA: { value: new THREE.Color('#6B5BFF') }, uB: { value: new THREE.Color('#FF8A5C') } };
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: this.u, transparent: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: /* glsl */`uniform float uTime,uGain; uniform vec3 uA,uB; varying vec2 vUv;
        float net(vec2 uv,float t){ vec2 p=mod(uv*6.2831,6.2831)-250.; vec2 i=p; float c=1.; const float inten=.005;
          for(int n=0;n<4;n++){ float tt=t*(1.-3.5/float(n+1)); i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x)); c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten))); }
          c/=4.; c=1.17-pow(c,1.4); return pow(abs(c),8.); }
        void main(){ vec2 c=vUv-.5; float r=length(c); float m=smoothstep(.5,.08,r); if(m*uGain<.002) discard;
          float t=uTime*.35; vec2 uv=c*1.5+vec2(.1,.2);
          vec3 col=vec3(net(uv*1.02+.006,t),net(uv,t),net(uv*.98-.006,t));
          vec3 tint=mix(uA,uB,smoothstep(-.3,.35,c.x+c.y*.6));
          gl_FragColor=vec4((col*mix(tint,vec3(1.),.35)*.9+tint*.05*m)*m*m*uGain,1.); }` }));
    this.mesh.frustumCulled = false; this.mesh.renderOrder = -9; stage.flat.add(this.mesh);
  }
}

/* outcomes as rows of large type running across the screen; the droplets pass in front and bend them */
export class Marquee {
  constructor(stage, rows) {
    this.stage = stage; this.rows = []; this.group = new THREE.Group(); stage.flat.add(this.group); this.group.visible = false;
    const maxW = Math.min(stage.renderer.capabilities.maxTextureSize, stage.small ? 4096 : 8192);
    rows.forEach((row, i) => {
      const H = 220, cv = document.createElement('canvas'), c = cv.getContext('2d'); setFont(c, row.font);
      const gap = 150, widths = row.items.map(w => c.measureText(w).width), total = widths.reduce((a, b) => a + b + gap, 0), k = Math.min(1, maxW / total);
      cv.width = Math.ceil(total * k); cv.height = Math.ceil(H * k); c.setTransform(k, 0, 0, k, 0, 0); setFont(c, row.font); c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 2.6;
      let x = 0; row.items.forEach((w, j) => { row.outline ? c.strokeText(w, x, H / 2 + 6) : c.fillText(w, x, H / 2 + 6); x += widths[j] + gap; c.save(); c.translate(x - gap / 2, H / 2 + 4); c.rotate(.785); c.fillRect(-9, -9, 18, 18); c.restore(); });
      const t = new THREE.CanvasTexture(cv); t.wrapS = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      const u = { uMap: { value: t }, uColor: { value: new THREE.Color(row.color || '#F2EFFF') }, uOff: { value: 0 }, uRep: { value: 1 }, uOpacity: { value: 1 } };
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ uniforms: u, ...BLEND,
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader: 'uniform sampler2D uMap; uniform vec3 uColor; uniform float uOff,uRep,uOpacity; varying vec2 vUv; void main(){ float a=texture2D(uMap,vec2(vUv.x*uRep+uOff,vUv.y)).a*smoothstep(0.,.06,vUv.x)*smoothstep(1.,.94,vUv.x); if(a<.012) discard; gl_FragColor=vec4(uColor,a*uOpacity); }' }));
      m.frustumCulled = false; m.renderOrder = -6; this.group.add(m); this.rows.push({ m, u, aspect: total / H, dir: i % 2 ? -1 : 1, speed: row.speed || .02, off: i * .37 });
    });
  }
  // cx, cy: centre in world units at depth z; rowH: world height of one row
  update(cx, cy, z, rowH, gapY, width, time, scroll) {
    const n = this.rows.length;
    this.rows.forEach((r, i) => { r.m.position.set(cx, cy + ((n - 1) / 2 - i) * (rowH + gapY), z); r.m.scale.set(width, rowH, 1); r.u.uRep.value = width / (rowH * r.aspect); r.u.uOff.value = r.off + r.dir * (time * r.speed + scroll); });
  }
}
