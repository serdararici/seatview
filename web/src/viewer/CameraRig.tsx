"use client";

// Moves the camera smoothly between poses.
// - "orbit" mode: after the move, OrbitControls takes over (overview / top view).
// - "seat" mode: the camera stays at the seat's eye point; dragging (or the
//   arrow keys) turns the head within a limited range.

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useRef } from "react";
import * as THREE from "three";
import { cameraMoveSeconds } from "@/theme";
import type { CameraPose } from "./poses";

// Type of the controls instance behind drei's <OrbitControls> component.
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

export type RigMode = "orbit" | "seat";

/** Look-around limits from a seat, in radians: ±70° sideways, ±30° up/down. */
const MAX_YAW = THREE.MathUtils.degToRad(70);
const MAX_PITCH = THREE.MathUtils.degToRad(30);
/** Head turn per dragged pixel, in radians. */
const DRAG_SENSITIVITY = 0.004;
/** Head turn per arrow-key press, in radians. */
const KEY_STEP = THREE.MathUtils.degToRad(5);

interface Props {
  /** Where the camera should go. A new object starts a new move. */
  pose: CameraPose;
  mode: RigMode;
}

interface Move {
  fromPos: THREE.Vector3;
  fromQuat: THREE.Quaternion;
  toPos: THREE.Vector3;
  toQuat: THREE.Quaternion;
  target: THREE.Vector3;
  t: number; // progress 0..1
}

/** Smooth start and end of the camera move. */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function CameraRig({ pose, mode }: Props) {
  const camera = useThree((s) => s.camera);
  const dom = useThree((s) => s.gl.domElement);
  const controls = useRef<OrbitControlsImpl>(null);
  const move = useRef<Move | null>(null);
  const first = useRef(true);
  // Head-turn offsets relative to "looking straight at the target" (seat mode).
  const look = useRef({ yaw: 0, pitch: 0 });

  // Start a move whenever the pose changes.
  useEffect(() => {
    const toPos = new THREE.Vector3(...pose.position);
    const target = new THREE.Vector3(...pose.target);
    // Orientation at the end of the move = camera at toPos looking at target.
    const probe = new THREE.Object3D();
    probe.position.copy(toPos);
    probe.lookAt(target);
    look.current = { yaw: 0, pitch: 0 };

    // OrbitControls would fight the animation, so pause it until the move ends.
    if (controls.current) controls.current.enabled = false;

    if (first.current || prefersReducedMotion()) {
      // First render (or reduced motion): jump straight to the pose.
      first.current = false;
      camera.position.copy(toPos);
      camera.quaternion.copy(probe.quaternion);
      move.current = null;
      finishMove(target);
      return;
    }

    move.current = {
      fromPos: camera.position.clone(),
      fromQuat: camera.quaternion.clone(),
      toPos,
      toQuat: probe.quaternion.clone(),
      target,
      t: 0,
    };
    // finishMove only depends on refs and `mode`; re-running on mode alone is not needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose, camera]);

  /** Hands the camera to OrbitControls (orbit mode) once it has arrived. */
  function finishMove(target: THREE.Vector3) {
    const c = controls.current;
    if (!c) return;
    c.target.copy(target);
    if (mode === "orbit") {
      c.enabled = true;
      c.update();
    }
  }

  // Seat mode: drag or arrow keys turn the head within the limits.
  useEffect(() => {
    if (mode !== "seat") return;
    let last: { x: number; y: number } | null = null;

    const turn = (dYaw: number, dPitch: number) => {
      const l = look.current;
      l.yaw = THREE.MathUtils.clamp(l.yaw + dYaw, -MAX_YAW, MAX_YAW);
      l.pitch = THREE.MathUtils.clamp(l.pitch + dPitch, -MAX_PITCH, MAX_PITCH);
    };
    const down = (e: PointerEvent) => {
      last = { x: e.clientX, y: e.clientY };
    };
    const moveHandler = (e: PointerEvent) => {
      if (!last) return;
      // Drag right = look left, like grabbing the scene ("drag the world").
      turn((e.clientX - last.x) * DRAG_SENSITIVITY, (e.clientY - last.y) * DRAG_SENSITIVITY);
      last = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      last = null;
    };
    const key = (e: KeyboardEvent) => {
      const steps: Record<string, [number, number]> = {
        ArrowLeft: [KEY_STEP, 0],
        ArrowRight: [-KEY_STEP, 0],
        ArrowUp: [0, KEY_STEP],
        ArrowDown: [0, -KEY_STEP],
      };
      const s = steps[e.key];
      if (!s) return;
      e.preventDefault();
      turn(s[0], s[1]);
    };

    dom.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    return () => {
      dom.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("keydown", key);
    };
  }, [mode, dom]);

  useFrame((_, dt) => {
    const m = move.current;
    if (m) {
      m.t = Math.min(1, m.t + dt / cameraMoveSeconds);
      const e = easeInOutCubic(m.t);
      camera.position.lerpVectors(m.fromPos, m.toPos, e);
      camera.quaternion.slerpQuaternions(m.fromQuat, m.toQuat, e);
      if (m.t >= 1) {
        move.current = null;
        finishMove(m.target);
      }
      return;
    }

    if (mode === "seat") {
      // Base direction: from the eye straight to the target (the stage center).
      const eye = new THREE.Vector3(...pose.position);
      const toTarget = new THREE.Vector3(...pose.target).sub(eye);
      // Yaw measured from +z toward +x (as in types.ts); pitch up from horizontal.
      const baseYaw = Math.atan2(toTarget.x, toTarget.z);
      const basePitch = Math.atan2(toTarget.y, Math.hypot(toTarget.x, toTarget.z));
      const yaw = baseYaw + look.current.yaw;
      const pitch = basePitch + look.current.pitch;
      const dir = new THREE.Vector3(
        Math.cos(pitch) * Math.sin(yaw),
        Math.sin(pitch),
        Math.cos(pitch) * Math.cos(yaw),
      );
      camera.position.copy(eye);
      camera.lookAt(eye.add(dir));
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      // Keep the camera above the ground and within a sensible range (meters).
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={3}
      maxDistance={250}
    />
  );
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
