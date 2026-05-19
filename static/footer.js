(function () {
  if (window.__GO_OFFICER_STANDARD_FOOTER_LOADED__) return;
  window.__GO_OFFICER_STANDARD_FOOTER_LOADED__ = true;

  const FALLBACK = {
    masterBrand: "고해영 일병 구하기",
    editionTitle: "savinghaey 개인 업무보조",
    operatorName: "고해영",
    contactEmail: "",
    trustMessage: "이 사이트는 개인 업무보조용 비공식 정적 사이트입니다. 최종 기준은 공문·지침·편람 등 공식 자료를 우선합니다.",
    affectionLine: "오늘 해야 할 일을 정리하고, 바로 찾고, 필요한 메모는 바로 출력합니다.",
    playfulAlias: "개인 업무보조",
    routes: { home: "/", scheduler: "/work-scheduler/", links: "/links/", memo: "/memo/" }
  };

  function mergeBrand(raw) {
    const cfg = raw || {};
    return Object.assign({}, FALLBACK, cfg, {
      routes: Object.assign({}, FALLBACK.routes, cfg.routes || {})
    });
  }

  function loadBrand(done) {
    if (window.SITE_BRAND) {
      done(mergeBrand(window.SITE_BRAND));
      return;
    }

    const existing = document.querySelector('script[data-brand-config-loader="true"]');
    if (existing) {
      existing.addEventListener("load", function onLoad() {
        existing.removeEventListener("load", onLoad);
        done(mergeBrand(window.SITE_BRAND));
      });
      existing.addEventListener("error", function onError() {
        existing.removeEventListener("error", onError);
        done(mergeBrand(FALLBACK));
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "/static/brand-config.js";
    script.async = false;
    script.setAttribute("data-brand-config-loader", "true");
    script.addEventListener("load", function () { done(mergeBrand(window.SITE_BRAND)); });
    script.addEventListener("error", function () { done(mergeBrand(FALLBACK)); });
    document.head.appendChild(script);
  }

  function isHomePage() {
    const path = String(location.pathname || "/").toLowerCase();
    return path === "/" || path === "/index.html" || path === "/index.htm";
  }

  function toElement(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  function removeLegacyUi() {
    document.querySelectorAll(".home-link-wrap, footer.site-footer, footer.simple-footer").forEach(function (node) {
      node.remove();
    });
    document.querySelectorAll("#brandBackToTop, #back-to-top-fab, #back-to-top, #backToTop, .back-to-top, .scroll-top, .go-top, .btn-top").forEach(function (node) {
      node.remove();
    });
  }

  function injectHomeLink(cfg) {
    if (isHomePage()) return;
    const link = toElement([
      '<div class="home-link-wrap" data-standard-home-link="true">',
      '  <a class="btn-home" href="' + (cfg.routes.home || "/") + '">메인으로 돌아가기</a>',
      '</div>'
    ].join(""));
    document.body.appendChild(link);
  }

  function injectFooter(cfg) {
    const year = new Date().getFullYear();
    const html = [
      '<footer class="site-footer" data-standard-footer="true">',
      '  <div class="shell">',
      '    <p class="footer-brand-line"><span class="footer-brand-name">© ' + year + '. ' + cfg.masterBrand + '</span><span class="footer-brand-pill">' + cfg.playfulAlias + '</span></p>',
      '    <p>' + cfg.editionTitle + ' · 운영자: ' + cfg.operatorName + (cfg.contactEmail ? ' · Contact: ' + cfg.contactEmail : '') + '</p>',
      '    <p>' + cfg.trustMessage + '</p>',
      '    <p>' + cfg.affectionLine + '</p>',
      '  </div>',
      '</footer>'
    ].join("");
    document.body.appendChild(toElement(html));
  }

  function ensureBackToTop() {
    const styleId = "brand-back-to-top-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = [
        "@media print{#brandBackToTop{display:none !important;}}",
        "#brandBackToTop{position:fixed;right:16px;bottom:16px;z-index:2147483646;display:none;}",
        "#brandBackToTop.is-visible{display:block;}",
        "#brandBackToTop .btn{border-radius:999px;padding:10px 14px;box-shadow:0 10px 24px rgba(0,0,0,.14);}"
      ].join("");
      document.head.appendChild(style);
    }

    const wrap = toElement('<div id="brandBackToTop" aria-label="페이지 상단으로 이동"><button type="button" class="btn">위로</button></div>');
    document.body.appendChild(wrap);

    const button = wrap.querySelector("button");
    button.addEventListener("click", function () {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); }
      catch (_) { window.scrollTo(0, 0); }
    });

    const toggle = function () {
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;
      wrap.classList.toggle("is-visible", y > 240);
    };

    window.addEventListener("scroll", toggle, { passive: true });
    window.addEventListener("resize", toggle);
    window.addEventListener("orientationchange", toggle);
    toggle();
  }

  function init(cfg) {
    removeLegacyUi();
    injectHomeLink(cfg);
    injectFooter(cfg);
    ensureBackToTop();
  }

  function boot() { loadBrand(init); }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
