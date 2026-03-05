const state = {
  topics: [],
  hardware: [],
  template: null,
  selectedTopicIds: [],
  durationsByTopicId: {},
  generatedLessons: [],
  teacherChecks: [],
  hardwareRows: [],
  classSize: 24
};

const topicsTreeEl = document.getElementById("topics-tree");
const topicSearchEl = document.getElementById("topic-search");
const selectedLessonsEl = document.getElementById("selected-lessons");
const generateBtn = document.getElementById("generate-btn");
const classSizeEl = document.getElementById("class-size");
const sowCoverEl = document.getElementById("sow-cover");
const lessonPacksEl = document.getElementById("lesson-packs");
const sowSummaryEl = document.getElementById("sow-summary");
const hardwareSummaryEl = document.getElementById("hardware-summary");
const teacherChecksEl = document.getElementById("teacher-checks");
const viewerEl = document.getElementById("asset-viewer");
const printBtn = document.getElementById("print-btn");
const clearBtn = document.getElementById("clear-btn");
const toastEl = document.getElementById("toast");
const lessonItemTemplate = document.getElementById("lesson-item-template");
const metricTopicsEl = document.getElementById("metric-topics");
const metricHoursEl = document.getElementById("metric-hours");
const metricReadinessEl = document.getElementById("metric-readiness");
const metricHardwareEl = document.getElementById("metric-hardware");
const STORAGE_KEY = "sow_generator_session_v2";

init().catch((error) => {
  console.error(error);
  topicsTreeEl.innerHTML = "<p>Failed to load data files.</p>";
});

async function init() {
  const [topics, hardware, templates] = await Promise.all([
    fetchJson("data/topics.json"),
    fetchJson("data/hardware.json"),
    fetchJson("data/templates.json")
  ]);

  state.topics = topics;
  state.hardware = hardware;
  state.template = templates[0];
  restoreSession();
  classSizeEl.value = String(state.classSize);

  bindEvents();
  renderTopicsTree();
  renderSelectedLessons();
  renderTeacherChecks();
  renderKpis();
}

