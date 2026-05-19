(function () {
  "use strict";

  const CUSTOM_KEY = "savinghaey.links.custom.v1";
  const FAVORITE_KEY = "savinghaey.links.favorites.v1";
  const state = {
    custom: [],
    favorites: new Set(),
    query: "",
    category: "all",
    favoriteOnly: false
  };
  const els = {};

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function normalizeUrl(value) {
    const url = String(value || "").trim();
    if (!url) return "";
    if (url === "#") return "";
    if (/^(https?:\/\/|\/)/i.test(url)) return url;
    return "https://" + url;
  }

  function baseLinks() {
    const groups = Array.isArray(window.SAVINGHAEY_LINKS) ? window.SAVINGHAEY_LINKS : [];
    return groups.flatMap(function (group) {
      return (group.items || []).map(function (item) {
        return Object.assign({}, item, {
          category: item.category || group.category || "기타",
          source: "default"
        });
      });
    });
  }

  function allLinks() {
    return baseLinks().concat(state.custom.map(function (item) {
      return Object.assign({}, item, { source: "custom" });
    })).map(function (item) {
      const tags = Array.isArray(item.tags)
        ? item.tags
        : String(item.tags || "").split(",").map(function (tag) { return tag.trim(); }).filter(Boolean);
      return Object.assign({}, item, {
        id: item.id || "link-" + Math.random().toString(36).slice(2),
        title: item.title || "제목 없음",
        url: normalizeUrl(item.url),
        category: item.category || "기타",
        description: item.description || "",
        tags: tags
      });
    });
  }

  function filteredLinks() {
    const query = state.query.trim().toLowerCase();
    return allLinks().filter(function (item) {
      if (state.category !== "all" && item.category !== state.category) return false;
      if (state.favoriteOnly && !state.favorites.has(item.id)) return false;
      if (!query) return true;
      const haystack = [item.title, item.description, item.category, item.url, item.tags.join(" ")].join(" ").toLowerCase();
      return query.split(/\s+/).every(function (word) { return haystack.includes(word); });
    });
  }

  function renderCategories() {
    const categories = Array.from(new Set(allLinks().map(function (item) { return item.category; }))).sort();
    const allPressed = state.category === "all" ? "true" : "false";
    const buttons = ['<button class="chip" type="button" data-category="all" aria-pressed="' + allPressed + '">전체</button>'];
    categories.forEach(function (category) {
      buttons.push('<button class="chip" type="button" data-category="' + escapeHtml(category) + '" aria-pressed="' + (state.category === category ? "true" : "false") + '">' + escapeHtml(category) + '</button>');
    });
    els.categoryChips.innerHTML = buttons.join("");
  }

  function renderCard(item) {
    const favorite = state.favorites.has(item.id);
    const tags = item.tags.map(function (tag) {
      return '<span class="chip">' + escapeHtml(tag) + '</span>';
    }).join("");
    const open = item.url
      ? '<a class="btn primary" href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">열기</a>'
      : '<button class="btn ghost" type="button" disabled>URL 필요</button>';
    const editDelete = item.source === "custom"
      ? '<button class="btn ghost" type="button" data-action="edit" data-id="' + escapeHtml(item.id) + '">수정</button><button class="btn danger" type="button" data-action="delete" data-id="' + escapeHtml(item.id) + '">삭제</button>'
      : "";

    return [
      '<article class="card links-card" data-id="' + escapeHtml(item.id) + '">',
      '  <div class="links-card-head">',
      '    <div><p class="page-kicker">' + escapeHtml(item.category) + '</p><h3 class="links-card-title">' + escapeHtml(item.title) + '</h3></div>',
      '    <button class="btn ghost links-star" type="button" data-action="favorite" data-id="' + escapeHtml(item.id) + '" aria-pressed="' + (favorite ? "true" : "false") + '">' + (favorite ? "★" : "☆") + '</button>',
      '  </div>',
      '  <p class="links-card-desc">' + escapeHtml(item.description || "설명이 없습니다.") + '</p>',
      item.url ? '  <p class="links-card-url">' + escapeHtml(item.url) + '</p>' : '  <p class="links-card-url">주소를 입력해 사용하세요.</p>',
      tags ? '  <div class="links-tag-row">' + tags + '</div>' : '',
      '  <div class="links-card-actions">' + open + editDelete + '</div>',
      '</article>'
    ].join("");
  }

  function render() {
    renderCategories();
    const list = filteredLinks();
    els.linksGrid.innerHTML = list.map(renderCard).join("");
    els.linksEmpty.hidden = list.length > 0;
    els.linkStatus.textContent = "전체 " + allLinks().length + "개 · 표시 " + list.length + "개 · 즐겨찾기 " + state.favorites.size + "개";
    els.btnShowFavorites.setAttribute("aria-pressed", state.favoriteOnly ? "true" : "false");
  }

  function clearForm() {
    els.editingCustomId.value = "";
    els.linkForm.reset();
  }

  function saveForm(event) {
    event.preventDefault();
    const id = els.editingCustomId.value || "custom-" + Date.now().toString(36);
    const item = {
      id: id,
      title: els.linkTitle.value.trim(),
      url: normalizeUrl(els.linkUrl.value),
      category: els.linkCategory.value.trim() || "개인 링크",
      description: els.linkDescription.value.trim(),
      tags: els.linkTags.value.split(",").map(function (tag) { return tag.trim(); }).filter(Boolean)
    };
    if (!item.title || !item.url) return;
    const idx = state.custom.findIndex(function (entry) { return entry.id === id; });
    if (idx >= 0) state.custom[idx] = item;
    else state.custom.push(item);
    writeJson(CUSTOM_KEY, state.custom);
    clearForm();
    render();
  }

  function handleCardAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");
    const item = allLinks().find(function (entry) { return entry.id === id; });
    if (!item) return;

    if (action === "favorite") {
      if (state.favorites.has(id)) state.favorites.delete(id);
      else state.favorites.add(id);
      writeJson(FAVORITE_KEY, Array.from(state.favorites));
      render();
      return;
    }

    if (action === "edit" && item.source === "custom") {
      els.editingCustomId.value = item.id;
      els.linkTitle.value = item.title;
      els.linkUrl.value = item.url;
      els.linkCategory.value = item.category;
      els.linkTags.value = item.tags.join(", ");
      els.linkDescription.value = item.description;
      location.hash = "linkFormSection";
      return;
    }

    if (action === "delete" && item.source === "custom") {
      if (!confirm(item.title + " 링크를 삭제할까요?")) return;
      state.custom = state.custom.filter(function (entry) { return entry.id !== id; });
      state.favorites.delete(id);
      writeJson(CUSTOM_KEY, state.custom);
      writeJson(FAVORITE_KEY, Array.from(state.favorites));
      render();
    }
  }

  function exportLinks() {
    const payload = { exportedAt: new Date().toISOString(), customLinks: state.custom, favorites: Array.from(state.favorites) };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "savinghaey-links-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  function importLinks(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || "{}"));
        if (Array.isArray(data.customLinks)) state.custom = data.customLinks;
        if (Array.isArray(data.favorites)) state.favorites = new Set(data.favorites);
        writeJson(CUSTOM_KEY, state.custom);
        writeJson(FAVORITE_KEY, Array.from(state.favorites));
        render();
      } catch (_) {
        alert("JSON 파일을 확인하세요.");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  function bind() {
    els.linkSearch.addEventListener("input", function () { state.query = els.linkSearch.value; render(); });
    els.categoryChips.addEventListener("click", function (event) {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      state.category = button.getAttribute("data-category") || "all";
      render();
    });
    els.btnShowFavorites.addEventListener("click", function () { state.favoriteOnly = !state.favoriteOnly; render(); });
    els.btnResetFilters.addEventListener("click", function () {
      state.query = "";
      state.category = "all";
      state.favoriteOnly = false;
      els.linkSearch.value = "";
      render();
    });
    els.linksGrid.addEventListener("click", handleCardAction);
    els.linkForm.addEventListener("submit", saveForm);
    els.btnClearLinkForm.addEventListener("click", clearForm);
    els.btnExportLinks.addEventListener("click", exportLinks);
    els.btnImportLinks.addEventListener("click", function () { els.linkImportFile.click(); });
    els.linkImportFile.addEventListener("change", function () {
      importLinks(els.linkImportFile.files && els.linkImportFile.files[0]);
      els.linkImportFile.value = "";
    });
  }

  function boot() {
    [
      "linkSearch", "btnShowFavorites", "btnResetFilters", "categoryChips", "linkStatus", "linksGrid", "linksEmpty",
      "linkForm", "editingCustomId", "linkTitle", "linkUrl", "linkCategory", "linkTags", "linkDescription",
      "btnClearLinkForm", "btnExportLinks", "btnImportLinks", "linkImportFile"
    ].forEach(function (id) { els[id] = document.getElementById(id); });

    state.custom = readJson(CUSTOM_KEY, []);
    state.favorites = new Set(readJson(FAVORITE_KEY, []));
    bind();
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
