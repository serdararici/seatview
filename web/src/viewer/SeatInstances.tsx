"use client";

// All seats as one InstancedMesh: a single draw call for hundreds of seats.
// Clicking a seat reports its index (the instanceId) to the parent.

import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Seat } from "@/engine/types";
import { colors } from "@/theme";

/** Simple seat block in meters: width x height x depth. */
const SEAT_SIZE: [number, number, number] = [0.44, 0.42, 0.42];
/** Pointer travel (px) above which a press counts as a drag, not a click. */
const CLICK_TOLERANCE_PX = 5;

const SEAT_COLOR = new THREE.Color(colors.seat);
const HOVER_COLOR = new THREE.Color(colors.seatHover);
const SELECTED_COLOR = new THREE.Color(colors.seatSelected);

interface Props {
  seats: Seat[];
  selected: number | null;
  onSelect: (index: number) => void;
}

export default function SeatInstances({ seats, selected, onSelect }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  // Write one transform per seat. Re-runs only when the seat list changes.
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new THREE.Object3D();
    seats.forEach((s, i) => {
      // Seat.position.y is the row floor; lift the box so it stands on it.
      o.position.set(s.position[0], s.position[1] + SEAT_SIZE[1] / 2, s.position[2]);
      // Three.js rotation.y turns +z toward +x, the same convention as Seat.facing.
      o.rotation.set(0, s.facing, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere(); // needed for correct raycasting/culling of instances
  }, [seats]);

  // Per-seat colors: selected > hovered > default.
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < seats.length; i++) {
      m.setColorAt(i, i === selected ? SELECTED_COLOR : i === hovered ? HOVER_COLOR : SEAT_COLOR);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [seats, selected, hovered]);

  // Pointer cursor while hovering a seat.
  useEffect(() => {
    document.body.style.cursor = hovered === null ? "" : "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    // Ignore the click that ends a drag (orbiting / looking around).
    if (e.delta > CLICK_TOLERANCE_PX || e.instanceId === undefined) return;
    e.stopPropagation();
    onSelect(e.instanceId);
  };

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, seats.length]}
      onClick={handleClick}
      onPointerMove={(e) => {
        e.stopPropagation();
        setHovered(e.instanceId ?? null);
      }}
      onPointerOut={() => setHovered(null)}
    >
      <boxGeometry args={SEAT_SIZE} />
      <meshStandardMaterial color="#ffffff" />
    </instancedMesh>
  );
}
