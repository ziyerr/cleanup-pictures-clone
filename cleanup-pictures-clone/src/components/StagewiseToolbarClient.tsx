"use client";
import dynamic from "next/dynamic";

const StagewiseToolbar = dynamic(
  () => import("@stagewise/toolbar-next").then(m => m.StagewiseToolbar as any),
  { ssr: false }
);

const stagewiseConfig = { plugins: [] };

export default function StagewiseToolbarClient() {
  if (process.env.NODE_ENV !== "development") return null;
  return <StagewiseToolbar {...({ config: stagewiseConfig } as any)} />;
} 