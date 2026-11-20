"use client";

// Static venue geometry: ground, stage and stepped stone terraces.

import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rowFloorHeight, rowRadius } from "@/engine/generators/amphitheater";
import type { BlockConfig, VenueConfig } from "@/engine/types";
import { colors } from "@/theme";

/** Arc segments per radian for the curved terrace edges. */
const SEGMENTS_PER_RADIAN = 24;
/** Terraces lower than this (m) are skipped: they would sit on the ground. */
const MIN_TERRACE_HEIGHT = 0.02;

export default function VenueModel({ venue }: { venue: VenueConfig }) {
  const { width, depth, height, position } = venue.stage;
  const terraces = useMemo(() => buildTerraces(venue.blocks, venue.stage.position), [venue]);

  return (
    <group>
      {/* Ground plane, a hair below y=0 so terrace bottoms don't z-fight with it. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color={colors.ground} />
      </mesh>

      {/* Stage box: front edge centered on stage.position, extending in -z. */}
      <mesh position={[position[0], height / 2, position[2] - depth / 2]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={colors.stage} />
      </mesh>

      {terraces && (
        <mesh geometry={terraces}>
          <meshStandardMaterial color={colors.terrace} />
        </mesh>
      )}
    </group>
  );
}

/**
 * One merged geometry with a solid step under every row of every block.
 * Each step is an annular sector (ring slice) between r ± rowDepth/2 that
 * reaches from the ground up to the row's floor height.
 */
function buildTerraces(blocks: BlockConfig[], center: [number, number, number]) {
  const parts: THREE.BufferGeometry[] = [];
  for (const block of blocks) {
    for (let row = 1; row <= block.rows; row++) {
      const top = rowFloorHeight(block, row);
      if (top < MIN_TERRACE_HEIGHT) continue;
      const r = rowRadius(block, row);
      const geo = sectorPrism(r - block.rowDepth / 2, r + block.rowDepth / 2, block.startAngle, block.endAngle, top);
      geo.translate(center[0], 0, center[2]);
      parts.push(geo);
    }
  }
  if (parts.length === 0) return null;
  const merged = mergeGeometries(parts);
  parts.forEach((p) => p.dispose());
  return merged;
}

/**
 * Ring slice between radii r0..r1 and angles a0..a1 (our convention: angle
 * from +z toward +x), extruded from y=0 up to y=height.
 */
function sectorPrism(r0: number, r1: number, a0: number, a1: number, height: number) {
  const steps = Math.max(2, Math.ceil((a1 - a0) * SEGMENTS_PER_RADIAN));
  const shape = new THREE.Shape();
  // The shape is drawn in its own XY plane with (X, Y) = (world x, world z).
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    const p: [number, number] = [r1 * Math.sin(a), r1 * Math.cos(a)];
    if (i === 0) shape.moveTo(...p);
    else shape.lineTo(...p);
  }
  for (let i = steps; i >= 0; i--) {
    const a = a0 + ((a1 - a0) * i) / steps;
    shape.lineTo(r0 * Math.sin(a), r0 * Math.cos(a));
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false });
  // Rotating +90° about X maps shape (X, Y, Z) to world (X, -Z, Y): the shape's
  // Y becomes world z (as intended) and the extrusion (0..height along Z) points
  // down to -height. Shift it up so the step spans y = 0..height.
  geo.rotateX(Math.PI / 2);
  geo.translate(0, height, 0);
  return geo;
}
