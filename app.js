const rawData = window.__STUDY_DATA__;
const supplementalNotes = window.__SUPPLEMENTAL_NOTES__ || [];

if (!rawData) {
  throw new Error("Study data is missing.");
}

const data = {
  ...rawData,
  notes: [...rawData.notes, ...supplementalNotes].sort((a, b) => a.order - b.order),
};

const unitOrder = ["Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "General"];
const notesByUnit = groupByUnit(data.notes);
const availableUnits = unitOrder.filter((unit) => notesByUnit.has(unit));

const heroStats = document.querySelector("#hero-stats");
const unitNav = document.querySelector("#unit-nav");
const notesRoot = document.querySelector("#notes-root");
const notesSummary = document.querySelector("#notes-summary");
const syllabusPreview = document.querySelector("#syllabus-preview");
const questionPreview = document.querySelector("#question-preview");

renderChrome();
renderNotes();

initTabs();

function initTabs() {
  const tabBar = document.querySelector("#tab-bar");
  if (!tabBar) return;
  tabBar.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-content").forEach((tc) => tc.classList.remove("active"));
    const target = document.querySelector("#tab-" + tab.dataset.tab);
    if (target) target.classList.add("active");

    if (tab.dataset.tab === "questions") {
      renderQuestionPapers();
    }
  });
}

function renderQuestionPapers() {
  const root = document.querySelector("#question-papers-root");
  if (!root || root.dataset.rendered) return;
  root.dataset.rendered = "true";

  const papers = [
    { label: "Question Paper 1", text: data.questionPaper },
    { label: "Question Paper 2", text: data.questionPaper2 },
  ];

  root.innerHTML = papers.map((p, i) => `
    <details class="qp-card" ${i === 0 ? "open" : ""}>
      <summary><span class="qp-label">${escapeHtml(p.label)}</span></summary>
      <pre class="qp-text">${escapeHtml(p.text)}</pre>
    </details>
  `).join("");
}

if (typeof mermaid !== 'undefined') {
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', maxTextSize: 60000 });
  setTimeout(() => {
    document.querySelectorAll('.mermaid').forEach(el => {
      if (!el.dataset.processed) {
        mermaid.run({ nodes: [el] });
        el.dataset.processed = 'true';
      }
    });
  }, 300);
}

function renderChrome() {
  heroStats.innerHTML = [
    buildStat(data.notes.length, "Total note sections"),
    buildStat(supplementalNotes.length, "New syllabus notes added"),
    buildStat(availableUnits.length, "Units covered"),
  ].join("");

  notesSummary.textContent = "All " + rawData.notes.length + " extracted conversation notes plus " + supplementalNotes.length + " added syllabus notes covering all missing topics across Units 2, 3, 4, 5 and General.";
  syllabusPreview.textContent = data.syllabus;
  questionPreview.textContent = data.questionPaper;

  unitNav.innerHTML = availableUnits
    .map((unit) => '<a href="#' + slugify(unit) + '">' + escapeHtml(unit) + '</a>')
    .join("");
}

function renderNotes() {
  notesRoot.innerHTML = availableUnits
    .map((unit) => {
      const notes = notesByUnit.get(unit);
      return '<section class="unit-section" id="' + slugify(unit) + '">' +
        '<div class="unit-heading">' +
          '<p class="card-kicker">' + escapeHtml(unit) + '</p>' +
          '<h2>' + escapeHtml(unitTitle(unit)) + '</h2>' +
          '<span>' + notes.length + ' topics</span>' +
        '</div>' +
        '<div class="topic-stack">' + notes.map(renderNote).join("") + '</div>' +
      '</section>';
    })
    .join("");
}

function renderNote(note) {
  return '<details class="note-card" ' + (note.order <= 2 ? "open" : "") + '>' +
    '<summary>' +
      '<span class="note-title">' + escapeHtml(note.title) + '</span>' +
      '<span class="note-excerpt">' + escapeHtml(note.excerpt) + '...</span>' +
    '</summary>' +
    '<article class="note-content">' + note.html + '</article>' +
  '</details>';
}

function groupByUnit(notes) {
  const groups = new Map();
  for (const note of notes) {
    if (!groups.has(note.unit)) {
      groups.set(note.unit, []);
    }
    groups.get(note.unit).push(note);
  }
  return groups;
}

function unitTitle(unit) {
  return {
    "Unit 1": "Introduction to Cyber Security",
    "Unit 2": "Cyber Crime Techniques",
    "Unit 3": "Identity Theft and Financial Fraud",
    "Unit 4": "Cyber Law and Investigation",
    "Unit 5": "Information Security Policy and Standards",
    General: "General Notes",
  }[unit] || unit;
}

function buildStat(value, label) {
  return '<div class="stat"><strong>' + escapeHtml(String(value)) + '</strong><span>' + escapeHtml(label) + '</span></div>';
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
