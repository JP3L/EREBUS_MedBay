#!/usr/bin/env node
// Generate Figma-importable SVG files for all 20 step panels.
// Each SVG is 1024×768 with named <g> groups so Figma shows clean layer structure
// and text stays editable.
//
// Usage:   node export-svg.mjs
// Output:  prototype/export/svg/<stepId>.svg

import { STATIONS, INTRO, CLOSEOUT, SPLASH } from "./prototype/content.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "prototype", "export", "svg");
mkdirSync(OUT, { recursive: true });

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#05070d",
  panelFill: "#132640",
  panelEdge: "#1e4166",
  text: "#d7e3f0",
  textDim: "#8ea5bd",
  accent: "#36e0ff",
  warn: "#ffcc00",
  danger: "#ff3355",
  success: "#00ff99",
  logBg: "#000000",
};

// ─── Text wrapping ───────────────────────────────────────────────────────────
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line += (line ? " " : "") + w;
    }
  }
  if (line) lines.push(line.trim());
  return lines;
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tspans(lines, x, startY, lineHeight) {
  return lines
    .map((l, i) => `<tspan x="${x}" y="${startY + i * lineHeight}">${esc(l)}</tspan>`)
    .join("");
}

// ─── Fragment builders ───────────────────────────────────────────────────────
function chrome(stepId) {
  return `
  <g id="chrome">
    <text x="64" y="58" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="3" fill="${C.accent}" opacity="0.7">EREBUS // MEDBAY</text>
    <text x="960" y="58" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="${C.textDim}" text-anchor="end" opacity="0.55">${esc(stepId)}</text>
  </g>`;
}

function banner(state) {
  if (!state) return "";
  const map = {
    stabilized: [C.success, "Patient Stabilized"],
    failed: [C.danger, "Adverse Event — Reset"],
    partial: [C.warn, "Partial Mitigation — Escalate"],
    complete: [C.success, "Station Complete"],
  };
  const [color, label] = map[state] || [];
  if (!label) return "";
  return `
  <g id="banner">
    <rect x="64" y="80" width="896" height="36" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-width="1" rx="2"/>
    <text x="512" y="104" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="3" fill="${color}" text-anchor="middle">${esc(label.toUpperCase())}</text>
  </g>`;
}

function subtitle(stationTitle, deviceName) {
  return `
  <g id="subtitle">
    <text x="64" y="152" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2.5" fill="${C.textDim}" text-transform="uppercase">${esc(`${stationTitle} · ${deviceName}`.toUpperCase())}</text>
  </g>`;
}

function heading(text, y = 196) {
  return `
  <g id="heading">
    <text x="64" y="${y}" font-family="Rajdhani, sans-serif" font-weight="700" font-size="32" fill="${C.accent}" letter-spacing="0.5">${esc(text.toUpperCase())}</text>
  </g>`;
}

function body(text, y = 240, maxLines = 4) {
  const lines = wrap(text, 75).slice(0, maxLines);
  return `
  <g id="body">
    <text font-family="Rajdhani, sans-serif" font-size="18" fill="${C.text}">${tspans(lines, 64, y, 26)}</text>
  </g>`;
}

function compareBlock(panel, y = 340) {
  const colW = 440;
  const mkCol = (col, xOff, borderColor, id) => {
    const titleY = y + 28;
    const linesStartY = titleY + 30;
    return `
    <g id="${id}">
      <rect x="${xOff}" y="${y}" width="${colW}" height="180" fill="#000000" fill-opacity="0.3" stroke="${borderColor}" stroke-width="1" rx="3"/>
      <text x="${xOff + 18}" y="${titleY}" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2.5" fill="${C.textDim}">${esc(col.title.toUpperCase())}</text>
      <text font-family="JetBrains Mono, monospace" font-size="14" fill="${C.text}">${tspans(col.lines, xOff + 18, linesStartY, 26)}</text>
    </g>`;
  };
  return `
  <g id="compare-panel">
    ${mkCol(panel.left, 64, panel.mismatch ? C.danger : C.panelEdge, "col-left")}
    ${mkCol(panel.right, 520, panel.mismatch ? C.success : C.panelEdge, "col-right")}
  </g>`;
}

