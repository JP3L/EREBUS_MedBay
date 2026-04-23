// Renders a single step panel for asset export.
// URL: panel.html?id=<stepId>  (stationId inferred from the stepId prefix)

import { STATIONS } from "./content.js";

const params = new URLSearchParams(window.location.search);
const stepId = params.get("id");
const stationId = stepId?.split("_")[0]; // "s1_0_alert" -> "s1"
const station = STATIONS.find(s => s.id === stationId);
const step = station?.steps.find(s => s.id === stepId);

const root = document.getElementById("panel");

if (!step) {
  root.innerHTML = `
    <div class="panel-card" style="text-align:center;">
      <h2 style="color: var(--danger);">Panel not found</h2>
      <p>Pass <code>?id=&lt;stepId&gt;</code> — e.g. <code>?id=s1_0_alert</code></p>
      <p style="font-family: var(--mono); font-size: 11px; color: var(--text-dim);">
        Available step IDs:
      </p>
      <ul style="list-style: none; padding: 0; font-family: var(--mono); font-size: 12px; columns: 3;">
        ${STATIONS.flatMap(s => s.steps.map(st =>
          `<li><a href="?id=${st.id}" style="color: var(--accent);">${st.id}</a></li>`
        )).join("")}
      </ul>
    </div>
  `;
} else {
  root.innerHTML = `
    <div class="panel-card" style="position: relative;">
      <div class="erebus-mark">EREBUS // MEDBAY</div>
      <div class="panel-id">${step.id}</div>
      ${renderStepContent(step, station)}
    </div>
  `;
}

function renderStepContent(step, station) {
  const bannerHtml =
    step.state === "stabilized" ? `<div class="banner success">Patient Stabilized</div>`
    : step.state === "failed" ? `<div class="banner danger">Adverse Event — Reset</div>`
    : step.state === "partial" ? `<div class="banner warn">Partial Mitigation — Escalate</div>`
    : step.state === "complete" ? `<div class="banner success">Station Complete</div>`
    : "";

  let panelHtml = "";
  if (step.panel) {
    if (step.panel.type === "compare") {
      panelHtml = `
        <div class="panel-compare">
          <div class="col danger">
            <h4>${step.panel.left.title}</h4>
            <ul>${step.panel.left.lines.map(l => `<li>${l}</li>`).join("")}</ul>
          </div>
          <div class="col safe">
            <h4>${step.panel.right.title}</h4>
            <ul>${step.panel.right.lines.map(l => `<li>${l}</li>`).join("")}</ul>
          </div>
        </div>
      `;
    } else if (step.panel.type === "diag") {
      panelHtml = `
        <div class="panel-diag">
          ${step.panel.rows.map(([k, v]) => `<div class="row"><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")}
        </div>
        ${step.panel.verdict ? `<div class="verdict">${step.panel.verdict}</div>` : ""}
      `;
    } else if (step.panel.type === "log") {
      panelHtml = `
        <div class="panel-log">${step.panel.lines.map(l => `<div>${l}</div>`).join("")}</div>
        ${step.panel.verdict ? `<div class="verdict">${step.panel.verdict}</div>` : ""}
      `;
    }
  }

  if (step.takeaways) {
    return `
      ${bannerHtml}
      <h2>${step.heading}</h2>
      <div class="teaching">
        <h3>What You Just Defended</h3>
        <p>${step.body}</p>
        <ul>${step.takeaways.map(t => `<li>${t}</li>`).join("")}</ul>
        ${step.realWorld ? `<div class="real-world">${step.realWorld}</div>` : ""}
      </div>
      <div class="choices" style="margin-top: 18px;">
        ${step.choices.map(c => `<button class="choice">${c.label}</button>`).join("")}
      </div>
    `;
  }

  return `
    ${bannerHtml}
    <div style="color: var(--text-dim); font-family: var(--mono); font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 8px;">
      ${station.title} · ${station.device.name}
    </div>
    <h2>${step.heading}</h2>
    <div class="body">${step.body}</div>
    ${panelHtml}
    <div class="choices" style="margin-top: 18px;">
      ${step.choices.map(c => {
        const cls = c.correct ? "choice" : c.tag === "fail" ? "choice danger" : "choice secondary";
        return `<button class="${cls}">${c.label}</button>`;
      }).join("")}
    </div>
  `;
}
