/* =============================================================================
   catalog.js — the full exercise catalog: search + filter every movement.
   Reuses EXERCISES / TAG_LABELS (data.js) and muscleMapSVG (bodymap.js).
   Loaded as a classic script; no build step.
   ========================================================================== */

const $ = (sel) => document.querySelector(sel);
function label(v) { return TAG_LABELS[v] || v.replace(/-/g, " "); }

/* --- filter groups: the dimensions worth narrowing the catalog by. -------- */
const FILTER_GROUPS = [
  { key: "muscle", title: "Músculo" },
  { key: "pattern", title: "Padrão" },
  { key: "equip", title: "Equipamento" },
  { key: "level", title: "Nível" },
];

/* active filters: one Set of selected values per group. */
const active = { muscle: new Set(), pattern: new Set(), equip: new Set(), level: new Set() };
let query = "";

/* Collect the distinct values present in the pool for a dimension, in a stable
   order (level follows LEVEL_ORDER; the rest keep first-seen order). */
function valuesFor(key) {
  const seen = new Set();
  EXERCISES.forEach((ex) => {
    const v = ex[key];
    (Array.isArray(v) ? v : v ? [v] : []).forEach((x) => seen.add(x));
  });
  const list = [...seen];
  if (key === "level") list.sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  return list;
}

/* A searchable text blob per exercise (name + keywords + human tag labels). */
function haystack(ex) {
  const parts = [ex.name, ...(ex.keywords || [])];
  ["muscle", "pattern", "equip", "level", "util"].forEach((k) => {
    const v = ex[k];
    (Array.isArray(v) ? v : v ? [v] : []).forEach((x) => { parts.push(x, label(x)); });
  });
  return parts.join(" ").toLowerCase();
}

function matches(ex) {
  if (query && !haystack(ex).includes(query)) return false;
  for (const { key } of FILTER_GROUPS) {
    const sel = active[key];
    if (!sel.size) continue;
    const v = ex[key];
    const vals = Array.isArray(v) ? v : v ? [v] : [];
    if (!vals.some((x) => sel.has(x))) return false;
  }
  return true;
}

/* --- one catalog card ---------------------------------------------------- */
function chipRow(ex) {
  const chips = [];
  (ex.muscle || []).forEach((m) => chips.push(`<span class="tag tag-muscle">${label(m)}</span>`));
  (ex.pattern || []).forEach((p) => chips.push(`<span class="tag tag-pattern">${label(p)}</span>`));
  (ex.equip || []).forEach((e) => chips.push(`<span class="tag tag-equip">${label(e)}</span>`));
  if (ex.level) chips.push(`<span class="tag tag-level">${label(ex.level)}</span>`);
  return `<div class="tag-row">${chips.join("")}</div>`;
}

function catalogCard(ex) {
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
      <div class="cue cue-avoid"><span class="cue-label">Evite</span><ul class="cue-list">${ex.avoid.split(";").map((s) => `<li>${s.trim()}</li>`).join("")}</ul></div>`;
  }

  return `
    <article class="ex-card cat-card">
      <div class="ex-body">
        <h3 class="ex-name">${ex.name}</h3>
        ${chipRow(ex)}
        <div class="ex-cues">${cues}</div>
      </div>
    </article>`;
}

/* --- filters UI ---------------------------------------------------------- */
function buildFilters() {
  const host = $("#catFilters");
  host.innerHTML = FILTER_GROUPS.map((g) => {
    const chips = valuesFor(g.key).map((v) =>
      `<button type="button" class="filter-chip" data-group="${g.key}" data-value="${v}">${label(v)}</button>`
    ).join("");
    return `<div class="filter-group">
      <span class="filter-title">${g.title}</span>
      <div class="filter-chips">${chips}</div>
    </div>`;
  }).join("") +
    `<button type="button" id="clearFilters" class="filter-clear" hidden>Limpar filtros ✕</button>`;

  host.querySelectorAll(".filter-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const { group, value } = btn.dataset;
      const set = active[group];
      set.has(value) ? set.delete(value) : set.add(value);
      btn.classList.toggle("is-on", set.has(value));
      render();
    });
  });

  $("#clearFilters").addEventListener("click", () => {
    Object.values(active).forEach((s) => s.clear());
    query = "";
    $("#catSearch").value = "";
    host.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("is-on"));
    render();
  });
}

/* --- render -------------------------------------------------------------- */
function render() {
  const results = EXERCISES.filter(matches);
  $("#catGrid").innerHTML = results.map(catalogCard).join("");

  const total = EXERCISES.length;
  $("#catCount").textContent =
    results.length === total ? `${total} movimentos` : `${results.length} de ${total}`;

  $("#catEmpty").hidden = results.length !== 0;

  const anyFilter = query || Object.values(active).some((s) => s.size);
  const clear = $("#clearFilters");
  if (clear) clear.hidden = !anyFilter;
}

/* --- boot ---------------------------------------------------------------- */
buildFilters();
$("#catSearch").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  render();
});
render();
