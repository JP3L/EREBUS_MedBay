import { INTRO, CLOSEOUT, STATIONS } from "./content.js";

const root = document.getElementById("app");
const hudStat = document.getElementById("hud-progress");
const hudTime = document.getElementById("hud-time");

const state = {
  stabilized: new Set(),
  startTime: null,
};

// ─── Routing ────────────────────────────────────────────────────────────────
function parseHash() {
  const h = window.location.hash.slice(1) || "/intro";
  return h.split("/").filter(Boolean); // ["intro"] | ["mission"] | ["s1", "s1_0_alert"]
}

function goto(path) {
  window.location.hash = path;
}

window.addEventListener("hashchange", render);
window.addEventListener("load", () => {
  state.startTime = Date.now();
  tickTime();
  setInterval(tickTime, 1000);
  render();
});

function tickTime() {
  if (!state.startTime) return;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  hudTime.textContent = `T+${mm}:${ss}`;
}

function updateHudProgress() {
  hudStat.innerHTML = `Stabilized <b>${state.stabilized.size}/3</b>`;
}

// ─── Renderers ──────────────────────────────────────────────────────────────
function render() {
  updateHudProgress();
  const parts = parseHash();
  const route = parts[0];

  if (route === "intro" || !route) return renderIntro();
  if (route === "mission") return renderMission();
  if (route === "closeout") return renderCloseout();
  const station = STATIONS.find(s => s.id === route);
  if (station) {
    const stepId = parts[1] || station.steps[0].id;
    return renderStation(station, stepId);
  }
  renderIntro();
}

function renderIntro() {
  root.innerHTML = `
    <section class="intro">
      <h3>EREBUS // Station Uplink</h3>
      <h1>${INTRO.title}</h1>
      ${INTRO.lines.map(l => `<p>${l}</p>`).join("")}
      <button class="cta" id="enter">${INTRO.cta}</button>
    </section>
  `;
  document.getElementById("enter").onclick = () => {
    state.startTime = Date.now();
    goto("/mission");
  };
}

function renderMission() {
  const completeHtml = STATIONS.map((s, i) => {
    const isDone = state.stabilized.has(s.id);
    const classes = ["station-card", isDone ? "complete" : "pulse"].join(" ");
    return `
      <article class="${classes}" data-id="${s.id}">
        <div class="station-num">STATION ${i + 1}</div>
        <div class="station-title">${s.title}</div>
        <div class="station-device">${s.device.name}</div>
        <div class="station-vitals">${isDone ? "All vitals nominal." : s.alert.displayed}</div>
      </article>
    `;
  }).join("");

  const allDone = state.stabilized.size === 3;

  root.innerHTML = `
    <section class="mission">
      <div class="mission-header">
        <div>
          <h3>Mission Control</h3>
          <h1>MedBay Triage Grid</h1>
        </div>
        ${allDone ? `<button class="cta" id="finish">Closeout</button>` : ``}
      </div>
      <p style="color: var(--text-dim); margin-bottom: 24px;">
        Three networked medical devices are reporting anomalies. Select a station to investigate.
      </p>
      <div class="stations">${completeHtml}</div>
    </section>
  `;

  root.querySelectorAll(".station-card").forEach(el => {
    el.onclick = () => goto(`/${el.dataset.id}`);
  });
  const finishBtn = document.getElementById("finish");
  if (finishBtn) finishBtn.onclick = () => goto("/closeout");
}

