"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import skyVert from "@/shaders/skybox/procedural_sky.vert";
import skyFrag from "@/shaders/skybox/procedural_sky.frag";

interface SkyProps {
  moonElevation?: number; // degrees above horizon, 0–90
  moonAzimuth?: number; // degrees around horizon, 0–360
}

export default function Sky({
  moonElevation = 35,
  moonAzimuth = 200,
}: SkyProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Convert spherical moon direction to a unit vec3
  const elRad = (moonElevation * Math.PI) / 180;
  const azRad = (moonAzimuth * Math.PI) / 180;
  const moonDir = new THREE.Vector3(
    Math.cos(elRad) * Math.sin(azRad),
    Math.sin(elRad),
    Math.cos(elRad) * Math.cos(azRad),
  ).normalize();

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.time.value = clock.elapsedTime;
    }
  });

  return (
    // Large box, inside-out — sky renders at depth 1.0 behind everything
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={skyVert}
        fragmentShader={skyFrag}
        uniforms={{
          time: { value: 0 },
          moonDir: { value: moonDir },
        }}
        side={THREE.BackSide} // render inside faces
        depthWrite={false} // sky never writes depth
      />
    </mesh>
  );
}
