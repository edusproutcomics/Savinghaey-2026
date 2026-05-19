/* 차단하고 싶은 영역에만 붙일 클래스, 속성들
class="no-copy"
class="block-copy"
class="protect-copy"
data-copy-block="true"
data-no-copy="true" 
*/



(function () {
  if (window.__GO_OFFICER_GLOBAL_LOADER__) return;
  window.__GO_OFFICER_GLOBAL_LOADER__ = true;

  const VERSION = "20260425-mm-brand-block-list";

  const DEFAULT_COPY_BLOCK_SELECTORS = [
    ".no-copy",
    ".block-copy",
    ".protect-copy",
    "[data-copy-block='true']",
    "[data-no-copy='true']"
  ];

  const DEFAULT_COPY_ALLOW_SELECTORS = [
    ".allow-copy",
    ".copy-allow",
    "[data-copy-allow='true']",
    "input",
    "textarea",
    "[contenteditable='true']",
    "pre",
    "code"
  ];

  function ensureStyle() {
    const hasStyle = !!document.querySelector('link[href*="/static/style.css"]');
    if (hasStyle) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/static/style.css?v=" + VERSION;
    document.head.appendChild(link);
  }

  function ensureScript(src, attrs) {
    const existing = document.querySelector('script[src*="' + src + '"]');
    if (existing) return Promise.resolve(existing);

    return new Promise(function (resolve) {
      const script = document.createElement("script");
      script.src = src + "?v=" + VERSION;
      script.async = false;

      if (attrs) {
        Object.keys(attrs).forEach(function (key) {
          script.setAttribute(key, attrs[key]);
        });
      }

      script.onload = function () {
        resolve(script);
      };

      script.onerror = function () {
        resolve(script);
      };

      document.head.appendChild(script);
    });
  }

  function ensureBrandStack() {
    ensureStyle();

    return ensureScript("/static/brand-config.js").then(function () {
      return ensureScript("/static/brand-ui.js", { defer: "" });
    });
  }

  function normalizeSelectorList(value, fallback) {
    if (Array.isArray(value)) {
      return value
        .map(function (item) {
          return String(item || "").trim();
        })
        .filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map(function (item) {
          return item.trim();
        })
        .filter(Boolean);
    }

    return fallback.slice();
  }

  function joinSelectors(selectors) {
    return selectors.filter(Boolean).join(", ");
  }

  function toElement(node) {
    if (!node) return null;

    if (node.nodeType === Node.ELEMENT_NODE) {
      return node;
    }

    if (node.parentElement) {
      return node.parentElement;
    }

    return null;
  }

  function matchesSelector(element, selector) {
    if (!element || !selector || !element.matches) return false;

    try {
      return element.matches(selector);
    } catch (error) {
      return false;
    }
  }

  function closestPolicyType(element, blockSelector, allowSelector) {
    let current = toElement(element);

    while (current && current !== document.documentElement) {
      if (matchesSelector(current, allowSelector)) {
        return "allow";
      }

      if (matchesSelector(current, blockSelector)) {
        return "block";
      }

      current = current.parentElement;
    }

    return "allow";
  }

  function isBlockedByPolicy(target, blockSelector, allowSelector) {
    if (!blockSelector) return false;
    return closestPolicyType(target, blockSelector, allowSelector) === "block";
  }

  function rangeIntersectsNode(range, node) {
    try {
      return range.intersectsNode(node);
    } catch (error) {
      return false;
    }
  }

  function selectionContainsBlockedText(blockSelector, allowSelector) {
    const selection = window.getSelection ? window.getSelection() : null;

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }

    for (let i = 0; i < selection.rangeCount; i += 1) {
      const range = selection.getRangeAt(i);
      const root = toElement(range.commonAncestorContainer) || document.body;

      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            const text = String(node.nodeValue || "");

            if (!text.trim()) {
              return NodeFilter.FILTER_REJECT;
            }

            if (!rangeIntersectsNode(range, node)) {
              return NodeFilter.FILTER_REJECT;
            }

            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      let currentNode = walker.nextNode();

      while (currentNode) {
        const parent = toElement(currentNode);

        if (isBlockedByPolicy(parent, blockSelector, allowSelector)) {
          return true;
        }

        currentNode = walker.nextNode();
      }
    }

    return false;
  }

  function buildProtectionCss(blockSelectors, allowSelectors) {
    const blockCss = blockSelectors.join(",\n");

    const allowInsideBlockCss = [];

    blockSelectors.forEach(function (blockSelector) {
      allowSelectors.forEach(function (allowSelector) {
        allowInsideBlockCss.push(blockSelector + " " + allowSelector);
      });
    });

    return [
      blockCss + " {",
      "  -webkit-user-select: none;",
      "  user-select: none;",
      "}",
      "",
      allowInsideBlockCss.join(",\n") + " {",
      "  -webkit-user-select: text;",
      "  user-select: text;",
      "}"
    ].join("\n");
  }

  function ensureProtectionCss(blockSelectors, allowSelectors) {
    const styleId = "go-officer-copy-block-list-style";

    if (document.getElementById(styleId)) return;
    if (!blockSelectors.length) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = buildProtectionCss(blockSelectors, allowSelectors);

    document.head.appendChild(style);
  }

  function applyProtection() {
    const cfg = window.SITE_BRAND || {};

    // brand-config.js에서 copyProtection: false면 보호 기능 전체 비활성화
    if (cfg.copyProtection === false) return;

    const host = location.hostname || "";

    const allowedHosts = [
      "savinghaey.co.kr",
      "localhost",
      "127.0.0.1"
    ];

    if (!allowedHosts.includes(host)) return;

    const blockSelectors = normalizeSelectorList(
      cfg.copyBlockSelectors,
      DEFAULT_COPY_BLOCK_SELECTORS
    );

    const allowSelectors = normalizeSelectorList(
      cfg.copyAllowSelectors,
      DEFAULT_COPY_ALLOW_SELECTORS
    );

    const blockSelector = joinSelectors(blockSelectors);
    const allowSelector = joinSelectors(allowSelectors);

    if (!blockSelector) return;

    ensureProtectionCss(blockSelectors, allowSelectors);

    function shouldBlockEvent(event) {
      if (isBlockedByPolicy(event.target, blockSelector, allowSelector)) {
        return true;
      }

      if (
        event.type === "copy" ||
        event.type === "cut"
      ) {
        return selectionContainsBlockedText(blockSelector, allowSelector);
      }

      return false;
    }

    function blockIfNeeded(event) {
      if (!shouldBlockEvent(event)) return;

      event.preventDefault();
      event.stopPropagation();
    }

    // 차단 영역에서만 우클릭 차단
    document.addEventListener("contextmenu", blockIfNeeded, {
      capture: true,
      passive: false
    });

    // 차단 영역에서만 텍스트 선택 시작 차단
    document.addEventListener("selectstart", blockIfNeeded, {
      capture: true,
      passive: false
    });

    // 차단 영역에서만 복사 차단
    document.addEventListener("copy", blockIfNeeded, {
      capture: true,
      passive: false
    });

    // 차단 영역에서만 잘라내기 차단
    document.addEventListener("cut", blockIfNeeded, {
      capture: true,
      passive: false
    });

    // 차단 영역에서만 드래그 차단
    document.addEventListener("dragstart", blockIfNeeded, {
      capture: true,
      passive: false
    });

    // Ctrl/Cmd + C, X, A 보조 차단
    document.addEventListener(
      "keydown",
      function (event) {
        const key = String(event.key || "").toLowerCase();
        const isCopyRelatedKey = ["c", "x", "a"].includes(key);
        const isModifierPressed = event.ctrlKey || event.metaKey;

        if (!isModifierPressed || !isCopyRelatedKey) return;

        const targetBlocked = isBlockedByPolicy(
          event.target,
          blockSelector,
          allowSelector
        );

        const selectionBlocked = selectionContainsBlockedText(
          blockSelector,
          allowSelector
        );

        if (!targetBlocked && !selectionBlocked) return;

        event.preventDefault();
        event.stopPropagation();
      },
      true
    );
  }

  function init() {
    ensureBrandStack().then(function () {
      applyProtection();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
