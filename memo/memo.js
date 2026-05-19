(function () {
  "use strict";

  const STORAGE_KEY = "savinghaey.memo.items.v1";
  const state = { memos: [], activeId: "", query: "" };
  const els = {};

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function readMemos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function writeMemos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.memos));
  }

  function nowIso() { return new Date().toISOString(); }

  function formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function currentMemo() {
    return state.memos.find(function (memo) { return memo.id === state.activeId; }) || null;
  }

  function sortedMemos() {
    return state.memos.slice().sort(function (a, b) {
      return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
    });
  }

  function matchingMemos() {
    const q = state.query.trim().toLowerCase();
    const list = sortedMemos();
    if (!q) return list;
    return list.filter(function (memo) {
      const haystack = [memo.title, memo.category, memo.content].join(" ").toLowerCase();
      return q.split(/\s+/).every(function (word) { return haystack.includes(word); });
    });
  }

  function setStatus(text) {
    els.memoStatus.textContent = text || "";
  }

  function renderPreview() {
    const title = els.memoTitleInput.value.trim() || "제목 없음";
    const category = els.memoCategoryInput.value.trim() || "분류 없음";
    const content = els.memoContentInput.value.trim() || "메모 내용을 입력하면 이곳에 미리보기가 표시됩니다.";
    els.memoPreview.innerHTML = [
      '<p class="page-kicker">' + escapeHtml(category) + '</p>',
      '<h3 style="margin-top:0;">' + escapeHtml(title) + '</h3>',
      '<div style="white-space:pre-wrap;">' + escapeHtml(content) + '</div>'
    ].join("");
  }

  function fillForm(memo) {
    state.activeId = memo ? memo.id : "";
    els.memoId.value = memo ? memo.id : "";
    els.memoTitleInput.value = memo ? memo.title || "" : "";
    els.memoCategoryInput.value = memo ? memo.category || "" : "";
    els.memoContentInput.value = memo ? memo.content || "" : "";
    setStatus(memo ? "편집 중: " + (memo.title || "제목 없음") : "새 메모를 작성 중입니다.");
    renderPreview();
    renderList();
  }

  function readForm() {
    const title = els.memoTitleInput.value.trim();
    const category = els.memoCategoryInput.value.trim();
    const content = els.memoContentInput.value.trim();
    if (!title || !content) {
      alert("제목과 내용을 입력하세요.");
      return null;
    }
    const existing = currentMemo();
    const now = nowIso();
    return {
      id: els.memoId.value || "memo-" + Date.now().toString(36),
      title: title,
      category: category,
      content: content,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now
    };
  }

  function saveMemo(showStatus) {
    const memo = readForm();
    if (!memo) return null;
    const idx = state.memos.findIndex(function (item) { return item.id === memo.id; });
    if (idx >= 0) state.memos[idx] = memo;
    else state.memos.push(memo);
    state.activeId = memo.id;
    writeMemos();
    fillForm(memo);
    if (showStatus) setStatus("저장 완료: " + memo.title);
    return memo;
  }

  function renderList() {
    const list = matchingMemos();
    els.memoEmpty.hidden = list.length > 0;
    els.memoList.innerHTML = list.map(function (memo) {
      const active = memo.id === state.activeId ? ' aria-current="true"' : '';
      const excerpt = String(memo.content || "").replace(/\s+/g, " ").slice(0, 80);
      return [
        '<article class="card memo-card" data-id="' + escapeHtml(memo.id) + '"' + active + '>',
        '  <h3>' + escapeHtml(memo.title || "제목 없음") + '</h3>',
        '  <p>' + escapeHtml(memo.category || "분류 없음") + ' · ' + escapeHtml(formatDateTime(memo.updatedAt || memo.createdAt)) + '</p>',
        '  <p>' + escapeHtml(excerpt) + (excerpt.length >= 80 ? '…' : '') + '</p>',
        '  <div class="memo-card-actions">',
        '    <button class="btn ghost" type="button" data-action="edit" data-id="' + escapeHtml(memo.id) + '">편집</button>',
        '    <a class="btn ghost" href="/memo/detail.html?id=' + encodeURIComponent(memo.id) + '">상세</a>',
        '    <a class="btn primary" href="/memo/detail.html?id=' + encodeURIComponent(memo.id) + '&print=1">출력/PDF</a>',
        '    <button class="btn danger" type="button" data-action="delete" data-id="' + escapeHtml(memo.id) + '">삭제</button>',
        '  </div>',
        '</article>'
      ].join("");
    }).join("");
    setStatus("전체 " + state.memos.length + "개 · 표시 " + list.length + "개" + (state.activeId ? " · 선택됨" : ""));
  }

  function openDetail() {
    const memo = saveMemo(true);
    if (!memo) return;
    window.open("/memo/detail.html?id=" + encodeURIComponent(memo.id), "_blank", "noopener,noreferrer");
  }

  function deleteMemo(id) {
    const memo = state.memos.find(function (item) { return item.id === id; });
    if (!memo) return;
    if (!confirm((memo.title || "메모") + "을(를) 삭제할까요?")) return;
    state.memos = state.memos.filter(function (item) { return item.id !== id; });
    writeMemos();
    if (state.activeId === id) fillForm(null);
    else renderList();
  }

  function exportMemos() {
    const blob = new Blob([JSON.stringify({ exportedAt: nowIso(), memos: state.memos }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "savinghaey-memos-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  function importMemos(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        const imported = Array.isArray(data) ? data : data.memos;
        if (!Array.isArray(imported)) throw new Error("invalid");
        const byId = new Map(state.memos.map(function (memo) { return [memo.id, memo]; }));
        imported.forEach(function (memo) { if (memo && memo.id) byId.set(memo.id, memo); });
        state.memos = Array.from(byId.values());
        writeMemos();
        renderList();
      } catch (_) {
        alert("JSON 파일을 확인하세요.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function bind() {
    els.memoForm.addEventListener("submit", function (event) { event.preventDefault(); saveMemo(true); });
    els.btnNewMemo.addEventListener("click", function () { fillForm(null); els.memoTitleInput.focus(); });
    els.btnOpenDetail.addEventListener("click", openDetail);
    els.memoTitleInput.addEventListener("input", renderPreview);
    els.memoCategoryInput.addEventListener("input", renderPreview);
    els.memoContentInput.addEventListener("input", renderPreview);
    els.memoSearch.addEventListener("input", function () { state.query = els.memoSearch.value; renderList(); });
    els.memoList.addEventListener("click", function (event) {
      const target = event.target.closest("[data-action]");
      if (!target) return;
      const id = target.getAttribute("data-id");
      if (target.getAttribute("data-action") === "edit") {
        const memo = state.memos.find(function (item) { return item.id === id; });
        if (memo) fillForm(memo);
      }
      if (target.getAttribute("data-action") === "delete") deleteMemo(id);
    });
    els.btnExportMemos.addEventListener("click", exportMemos);
    els.btnImportMemos.addEventListener("click", function () { els.memoImportFile.click(); });
    els.memoImportFile.addEventListener("change", function () {
      importMemos(els.memoImportFile.files && els.memoImportFile.files[0]);
      els.memoImportFile.value = "";
    });
  }

  function boot() {
    [
      "memoForm", "memoId", "memoTitleInput", "memoCategoryInput", "memoContentInput", "btnNewMemo", "btnOpenDetail",
      "memoSearch", "memoStatus", "memoList", "memoEmpty", "memoPreview", "btnExportMemos", "btnImportMemos", "memoImportFile"
    ].forEach(function (id) { els[id] = document.getElementById(id); });
    state.memos = readMemos();
    bind();
    const params = new URLSearchParams(location.search);
    const id = params.get("id") || params.get("edit") || "";
    const selected = id ? state.memos.find(function (memo) { return memo.id === id; }) : null;
    fillForm(selected || null);
    renderList();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
