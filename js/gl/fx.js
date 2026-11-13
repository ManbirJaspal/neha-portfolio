// Atmosphere and set pieces: dust in the light, caustics thrown by the glass, the outcomes marquee.
import * as THREE from 'three';
import { setFont, BLEND } from './doc.js';

/* dust motes with depth of field: sharp near the focal plane, soft discs away from it; they drift with the page */
export class Dust {
  constructor(stage, n) {
    const pos = new Float32Array(n * 3), seed = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (Math.random() - .5) * 20; pos[i * 3 + 1] = (Math.random() - .5) * 12; pos[i * 3 + 2] = -7 + Math.random() * 13; seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3));
    this.u = { uTime: { value: 0 }, uScroll: { value: 0 }, uPR: { value: 1 }, uTint: { value: new THREE.Color('#8E84FF') }, uGain: { value: 1 }, uStreak: { value: 0 } };
    this.points = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`attribute vec3 aSeed; uniform float uTime,uScroll,uPR,uStreak; varying float vA; varying float vS; varying float vSoft;
        void main(){ vec3 p=position; float par=.25+aSeed.x*.9;
          p.y=mod(p.y+uScroll*par+uTime*.04*(.4+aSeed.z)+6.,12.)-6.; p.x+=sin(uTime*.11+aSeed.y*20.)*.35; p.z+=cos(uTime*.07+aSeed.x*17.)*.3;
          vec4 mv=modelViewMatrix*vec4(p,1.); float depth=-mv.z; float coc=abs(depth-10.);
          float size=(1.6+coc*2.6)*(.55+aSeed.z*.9); gl_PointSize=uPR*size*(10./depth)*(1.+uStreak*.6);
          vSoft=clamp(coc*.4,0.,1.); vA=(.16+.5*aSeed.y)/(1.+coc*coc*.5)*smoothstep(1.,3.,depth); vS=aSeed.x; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: /* glsl */`uniform vec3 uTint; uniform float uGain; varying float vA; varying float vS; varying float vSoft;
        void main(){ float d=length(gl_PointCoord-.5); float disc=smoothstep(.5,.5-mix(.42,.06,vSoft),d); disc*=mix(1.,.55+.45*smoothstep(.18,.46,d),vSoft);
          vec3 col=mix(vec3(1.,.95,.88),uTint,smoothstep(.45,1.,vS)); gl_FragColor=vec4(col*disc*vA*uGain,1.); }` }));
    this.points.frustumCulled = false; this.points.renderOrder = 5; stage.scene.add(this.points);
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
