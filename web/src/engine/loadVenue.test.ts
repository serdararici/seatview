import { describe, expect, it } from "vitest";
import { listVenueSlugs, loadVenue, parseVenue, VenueNotFoundError } from "./loadVenue";

describe("loadVenue", () => {
  it("loads every venue JSON in /venues", () => {
    const slugs = listVenueSlugs();
    expect(slugs).toContain("harbiye-acikhava");
    for (const slug of slugs) expect(loadVenue(slug).id).toBe(slug);
  });

  it("marks the Harbiye placeholder as sample data", () => {
    expect(loadVenue("harbiye-acikhava").dataStatus).toBe("sample");
  });

  it("rejects unknown and unsafe slugs with VenueNotFoundError", () => {
    expect(() => loadVenue("does-not-exist")).toThrow(VenueNotFoundError);
    expect(() => loadVenue("../package")).toThrow(VenueNotFoundError);
  });
});

describe("parseVenue", () => {
  const valid = loadVenue("harbiye-acikhava");

  it("names the offending field", () => {
    const bad = { ...valid, blocks: [{ ...valid.blocks[0], seatSpacing: 0 }] };
    expect(() => parseVenue(bad)).toThrow("venue.blocks[0].seatSpacing must be greater than 0.");
  });

  it("rejects a first row too short for one seat", () => {
    const bad = { ...valid, blocks: [{ ...valid.blocks[0], seatSpacing: 100 }] };
    expect(() => parseVenue(bad)).toThrow(/shorter than seatSpacing/);
  });

  it("rejects duplicate block ids", () => {
    const bad = { ...valid, blocks: [valid.blocks[0], valid.blocks[0]] };
    expect(() => parseVenue(bad)).toThrow(/duplicate block id/);
  });
});
