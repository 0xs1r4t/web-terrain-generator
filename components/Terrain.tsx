"use client";

import { useMemo, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { generateTerrain, TerrainData } from "@/lib/terrain";

import colorsGlsl from "@/shaders/colors.glsl";
import terrainVert from "@/shaders/terrain/terrain.vert";
import terrainFrag from "@/shaders/terrain/terrain.frag";

const terrainFragWithColors = colorsGlsl + "\n" + terrainFrag;

export interface TerrainRef {
  data: TerrainData;
}

interface TerrainProps {
  width?: number;
  height?: number;
  scale?: number;
  heightScale?: number;
  octaves?: number;
  frequency?: number;
  lightPos?: THREE.Vector3 | [number, number, number];
}

const Terrain = forwardRef<TerrainRef, TerrainProps>(function Terrain(
  {
    width = 2,
    height = 5,
    scale = 1.0,
    heightScale = 1.0,
    octaves = 10,
    frequency = 0.2,
    lightPos = [20, 30, 10],
  },
  ref,
) {
  const td = useMemo(
    () =>
      generateTerrain(width, height, scale, heightScale, octaves, frequency),
    [width, height, scale, heightScale, octaves, frequency],
  );

  useImperativeHandle(ref, () => ({ data: td }), [td]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(td.positions, 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(td.normals, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(td.colors, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(td.uvs, 2));
    geo.setIndex(new THREE.BufferAttribute(td.indices, 1));
    return geo;
  }, [td]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <shaderMaterial
        vertexShader={terrainVert}
        fragmentShader={terrainFragWithColors}
        uniforms={{
          lightPos: {
            value:
              lightPos instanceof THREE.Vector3
                ? lightPos
                : new THREE.Vector3(...lightPos),
          },
          lightColor: { value: new THREE.Vector3(0.8, 0.85, 0.9) },
          viewPos: { value: new THREE.Vector3(0, 8, 18) },
        }}
        vertexColors
        side={THREE.FrontSide}
      />
    </mesh>
  );
});

export default Terrain;
