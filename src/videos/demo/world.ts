// The "Perbedaan Saham vs Kripto" world in one Three.js scene:
// - Painted 5-stop sky dome (golden arena, day Bursa Efek, night Cyber Blockchain Lab, space Storm Volatility)
// - Glowing starfield + moon disc & motivated lamp/neon halos (NOINK layer 3)
// - All 5 Hero 3D Sets (Split Stage, Bursa Efek OJK/BEI Hall, Cyber Blockchain 24/7 Lab, Auto Rejection Vault, Volatile Storm Room)
// - 2D lit character sprites (cardShade) + contact/cast shadow blobs + cartoon FX cards
import * as THREE from "three";
import {
  V, Kit,
  buildSplitSet, buildBursaSet, buildCryptoSet, buildAraSet, buildVolatileSet,
} from "./build";
import { ctex, rng } from "./paint";
import { LIGHTS, LOOK, LightPreset } from "./lights";
import { TONE, CHAR, untone } from "./shade";
import { NOINK } from "./ink";
import { Pool, Actor, Fx, stage } from "./cast";
import { SHOTS, camAt, worldState, ShotDef } from "./story";

export const loadKit = async (): Promise<Kit> => ({});

const discTex = () => ctex("sahamMoonDisc", 128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 54, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

const haloTex = () => ctex("sahamGlowHalo", 256, 256, (g) => {
  const im = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const u = Math.hypot(x - 127.5, y - 127.5) / 128;
    const a = (0.55 * Math.exp(-((u / 0.25) ** 2)) + 0.35 * Math.exp(-((u / 0.6) ** 2))) * (1 - Math.min(1, Math.max(0, (u - 0.8) / 0.2)));
    const i = (y * 256 + x) * 4;
    im.data[i] = im.data[i + 1] = im.data[i + 2] = 255;
    im.data[i + 3] = Math.round(255 * Math.min(1, a));
  }
  g.putImageData(im, 0, 0);
});

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private stars: THREE.Group;
  private fog = new THREE.Fog("#4a2078", 35, 380);
  private moonDisc: THREE.Sprite;
  private moonHalo: THREE.Sprite;
  private lampHalo: THREE.Sprite;
  private sunCache = new Map<number, THREE.Vector3>();

  // 5 Hero 3D Sets
  private splitSet: THREE.Group;
  private bursaSet: THREE.Group;
  private cryptoSet: { root: THREE.Group; coinsGroup: THREE.Group };
  private araSet: THREE.Group;
  private volatileSet: THREE.Group;

  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private v = new THREE.Vector3();
  private sph = new THREE.Sphere();

  constructor(_kit: Kit) {
    const R = this.root;

    // ---- 1. Painted 5-stop Sky Dome ----
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: {
        c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() },
      },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
        void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
          vec3 c = mix(c0, c1, smoothstep(-0.15, e.x, el));
          c = mix(c, c2, smoothstep(e.x, e.y, el));
          c = mix(c, c3, smoothstep(e.y, e.z, el));
          c = mix(c, c4, smoothstep(e.z, e.w, el));
          gl_FragColor = vec4(c, 1.0); }`,
      side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(1100, 48, 24), this.skyMat);
    this.sky.renderOrder = -2; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);

    // ---- 2. Glowing Starfield ----
    this.stars = new THREE.Group();
    const sr = rng(88), starGeo = new THREE.SphereGeometry(1, 6, 6);
    const starMats = [
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.3, 2.6), fog: false, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.0, 1.6), fog: false, depthWrite: false }),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 2.2, 2.8), fog: false, depthWrite: false }),
    ];
    for (let i = 0; i < 280; i++) {
      const th = (sr() - 0.5) * Math.PI * 1.3 - Math.PI * 0.5;
      const ph = Math.acos(2 * sr() - 1) * 0.65 + 0.15;
      const dist = 680;
      const sm = new THREE.Mesh(starGeo, starMats[i % 3]);
      sm.position.set(dist * Math.sin(ph) * Math.cos(th), dist * Math.cos(ph), dist * Math.sin(ph) * Math.sin(th));
      sm.scale.setScalar(1.8 + sr() * 3.6);
      sm.layers.set(NOINK);
      this.stars.add(sm);
    }
    R.add(this.stars);

    // ---- 3. Glowing Moon Disc & Motivated Lamp Halos ----
    this.moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: discTex(), color: new THREE.Color(2.4, 2.1, 2.3), fog: false, depthWrite: false }));
    this.moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1.4, 0.9, 1.5), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
    this.lampHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: new THREE.Color(1.7, 1.15, 0.50), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));

    for (const s of [this.moonDisc, this.moonHalo, this.lampHalo]) {
      s.frustumCulled = false;
      s.layers.set(NOINK);
      R.add(s);
    }

    // ---- 4. Lights & Shadow Rig ----
    this.hemi = new THREE.HemisphereLight("#d8c4ff", "#5e3c82", 0.65);
    this.sun = new THREE.DirectionalLight("#fff0d6", 3.1);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.hemi, this.sun, this.sun.target);

    // ---- 5. Build All 5 Hero 3D Sets ----
    this.splitSet = buildSplitSet();
    this.bursaSet = buildBursaSet();
    this.cryptoSet = buildCryptoSet();
    this.araSet = buildAraSet();
    this.volatileSet = buildVolatileSet();

    R.add(this.splitSet, this.bursaSet, this.cryptoSet.root, this.araSet, this.volatileSet);
  }

  private shotSun(id: number, s: ShotDef, L: LightPreset) {
    let v = this.sunCache.get(id);
    if (v) return v;
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) {
      const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1;
      fx += x / n; fz += z / n;
    }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sunAz ?? L.az), el = THREE.MathUtils.degToRad(s.sunEl ?? L.el);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const s = SHOTS[id - 1], ws = worldState(id, f), L = LIGHTS[s.light];

    // ---- Camera ----
    const c = camAt(id, f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.2; cam.far = 1500; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    const focus = V(...c.look), dist = cam.position.distanceTo(focus);
    cam.layers.enable(NOINK);

    // ---- Light Rig & Shader Uniforms ----
    const K = LOOK[s.light], sunDir = this.shotSun(id, s, L);
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 6, 12, 65);
    this.sun.position.copy(focus).addScaledVector(sunDir, 220); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 20; sc.far = 480; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);

    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term;
    TONE.uBounce.value.set(...K.bounce); TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);

    // ---- Sky + Stars ----
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    this.stars.position.copy(cam.position);
    this.stars.visible = ws.showStars;

    untone(L.fog, this.fog.color);
    this.fog.near = L.fogNear;
    this.fog.far = L.fogFar;
    scene.fog = this.fog;
    scene.background = null;

    // ---- 3D Hero Sets Visibility & Poses ----
    this.splitSet.visible = ws.setKind === "split";
    this.bursaSet.visible = ws.setKind === "bursa";
    this.cryptoSet.root.visible = ws.setKind === "crypto";
    this.araSet.visible = ws.setKind === "ara";
    this.volatileSet.visible = ws.setKind === "volatile";

    if (this.cryptoSet.root.visible) {
      this.cryptoSet.coinsGroup.children.forEach((ch, idx) => {
        ch.rotation.y = Math.sin(ws.t * 2.4 + idx * 1.2) * 0.38;
        ch.position.y = [1.42, 1.28, 1.16][idx] + Math.sin(ws.t * 3.5 + idx) * 0.04;
      });
    }

    // ---- Glowing Moon & Motivated Lamp / Beacon Halos ----
    this.moonDisc.visible = this.moonHalo.visible = ws.showMoon;
    if (ws.showMoon) {
      this.moonDisc.position.set(-0.95, 2.35, -12.0);
      this.moonDisc.scale.setScalar(1.4);
      this.moonHalo.position.copy(this.moonDisc.position);
      this.moonHalo.scale.setScalar(5.5);
    }

    if (ws.setKind === "bursa") {
      this.lampHalo.visible = true;
      (this.lampHalo.material as THREE.SpriteMaterial).color.setRGB(1.7, 1.25, 0.55);
      this.lampHalo.position.set(1.06, 1.34, -1.96);
      this.lampHalo.scale.setScalar(2.1 + 0.10 * Math.sin(ws.t * 4.5));
    } else if (ws.setKind === "ara") {
      this.lampHalo.visible = true;
      (this.lampHalo.material as THREE.SpriteMaterial).color.setRGB(1.7, 1.25, 0.55);
      this.lampHalo.position.set(1.08, 1.46, -2.02);
      this.lampHalo.scale.setScalar(2.2 + 0.12 * Math.sin(ws.t * 4.8));
    } else if (ws.setKind === "crypto") {
      this.lampHalo.visible = true;
      (this.lampHalo.material as THREE.SpriteMaterial).color.setRGB(0.45, 1.55, 1.95);
      this.lampHalo.position.set(0.64, 2.38, -2.85);
      this.lampHalo.scale.setScalar(2.8 + 0.18 * Math.sin(ws.t * 5.2));
    } else if (ws.setKind === "volatile") {
      this.lampHalo.visible = true;
      (this.lampHalo.material as THREE.SpriteMaterial).color.setRGB(1.95, 0.45, 0.65);
      this.lampHalo.position.set(0.92, 2.55, -1.65);
      this.lampHalo.scale.setScalar(2.7 + 0.28 * Math.sin(ws.t * 9.5));
    } else {
      this.lampHalo.visible = false;
    }

    // ---- 2D Cast & Effect Cards ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(ws, { pos: cam.position, right, sun: sunDir });
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const sc2 = p.scale ?? 1;
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y + 1.1 * sc2, p.z), 3.5))) continue;
      const a = this.actor(ai++);
      const [w, h, k] = p.size ?? [300, 500, 0.5];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      a.mesh.castShadow = L.actorShadow;
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;

    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      if (!this.frustum.intersectsSphere(this.sph.set(this.v.set(p.x, p.y, p.z), Math.max(p.w, p.h) + 1.5))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft);
      e.mesh.visible = true;
      e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.quaternion.copy(cam.quaternion); e.mesh.rotateZ(p.rot ?? 0); }
      e.mesh.scale.set(p.w, p.h, 1);
      fused.push(e);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e of fused) e.bind();
    return focus;
  }
}
