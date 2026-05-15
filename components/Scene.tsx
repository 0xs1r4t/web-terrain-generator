"use client";

import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stats } from "@react-three/drei";
import { useControls, folder, button } from "leva";
import * as THREE from "three";

import Terrain from "@/components/Terrain";
import Foliage from "@/components/Foliage";
import Sky from "@/components/Sky";
import { generateTerrain, TerrainData } from "@/lib/terrain";

function ForestScene() {
  // ── Leva controls ──────────────────────────────────────────────────────────
  const {
    heightScale,
    size,
    frequency,
    octaves,
    grassCount,
    flowerCount,
    bladeHeight,
    bladeWidth,
    slopeThreshold,
    windSpeed,
    windStrength,
    lightX,
    lightY,
    lightZ,
    fogNear,
    fogFar,
    fogColor,
    moonElevation,
    moonAzimuth,
  } = useControls({
    Terrain: folder(
      {
        heightScale: { value: 5.0, min: 1, max: 20, step: 0.5 },
        size: { value: 50, min: 10, max: 200, step: 10 },
        frequency: { value: 1.5, min: 0.1, max: 5, step: 0.1 },
        octaves: { value: 6, min: 1, max: 10, step: 1 },
      },
      { collapsed: false },
    ),

    Foliage: folder(
      {
        grassCount: { value: 40000, min: 0, max: 100000, step: 1000 },
        flowerCount: { value: 6000, min: 0, max: 20000, step: 500 },
        bladeHeight: { value: 0.5, min: 0.1, max: 2.0, step: 0.05 },
        bladeWidth: { value: 0.18, min: 0.05, max: 1.0, step: 0.01 },
        slopeThreshold: {
          value: 0.5,
          min: 0.0,
          max: 1.0,
          step: 0.05,
          hint: "Min normal.y for grass placement",
        },
      },
      { collapsed: true },
    ),

    Wind: folder(
      {
        windSpeed: { value: 1.2, min: 0, max: 5, step: 0.1 },
        windStrength: { value: 0.25, min: 0, max: 1.0, step: 0.05 },
      },
      { collapsed: true },
    ),

    Lighting: folder(
      {
        lightX: { value: 20, min: -50, max: 50, step: 1 },
        lightY: { value: 30, min: 1, max: 100, step: 1 },
        lightZ: { value: 10, min: -50, max: 50, step: 1 },
      },
      { collapsed: true },
    ),

    Fog: folder(
      {
        fogColor: { value: "#0a1520" },
        fogNear: { value: 20, min: 1, max: 100, step: 1 },
        fogFar: { value: 60, min: 10, max: 300, step: 5 },
      },
      { collapsed: true },
    ),
    Sky: folder(
      {
        moonElevation: { value: 35, min: 0, max: 90, step: 1 },
        moonAzimuth: { value: 200, min: 0, max: 360, step: 1 },
      },
      { collapsed: true },
    ),
  });

  // ── Terrain data — regenerates when geometry params change ─────────────────
  // size, heightScale, frequency, octaves all affect geometry → full rebuild
  const [terrainData, setTerrainData] = useState<TerrainData>(() =>
    generateTerrain(size, size, 1.0, heightScale, octaves, frequency),
  );

  // Keep terrainData in sync with Leva controls.
  // useMemo would be cleaner but useState + useEffect gives us explicit control
  // over when the expensive rebuild fires (only on unmount/remount of deps).
  const terrainKey = `${size}-${heightScale}-${frequency}-${octaves}`;

  // ── Wind uniforms — passed as props so Foliage can forward to ShaderMaterial
  const windUniforms = { windSpeed, windStrength };

  const lightPos = new THREE.Vector3(lightX, lightY, lightZ);

  return (
    <>
      <ambientLight intensity={0.15} color="#1a2a3a" />
      <directionalLight
        position={lightPos}
        intensity={0.6}
        color="#c8d8e8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <pointLight
        position={[0, 3, 0]}
        intensity={0.3}
        color="#ffe87a"
        distance={15}
      />

      <Sky moonElevation={moonElevation} moonAzimuth={moonAzimuth} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {/*
        terrainKey forces a full remount of Terrain + Foliage when geometry
        params change — cleanest way to trigger useMemo rebuilds in children.
      */}
      <Terrain
        key={`terrain-${terrainKey}`}
        width={size}
        height={size}
        scale={1.0}
        heightScale={heightScale}
        octaves={octaves}
        frequency={frequency}
        lightPos={lightPos || [20, 30, 10]}
      />
      <Foliage
        key={`grass-${terrainKey}-${grassCount}-${bladeHeight}-${bladeWidth}`}
        foliageType="grass"
        terrainData={generateTerrain(
          size,
          size,
          1.0,
          heightScale,
          octaves,
          frequency,
        )}
        count={grassCount}
        bladeWidth={bladeWidth}
        bladeHeight={bladeHeight}
        slopeThreshold={slopeThreshold}
        windSpeed={windSpeed}
        windStrength={windStrength}
        seed={1}
      />
      <Foliage
        key={`flower-${terrainKey}-${flowerCount}`}
        foliageType="flower"
        terrainData={generateTerrain(
          size,
          size,
          1.0,
          heightScale,
          octaves,
          frequency,
        )}
        count={flowerCount}
        bladeWidth={0.4}
        bladeHeight={0.8}
        slopeThreshold={slopeThreshold}
        windSpeed={windSpeed}
        windStrength={windStrength}
        seed={2}
      />

      <OrbitControls
        target={[0, 1, 0]}
        minDistance={2}
        maxDistance={40}
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows="soft"
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.8,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      camera={{ fov: 60, near: 0.1, far: 200, position: [0, 8, 18] }}
      style={{ width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <ForestScene />
      </Suspense>
      <Stats />
    </Canvas>
  );
}
