import { describe, expect, it } from "vitest";
import { loadVenue } from "../loadVenue";
import type { BlockConfig, Seat, VenueConfig } from "../types";
import { generateSeats, rowRadius, seatsInRow } from "./amphitheater";

// Small hand-made venue. Two blocks share an edge exactly (endAngle of "a" ==
// startAngle of "b") to stress the "no overlap across blocks" rule. The arc
// center is deliberately not at the origin.
function block(overrides: Partial<BlockConfig>): BlockConfig {
  return {
    id: "x",
    rows: 8,
    seatSpacing: 0.5,
    firstRowRadius: 10,
    rowDepth: 0.9,
    rowRise: 0.4,
    baseHeight: 0.3,
    startAngle: -0.5,
    endAngle: 0,
    ...overrides,
  };
}

const fixture: VenueConfig = {
  id: "fixture",
  name: "Fixture",
  city: "Nowhere",
  type: "amphitheater",
  dataStatus: "sample",
  stage: { width: 20, depth: 10, height: 1, position: [3, 0, -2] },
  blocks: [block({ id: "a" }), block({ id: "b", startAngle: 0, endAngle: 0.7 })],
};

// The real sample venue from /venues (tests run with cwd = web/).
const harbiye = loadVenue("harbiye-acikhava");

const venues: [string, VenueConfig][] = [
  ["fixture", fixture],
  ["harbiye-acikhava", harbiye],
];

/** Horizontal (x/z) distance between two seats, in meters. */
function groundDistance(a: Seat, b: Seat): number {
  return Math.hypot(a.position[0] - b.position[0], a.position[2] - b.position[2]);
}

function seatsOfRow(seats: Seat[], blockId: string, row: number): Seat[] {
  return seats.filter((s) => s.blockId === blockId && s.row === row).sort((p, q) => p.number - q.number);
}

describe.each(venues)("generateSeats(%s)", (_name, venue) => {
  const seats = generateSeats(venue);
  const [cx, , cz] = venue.stage.position;

  it("produces seats for every row of every block", () => {
    for (const b of venue.blocks) {
      for (let row = 1; row <= b.rows; row++) {
        expect(seatsOfRow(seats, b.id, row).length).toBe(seatsInRow(b, row));
        expect(seatsInRow(b, row)).toBeGreaterThan(0);
      }
    }
  });

  it("seat count grows with row radius", () => {
    for (const b of venue.blocks) {
      for (let row = 2; row <= b.rows; row++) {
        expect(seatsInRow(b, row)).toBeGreaterThanOrEqual(seatsInRow(b, row - 1));
      }
      expect(seatsInRow(b, b.rows)).toBeGreaterThan(seatsInRow(b, 1));
    }
  });

  it("places every seat on its row's arc", () => {
    for (const s of seats) {
      const b = venue.blocks.find((x) => x.id === s.blockId)!;
      const r = Math.hypot(s.position[0] - cx, s.position[2] - cz);
      expect(r).toBeCloseTo(rowRadius(b, s.row), 9);
    }
  });

  it("keeps the spacing ~constant along a row", () => {
    for (const b of venue.blocks) {
      for (let row = 1; row <= b.rows; row++) {
        const rowSeats = seatsOfRow(seats, b.id, row);
        for (let i = 1; i < rowSeats.length; i++) {
          // Seats are exactly seatSpacing apart along the arc; the straight-line
          // (chord) distance is a hair shorter. 0.1 % tolerance is plenty.
          const d = groundDistance(rowSeats[i - 1], rowSeats[i]);
          expect(Math.abs(d - b.seatSpacing) / b.seatSpacing).toBeLessThan(0.001);
        }
      }
    }
  });

  it("raises each row by rowRise, starting at baseHeight", () => {
    for (const s of seats) {
      const b = venue.blocks.find((x) => x.id === s.blockId)!;
      expect(s.position[1]).toBeCloseTo(b.baseHeight + (s.row - 1) * b.rowRise, 9);
    }
  });

  it("points every seat at the stage (arc center)", () => {
    for (const s of seats) {
      const dx = cx - s.position[0];
      const dz = cz - s.position[2];
      const len = Math.hypot(dx, dz);
      // facing f looks along (sin f, cos f); compare with the unit vector to the center.
      const dot = (Math.sin(s.facing) * dx + Math.cos(s.facing) * dz) / len;
      expect(dot).toBeCloseTo(1, 9);
    }
  });

  it("numbers seats 1..n without gaps in every row", () => {
    for (const b of venue.blocks) {
      for (let row = 1; row <= b.rows; row++) {
        const numbers = seatsOfRow(seats, b.id, row).map((s) => s.number);
        expect(numbers).toEqual(numbers.map((_, i) => i + 1));
      }
    }
  });

  it("does not overlap seats across blocks", () => {
    const minSpacing = Math.min(...venue.blocks.map((b) => b.seatSpacing));
    let closest = Infinity;
    for (let i = 0; i < seats.length; i++) {
      for (let j = i + 1; j < seats.length; j++) {
        if (seats[i].blockId === seats[j].blockId) continue;
        // Seats on different rows are at different radii/heights; only seats
        // close in height can collide, so compare those on the ground plane.
        if (Math.abs(seats[i].position[1] - seats[j].position[1]) > 0.2) continue;
        closest = Math.min(closest, groundDistance(seats[i], seats[j]));
      }
    }
    expect(closest).toBeGreaterThanOrEqual(minSpacing * 0.999);
  });
});