function bindEvents() {
  topicSearchEl.addEventListener("input", renderTopicsTree);
  generateBtn.addEventListener("click", generateScheme);
  printBtn.addEventListener("click", () => window.print());
  clearBtn.addEventListener("click", resetSession);
  classSizeEl.addEventListener("input", () => {
    state.classSize = Math.max(1, Number(classSizeEl.value) || 1);
    persistSession();
    computeHardwareRows();
    renderHardware();
    renderKpis();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== topicSearchEl) {
      event.preventDefault();
      topicSearchEl.focus();
    }
  });
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch ${url}`);
  }
  return response.json();
}

function renderTopicsTree() {
  const search = topicSearchEl.value.trim().toLowerCase();
  const filtered = state.topics.filter((topic) => {
    const haystack = `${topic.name} ${topic.subject} ${topic.domain} ${topic.level}`.toLowerCase();
    return haystack.includes(search);
  });

  const grouped = groupBySubjectDomain(filtered);
  topicsTreeEl.innerHTML = "";

  Object.entries(grouped).forEach(([subject, domains]) => {
    const subjectDetails = document.createElement("details");
    subjectDetails.open = true;
    const subjectSummary = document.createElement("summary");
    subjectSummary.textContent = subject;
    subjectDetails.appendChild(subjectSummary);

    Object.entries(domains).forEach(([domain, topics]) => {
      const domainDetails = document.createElement("details");
      domainDetails.open = true;
      const domainSummary = document.createElement("summary");
      domainSummary.textContent = domain;
      domainDetails.appendChild(domainSummary);

      topics.forEach((topic) => {
        const row = document.createElement("label");
        row.className = "topic-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = state.selectedTopicIds.includes(topic.id);
        checkbox.addEventListener("change", () => {
          toggleTopic(topic.id, checkbox.checked);
        });

        const text = document.createElement("span");
        text.textContent = `${topic.name} (${topic.level})`;

        row.appendChild(checkbox);
        row.appendChild(text);
        domainDetails.appendChild(row);
      });

      subjectDetails.appendChild(domainDetails);
    });

    topicsTreeEl.appendChild(subjectDetails);
  });
}

function groupBySubjectDomain(topics) {
  return topics.reduce((acc, topic) => {
    if (!acc[topic.subject]) {
      acc[topic.subject] = {};
    }
    if (!acc[topic.subject][topic.domain]) {
      acc[topic.subject][topic.domain] = [];
    }
    acc[topic.subject][topic.domain].push(topic);
    return acc;
  }, {});
}

function toggleTopic(topicId, checked) {
  const index = state.selectedTopicIds.indexOf(topicId);
  if (checked && index === -1) {
    state.selectedTopicIds.push(topicId);
    state.durationsByTopicId[topicId] = state.durationsByTopicId[topicId] || 60;
  } else if (!checked && index >= 0) {
    state.selectedTopicIds.splice(index, 1);
  }
  renderSelectedLessons();
  persistSession();
  renderKpis();
}

function renderSelectedLessons() {
  selectedLessonsEl.innerHTML = "";

  state.selectedTopicIds.forEach((topicId) => {
    const topic = findTopic(topicId);
    const fragment = lessonItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".lesson-item");
    const title = fragment.querySelector(".lesson-title");
    const durationSelect = fragment.querySelector(".duration-select");

    const removeBtn = fragment.querySelector(".remove-btn");

    item.dataset.topicId = topicId;
    title.textContent = topic ? topic.name : topicId;
    durationSelect.value = String(state.durationsByTopicId[topicId] || 60);

    durationSelect.addEventListener("change", () => {
      state.durationsByTopicId[topicId] = Number(durationSelect.value);
      persistSession();
      renderKpis();
    });

    removeBtn.addEventListener("click", () => {
      toggleTopic(topicId, false);
      renderTopicsTree();
      showToast("Lesson removed from plan.");
    });

    attachDragHandlers(item);
    selectedLessonsEl.appendChild(fragment);
  });
}

let lessonDragOverBound = false;

function attachDragHandlers(item) {
  item.addEventListener("dragstart", () => {
    item.classList.add("dragging");
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    syncOrderFromDom();
  });

  if (!lessonDragOverBound) {
    selectedLessonsEl.addEventListener("dragover", (event) => {
      event.preventDefault();
      const dragging = selectedLessonsEl.querySelector(".dragging");
      const target = event.target.closest(".lesson-item");
      if (!dragging || !target || dragging === target) {
        return;
      }

      const rect = target.getBoundingClientRect();
      const insertBefore = event.clientY < rect.top + rect.height / 2;
      selectedLessonsEl.insertBefore(dragging, insertBefore ? target : target.nextSibling);
    });
    lessonDragOverBound = true;
  }
}

function syncOrderFromDom() {
  state.selectedTopicIds = [...selectedLessonsEl.querySelectorAll(".lesson-item")].map((item) => item.dataset.topicId);
  persistSession();
  renderKpis();
}

function generateScheme() {
  runGeneration(true);
}

function runGeneration(notify) {
  const selectedTopics = state.selectedTopicIds.map(findTopic).filter(Boolean);
  state.teacherChecks = [];
  state.generatedLessons = selectedTopics.map((topic, index) => generateLesson(topic, index));

  renderCover(selectedTopics);
  renderLessonPacks();
  renderSowSummary();
  computeHardwareRows();
  renderHardware();
  renderTeacherChecks();
  renderKpis();
  persistSession();
  if (notify) {
    showToast("Scheme generated successfully.");
  }
}

function generateLesson(topic, index) {
  const duration = state.durationsByTopicId[topic.id] || topic.estimated_minutes || 60;
  const content = topic.content || {};
  const lessonTeacherChecks = [];
  const blocks = state.template.blocks.map((block) => {
    const html = content[block.content_field];
    if (!html || !String(html).trim()) {
      return {
        key: block.key,
        name: block.name,
        missing: true,
        html: `<p>Missing content for ${block.name}.</p>`
      };
    }
    const extracted = extractTeacherChecks(html);
    if (extracted.notes.length) {
      lessonTeacherChecks.push(...extracted.notes.map((note) => `${block.name}: ${note}`));
    }
    return {
      key: block.key,
      name: block.name,
      missing: false,
      html: extracted.studentHtml
    };
  });

  if (lessonTeacherChecks.length) {
    state.teacherChecks.push({
      lessonNumber: index + 1,
      topicName: topic.name,
      duration,
      checks: lessonTeacherChecks
    });
  }

  return {
    lessonNumber: index + 1,
    topic,
    duration,
    blocks
  };
}

function renderCover(selectedTopics) {
  if (!sowCoverEl || !selectedTopics.length) {
    if (sowCoverEl) sowCoverEl.hidden = true;
    return;
  }

  const subjects = [...new Set(selectedTopics.map((t) => t.subject))].join(" / ");
  const totalMinutes = state.selectedTopicIds.reduce((sum, id) => {
    return sum + (state.durationsByTopicId[id] || findTopic(id)?.estimated_minutes || 60);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const classSize = Math.max(1, Number(classSizeEl.value) || state.classSize || 24);
  const dateStr = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  sowCoverEl.hidden = false;
  sowCoverEl.innerHTML = `
    <div class="cover-logo-row">
      <img src="assets/matrix%20light.png" alt="Matrix TSL" class="cover-logo">
    </div>
    <h1 class="cover-title">Scheme of Work</h1>
    <p class="cover-subject">${escapeHtml(subjects)}</p>
    <div class="cover-meta">
      <div class="cover-meta-item"><span class="cover-meta-label">Lessons</span><span class="cover-meta-value">${selectedTopics.length}</span></div>
      <div class="cover-meta-item"><span class="cover-meta-label">Total Hours</span><span class="cover-meta-value">${totalHours}</span></div>
      <div class="cover-meta-item"><span class="cover-meta-label">Class Size</span><span class="cover-meta-value">${classSize}</span></div>
      <div class="cover-meta-item"><span class="cover-meta-label">Date</span><span class="cover-meta-value">${dateStr}</span></div>
    </div>
    <div class="cover-about">
      <h2>About This Scheme of Work</h2>
      <p>This Scheme of Work has been generated using the Matrix TSL Scheme of Work Generator. It is fully customised to the selected topics, lesson durations, and class size specified by the lecturer.</p>
      <p>Each lesson pack contains structured content aligned to Matrix TSL engineering curricula, including learning outcomes, teacher-led explanation notes, student practice activities, and assessment tasks.</p>
      <p>Matrix TSL provides industry-leading engineering education resources, hardware kits, and digital tools for further and higher education providers across the UK and internationally.</p>
    </div>
    <div class="cover-footer">
      <p>Generated by Matrix TSL Scheme of Work Generator &nbsp;&bull;&nbsp; <strong>matrixtsl.com</strong></p>
    </div>
  `;
}

function renderLessonPacks() {
  lessonPacksEl.innerHTML = "";

  if (state.generatedLessons.length === 0) {
    lessonPacksEl.innerHTML = '<p class="muted">No lessons generated yet.</p>';
    return;
  }

  state.generatedLessons.forEach((lesson) => {
    const card = document.createElement("article");
    card.className = "lesson-card";
    card.innerHTML = `<strong>Lesson ${lesson.lessonNumber}: ${escapeHtml(lesson.topic.name)}</strong> (${lesson.duration} min)`;

    const blockList = document.createElement("ul");
    blockList.className = "block-list";

    lesson.blocks.forEach((block) => {
      const li = document.createElement("li");
      li.className = "block-item";

      const header = document.createElement("div");
      header.className = "block-item-header";

      const left = document.createElement("span");
      left.textContent = block.name;

      const right = document.createElement("button");
      right.type = "button";
      right.textContent = block.missing ? "View Missing" : "Open";
      right.addEventListener("click", () => renderViewer(lesson, block));

      header.appendChild(left);
      header.appendChild(right);

      const contentDiv = document.createElement("div");
      contentDiv.className = "block-print-content";
      contentDiv.innerHTML = block.html;

      li.appendChild(header);
      li.appendChild(contentDiv);
      blockList.appendChild(li);
    });

    card.appendChild(blockList);
    lessonPacksEl.appendChild(card);
  });
}

function renderTeacherChecks() {
  if (!teacherChecksEl) {
    return;
  }
  if (!state.teacherChecks.length) {
    teacherChecksEl.innerHTML = '<p class="muted">No lecturer checks captured yet.</p>';
    return;
  }

  const section = document.createElement("section");
  section.className = "lecturer-checks-section";
  section.innerHTML = `
    <p class="muted"><strong>Print note:</strong> Student material appears first. Staff-only checks start in this section.</p>
  `;

  state.teacherChecks.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "lesson-card";
    card.innerHTML = `<strong>Lesson ${entry.lessonNumber}: ${escapeHtml(entry.topicName)}</strong> (${entry.duration} min)`;
    const list = document.createElement("ul");
    list.className = "teacher-check-list";
    entry.checks.forEach((check) => {
      const li = document.createElement("li");
      li.textContent = check;
      list.appendChild(li);
    });
    card.appendChild(list);
    section.appendChild(card);
  });

  teacherChecksEl.innerHTML = "";
  teacherChecksEl.appendChild(section);
}

function renderViewer(lesson, block) {
  viewerEl.innerHTML = `
    <h4>Lesson ${lesson.lessonNumber}: ${escapeHtml(lesson.topic.name)}</h4>
    <p class="muted">${escapeHtml(block.name)}</p>
    <div class="content-render">${block.html}</div>
  `;
  viewerEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderSowSummary() {
  if (state.generatedLessons.length === 0) {
    sowSummaryEl.innerHTML = '<p class="muted">No SoW summary yet.</p>';
    return;
  }

  const rows = state.generatedLessons.map((lesson) => {
    const availableBlocks = lesson.blocks.filter((block) => !block.missing).length;
    return `
      <tr>
        <td>${lesson.lessonNumber}</td>
        <td>${escapeHtml(lesson.topic.name)}</td>
        <td>${lesson.duration} min</td>
        <td>${availableBlocks}/${lesson.blocks.length} blocks ready</td>
      </tr>
    `;
  }).join("");

  sowSummaryEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Lesson</th>
          <th>Topic</th>
          <th>Duration</th>
          <th>Content Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function computeHardwareRows() {
  const classSize = Math.max(1, Number(classSizeEl.value) || state.classSize || 1);
  const selectedTopics = state.selectedTopicIds.map(findTopic).filter(Boolean);
  const tagSet = new Set(selectedTopics.flatMap((topic) => topic.hardware_tags || []));

  state.hardwareRows = state.hardware
    .map((item) => {
      const matched = item.supports_tags.filter((tag) => tagSet.has(tag));
      if (matched.length === 0) {
        return null;
      }
      const required = Math.ceil(classSize / item.learners_per_kit);
      return {
        sku: item.sku,
        name: item.name,
        image: item.image || "",
        matchedTags: matched,
        required,
        owned: 0,
        toBuy: required
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchedTags.length - a.matchedTags.length);
}

function renderHardware() {
  if (state.hardwareRows.length === 0) {
    hardwareSummaryEl.innerHTML = '<p class="muted">No matching hardware recommendations yet.</p>';
    return;
  }

  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Image</th>
        <th>SKU</th>
        <th>Item</th>
        <th>Matched Tags</th>
        <th>Required</th>
        <th>Already Own</th>
        <th>Need To Buy</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");
  state.hardwareRows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="hardware-image-cell"></td>
      <td>${escapeHtml(row.sku)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.matchedTags.join(", "))}</td>
      <td>${row.required}</td>
      <td></td>
      <td class="to-buy">${row.toBuy}</td>
    `;

    if (row.image) {
      const img = document.createElement("img");
      img.src = row.image;
      img.alt = `${row.name} image`;
      img.className = "hardware-image";
      img.loading = "lazy";
      tr.children[0].appendChild(img);
    } else {
      tr.children[0].textContent = "-";
    }

    const ownInput = document.createElement("input");
    ownInput.type = "number";
    ownInput.className = "hardware-own-input";
    ownInput.min = "0";
    ownInput.value = "0";
    ownInput.addEventListener("input", () => {
      row.owned = Math.max(0, Number(ownInput.value) || 0);
      row.toBuy = Math.max(0, row.required - row.owned);
      tr.querySelector(".to-buy").textContent = String(row.toBuy);
      persistSession();
    });

    tr.children[5].appendChild(ownInput);
    tbody.appendChild(tr);
  });

  hardwareSummaryEl.innerHTML = "";
  tableWrap.appendChild(table);
  hardwareSummaryEl.appendChild(tableWrap);
}

