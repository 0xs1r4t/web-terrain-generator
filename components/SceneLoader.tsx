"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => null, // or a spinner/skeleton
});

export default function SceneLoader() {
  return <Scene />;
}
