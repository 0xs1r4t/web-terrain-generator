import { warpedFBM, ridgedNoise } from "@/lib/noise";

export interface TerrainData {
  positions: Float32Array;
  normals: Float32Array;
  colors: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
  heightMap: Float32Array; // [z*width+x] = y, used by foliage
  width: number;
  height: number;
  scale: number;
  heightScale: number;
}

function mix(a: number, b: number, t: number) {
  return a + t * (b - a);
}

function heightColour(yPos: number, hs: number): [number, number, number] {
  const r = yPos / hs;
  if (r < 0.2) return [0.2, 0.25, 0.18];
  if (r < 0.4) return [0.25, 0.35, 0.22];
  if (r < 0.6) return [0.3, 0.42, 0.28];
  if (r < 0.8) return [0.35, 0.4, 0.32];
  return [0.42, 0.43, 0.4];
}

export function generateTerrain(
  width = 50,
  height = 50,
  scale = 1.0,
  heightScale = 5.0,
  octaves = 6,
  frequency = 1.5,
): TerrainData {
  const vCount = width * height;
  const positions = new Float32Array(vCount * 3);
  const normals = new Float32Array(vCount * 3);
  const colors = new Float32Array(vCount * 3);
  const uvs = new Float32Array(vCount * 2);
  const heightMap = new Float32Array(vCount);

  for (let z = 0; z < height; z++) {
    for (let x = 0; x < width; x++) {
      const sx = x * frequency,
        sz = z * frequency;
      let h = warpedFBM(sx, sz, octaves);
      h = mix(h, ridgedNoise(sx * 0.5, sz * 0.5, 4), 0.4);
      if (h < 0.3) h *= 0.6;
      const yPos = h * heightScale;
      heightMap[z * width + x] = yPos;

      const vi = (z * width + x) * 3;
      positions[vi] = x * scale - (width * scale) / 2;
      positions[vi + 1] = yPos;
      positions[vi + 2] = z * scale - (height * scale) / 2;

      const [r, g, b] = heightColour(yPos, heightScale);
      colors[vi] = r;
      colors[vi + 1] = g;
      colors[vi + 2] = b;

      uvs[(z * width + x) * 2] = x / width;
      uvs[(z * width + x) * 2 + 1] = z / height;
    }
  }

  const indices = new Uint32Array((width - 1) * (height - 1) * 6);
  let idx = 0;
  for (let z = 0; z < height - 1; z++) {
    for (let x = 0; x < width - 1; x++) {
      const tl = z * width + x,
        tr = tl + 1,
        bl = (z + 1) * width + x,
        br = bl + 1;
      indices[idx++] = tl;
      indices[idx++] = bl;
      indices[idx++] = tr;
      indices[idx++] = tr;
      indices[idx++] = bl;
      indices[idx++] = br;
    }
  }

  // Face normal accumulation (matches calculateNormals)
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3,
      i1 = indices[i + 1] * 3,
      i2 = indices[i + 2] * 3;
    const ax = positions[i1] - positions[i0],
      ay = positions[i1 + 1] - positions[i0 + 1],
      az = positions[i1 + 2] - positions[i0 + 2];
    const bx = positions[i2] - positions[i0],
      by = positions[i2 + 1] - positions[i0 + 1],
      bz = positions[i2 + 2] - positions[i0 + 2];
    const nx = ay * bz - az * by,
      ny = az * bx - ax * bz,
      nz = ax * by - ay * bx;
    for (const vi of [i0, i1, i2]) {
      normals[vi] += nx;
      normals[vi + 1] += ny;
      normals[vi + 2] += nz;
    }
  }
  for (let i = 0; i < vCount; i++) {
    const vi = i * 3,
      len =
        Math.sqrt(
          normals[vi] ** 2 + normals[vi + 1] ** 2 + normals[vi + 2] ** 2,
        ) || 1;
    normals[vi] /= len;
    normals[vi + 1] /= len;
    normals[vi + 2] /= len;
  }

  return {
    positions,
    normals,
    colors,
    uvs,
    indices,
    heightMap,
    width,
    height,
    scale,
    heightScale,
  };
}

export function sampleHeight(td: TerrainData, wx: number, wz: number): number {
  const { width, height, scale, heightMap } = td;
  const gx = (wx + (width * scale) / 2) / scale;
  const gz = (wz + (height * scale) / 2) / scale;
  const x0 = Math.floor(gx),
    z0 = Math.floor(gz),
    x1 = x0 + 1,
    z1 = z0 + 1;
  if (x0 < 0 || z0 < 0 || x1 >= width || z1 >= height) return -999;
  const fx = gx - x0,
    fz = gz - z0;
  const h00 = heightMap[z0 * width + x0],
    h10 = heightMap[z0 * width + x1];
  const h01 = heightMap[z1 * width + x0],
    h11 = heightMap[z1 * width + x1];
  return (
    h00 +
    (h10 - h00) * fx +
    (h01 + (h11 - h01) * fx - (h00 + (h10 - h00) * fx)) * fz
  );
}

export function sampleNormal(
  td: TerrainData,
  wx: number,
  wz: number,
): [number, number, number] {
  const e = td.scale;
  const hL = sampleHeight(td, wx - e, wz),
    hR = sampleHeight(td, wx + e, wz);
  const hD = sampleHeight(td, wx, wz - e),
    hU = sampleHeight(td, wx, wz + e);
  const nx = hL - hR,
    ny = 2 * e,
    nz = hD - hU;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
  return [nx / len, ny / len, nz / len];
}
