"use client";

// Full-screen venue scene: venue geometry, seats and the camera rig, plus the
// HTML overlay (venue name, view buttons, selected-seat ticket) on top.

import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";
import type { Seat, VenueConfig } from "@/engine/types";
import { colors } from "@/theme";
import CameraRig from "./CameraRig";
import { overviewPose, seatPose, topDownPose } from "./poses";
import SeatInstances from "./SeatInstances";
import styles from "./SeatScene.module.css";
import VenueModel from "./VenueModel";

type View = "overview" | "top" | "seat";

interface Props {
  venue: VenueConfig;
  seats: Seat[];
}

export default function SeatScene({ venue, seats }: Props) {
  const [view, setView] = useState<View>("overview");
  const [selected, setSelected] = useState<number | null>(null);
  const seat = selected === null ? null : seats[selected];

  const pose = useMemo(() => {
    if (view === "seat" && seat) return seatPose(seat, venue);
    if (view === "top") return topDownPose(venue);
    return overviewPose(venue);
  }, [view, seat, venue]);

  const selectSeat = (index: number) => {
    setSelected(index);
    setView("seat");
  };

  const isSample = venue.dataStatus === "sample";

  return (
    <div className={styles.root}>
      <Canvas className={styles.canvas} camera={{ fov: 60, near: 0.1, far: 1000 }} dpr={[1, 2]}>
        <color attach="background" args={[colors.sky]} />
        <fog attach="fog" args={[colors.sky, 120, 400]} />
        <hemisphereLight args={[colors.text, colors.ground, 0.9]} />
        <directionalLight position={[20, 40, 30]} intensity={1.4} />
        <VenueModel venue={venue} />
        <SeatInstances seats={seats} selected={selected} onSelect={selectSeat} />
        <CameraRig pose={pose} mode={view === "seat" ? "seat" : "orbit"} />
      </Canvas>

      <div className={styles.top}>
        <header className={styles.venue}>
          <h1 className={styles.venueName}>{venue.name}</h1>
          <p className={styles.venueMeta}>
            {venue.city}
            {isSample && <span className={styles.badge}>Sample data</span>}
          </p>
        </header>

        <div className={styles.views} role="group" aria-label="Camera view">
          <button
            type="button"
            className={styles.button}
            aria-pressed={view === "overview"}
            onClick={() => setView("overview")}
          >
            Overview
          </button>
          {/* Temporary: top-down view to check the generated layout. */}
          <button type="button" className={styles.button} aria-pressed={view === "top"} onClick={() => setView("top")}>
            Top view
          </button>
        </div>
      </div>

      <footer className={styles.bottom}>
        {/* Announced to screen readers when the selected seat changes. */}
        <div aria-live="polite">
          {seat && (
            <section className={styles.ticket} aria-label="Selected seat">
              <p className={styles.seatLabel}>
                Block {blockName(seat.blockId)} · Row {seat.row} · Seat {seat.number}
              </p>
              <div className={styles.stub}>
                <p className={styles.estimate}>Estimated view</p>
                <p className={styles.status}>
                  {isSample
                    ? "Sample data: venue measurements are placeholders, not yet checked on site."
                    : "Based on venue measurements checked on site."}
                </p>
              </div>
            </section>
          )}
        </div>
        <p className={styles.hint}>
          {view === "seat"
            ? "Drag or use the arrow keys to look around."
            : "Click a seat to see its view."}
        </p>
      </footer>
    </div>
  );
}

/** "center" -> "Center"; ids are lowercase slugs in the venue JSON. */
function blockName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
