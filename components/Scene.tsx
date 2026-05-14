"use client";

import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Stats } from "@react-three/drei";
import * as THREE from "three";
import Terrain from "./Terrain";
import Foliage from "./Foliage";
import { generateTerrain, TerrainData } from "@/lib/terrain";

const TERRAIN = {
  width: 50,
  height: 50,
  scale: 1.0,
  heightScale: 5.0,
  octaves: 6,
  frequency: 1.5,
};

function ForestScene() {
  // One generateTerrain call — shared between Terrain mesh + both Foliage components
  const [terrainData] = useState<TerrainData>(() =>
    generateTerrain(
      TERRAIN.width,
      TERRAIN.height,
      TERRAIN.scale,
      TERRAIN.heightScale,
      TERRAIN.octaves,
      TERRAIN.frequency,
    ),
  );

  return (
    <>
      <ambientLight intensity={0.15} color="#1a2a3a" />
      <directionalLight
        position={[20, 30, 10]}
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

      {/* Replaces your procedural skybox / .exr loader */}
      <Environment preset="forest" background blur={0.6} />
      <fog attach="fog" args={["#0a1520", 20, 60]} />

      <Terrain {...TERRAIN} />
      <Foliage
        foliageType="grass"
        terrainData={terrainData}
        count={40000}
        seed={1}
      />
      <Foliage
        foliageType="flower"
        terrainData={terrainData}
        count={6000}
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
      shadows
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
      <Stats /> {/* remove before deploying */}
    </Canvas>
  );
}
