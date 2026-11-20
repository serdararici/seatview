import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { generateSeatsForVenue } from "@/engine/generators";
import { listVenueSlugs, loadVenue, VenueNotFoundError } from "@/engine/loadVenue";
import type { VenueConfig } from "@/engine/types";
import SeatScene from "@/viewer/SeatScene";

// Opt out of instant-navigation validation: this page reads `params` outside
// <Suspense> on purpose. Every venue is prerendered (below), so known slugs are
// served statically anyway, and an unknown slug keeps a real 404 status instead
// of streaming a "not found" into an already-sent 200 response.
export const instant = false;

// Prerender every venue in /venues at build time. With Cache Components this
// must return at least one slug (there is always harbiye-acikhava).
export function generateStaticParams() {
  return listVenueSlugs().map((slug) => ({ slug }));
}

/** loadVenue, but an unknown slug becomes a 404 instead of a server error. */
function getVenueOr404(slug: string): VenueConfig {
  try {
    return loadVenue(slug);
  } catch (e) {
    if (e instanceof VenueNotFoundError) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: PageProps<"/venue/[slug]">): Promise<Metadata> {
  const venue = getVenueOr404((await params).slug);
  return {
    title: `${venue.name} – seat view · seatview`,
    description: `Estimated view from every seat at ${venue.name}, ${venue.city}.`,
  };
}

export default async function VenuePage({ params }: PageProps<"/venue/[slug]">) {
  const venue = getVenueOr404((await params).slug);
  // Seats are computed on the server and sent to the client as plain data.
  const seats = generateSeatsForVenue(venue);
  return <SeatScene venue={venue} seats={seats} />;
}
