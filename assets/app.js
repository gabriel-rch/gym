/* =============================================================================
   app.js — wiring: settings, date navigation, and rendering the daily edition.
   ========================================================================== */

const STORAGE_KEY = "gym.edition.settings";

const KIND_LABEL = { lift: "Treinar", cardio: "Condicionar", recovery: "Recuperar", rest: "Descansar" };
const SHORT_LABELS = {
  FB: "Todo", UA: "Sup A", LA: "Inf A", UB: "Sup B", LB: "Inf B",
  PUSH: "Empurrar", PULL: "Puxar", LEGS: "Pernas", CARDIO: "Cardio", RECOVERY: "Caminhada",
};

const WEEKDAYS_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

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

/* --- controls (populated once) ------------------------------------------- */
function buildControls() {
  const phaseSel = $("#phaseSelect");
  phaseSel.innerHTML = PHASES.map(
    (p) => `<option value="${p.id}">Fase ${p.n} · ${p.name}</option>`
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
    .map((f) => `<option value="${f}">${f} dias</option>`)
    .join("");
  freqSel.value = String(state.frequency);
}

/* --- one exercise card --------------------------------------------------- */
function exerciseCard(item, index) {
  const { exercise: ex, dose, slot } = item;
  const num = String(index + 1).padStart(2, "0");
  if (!ex) {
    return `<article class="ex-card empty"><div class="ex-index">${num}</div>
      <div class="ex-body"><div class="ex-slot">${slot.label}</div>
      <h3 class="ex-name">Nenhum exercício correspondente</h3></div></article>`;
  }

  const map = muscleMapSVG(ex);
  const feelBody = map
    ? `<div class="cue-feel-row"><p>${ex.feel}</p>` +
      `<figure class="ex-figure">${map}<figcaption class="bm-caption">Frente / Costas</figcaption></figure></div>`
    : `<p>${ex.feel}</p>`;

  let cues;
  if (ex.desc) {
    cues = `<div class="cue cue-note"><span class="cue-label">Nota</span><p>${ex.desc}</p></div>`;
  } else {
    cues = `
      <div class="cue cue-feel${map ? " has-map" : ""}"><span class="cue-label">Sinta em</span>${feelBody}</div>
      <div class="cue cue-form"><span class="cue-label">Forma</span><p>${ex.form}</p></div>
      <div class="cue cue-avoid"><span class="cue-label">Evite</span><ul class="cue-list">${ex.avoid.split(";").map(s => `<li>${s.trim()}</li>`).join("")}</ul></div>`;
  }

  return `
    <article class="ex-card">
      <div class="ex-index">${num}</div>
      <div class="ex-body">
        <div class="ex-slot">${slot.label}</div>
        <h3 class="ex-name">${ex.name}</h3>
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
    const label = s.type === "rest" ? "Descanso" : SHORT_LABELS[s.templateId] || s.templateId;
    const cls = ["week-cell", `kind-${s.type}`, i === todayIdx ? "is-today" : ""].join(" ");
    return `<button class="${cls}" data-offset="${i - todayIdx}">
      <span class="week-dow">${wd}</span>
      <span class="week-num">${cellDate.getDate()}</span>
      <span class="week-label">${label}</span>
    </button>`;
  }).join("");

  const host = $("#weekstrip");
  host.innerHTML = `<div class="week-head">A semana</div><div class="week-grid">${cells}</div>`;
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

  const weekday = d.toLocaleDateString("pt-BR", { weekday: "long" });
  const dateFull = d.toLocaleDateString("pt-BR", { month: "long", day: "numeric", year: "numeric" });
  const edition = dayNumber(d) - EPOCH_DN + 1;

  const sessionName =
    session.type === "rest" ? "Dia de descanso"
    : session.type === "recovery" ? "Recuperação ativa"
    : session.type === "cardio" ? "Cardio + Técnica"
    : session.template.name;

  let effort = "";
  if (session.type === "lift") {
    effort = `<p class="hero-effort"><b>Esforço</b> — termine toda série efetiva com ${phase.rir}. Comece com 5–10 min de cardio leve e uma série de teste leve.</p>`;
  } else if (session.template && session.template.note) {
    effort = `<p class="hero-effort">${session.template.note}</p>`;
  } else if (session.type === "rest") {
    effort = `<p class="hero-effort">Nenhuma sessão programada para hoje. Movimento leve supera o descanso total — uma curta caminhada basta.</p>`;
  }

  $("#hero").innerHTML = `
    <div class="hero-meta">
      <span class="edition-no" title="A data de hoje define a seleção — o mesmo dia sempre rende o mesmo treino.">Edição Nº ${edition}</span>
    </div>
    <h1 class="hero-date">
      <span class="weekday">${weekday}</span>
      <span class="date-full">${dateFull}</span>
    </h1>
    <div class="hero-session">
      <span class="kind-chip kind-${session.type}">${KIND_LABEL[session.type]}</span>
      <span class="session-name">${sessionName}</span>
    </div>
    <p class="hero-blurb"><b>Fase ${phase.n} · ${phase.name}</b> <span class="weeks">${phase.weeks}</span> — ${phase.blurb}</p>
    ${effort}`;
}

/* --- the program --------------------------------------------------------- */
function renderProgram(workout) {
  const host = $("#program");
  if (workout.session.type === "rest") {
    host.innerHTML = `<div class="rest-panel">
      <div class="rest-mark">✕</div>
      <h2>Descanso</h2>
      <p>A recuperação é onde o esforço dá frutos. Coma, durma e deixe a dor muscular assentar —
      sua próxima sessão está na barra acima.</p>
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