function diagBlock(panel, y = 270) {
  const rowH = 32;
  const boxH = panel.rows.length * rowH + 24;
  const rows = panel.rows
    .map(([k, v], i) => {
      const rowY = y + 30 + i * rowH;
      return `
      <g id="diag-row-${i}">
        <text x="84" y="${rowY}" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="${C.textDim}">${esc(k.toUpperCase())}</text>
        <text x="260" y="${rowY}" font-family="JetBrains Mono, monospace" font-size="14" fill="${C.text}">${esc(v)}</text>
        ${i < panel.rows.length - 1 ? `<line x1="84" y1="${rowY + 10}" x2="940" y2="${rowY + 10}" stroke="#ffffff" stroke-opacity="0.05" stroke-dasharray="2 3"/>` : ""}
      </g>`;
    })
    .join("");
  return `
  <g id="diag-panel">
    <rect x="64" y="${y}" width="896" height="${boxH}" fill="#000000" fill-opacity="0.3" stroke="${C.panelEdge}" rx="3"/>
    ${rows}
  </g>
  ${panel.verdict ? verdict(panel.verdict, y + boxH + 16) : ""}`;
}

function logBlock(panel, y = 270) {
  const lineH = 24;
  const pad = 14;
  const boxH = panel.lines.length * lineH + pad * 2;
  const lines = panel.lines
    .map((l, i) => `<tspan x="${84}" y="${y + pad + 16 + i * lineH}">${esc(l)}</tspan>`)
    .join("");
  return `
  <g id="log-panel">
    <rect x="64" y="${y}" width="896" height="${boxH}" fill="${C.logBg}" stroke="${C.panelEdge}" rx="3"/>
    <text font-family="JetBrains Mono, monospace" font-size="12" fill="${C.accent}">${lines}</text>
  </g>
  ${panel.verdict ? verdict(panel.verdict, y + boxH + 16) : ""}`;
}

function verdict(text, y) {
  const lines = wrap(text, 100).slice(0, 3);
  const boxH = lines.length * 22 + 20;
  return `
  <g id="verdict">
    <rect x="64" y="${y}" width="896" height="${boxH}" fill="${C.warn}" fill-opacity="0.08"/>
    <rect x="64" y="${y}" width="3" height="${boxH}" fill="${C.warn}"/>
    <text font-family="Rajdhani, sans-serif" font-size="14" fill="${C.text}">${tspans(lines, 84, y + 24, 22)}</text>
  </g>`;
}

function teachingBlock(step, y = 220) {
  const bodyLines = wrap(step.body, 85).slice(0, 3);
  const takeawayY = y + 50 + bodyLines.length * 24 + 16;
  const takeawayItems = step.takeaways
    .map((t, i) => {
      const ty = takeawayY + i * 28;
      const wrapped = wrap(t, 90);
      return `
      <text x="96" y="${ty}" font-family="Rajdhani, sans-serif" font-size="15" fill="${C.text}">
        <tspan fill="${C.success}">▸ </tspan>${esc(wrapped[0])}
      </text>${wrapped[1] ? `<text x="112" y="${ty + 20}" font-family="Rajdhani, sans-serif" font-size="15" fill="${C.text}">${esc(wrapped[1])}</text>` : ""}`;
    })
    .join("");
  const takeawayEnd = takeawayY + step.takeaways.length * 28;
  const realWorldBlock = step.realWorld
    ? (() => {
        const rwLines = wrap(step.realWorld, 110).slice(0, 3);
        const rwY = takeawayEnd + 20;
        const rwBoxH = rwLines.length * 20 + 20;
        return `
    <g id="real-world">
      <rect x="80" y="${rwY}" width="864" height="${rwBoxH}" fill="#000000" fill-opacity="0.35"/>
      <rect x="80" y="${rwY}" width="3" height="${rwBoxH}" fill="${C.accent}"/>
      <text font-family="Rajdhani, sans-serif" font-size="13" fill="${C.textDim}" font-style="italic">${tspans(rwLines, 100, rwY + 22, 20)}</text>
    </g>`;
      })()
    : "";
  return `
  <g id="teaching-card">
    <rect x="64" y="${y}" width="896" height="420" fill="${C.success}" fill-opacity="0.04" stroke="${C.success}" rx="4"/>
    <text x="84" y="${y + 30}" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="3" fill="${C.success}">WHAT YOU JUST DEFENDED</text>
    <text font-family="Rajdhani, sans-serif" font-size="16" fill="${C.text}">${tspans(bodyLines, 84, y + 58, 24)}</text>
    ${takeawayItems}
    ${realWorldBlock}
  </g>`;
}

