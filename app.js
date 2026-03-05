const state = {
  topics: [],
  hardware: [],
  template: null,
  selectedTopicIds: [],
  durationsByTopicId: {},
  generatedLessons: [],
  hardwareRows: []
};

const topicsTreeEl = document.getElementById("topics-tree");
const topicSearchEl = document.getElementById("topic-search");
const selectedLessonsEl = document.getElementById("selected-lessons");
const generateBtn = document.getElementById("generate-btn");
const classSizeEl = document.getElementById("class-size");
const lessonPacksEl = document.getElementById("lesson-packs");
const sowSummaryEl = document.getElementById("sow-summary");
const hardwareSummaryEl = document.getElementById("hardware-summary");
const viewerEl = document.getElementById("asset-viewer");
const printBtn = document.getElementById("print-btn");
const lessonItemTemplate = document.getElementById("lesson-item-template");

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

  bindEvents();
  renderTopicsTree();
  renderSelectedLessons();
}

function bindEvents() {
  topicSearchEl.addEventListener("input", renderTopicsTree);
  generateBtn.addEventListener("click", generateScheme);
  printBtn.addEventListener("click", () => window.print());
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
}

function renderSelectedLessons() {
  selectedLessonsEl.innerHTML = "";

  state.selectedTopicIds.forEach((topicId) => {
    const topic = findTopic(topicId);
    const fragment = lessonItemTemplate.content.cloneNode(true);
    const item = fragment.querySelector(".lesson-item");
    const title = fragment.querySelector(".lesson-title");
    const durationSelect = fragment.querySelector(".duration-select");

    item.dataset.topicId = topicId;
    title.textContent = topic ? topic.name : topicId;
    durationSelect.value = String(state.durationsByTopicId[topicId] || 60);

    durationSelect.addEventListener("change", () => {
      state.durationsByTopicId[topicId] = Number(durationSelect.value);
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
}

function generateScheme() {
  const selectedTopics = state.selectedTopicIds.map(findTopic).filter(Boolean);
  state.generatedLessons = selectedTopics.map((topic, index) => generateLesson(topic, index));

  renderLessonPacks();
  renderSowSummary();
  computeHardwareRows();
  renderHardware();
}

function generateLesson(topic, index) {
  const duration = state.durationsByTopicId[topic.id] || topic.estimated_minutes || 60;
  const content = topic.content || {};
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
    return {
      key: block.key,
      name: block.name,
      missing: false,
      html
    };
  });

  return {
    lessonNumber: index + 1,
    topic,
    duration,
    blocks
  };
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
      const left = document.createElement("span");
      left.textContent = block.name;

      const right = document.createElement("button");
      right.type = "button";
      right.textContent = block.missing ? "View Missing" : "Open";
      right.addEventListener("click", () => renderViewer(lesson, block));

      li.appendChild(left);
      li.appendChild(right);
      blockList.appendChild(li);
    });

    card.appendChild(blockList);
    lessonPacksEl.appendChild(card);
  });
}

function renderViewer(lesson, block) {
  viewerEl.innerHTML = `
    <h4>Lesson ${lesson.lessonNumber}: ${escapeHtml(lesson.topic.name)}</h4>
    <p class="muted">${escapeHtml(block.name)}</p>
    <div class="content-render">${block.html}</div>
  `;
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
  const classSize = Math.max(1, Number(classSizeEl.value) || 1);
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

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
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
      <td>${escapeHtml(row.sku)}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.matchedTags.join(", "))}</td>
      <td>${row.required}</td>
      <td></td>
      <td class="to-buy">${row.toBuy}</td>
    `;

    const ownInput = document.createElement("input");
    ownInput.type = "number";
    ownInput.min = "0";
    ownInput.value = "0";
    ownInput.addEventListener("input", () => {
      row.owned = Math.max(0, Number(ownInput.value) || 0);
      row.toBuy = Math.max(0, row.required - row.owned);
      tr.querySelector(".to-buy").textContent = String(row.toBuy);
    });

    tr.children[4].appendChild(ownInput);
    tbody.appendChild(tr);
  });

  hardwareSummaryEl.innerHTML = "";
  hardwareSummaryEl.appendChild(table);
}

function findTopic(topicId) {
  return state.topics.find((topic) => topic.id === topicId);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
