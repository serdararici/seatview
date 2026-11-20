// Single source of truth for colors, fonts and spacing (see CLAUDE.md).
//
// Direction: an open-air amphitheater at dusk. Evening-sky indigo for the
// background and UI surfaces, warm limestone for the terraces, and one bold
// accent: stage-light amber, used only for the selected seat and focus/active
// states so it always means "this is you / this is active".
//
// 3D code reads the hex values directly; CSS reads them as custom properties
// produced by `cssVariables()` (applied on <html> in the root layout).

export const colors = {
  // Scene
  sky: "#1b2440", // canvas background / fog
  ground: "#27302a", // park ground around the venue
  terrace: "#b9ae9a", // stone seating steps
  stage: "#6e4e37", // wooden stage floor
  stageEdge: "#4a3424",
  seat: "#5b6b8c", // unselected seats
  seatHover: "#8d9cc0",
  seatSelected: "#f2b544", // = accent

  // UI
  surface: "rgba(20, 27, 48, 0.86)", // overlay panels over the 3D canvas
  surfaceSolid: "#141b30",
  border: "rgba(169, 177, 199, 0.28)",
  text: "#eef0f6", // ~15:1 on surfaceSolid
  textMuted: "#a9b1c7", // ~8:1 on surfaceSolid
  accent: "#f2b544", // stage-light amber
  onAccent: "#1b2440",
} as const;

export const fonts = {
  // Loaded with next/font in app/layout.tsx, exposed as CSS variables.
  body: "var(--font-geist-sans), system-ui, sans-serif",
  // Condensed face for the ticket-like seat label.
  ticket: "var(--font-barlow-condensed), var(--font-geist-sans), sans-serif",
} as const;

/** Spacing scale in px (4 px grid). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  pill: 999,
} as const;

/** Minimum touch target size in px (WCAG / platform guidance). */
export const touchTarget = 44;

/** Duration of camera moves in seconds (0 when the user prefers reduced motion). */
export const cameraMoveSeconds = 1.2;

/** CSS custom properties for all tokens, e.g. { "--color-accent": "#f2b544" }. */
export function cssVariables(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(colors)) vars[`--color-${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(fonts)) vars[`--font-${kebab(k)}`] = v;
  for (const [k, v] of Object.entries(spacing)) vars[`--space-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(radius)) vars[`--radius-${k}`] = `${v}px`;
  vars["--touch-target"] = `${touchTarget}px`;
  return vars;
}

function kebab(s: string): string {
  return s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
