/* =============================================================================
   app.js — wiring: settings, date navigation, and rendering the daily edition.
   ========================================================================== */

const STORAGE_KEY = "gym.edition.settings";

const KIND_LABEL = { lift: "Train", cardio: "Condition", recovery: "Recover", rest: "Rest" };
const SHORT_LABELS = {
  FB: "Full", UA: "Up A", LA: "Lo A", UB: "Up B", LB: "Lo B",
  PUSH: "Push", PULL: "Pull", LEGS: "Legs", CARDIO: "Cardio", RECOVERY: "Walk",
};

const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const state = {
  date: new Date(),
  phaseId: PHASES[0].id,
  frequency: PHASES[0].defaultFrequency,
};

/* --- settings ------------------------------------------------------------ */
function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && getPhase(saved.phaseId)) {
      state.phaseId = saved.phaseId;
      const phase = getPhase(saved.phaseId);
      state.frequency = availableFrequencies(phase).includes(saved.frequency)
        ? saved.frequency
        : phase.defaultFrequency;
    }
  } catch (_) { /* first run — keep defaults */ }
}
function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phaseId: state.phaseId, frequency: state.frequency }));
  } catch (_) { /* private mode — ignore */ }
}

/* --- small DOM helpers --------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function titleCase(s) {
  return s.replace(/-/g, " ");
}
function tagLabel(v) {
  return TAG_LABELS[v] || titleCase(v);
}

/* --- controls (populated once) ------------------------------------------- */
function buildControls() {
  const phaseSel = $("#phaseSelect");
  phaseSel.innerHTML = PHASES.map(
    (p) => `<option value="${p.id}">Phase ${p.n} · ${p.name}</option>`
  ).join("");
  phaseSel.value = state.phaseId;
  phaseSel.addEventListener("change", () => {
    state.phaseId = phaseSel.value;
    const phase = getPhase(state.phaseId);
    if (!availableFrequencies(phase).includes(state.frequency)) {
      state.frequency = phase.defaultFrequency;
    }
    saveSettings();
    buildFrequencyOptions();
    render();
  });

  buildFrequencyOptions();
  $("#freqSelect").addEventListener("change", (e) => {
    state.frequency = Number(e.target.value);
    saveSettings();
    render();
  });

  $("#prevDay").addEventListener("click", () => { state.date = addDays(state.date, -1); render(); });
  $("#nextDay").addEventListener("click", () => { state.date = addDays(state.date, 1); render(); });
  $("#today").addEventListener("click", () => { state.date = new Date(); render(); });
}

function buildFrequencyOptions() {
  const phase = getPhase(state.phaseId);
  const freqSel = $("#freqSelect");
  freqSel.innerHTML = availableFrequencies(phase)
    .map((f) => `<option value="${f}">${f} days</option>`)
    .join("");
  freqSel.value = String(state.frequency);
}

/* --- tag chips ----------------------------------------------------------- */
function chipRow(ex) {
  const chips = [];
  (ex.muscle || []).forEach((m) => chips.push(`<span class="chip chip-muscle">${tagLabel(m)}</span>`));
  (ex.pattern || []).forEach((p) => chips.push(`<span class="chip chip-pattern">${tagLabel(p)}</span>`));
  (ex.equip || []).forEach((e) => chips.push(`<span class="chip chip-equip">${tagLabel(e)}</span>`));
  return `<div class="ex-tags">${chips.join("")}</div>`;
}
function metaRow(ex) {
  const bits = [`lvl ${ex.level}`, `skill ${ex.skill.join("/")}`, ex.load];
  (ex.util || []).forEach((u) => bits.push(tagLabel(u)));
  return `<div class="ex-meta">${bits.map((b) => `<span>${b}</span>`).join("<i>·</i>")}</div>`;
}

/* --- one exercise card --------------------------------------------------- */
function exerciseCard(item, index) {
  const { exercise: ex, dose, slot } = item;
  const num = String(index + 1).padStart(2, "0");
  if (!ex) {
    return `<article class="ex-card empty"><div class="ex-index">${num}</div>
      <div class="ex-body"><div class="ex-slot">${slot.label}</div>
      <h3 class="ex-name">No matching exercise</h3></div></article>`;
  }

  let cues;
  if (ex.desc) {
    cues = `<div class="cue cue-note"><span class="cue-label">Note</span><p>${ex.desc}</p></div>`;
  } else {
    cues = `
      <div class="cue cue-feel"><span class="cue-label">Feel it in</span><p>${ex.feel}</p></div>
      <div class="cue cue-form"><span class="cue-label">Form</span><p>${ex.form}</p></div>
      <div class="cue cue-avoid"><span class="cue-label">Avoid</span><p>${ex.avoid}</p></div>`;
  }

  return `
    <article class="ex-card">
      <div class="ex-index">${num}</div>
      <div class="ex-body">
        <div class="ex-slot">${slot.label}</div>
        <h3 class="ex-name">${ex.name}</h3>
        ${metaRow(ex)}
        ${chipRow(ex)}
        <div class="ex-cues">${cues}</div>
      </div>
      <div class="ex-dose"><span class="dose-fig">${dose || "—"}</span></div>
    </article>`;
}