function renderStation(station, stepId) {
  const step = station.steps.find(s => s.id === stepId);
  if (!step) { goto(`/${station.id}`); return; }

  const patientStabilized = step.state === "stabilized" || step.state === "complete";
  if (step.state === "complete") state.stabilized.add(station.id);

  const patientHtml = `
    <aside class="patient-card ${patientStabilized ? "stabilized" : ""}">
      <h3>Patient</h3>
      <div class="patient-name">${station.patient.name}</div>
      <div class="patient-role">${station.patient.role}</div>
      <div class="patient-status">${patientStabilized ? "Stable · monitoring" : station.patient.status}</div>
      <div class="patient-background">${station.patient.background}</div>
      <hr style="border: none; border-top: 1px solid var(--panel-edge); margin: 16px 0;">
      <h3>Device</h3>
      <div style="font-weight: 600; margin: 4px 0;">${station.device.name}</div>
      <div class="patient-background">${station.device.blurb}</div>
    </aside>
  `;

  const stepHtml = renderStep(step);

  root.innerHTML = `
    <button class="back" id="back">◂ Return to Mission Control</button>
    <div class="station-view">
      ${patientHtml}
      <section class="step-panel">${stepHtml}</section>
    </div>
  `;

  document.getElementById("back").onclick = () => goto("/mission");

  root.querySelectorAll("button.choice").forEach(btn => {
    btn.onclick = () => {
      const next = btn.dataset.next;
      if (next === "MISSION") goto("/mission");
      else goto(`/${station.id}/${next}`);
    };
  });
}

function renderStep(step) {
  const bannerHtml =
    step.state === "stabilized" ? `<div class="banner success">Patient Stabilized</div>`
    : step.state === "failed" ? `<div class="banner danger">Adverse Event — Reset</div>`
    : step.state === "partial" ? `<div class="banner warn">Partial Mitigation — Escalate</div>`
    : step.state === "complete" ? `<div class="banner success">Station Complete</div>`
    : "";

  let panelHtml = "";
  if (step.panel) {
    if (step.panel.type === "compare") {
      const leftCls = step.panel.mismatch ? "col danger" : "col";
      const rightCls = step.panel.mismatch ? "col safe" : "col";
      panelHtml = `
        <div class="panel-compare">
          <div class="${leftCls}">
            <h4>${step.panel.left.title}</h4>
            <ul>${step.panel.left.lines.map(l => `<li>${l}</li>`).join("")}</ul>
          </div>
          <div class="${rightCls}">
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
    // Note: extracted verdict if present
    if (step.panel.verdict && step.panel.type !== "diag" && step.panel.type !== "log") {
      panelHtml += `<div class="verdict">${step.panel.verdict}</div>`;
    }
  }

  // Teaching card (takes over body)
  if (step.takeaways) {
    const teachHtml = `
      <div class="teaching">
        <h3>What You Just Defended</h3>
        <p>${step.body}</p>
        <ul>${step.takeaways.map(t => `<li>${t}</li>`).join("")}</ul>
        ${step.realWorld ? `<div class="real-world">${step.realWorld}</div>` : ""}
      </div>
    `;
    return `
      ${bannerHtml}
      <h2>${step.heading}</h2>
      ${teachHtml}
      <div class="choices">${renderChoices(step)}</div>
    `;
  }

  return `
    ${bannerHtml}
    <h2>${step.heading}</h2>
    <div class="body">${step.body}</div>
    ${panelHtml}
    <div class="choices">${renderChoices(step)}</div>
  `;
}

function renderChoices(step) {
  return step.choices
    .map(c => {
      const cls = c.correct ? "choice" : c.tag === "fail" ? "choice danger" : "choice secondary";
      return `<button class="${cls}" data-next="${c.next}">${c.label}</button>`;
    })
    .join("");
}

function renderCloseout() {
  root.innerHTML = `
    <section class="closeout">
      <h3>EREBUS // MedBay Uplink Closed</h3>
      <h1>${CLOSEOUT.title}</h1>
      ${CLOSEOUT.lines.map(l => `<p>${l}</p>`).join("")}
      <button class="cta" id="replay">${CLOSEOUT.cta}</button>
    </section>
  `;
  document.getElementById("replay").onclick = () => {
    state.stabilized.clear();
    state.startTime = Date.now();
    goto("/mission");
  };
}
