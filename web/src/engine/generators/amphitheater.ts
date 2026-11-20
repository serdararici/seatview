// Seat generator for amphitheaters: rows are concentric arcs around the stage.
// Pure functions only: no React, Three.js or Node imports.
//
// Coordinate system (see ../types.ts): meters and radians, x = right, y = up,
// z = from the stage toward the audience. A block angle θ is measured around
// the y axis from +z toward +x, so a point at radius r and angle θ around the
// arc center c is:  (c.x + r·sin θ,  y,  c.z + r·cos θ).

import type { BlockConfig, Seat, Vec3, VenueConfig } from "../types";

/** Radius of a row (1-based) from the arc center, in meters. */
export function rowRadius(block: BlockConfig, row: number): number {
  return block.firstRowRadius + (row - 1) * block.rowDepth;
}

/**
 * Floor height of a row (1-based), in meters.
 * Row 1 sits at baseHeight; every further row is rowRise higher.
 */
export function rowFloorHeight(block: BlockConfig, row: number): number {
  return block.baseHeight + (row - 1) * block.rowRise;
}

/**
 * How many seats fit in a row at the block's seat spacing.
 * Each seat takes `seatSpacing` meters of arc, so the count is the arc length
 * divided by the spacing, rounded down. Outer rows have a longer arc and
 * therefore more seats.
 */
export function seatsInRow(block: BlockConfig, row: number): number {
  const arcLength = rowRadius(block, row) * (block.endAngle - block.startAngle);
  // Small epsilon so an arc of exactly n·spacing is not lost to float error.
  return Math.max(0, Math.floor(arcLength / block.seatSpacing + 1e-9));
}

/**
 * Angles (radians) of the seats in a row, in increasing order.
 * Seats are spread at exactly `seatSpacing` meters of arc (= seatSpacing / r
 * radians) and the group is centered in the block's angular range. That leaves
 * at least half a spacing free at each block edge, so seats of neighbouring
 * blocks cannot overlap as long as the blocks' angle ranges do not overlap.
 */
export function seatAngles(block: BlockConfig, row: number): number[] {
  const n = seatsInRow(block, row);
  const r = rowRadius(block, row);
  const step = block.seatSpacing / r;
  const mid = (block.startAngle + block.endAngle) / 2;
  return Array.from({ length: n }, (_, k) => mid + (k - (n - 1) / 2) * step);
}

/**
 * Yaw (radians, from +z toward +x) of a direction (dx, dz) on the ground plane.
 * Matches the Seat.facing convention: facing f looks along (sin f, cos f).
 */
export function yawOf(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

/** Generates every seat of an amphitheater venue. */
export function generateSeats(venue: VenueConfig): Seat[] {
  // Arc center = front-edge center of the stage (on the ground plane).
  const [cx, , cz] = venue.stage.position;
  const seats: Seat[] = [];

  for (const block of venue.blocks) {
    for (let row = 1; row <= block.rows; row++) {
      const r = rowRadius(block, row);
      const y = rowFloorHeight(block, row);
      seatAngles(block, row).forEach((theta, k) => {
        const x = cx + r * Math.sin(theta);
        const z = cz + r * Math.cos(theta);
        const position: Vec3 = [x, y, z];
        seats.push({
          blockId: block.id,
          row,
          number: k + 1,
          position,
          // Look from the seat back toward the arc center (= toward the stage).
          facing: yawOf(cx - x, cz - z),
        });
      });
    }
  }
  return seats;
}
