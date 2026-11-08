// "Perbedaan Saham vs Kripto": 70.65 s 2D-in-3D Remotion Short
// Full post chain: InkPass -> LensBlur (pre + main) -> [Bloom + NEUTRAL tone map + Grade], MSAA 4 + Kinetic Comic Captions.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, getInputProps, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectComposer as PostEffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur, GrainEffect } from "./lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./grade";
import { Kit } from "./build";
import { TOTAL, SHOTS, FLASH_AT, layersAt, dofAt } from "./story";
import { SahamCaptionOverlay } from "./SahamCaptionOverlay";

export const SAHAM_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({
  ink: true,
  lens: true,
  pre: true,
  bloom: true,
  grade: true,
  grain: false,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}),
});

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.5,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3(), glSize = new THREE.Vector2();
const EMPTY_KIT: Kit = {};

const Inner: React.FC<{ id: number; kit: Kit }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { gl, camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);

  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.night, GRADE_STRENGTH.night),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);

  const composer = useMemo(() => {
    gl.toneMapping = THREE.NoToneMapping;
    const c = new PostEffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, camera));
    if (on.ink) c.addPass(fx.ink);
    if (on.lens && on.pre) c.addPass(new EffectPass(camera, fx.lens.pre));
    if (on.lens) c.addPass(new EffectPass(camera, fx.lens.main));
    const tail: Effect[] = [];
    if (on.bloom) tail.push(fx.bloom);
    tail.push(fx.tone);
    if (on.grade) tail.push(fx.grade);
    if (on.grain) tail.push(fx.grain);
    c.addPass(new EffectPass(camera, ...tail));
    return c;
  }, [gl, scene, camera, fx, on]);

  useEffect(() => () => {
    composer.dispose();
    fx.ink.dispose();
  }, [composer, fx]);

  const syncFrame = (frame: number) => {
    const cam = camera as THREE.PerspectiveCamera;
    target.copy(world.update(id, frame, cam, scene));
    noInkFallback(world.root);
    const d = dofAt(frame);
    cam.getWorldDirection(fwd);
    if (d.focus) fpt.set(...d.focus(frame)); else fpt.copy(target);
    fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
    fx.lens.cInf = d.cInf;
    gradeFor(fx.grade, SHOTS[id - 1].light);
    fx.grain.seed = frame;
  };

  syncFrame(f);

  useFrame((_, delta) => {
    syncFrame(f);
    gl.getSize(glSize);
    composer.setSize(glSize.width, glSize.height);
    gl.autoClear = true;
    composer.render(delta || 1 / 30);
  }, 1);

  return <primitive object={world.root} dispose={null} />;
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const ShotView: React.FC<{ id: number; kit: Kit; alpha: number }> = ({ id, kit, alpha }) => (
  <AbsoluteFill style={{ opacity: alpha }}>
    <ThreeCanvas
      width={1080}
      height={1920}
      {...(dprOverride() ? { dpr: dprOverride() } : {})}
      shadows
      gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
      camera={{ fov: 38, near: 0.2, far: 1500 }}
    >
      <Inner id={id} kit={kit} />
    </ThreeCanvas>
  </AbsoluteFill>
);

export const SahamShort: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "#140b2e" }}>
      {layersAt(f).map((l) => (
        <ShotView key={l.id} id={l.id} kit={EMPTY_KIT} alpha={l.alpha} />
      ))}
      {f >= FLASH_AT && f < FLASH_AT + 4 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: [1, 0.75, 0.45, 0.2][f - FLASH_AT],
          }}
        />
      )}
      <Audio src={staticFile("saham_mix.wav")} />
    </AbsoluteFill>
  );
};

export const SahamShortWithCaptions: React.FC = () => {
  return (
    <AbsoluteFill>
      <SahamShort />
      <SahamCaptionOverlay />
    </AbsoluteFill>
  );
};