function choices(step, y = 640) {
  const btnH = 52;
  const gap = 12;
  return `
  <g id="choices">
    ${step.choices
      .map((c, i) => {
        const bx = 64;
        const by = y + i * (btnH + gap);
        const color = c.correct ? C.accent : c.tag === "fail" ? C.danger : C.textDim;
        return `
    <g id="choice-${i}">
      <rect x="${bx}" y="${by}" width="896" height="${btnH}" fill="${color}" fill-opacity="0.04" stroke="${color}" stroke-width="1" rx="3"/>
      <text x="${bx + 24}" y="${by + 34}" font-family="Rajdhani, sans-serif" font-weight="600" font-size="16" letter-spacing="1" fill="${color}">▸ ${esc(c.label.toUpperCase())}</text>
    </g>`;
      })
      .join("")}
  </g>`;
}

// ─── Composer ────────────────────────────────────────────────────────────────
function buildSVG(station, step) {
  const hasBanner = !!step.state;
  const headingY = hasBanner ? 176 : 196;
  const subtitleY = hasBanner ? 152 : 152;
  const bodyY = headingY + 44;

  let middle = "";
  const choicesY = computeChoicesY(step);

  if (step.takeaways) {
    middle = teachingBlock(step, headingY + 24);
  } else {
    middle = body(step.body, bodyY);
    if (step.panel) {
      const panelStartY = bodyY + Math.min(wrap(step.body, 75).length, 4) * 26 + 24;
      if (step.panel.type === "compare") middle += compareBlock(step.panel, panelStartY);
      else if (step.panel.type === "diag") middle += diagBlock(step.panel, panelStartY);
      else if (step.panel.type === "log") middle += logBlock(step.panel, panelStartY);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" width="1024" height="768">
  <title>${esc(step.id)} — ${esc(step.heading)}</title>
  <g id="background">
    <rect x="0" y="0" width="1024" height="768" fill="${C.bg}"/>
  </g>
  <g id="panel-card">
    <rect x="32" y="24" width="960" height="720" fill="${C.panelFill}" stroke="${C.panelEdge}" stroke-width="1" rx="6"/>
  </g>
  ${chrome(step.id)}
  ${banner(step.state)}
  ${step.takeaways ? "" : subtitle(station.title, station.device.name)}
  ${step.takeaways ? "" : heading(step.heading, headingY)}
  ${step.takeaways ? heading(step.heading, 152) : ""}
  ${middle}
  ${choices(step, choicesY)}
</svg>
`;
}

function computeChoicesY(step) {
  const n = step.choices.length;
  return 744 - n * 52 - (n - 1) * 12 - 28;
}

// ─── Splash / Intro / Closeout composers ─────────────────────────────────────
function buildSplashSVG(s) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" width="1024" height="768">
  <title>Splash — ${esc(s.subtitle)}</title>
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="${C.accent}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${C.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g id="background">
    <rect x="0" y="0" width="1024" height="768" fill="${C.bg}"/>
    <rect x="0" y="0" width="1024" height="768" fill="url(#glow)"/>
  </g>
  <g id="frame">
    <rect x="24" y="24" width="976" height="720" fill="none" stroke="${C.accent}" stroke-width="1" stroke-opacity="0.25" rx="4"/>
    <rect x="40" y="40" width="944" height="688" fill="none" stroke="${C.panelEdge}" stroke-width="1" rx="2"/>
  </g>
  <g id="top-chrome">
    <text x="64" y="76" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="4" fill="${C.accent}" opacity="0.7">ESTABLISHING UPLINK…</text>
    <text x="960" y="76" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="${C.textDim}" text-anchor="end" opacity="0.6">MEDBAY.OPS // 2126-04-22</text>
  </g>
  <g id="brand">
    <text x="512" y="340" font-family="Rajdhani, sans-serif" font-weight="700" font-size="128" letter-spacing="18" fill="${C.accent}" text-anchor="middle">${esc(s.brand)}</text>
    <line x1="256" y1="372" x2="768" y2="372" stroke="${C.accent}" stroke-width="1" stroke-opacity="0.5"/>
    <text x="512" y="446" font-family="Rajdhani, sans-serif" font-weight="600" font-size="68" letter-spacing="24" fill="${C.text}" text-anchor="middle">${esc(s.subtitle)}</text>
  </g>
  <g id="tagline">
    <text x="512" y="506" font-family="Rajdhani, sans-serif" font-size="20" letter-spacing="6" fill="${C.textDim}" text-anchor="middle">${esc(s.tagline.toUpperCase())}</text>
  </g>
  <g id="status">
    <rect x="360" y="586" width="304" height="48" fill="${C.danger}" fill-opacity="0.08" stroke="${C.danger}" stroke-width="1" rx="2"/>
    <circle cx="384" cy="610" r="5" fill="${C.danger}"/>
    <text x="400" y="616" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="2" fill="${C.danger}">${esc(s.status.toUpperCase())}</text>
  </g>
  <g id="footer">
    <text x="512" y="708" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="4" fill="${C.textDim}" text-anchor="middle" opacity="0.5">${esc(s.footer.toUpperCase())}</text>
  </g>
</svg>
`;
}

function buildIntroSVG(i) {
  const linesY = 290;
  const lineH = 42;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" width="1024" height="768">
  <title>Intro — ${esc(i.title)}</title>
  <g id="background">
    <rect x="0" y="0" width="1024" height="768" fill="${C.bg}"/>
  </g>
  <g id="panel-card">
    <rect x="32" y="24" width="960" height="720" fill="${C.panelFill}" stroke="${C.panelEdge}" rx="6"/>
  </g>
  ${chrome("intro")}
  <g id="label">
    <text x="64" y="152" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="4" fill="${C.accent}">EREBUS // STATION UPLINK</text>
  </g>
  <g id="title">
    <text x="64" y="218" font-family="Rajdhani, sans-serif" font-weight="700" font-size="48" letter-spacing="1" fill="${C.text}">${esc(i.title.toUpperCase())}</text>
  </g>
  <g id="briefing">
    ${i.lines
      .map((line, idx) => {
        const y = linesY + idx * lineH;
        const highlight = idx === 0;
        return `<text x="64" y="${y}" font-family="Rajdhani, sans-serif" font-size="${highlight ? 24 : 22}" fill="${highlight ? C.accent : C.text}" font-weight="${highlight ? 600 : 400}">${esc(line)}</text>`;
      })
      .join("\n    ")}
  </g>
  <g id="cta">
    <rect x="320" y="644" width="384" height="60" fill="${C.accent}" rx="3"/>
    <text x="512" y="682" font-family="Rajdhani, sans-serif" font-weight="700" font-size="22" letter-spacing="6" fill="${C.bg}" text-anchor="middle">${esc(i.cta.toUpperCase())}</text>
  </g>
</svg>
`;
}

function buildCloseoutSVG(c) {
  // Running-y layout so wrapped prose lines don't collide with the next item.
  let y = 250;
  const recap = c.lines
    .map((line) => {
      const isBullet = line.trim().startsWith("•");
      const text = isBullet ? line.replace(/^•\s*/, "") : line;
      const x = isBullet ? 96 : 64;
      const color = isBullet ? C.text : C.textDim;
      const marker = isBullet ? `<tspan fill="${C.success}">▸ </tspan>` : "";
      const wrapped = wrap(text, isBullet ? 70 : 72).slice(0, 3);
      const contIndent = isBullet ? 16 : 0;
      const lineSpacing = 24;
      const blockGap = isBullet ? 6 : 10;
      const out = wrapped
        .map((seg, i) => {
          const lineX = i === 0 ? x : x + contIndent;
          const lineY = y + i * lineSpacing;
          const prefix = i === 0 ? marker : "";
          return `<text x="${lineX}" y="${lineY}" font-family="Rajdhani, sans-serif" font-size="18" fill="${color}">${prefix}${esc(seg)}</text>`;
        })
        .join("\n    ");
      y += wrapped.length * lineSpacing + blockGap;
      return out;
    })
    .join("\n    ");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" width="1024" height="768">
  <title>Closeout — ${esc(c.title)}</title>
  <g id="background">
    <rect x="0" y="0" width="1024" height="768" fill="${C.bg}"/>
  </g>
  <g id="panel-card">
    <rect x="32" y="24" width="960" height="720" fill="${C.panelFill}" stroke="${C.success}" stroke-width="1" rx="6"/>
  </g>
  <g id="chrome">
    <text x="64" y="58" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="3" fill="${C.success}" opacity="0.8">EREBUS // MEDBAY UPLINK CLOSED</text>
    <text x="960" y="58" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="${C.textDim}" text-anchor="end" opacity="0.55">closeout</text>
  </g>
  <g id="banner">
    <rect x="64" y="96" width="896" height="40" fill="${C.success}" fill-opacity="0.1" stroke="${C.success}" rx="2"/>
    <text x="512" y="122" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="4" fill="${C.success}" text-anchor="middle">MISSION COMPLETE · 3/3 STABILIZED</text>
  </g>
  <g id="title">
    <text x="64" y="200" font-family="Rajdhani, sans-serif" font-weight="700" font-size="44" letter-spacing="1" fill="${C.text}">${esc(c.title.toUpperCase())}</text>
  </g>
  <g id="recap">
    ${recap}
  </g>
  <g id="cta">
    <rect x="320" y="660" width="384" height="56" fill="none" stroke="${C.success}" stroke-width="2" rx="3"/>
    <text x="512" y="696" font-family="Rajdhani, sans-serif" font-weight="700" font-size="20" letter-spacing="5" fill="${C.success}" text-anchor="middle">${esc(c.cta.toUpperCase())}</text>
  </g>
</svg>
`;
}

// ─── Mission Control composer ───────────────────────────────────────────────
function buildMissionControlSVG(stabilized) {
  // stabilized is a boolean array of length 3 — whether each station is done.
  const count = stabilized.filter(Boolean).length;
  const remaining = 3 - count;
  const progressColor = count === 3 ? C.success : count >= 1 ? C.warn : C.danger;

  const card = (i, station, done) => {
    const x = 56 + i * 310;
    const y = 320;
    const w = 280;
    const h = 320;
    const borderColor = done ? C.success : C.danger;
    const statusLabel = done ? "STABILIZED" : "ALERT";
    const statusFill = done ? C.success : C.danger;
    const shortTitle = station.title.split("—")[0].trim().replace("Bay", "").trim() || station.title;
    const vitals = done ? "All vitals nominal." : station.alert.displayed;
    const vitalsWrapped = wrap(vitals, 28).slice(0, 3);
    return `
    <g id="card-${i}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0a1a2e" stroke="${borderColor}" stroke-width="2" rx="4"/>
      ${done ? "" : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.danger}" fill-opacity="0.04" rx="4"/>`}
      <text x="${x + w - 16}" y="${y + 28}" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="2.5" fill="${statusFill}" text-anchor="end">
        <tspan>◆ ${statusLabel}</tspan>
      </text>
      <text x="${x + 20}" y="${y + 32}" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="3" fill="${C.textDim}">STATION ${i + 1}</text>
      <text x="${x + 20}" y="${y + 74}" font-family="Rajdhani, sans-serif" font-weight="700" font-size="26" fill="${C.text}">${esc(shortTitle.toUpperCase())}</text>
      <text x="${x + 20}" y="${y + 102}" font-family="Rajdhani, sans-serif" font-size="15" fill="${C.textDim}">${esc(station.device.name)}</text>
      <line x1="${x + 20}" y1="${y + 128}" x2="${x + w - 20}" y2="${y + 128}" stroke="${C.panelEdge}"/>
      <text x="${x + 20}" y="${y + 162}" font-family="JetBrains Mono, monospace" font-size="10" letter-spacing="2.5" fill="${C.textDim}">PATIENT</text>
      <text x="${x + 20}" y="${y + 184}" font-family="Rajdhani, sans-serif" font-size="17" fill="${C.text}">${esc(station.patient.name)}</text>
      <g id="card-${i}-vitals">
        <rect x="${x + 20}" y="${y + 208}" width="${w - 40}" height="80" fill="#000000" fill-opacity="0.35" rx="2"/>
        <rect x="${x + 20}" y="${y + 208}" width="3" height="80" fill="${borderColor}"/>
        ${vitalsWrapped
          .map(
            (seg, li) =>
              `<text x="${x + 32}" y="${y + 232 + li * 20}" font-family="JetBrains Mono, monospace" font-size="12" fill="${done ? C.success : C.text}">${esc(seg)}</text>`,
          )
          .join("\n        ")}
      </g>
    </g>`;
  };

  const cards = STATIONS.map((s, i) => card(i, s, stabilized[i])).join("");

  const directive = count === 0
    ? "WALK TO A RED-PULSING DEVICE TO INVESTIGATE"
    : count === 3
      ? "ALL PATIENTS STABILIZED — PROCEED TO CLOSEOUT"
      : `${remaining} DEVICE${remaining === 1 ? "" : "S"} REMAINING · INVESTIGATE THE RED PULSE`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 768" width="1024" height="768">
  <title>Mission Control — ${count}/3 stabilized</title>
  <g id="background">
    <rect x="0" y="0" width="1024" height="768" fill="${C.bg}"/>
  </g>
  <g id="panel-card">
    <rect x="32" y="24" width="960" height="720" fill="${C.panelFill}" stroke="${C.panelEdge}" rx="6"/>
  </g>
  <g id="chrome">
    <text x="64" y="58" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="3" fill="${C.accent}" opacity="0.8">EREBUS // MEDBAY · MISSION CONTROL</text>
    <text x="960" y="58" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="2" fill="${C.textDim}" text-anchor="end" opacity="0.55">${count}/3 stabilized</text>
  </g>
  <g id="title">
    <text x="64" y="148" font-family="Rajdhani, sans-serif" font-weight="700" font-size="42" letter-spacing="1" fill="${C.text}">MEDBAY TRIAGE GRID</text>
  </g>
  <g id="progress">
    <text x="64" y="200" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="3.5" fill="${C.textDim}">STATIONS STABILIZED</text>
    <text x="64" y="264" font-family="Rajdhani, sans-serif" font-weight="700" font-size="72" letter-spacing="2" fill="${progressColor}">${count}<tspan fill="${C.textDim}"> / 3</tspan></text>
    <g id="progress-bar">
      <rect x="320" y="210" width="640" height="12" fill="${C.bg}" stroke="${C.panelEdge}" rx="2"/>
      <rect x="320" y="210" width="${(count / 3) * 640}" height="12" fill="${progressColor}" rx="2"/>
      ${[0, 1, 2]
        .map((i) => {
          const tx = 320 + (i + 1) * (640 / 3) - 0.5;
          return `<line x1="${tx}" y1="${i === 2 ? 210 : 206}" x2="${tx}" y2="${i === 2 ? 222 : 226}" stroke="${C.panelEdge}" stroke-width="1"/>`;
        })
        .join("")}
    </g>
    <text x="320" y="260" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2" fill="${C.textDim}">TRIAGE</text>
    <text x="527" y="260" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2" fill="${C.textDim}" text-anchor="middle">TRAUMA</text>
    <text x="960" y="260" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2" fill="${C.textDim}" text-anchor="end">ICU</text>
  </g>
  <g id="cards">${cards}
  </g>
  <g id="directive">
    <rect x="64" y="680" width="896" height="44" fill="${progressColor}" fill-opacity="0.06" stroke="${progressColor}" stroke-opacity="0.5" rx="2"/>
    <text x="512" y="708" font-family="JetBrains Mono, monospace" font-size="13" letter-spacing="3.5" fill="${progressColor}" text-anchor="middle">▶ ${esc(directive)}</text>
  </g>
</svg>
`;
}

// ─── Export ──────────────────────────────────────────────────────────────────
let count = 0;
for (const [name, svg] of [
  ["splash", buildSplashSVG(SPLASH)],
  ["intro", buildIntroSVG(INTRO)],
  ["mission_0of3", buildMissionControlSVG([false, false, false])],
  ["mission_1of3", buildMissionControlSVG([true, false, false])],
  ["mission_2of3", buildMissionControlSVG([true, true, false])],
  ["mission_3of3", buildMissionControlSVG([true, true, true])],
  ["closeout", buildCloseoutSVG(CLOSEOUT)],
]) {
  writeFileSync(join(OUT, `${name}.svg`), svg, "utf8");
  count++;
  console.log(`  ✓ ${name}.svg`);
}
for (const station of STATIONS) {
  for (const step of station.steps) {
    const svg = buildSVG(station, step);
    const path = join(OUT, `${step.id}.svg`);
    writeFileSync(path, svg, "utf8");
    count++;
    console.log(`  ✓ ${step.id}.svg`);
  }
}
console.log(`\nWrote ${count} SVGs to ${OUT}`);
console.log(`\nTo import into Figma:`);
console.log(`  1. Open your Figma file`);
console.log(`  2. File → Import… (or drag-drop the .svg files onto the canvas)`);
console.log(`  3. Each SVG becomes a frame with editable text and shape layers`);
