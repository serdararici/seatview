// Loads and validates venue JSON files from the repo-level `venues/` folder.
// Server-side only (uses Node's fs). No external validation library on purpose.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { BlockConfig, StageConfig, Vec3, VenueConfig } from "./types";

const VENUE_TYPES = ["amphitheater", "cinema", "train"] as const;
const DATA_STATUSES = ["sample", "verified"] as const;

// Slugs become file names, so only allow a safe character set (no path traversal).
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Folder holding the venue JSON files. The Next.js app runs with cwd = web/. */
function venuesDir(): string {
  return path.resolve(process.cwd(), "..", "venues");
}

/** Thrown when no JSON file exists for a (well-formed or malformed) slug. */
export class VenueNotFoundError extends Error {}

/** Slugs of all venue JSON files, e.g. ["harbiye-acikhava"]. */
export function listVenueSlugs(): string[] {
  return readdirSync(venuesDir())
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length))
    .filter((slug) => SLUG_PATTERN.test(slug))
    .sort();
}

/** Reads `venues/<slug>.json` and returns the validated venue. */
export function loadVenue(slug: string): VenueConfig {
  if (!SLUG_PATTERN.test(slug)) {
    throw new VenueNotFoundError(`Invalid venue slug "${slug}": use lowercase letters, digits and hyphens.`);
  }
  const file = path.join(venuesDir(), `${slug}.json`);

  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    throw new VenueNotFoundError(`Venue "${slug}" not found (expected file: ${file}).`);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error(`Venue "${slug}": invalid JSON (${(e as Error).message}).`);
  }

  const venue = parseVenue(raw, slug);
  if (venue.id !== slug) {
    throw new Error(`Venue "${slug}": "id" is "${venue.id}" but must match the file name.`);
  }
  return venue;
}

/** Validates already-parsed JSON. Pure function, easy to unit test. */
export function parseVenue(raw: unknown, label = "venue"): VenueConfig {
  const v = asObject(raw, label);
  const type = oneOf(v.type, VENUE_TYPES, `${label}.type`);
  const dataStatus = oneOf(v.dataStatus, DATA_STATUSES, `${label}.dataStatus`);

  if (!Array.isArray(v.blocks) || v.blocks.length === 0) {
    throw new Error(`${label}.blocks must be a non-empty array.`);
  }
  const blocks = v.blocks.map((b, i) => parseBlock(b, `${label}.blocks[${i}]`));
  const ids = new Set<string>();
  for (const b of blocks) {
    if (ids.has(b.id)) throw new Error(`${label}.blocks: duplicate block id "${b.id}".`);
    ids.add(b.id);
  }

  const venue: VenueConfig = {
    id: str(v.id, `${label}.id`),
    name: str(v.name, `${label}.name`),
    city: str(v.city, `${label}.city`),
    type,
    stage: parseStage(v.stage, `${label}.stage`),
    blocks,
    dataStatus,
  };
  if (v.notes !== undefined) venue.notes = str(v.notes, `${label}.notes`);
  return venue;
}

function parseStage(raw: unknown, label: string): StageConfig {
  const s = asObject(raw, label);
  return {
    width: positive(s.width, `${label}.width`),
    depth: positive(s.depth, `${label}.depth`),
    height: nonNegative(s.height, `${label}.height`),
    position: vec3(s.position, `${label}.position`),
  };
}

function parseBlock(raw: unknown, label: string): BlockConfig {
  const b = asObject(raw, label);
  const block: BlockConfig = {
    id: str(b.id, `${label}.id`),
    rows: positiveInt(b.rows, `${label}.rows`),
    seatSpacing: positive(b.seatSpacing, `${label}.seatSpacing`),
    firstRowRadius: positive(b.firstRowRadius, `${label}.firstRowRadius`),
    rowDepth: positive(b.rowDepth, `${label}.rowDepth`),
    rowRise: finite(b.rowRise, `${label}.rowRise`),
    baseHeight: finite(b.baseHeight, `${label}.baseHeight`),
    startAngle: finite(b.startAngle, `${label}.startAngle`),
    endAngle: finite(b.endAngle, `${label}.endAngle`),
  };
  if (block.endAngle <= block.startAngle) {
    throw new Error(`${label}: endAngle must be greater than startAngle.`);
  }
  if (block.endAngle - block.startAngle > 2 * Math.PI) {
    throw new Error(`${label}: the block spans more than a full circle (endAngle - startAngle > 2*PI).`);
  }
  // The first row must hold at least one seat, otherwise the block is useless.
  const firstArc = block.firstRowRadius * (block.endAngle - block.startAngle);
  if (firstArc < block.seatSpacing) {
    throw new Error(`${label}: first row arc (${firstArc.toFixed(2)} m) is shorter than seatSpacing.`);
  }
  return block;
}

// --- small validation helpers; each throws an error naming the offending field ---

function asObject(x: unknown, label: string): Record<string, unknown> {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    throw new Error(`${label} must be an object.`);
  }
  return x as Record<string, unknown>;
}

function str(x: unknown, label: string): string {
  if (typeof x !== "string" || x.trim() === "") throw new Error(`${label} must be a non-empty string.`);
  return x;
}

function finite(x: unknown, label: string): number {
  if (typeof x !== "number" || !Number.isFinite(x)) throw new Error(`${label} must be a finite number.`);
  return x;
}

function positive(x: unknown, label: string): number {
  const n = finite(x, label);
  if (n <= 0) throw new Error(`${label} must be greater than 0.`);
  return n;
}

function nonNegative(x: unknown, label: string): number {
  const n = finite(x, label);
  if (n < 0) throw new Error(`${label} must not be negative.`);
  return n;
}

function positiveInt(x: unknown, label: string): number {
  const n = positive(x, label);
  if (!Number.isInteger(n)) throw new Error(`${label} must be a whole number.`);
  return n;
}

function vec3(x: unknown, label: string): Vec3 {
  if (!Array.isArray(x) || x.length !== 3) throw new Error(`${label} must be an array [x, y, z].`);
  return [finite(x[0], `${label}[0]`), finite(x[1], `${label}[1]`), finite(x[2], `${label}[2]`)];
}

function oneOf<T extends string>(x: unknown, allowed: readonly T[], label: string): T {
  if (typeof x !== "string" || !(allowed as readonly string[]).includes(x)) {
    throw new Error(`${label} must be one of: ${allowed.join(", ")}.`);
  }
  return x as T;
}
