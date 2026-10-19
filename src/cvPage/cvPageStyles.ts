/**
 * The CV page's stylesheet (F-032). It echoes the game: section accents are the districts'
 * building colours (set inline as `--accent`), headings carry a small isometric tile, and
 * labels use the letter-spaced monospace of the district names. Light and dark on screen,
 * one clean A4 column when printed.
 */
export const CV_PAGE_STYLES = `
:root {
  --bg: #f6f5f0;
  --paper: #ffffff;
  --ink: #1b1f2a;
  --muted: #5b6272;
  --rule: #e2e0d8;
  --chip: #f0eee6;
  --accent: #475569;
  --grass: #8bcf8b;
  /* Accent text is mixed towards the ink so small coloured text keeps a 4.5:1 contrast. */
  --accent-ink: #000;
  --accent-ink-amount: 25%;
  --font-display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --font-body: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #12151c;
    --paper: #1a1e27;
    --ink: #eceae4;
    --muted: #a3a9b6;
    --rule: #2c3240;
    --chip: #252a35;
    --accent-ink: #fff;
    --accent-ink-amount: 45%;
  }
}

:root[data-theme="dark"] {
  --bg: #12151c;
  --paper: #1a1e27;
  --ink: #eceae4;
  --muted: #a3a9b6;
  --rule: #2c3240;
  --chip: #252a35;
  --accent-ink: #fff;
  --accent-ink-amount: 45%;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font: 15px/1.55 var(--font-body);
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; text-decoration-color: color-mix(in srgb, currentColor 40%, transparent); text-underline-offset: 3px; }
a:hover { text-decoration-color: currentColor; }
a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 2px; }

.page {
  max-width: 1080px;
  margin: 32px auto;
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 14px;
  overflow: hidden;
}

/* Masthead: name and headline, with the CV map as a little isometric emblem. */
.masthead {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  padding: 40px 48px 32px;
  border-bottom: 1px solid var(--rule);
  background:
    linear-gradient(to bottom, transparent 60%, var(--paper)),
    repeating-linear-gradient(26.565deg, transparent 0 22px, color-mix(in srgb, var(--grass) 18%, transparent) 22px 23px),
    repeating-linear-gradient(-26.565deg, transparent 0 22px, color-mix(in srgb, var(--grass) 18%, transparent) 22px 23px);
}

.eyebrow {
  margin: 0 0 8px;
  font: 500 12px/1 var(--font-mono);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}

.masthead h1 {
  margin: 0;
  font: 800 clamp(40px, 7vw, 64px)/0.95 var(--font-display);
  letter-spacing: -0.02em;
}

.headline {
  margin: 12px 0 0;
  font: 600 18px/1.3 var(--font-display);
  color: var(--muted);
}

.emblem { width: 132px; height: auto; }

.contact {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
}

.contact a {
  display: inline-block;
  padding: 6px 12px;
  font: 500 13px/1 var(--font-mono);
  background: var(--chip);
  border: 1px solid var(--rule);
  border-radius: 999px;
  text-decoration: none;
}

.contact a:hover { border-color: var(--ink); }

.play {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 48px;
  font: 500 13px/1.4 var(--font-mono);
  background: color-mix(in srgb, var(--grass) 22%, var(--paper));
  border-bottom: 1px solid var(--rule);
}

.play a { font-weight: 600; }

/* Two columns: the sidebar holds the short lists, the main column the story. */
.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
}

.sidebar {
  padding: 32px 32px 40px 48px;
  border-right: 1px solid var(--rule);
}

.main { padding: 32px 48px 40px 40px; }

.section + .section { margin-top: 36px; }

.section__title {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 0 0 16px;
  font: 600 13px/1 var(--font-mono);
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--accent), var(--accent-ink) var(--accent-ink-amount));
}

/* An isometric tile, like one square of the map. */
.tile {
  flex: none;
  width: 18px;
  height: 10px;
  background: var(--accent);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
}

.summary p { margin: 0 0 12px; }
.summary p:first-child { font: 500 17px/1.5 var(--font-body); }

/* Experience: a timeline, one stop per company, with its roles from newest to oldest. */
.timeline, .roles { margin: 0; padding: 0; list-style: none; }

.timeline__company {
  position: relative;
  padding: 0 0 28px 28px;
  border-left: 2px solid color-mix(in srgb, var(--accent) 35%, transparent);
}

.timeline__company:last-child { padding-bottom: 0; border-left-color: transparent; }

.timeline__company::before {
  content: "";
  position: absolute;
  top: 4px;
  left: -10px;
  width: 18px;
  height: 10px;
  background: var(--accent);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
}

.company {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
  margin: 0 0 10px;
  font: 700 20px/1.2 var(--font-display);
}

.company__total { font: 500 12px/1 var(--font-mono); color: var(--muted); }

.role + .role { margin-top: 18px; padding-top: 18px; border-top: 1px dashed var(--rule); }
.role__title { margin: 0; font: 600 16px/1.35 var(--font-body); }
.role__period {
  margin: 2px 0 0;
  font: 500 12.5px/1.4 var(--font-mono);
  color: color-mix(in srgb, var(--accent), var(--accent-ink) var(--accent-ink-amount));
}
.role__meta { margin: 2px 0 0; font-size: 13px; color: var(--muted); }
.role__description { margin: 10px 0 0; }
.role__highlights { margin: 8px 0 0; padding-left: 18px; }
.role__highlights li + li { margin-top: 4px; }

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.tags li {
  padding: 3px 8px;
  font: 500 12px/1.3 var(--font-mono);
  background: var(--chip);
  border-radius: 4px;
}

/* Skills: one list per category, levels as tiles. */
.skills + .skills { margin-top: 18px; }
.skills__category { margin: 0 0 8px; font: 600 14px/1.3 var(--font-display); }
.skills__list { margin: 0; padding: 0; list-style: none; }

.skill {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}

.level { display: inline-flex; gap: 2px; flex: none; }

.level__tile {
  width: 12px;
  height: 7px;
  background: var(--rule);
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
}

.level__tile--on { background: var(--accent); }

.plain-list { margin: 0; padding: 0; list-style: none; }
.plain-list li { display: grid; gap: 2px; }
.plain-list li + li { margin-top: 12px; }
.muted { color: var(--muted); font-size: 13.5px; }

.footer {
  padding: 16px 48px;
  font: 500 12px/1.5 var(--font-mono);
  color: var(--muted);
  border-top: 1px solid var(--rule);
}

@media (max-width: 820px) {
  .page { margin: 0; border: 0; border-radius: 0; }
  .masthead { grid-template-columns: 1fr; padding: 28px 16px 24px; }
  .emblem { display: none; }
  .play, .footer { padding-left: 16px; padding-right: 16px; }
  .layout { grid-template-columns: 1fr; }
  .sidebar { order: 2; padding: 28px 16px; border-right: 0; border-top: 1px solid var(--rule); }
  .main { padding: 28px 16px; }
}

@page { size: A4; margin: 14mm; }

@media print {
  :root { --bg: #fff; --paper: #fff; --ink: #111; --muted: #444; --rule: #d6d6d6; --chip: #f2f2f2; }
  body { font-size: 10.5pt; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  .page { margin: 0; max-width: none; border: 0; border-radius: 0; }
  .screen-only, .play { display: none !important; }
  .masthead { padding: 0 0 16px; background: none; }
  .emblem { width: 90px; }
  .layout { grid-template-columns: 62mm 1fr; }
  .sidebar { padding: 18px 16px 0 0; }
  .main { padding: 18px 0 0 18px; }
  .footer { padding: 12px 0 0; }
  .timeline__company, .role, .skills { break-inside: avoid; }
  a { text-decoration: none; }
}
`;
