import { useControls, folder } from "leva";

export function useSceneControls() {
  return useControls({
    Terrain: folder({
      heightScale: { value: 5.0, min: 1, max: 20, step: 0.5 },
      size: { value: 50, min: 10, max: 200, step: 10 },
      frequency: { value: 1.5, min: 0.1, max: 5, step: 0.1 },
      octaves: { value: 6, min: 1, max: 10, step: 1 },
    }),
    Foliage: folder({
      grassCount: { value: 50000, min: 0, max: 500000, step: 1000 },
      flowerCount: { value: 5000, min: 0, max: 50000, step: 500 },
      bladeHeight: { value: 0.5, min: 0.1, max: 2.0, step: 0.05 },
      slopeThreshold: { value: 0.5, min: 0.0, max: 1.0, step: 0.05 },
    }),
    Wind: folder({
      windSpeed: { value: 1.2, min: 0, max: 5, step: 0.1 },
      windStrength: { value: 0.25, min: 0, max: 1.0, step: 0.05 },
    }),
  });
}
