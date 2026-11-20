// Picks the seat generator for a venue's type.
// Adding a venue type = add a generator and a case here.

import type { Seat, VenueConfig } from "../types";
import { generateSeats as generateAmphitheaterSeats } from "./amphitheater";

export function generateSeatsForVenue(venue: VenueConfig): Seat[] {
  switch (venue.type) {
    case "amphitheater":
      return generateAmphitheaterSeats(venue);
    default:
      throw new Error(`No seat generator for venue type "${venue.type}" yet (venue "${venue.id}").`);
  }
}
