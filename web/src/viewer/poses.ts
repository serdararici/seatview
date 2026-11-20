// Camera poses for the venue scene. Plain math on [x, y, z] arrays (meters),
// same coordinate system as src/engine/types.ts.

import { rowRadius } from "@/engine/generators/amphitheater";
import type { Seat, Vec3, VenueConfig } from "@/engine/types";

export interface CameraPose {
  /** Camera position. */
  position: Vec3;
  /** Point the camera looks at (also the orbit pivot in orbit modes). */
  target: Vec3;
}

/** Outermost row radius over all blocks: rough size of the seating area. */
export function seatingRadius(venue: VenueConfig): number {
  return Math.max(...venue.blocks.map((b) => rowRadius(b, b.rows)));
}

/** Center of the stage's top surface: what every seat looks at. */
export function stageCenter(venue: VenueConfig): Vec3 {
  const { position: [x, , z], depth, height } = venue.stage;
  // The stage extends from its front edge in -z, so its center is depth/2 behind it.
  return [x, height, z - depth / 2];
}

/** Elevated view from behind the audience, looking at the stage. */
export function overviewPose(venue: VenueConfig): CameraPose {
  const [cx, , cz] = venue.stage.position;
  const R = seatingRadius(venue);
  return {
    position: [cx, R * 0.9, cz + R * 1.75],
    target: stageCenter(venue),
  };
}

/** Seated eye height above the row floor, in meters. */
export const EYE_HEIGHT = 1.1;

/** First-person view from a seat: eye above the seat, looking at the stage center. */
export function seatPose(seat: Seat, venue: VenueConfig): CameraPose {
  const [x, y, z] = seat.position;
  return {
    position: [x, y + EYE_HEIGHT, z],
    target: stageCenter(venue),
  };
}

/** Straight-down view over stage + seating, to check the layout. */
export function topDownPose(venue: VenueConfig): CameraPose {
  const [cx, , cz] = venue.stage.position;
  const R = seatingRadius(venue);
  // Midpoint between the back of the stage and the last row.
  const midZ = cz + (R - venue.stage.depth) / 2;
  return {
    // Tiny z offset: looking exactly along -y makes lookAt/orbit degenerate.
    position: [cx, R * 2.4, midZ + 0.01],
    target: [cx, 0, midZ],
  };
}