/* --- the week strip ------------------------------------------------------ */
function renderWeekStrip(workout) {
  const phase = getPhase(state.phaseId);
  const dn = dayNumber(state.date);
  const todayIdx = weekdayMon0(dn);
  const monday = addDays(state.date, -todayIdx);

  const cells = WEEKDAYS_SHORT.map((wd, i) => {
    const cellDate = addDays(monday, i);
    const s = resolveSession(phase, state.frequency, cellDate);
    const label = s.type === "rest" ? "Rest" : SHORT_LABELS[s.templateId] || s.templateId;
    const cls = ["week-cell", `kind-${s.type}`, i === todayIdx ? "is-today" : ""].join(" ");
    return `<button class="${cls}" data-offset="${i - todayIdx}">
      <span class="week-dow">${wd}</span>
      <span class="week-num">${cellDate.getDate()}</span>
      <span class="week-label">${label}</span>
    </button>`;
  }).join("");

  const host = $("#weekstrip");
  host.innerHTML = `<div class="week-head">The week</div><div class="week-grid">${cells}</div>`;
  host.querySelectorAll(".week-cell").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.date = addDays(state.date, Number(btn.dataset.offset));
      render();
    });
  });
}

/* --- the hero edition block ---------------------------------------------- */
function renderHero(workout) {
  const phase = workout.phase;
  const session = workout.session;
  const d = state.date;

  const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
  const dateFull = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const edition = dayNumber(d) - EPOCH_DN + 1;
  const seedKey = formatDateKey(d);

  const sessionName =
    session.type === "rest" ? "Rest Day"
    : session.type === "recovery" ? "Active Recovery"
    : session.type === "cardio" ? "Cardio + Skill"
    : session.template.name;

  let effort = "";
  if (session.type === "lift") {
    effort = `<p class="hero-effort"><b>Effort</b> — end every working set with ${phase.rir}. Open with 5–10 min easy cardio and a light feeler set.</p>`;
  } else if (session.template && session.template.note) {
    effort = `<p class="hero-effort">${session.template.note}</p>`;
  } else if (session.type === "rest") {
    effort = `<p class="hero-effort">No session scheduled today. Light movement beats total rest — a short walk is plenty.</p>`;
  }

  const isToday = seedKey === formatDateKey(new Date());
  const previewTag = isToday ? "" : `<span class="preview-tag">previewing</span>`;

  $("#hero").innerHTML = `
    <div class="hero-meta">
      <span class="edition-no">Edition Nº ${edition}</span>
      <span class="seed" title="Today's date seeds the selection — the same day always gives the same workout.">seed&nbsp;·&nbsp;${seedKey}</span>
    </div>
    <h1 class="hero-date">
      <span class="weekday">${weekday}</span>
      <span class="date-full">${dateFull}</span>
    </h1>
    <div class="hero-session">
      ${previewTag}
      <span class="kind-chip kind-${session.type}">${KIND_LABEL[session.type]}</span>
      <span class="session-name">${sessionName}</span>
    </div>
    <p class="hero-blurb"><b>Phase ${phase.n} · ${phase.name}</b> <span class="weeks">${phase.weeks}</span> — ${phase.blurb}</p>
    ${effort}`;
}

/* --- the program --------------------------------------------------------- */
function renderProgram(workout) {
  const host = $("#program");
  if (workout.session.type === "rest") {
    host.innerHTML = `<div class="rest-panel">
      <div class="rest-mark">✕</div>
      <h2>Rest</h2>
      <p>Recovery is where the work pays off. Eat, sleep, and let the soreness settle —
      your next session is on the strip above.</p>
    </div>`;
    return;
  }
  host.innerHTML = workout.items.map((item, i) => exerciseCard(item, i)).join("");
}

/* --- top-level render ---------------------------------------------------- */
function render() {
  const phase = getPhase(state.phaseId);
  $("#phaseSelect").value = state.phaseId;
  $("#freqSelect").value = String(state.frequency);

  const workout = buildWorkout(phase, state.frequency, state.date);
  renderHero(workout);
  renderWeekStrip(workout);
  renderProgram(workout);
}

/* --- boot ---------------------------------------------------------------- */
loadSettings();
document.addEventListener("DOMContentLoaded", () => {
  buildControls();
  render();
});
