// Venue data model. Pure types, no React / Three.js imports.
//
// Units: all lengths are meters, all angles are radians.
//
// World coordinate system (right-handed, same as Three.js):
//   x = right (seen from the audience, looking at the stage)
//   y = up
//   z = from the stage toward the audience
// The stage's front-edge center sits at `StageConfig.position`; the stage body
// extends from there in -z (away from the audience).
//
// Seat blocks are arcs around the stage's front-edge center. A block angle is
// measured around the y axis from the +z axis (straight out from the stage)
// toward +x: angle 0 = center, positive = audience's right side.

/** Kind of venue. Each type has its own seat generator. */
export type VenueType = "amphitheater" | "cinema" | "train";

/** Whether the measurements are real or placeholders. */
export type DataStatus = "sample" | "verified";

/** A 3D point or offset in meters: [x, y, z]. */
export type Vec3 = [number, number, number];

export interface StageConfig {
  /** Stage width along the x axis, in meters. */
  width: number;
  /** Stage depth along the z axis (extends away from the audience), in meters. */
  depth: number;
  /** Height of the stage floor above the ground, in meters. */
  height: number;
  /** Center of the stage's front edge at ground level, [x, y, z] in meters. */
  position: Vec3;
}

export interface BlockConfig {
  /** Unique id within the venue, e.g. "left", "center", "right". */
  id: string;
  /** Number of rows in the block (row 1 is the closest to the stage). */
  rows: number;
  /** Number of seats in each row. */
  seatsPerRow: number;
  /** Radius of the first row, measured from the stage front-edge center, in meters. */
  firstRowRadius: number;
  /** Radial distance between two consecutive rows, in meters. */
  rowDepth: number;
  /** Height gained per row (the rake of the seating), in meters. */
  rowRise: number;
  /** Floor height of the first row above the ground, in meters. */
  baseHeight: number;
  /** Angle of the first seat in each row, in radians (0 = straight out from the stage). */
  startAngle: number;
  /** Angle of the last seat in each row, in radians. Must be greater than startAngle. */
  endAngle: number;
}

export interface VenueConfig {
  /** URL-safe slug, equal to the JSON file name, e.g. "harbiye-acikhava". */
  id: string;
  /** Display name. */
  name: string;
  /** City the venue is in. */
  city: string;
  /** Venue type; selects the seat generator. */
  type: VenueType;
  /** Stage geometry. */
  stage: StageConfig;
  /** Seat blocks; at least one. */
  blocks: BlockConfig[];
  /** "sample" = placeholder numbers, "verified" = checked on site. */
  dataStatus: DataStatus;
  /** Free-text remarks, e.g. what still has to be verified. */
  notes?: string;
}

export interface Seat {
  /** Id of the block this seat belongs to. */
  blockId: string;
  /** Row number, starting at 1 (1 = closest to the stage). */
  row: number;
  /** Seat number within the row, starting at 1 (increasing toward +angle). */
  number: number;
  /** Seat position [x, y, z] in meters (y = height of the seat/eye reference). */
  position: Vec3;
  /**
   * Facing direction as a yaw angle in radians around the y axis, measured from
   * +z toward +x. A seat looking straight at the stage faces its own arc
   * angle + PI.
   */
  facing: number;
}