function renderKpis() {
  const selectedCount = state.selectedTopicIds.length;
  const minutes = state.selectedTopicIds.reduce((sum, topicId) => {
    const topic = findTopic(topicId);
    return sum + (state.durationsByTopicId[topicId] || topic?.estimated_minutes || 60);
  }, 0);
  const totalBlocks = state.generatedLessons.reduce((sum, lesson) => sum + lesson.blocks.length, 0);
  const readyBlocks = state.generatedLessons.reduce(
    (sum, lesson) => sum + lesson.blocks.filter((block) => !block.missing).length,
    0
  );
  const readiness = totalBlocks === 0 ? 0 : Math.round((readyBlocks / totalBlocks) * 100);

  metricTopicsEl.textContent = String(selectedCount);
  metricHoursEl.textContent = (minutes / 60).toFixed(1);
  metricReadinessEl.textContent = `${readiness}%`;
  metricHardwareEl.textContent = String(state.hardwareRows.length);
}

function persistSession() {
  const payload = {
    selectedTopicIds: state.selectedTopicIds,
    durationsByTopicId: state.durationsByTopicId,
    classSize: Math.max(1, Number(classSizeEl.value) || state.classSize || 24),
    generatedLessons: state.generatedLessons,
    teacherChecks: state.teacherChecks
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Could not persist session", error);
  }
}

function restoreSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    state.selectedTopicIds = Array.isArray(parsed.selectedTopicIds) ? parsed.selectedTopicIds : [];
    state.durationsByTopicId = parsed.durationsByTopicId || {};
    state.classSize = Math.max(1, Number(parsed.classSize) || 24);
    if (state.selectedTopicIds.length) {
      runGeneration(false);
    }
    showToast("Previous session restored.");
  } catch (error) {
    console.warn("Could not restore session", error);
  }
}

function resetSession() {
  const confirmed = window.confirm("Reset all selected topics, durations, and generated output?");
  if (!confirmed) {
    return;
  }
  state.selectedTopicIds = [];
  state.durationsByTopicId = {};
  state.generatedLessons = [];
  state.teacherChecks = [];
  state.hardwareRows = [];
  state.classSize = 24;
  classSizeEl.value = "24";
  lessonPacksEl.innerHTML = '<p class="muted">No lessons generated yet.</p>';
  sowSummaryEl.innerHTML = '<p class="muted">No SoW summary yet.</p>';
  hardwareSummaryEl.innerHTML = '<p class="muted">No matching hardware recommendations yet.</p>';
  if (teacherChecksEl) {
    teacherChecksEl.innerHTML = '<p class="muted">No lecturer checks captured yet.</p>';
  }
  viewerEl.innerHTML = "<p>Select a lesson block to preview its content here.</p>";
  renderTopicsTree();
  renderSelectedLessons();
  renderKpis();
  localStorage.removeItem(STORAGE_KEY);
  showToast("Session reset complete.");
}

let toastTimer;
function showToast(message) {
  if (!toastEl) {
    return;
  }
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add("show");
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2200);
}

function findTopic(topicId) {
  return state.topics.find((topic) => topic.id === topicId);
}

function extractTeacherChecks(html) {
  const source = String(html || "");
  const notes = [];
  const regex = /<p>\s*<strong>\s*Teacher check:\s*<\/strong>\s*([\s\S]*?)<\/p>/gi;
  const studentHtml = source.replace(regex, (_, note) => {
    const cleaned = stripHtml(note).trim();
    if (cleaned) {
      notes.push(cleaned);
    }
    return "";
  });
  return { studentHtml: studentHtml.trim(), notes };
}

function stripHtml(value) {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
