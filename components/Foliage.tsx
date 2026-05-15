"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { TerrainData, sampleHeight, sampleNormal } from "@/lib/terrain";

import colorsGlsl from "@/shaders/colors.glsl";
import grassVert from "@/shaders/grass/grass.vert";
import grassFrag from "@/shaders/grass/grass.frag";
import flowerVert from "@/shaders/flower/flower.vert";
import flowerFrag from "@/shaders/flower/flower.frag";

const grassFragWithColors = colorsGlsl + "\n" + grassFrag;
const flowerFragWithColors = colorsGlsl + "\n" + flowerFrag;

// ── Deterministic PRNG ────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Position generation ───────────────────────────────────────────────────────
function generatePositions(
  foliageType: "grass" | "flower",
  count: number,
  td: TerrainData,
  seed: number,
  slopeThreshold: number,
) {
  const rng = mulberry32(seed);
  const hw = (td.width * td.scale) / 2;
  const hh = (td.height * td.scale) / 2;
  const pos: number[] = [],
    phases: number[] = [],
    texIdx: number[] = [];

  for (let i = 0; i < count * 2 && pos.length / 3 < count; i++) {
    const wx = rng() * td.width * td.scale - hw;
    const wz = rng() * td.height * td.scale - hh;
    const wy = sampleHeight(td, wx, wz);
    if (wy <= -999) continue;

    const [, ny] = sampleNormal(td, wx, wz);
    const valid =
      foliageType === "grass"
        ? ny > slopeThreshold
        : ny > slopeThreshold &&
          wy > -td.heightScale &&
          wy < td.heightScale * 1.2;
    if (!valid) continue;

    pos.push(wx, wy, wz);
    phases.push(rng() * Math.PI * 2);
    if (foliageType === "flower") texIdx.push(rng() < 0.5 ? 0 : 1);
  }

  return {
    positions: new Float32Array(pos),
    windPhases: new Float32Array(phases),
    textureIndices:
      foliageType === "flower" ? new Float32Array(texIdx) : undefined,
    count: pos.length / 3,
  };
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface FoliageProps {
  foliageType: "grass" | "flower";
  terrainData: TerrainData;
  count?: number;
  bladeWidth?: number;
  bladeHeight?: number;
  nearDist?: number;
  farDist?: number;
  seed?: number;
  slopeThreshold?: number;
  windSpeed?: number;
  windStrength?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Foliage({
  foliageType,
  terrainData,
  count = foliageType === "grass" ? 40000 : 6000,
  bladeWidth = foliageType === "grass" ? 0.18 : 0.4,
  bladeHeight = foliageType === "grass" ? 0.5 : 0.8,
  nearDist = foliageType === "grass" ? 8 : 12,
  farDist = foliageType === "grass" ? 25 : 30,
  seed = foliageType === "grass" ? 1 : 2,
  slopeThreshold = 0.5,
  windSpeed = 1.0,
  windStrength = 1.0,
}: FoliageProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const grassTex = useTexture("/textures/Grass.png");
  const flower1 = useTexture("/textures/flower_1.png");
  const flower2 = useTexture("/textures/flower_2.png");

  const foliageData = useMemo(() => {
    const data = generatePositions(
      foliageType,
      count,
      terrainData,
      seed,
      slopeThreshold,
    );
    console.log(`${foliageType}: generated ${data.count} instances`);
    console.log(
      "sample pos:",
      data.positions[0],
      data.positions[1],
      data.positions[2],
    );
    return data;
  }, [foliageType, count, terrainData, seed, slopeThreshold]);

  // Build geometry + material together so they share the same foliageData
  // reference and don't go stale.
  const { geo, mat } = useMemo(() => {
    const hw = bladeWidth / 2;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          -hw,
          0,
          0,
          hw,
          0,
          0,
          hw,
          bladeHeight,
          0,
          -hw,
          bladeHeight,
          0,
        ]),
        3,
      ),
    );
    geo.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2),
    );
    geo.setIndex([0, 1, 2, 0, 2, 3]);

    // Per-instance attributes
    geo.setAttribute(
      "instanceOffset",
      new THREE.InstancedBufferAttribute(foliageData.positions, 3),
    );
    geo.setAttribute(
      "windPhase",
      new THREE.InstancedBufferAttribute(foliageData.windPhases, 1),
    );
    if (foliageType === "flower" && foliageData.textureIndices) {
      geo.setAttribute(
        "textureIndex",
        new THREE.InstancedBufferAttribute(foliageData.textureIndices, 1),
      );
    }

    const mat = new THREE.ShaderMaterial({
      vertexShader: foliageType === "grass" ? grassVert : flowerVert,
      fragmentShader:
        foliageType === "grass" ? grassFragWithColors : flowerFragWithColors,
      uniforms: {
        time: { value: 0 },
        windSpeed: { value: windSpeed },
        windStrength: { value: windStrength },
        lightDir: { value: new THREE.Vector3(20, 30, 10).normalize() },
        nearDist: { value: nearDist },
        farDist: { value: farDist },
        ...(foliageType === "grass"
          ? { grassTexture: { value: grassTex } }
          : {
              flowerTexture0: { value: flower1 },
              flowerTexture1: { value: flower2 },
            }),
      },
      transparent: true,
      depthWrite: true,
      side: THREE.DoubleSide,
      alphaTest: 0.01,
    });

    // const mat = new THREE.ShaderMaterial({
    //   vertexShader: DEBUG_VERT,
    //   fragmentShader: DEBUG_FRAG,
    //   side: THREE.DoubleSide,
    // });

    return { geo, mat };
  }, [
    foliageData,
    bladeWidth,
    bladeHeight,
    foliageType,
    nearDist,
    farDist,
    grassTex,
    flower1,
    flower2,
  ]);

  // Tick the time uniform every frame, and update wind uniforms for live tweaking.
  useFrame(({ clock }) => {
    const mat = meshRef.current?.material as THREE.ShaderMaterial;
    if (!mat) return;
    mat.uniforms.time.value = clock.elapsedTime;
    mat.uniforms.windSpeed.value = windSpeed; // live update
    mat.uniforms.windStrength.value = windStrength;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geo, mat, foliageData.count]}
      frustumCulled={false}
    />
  );
}
