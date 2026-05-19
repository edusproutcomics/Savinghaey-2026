(function () {
  "use strict";

  const STORAGE_KEY = "savinghaey.memo.items.v1";
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

  function formatDateTime(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function renderMissing() {
    els.printCategory.textContent = "MEMO NOT FOUND";
    els.printTitle.textContent = "메모를 찾을 수 없습니다";
    els.printMeta.textContent = "현재 브라우저 localStorage에 해당 메모가 없습니다.";
    els.printBody.textContent = "메모 작성 페이지에서 저장된 메모를 다시 선택하세요.";
    els.btnEditMemo.href = "/memo/";
  }

  function renderMemo(memo) {
    const title = memo.title || "제목 없음";
    const category = memo.category || "MEMO";
    const updated = formatDateTime(memo.updatedAt || memo.createdAt);
    const content = memo.content || memo.body || "";

    document.title = title + " | 메모 상세/출력";
    els.printCategory.textContent = category;
    els.printTitle.textContent = title;
    els.printMeta.innerHTML = [
      '<span>작성/수정: ' + escapeHtml(updated) + '</span>',
      '<span>분류: ' + escapeHtml(category) + '</span>'
    ].join("");
    els.printBody.innerHTML = escapeHtml(content);
    els.printFoot.textContent = "고해영 일병 구하기 · savinghaey.co.kr · " + updated;
    els.btnEditMemo.href = "/memo/?id=" + encodeURIComponent(memo.id);

    els.btnCopyMemo.addEventListener("click", function () {
      navigator.clipboard.writeText(content).then(function () {
        els.btnCopyMemo.textContent = "복사 완료";
        setTimeout(function () { els.btnCopyMemo.textContent = "내용 복사"; }, 1200);
      }).catch(function () {
        alert("복사에 실패했습니다. 내용을 직접 선택해 복사하세요.");
      });
    });
  }

  function boot() {
    ["btnEditMemo", "btnCopyMemo", "btnPrintMemo", "printCategory", "printTitle", "printMeta", "printBody", "printFoot"].forEach(function (id) {
      els[id] = document.getElementById(id);
    });

    const params = new URLSearchParams(location.search);
    const id = params.get("id") || "";
    const printNow = params.get("print") === "1";
    const memo = readMemos().find(function (item) { return item.id === id; });

    els.btnPrintMemo.addEventListener("click", function () { window.print(); });

    if (!memo) {
      renderMissing();
      return;
    }

    renderMemo(memo);
    if (printNow) setTimeout(function () { window.print(); }, 350);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
