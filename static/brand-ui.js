(function () {
  if (window.__GO_OFFICER_BRAND_UI_LOADED__) return;
  window.__GO_OFFICER_BRAND_UI_LOADED__ = true;

  const FALLBACK = {
    masterBrand: "고해영 일병 구하기",
    editionTitle: "savinghaey 개인 업무보조",
    siteTitle: "고해영 일병 구하기 | savinghaey.co.kr",
    siteDescription: "개인 업무 스케줄러, 바로가기 허브, 출력용 메모를 한 곳에서 관리하는 정적 업무 보조 사이트입니다.",
    operatorName: "고해영",
    contactEmail: "",
    feedbackLabel: "",
    slogan: "업무는 기록하고, 놓치는 일은 줄입니다.",
    homeHeadline: "고해영 일병 구하기",
    homeSubtitle: "업무 스케줄러, 바로가기 허브, A4 출력용 메모를 한 곳에서 관리하는 개인 대시보드입니다.",
    trustMessage: "이 사이트는 개인 업무보조용 비공식 정적 사이트입니다. 최종 기준은 공문·지침·편람 등 공식 자료를 우선합니다.",
    affectionLine: "오늘 해야 할 일을 정리하고, 바로 찾고, 필요한 메모는 바로 출력합니다.",
    playfulAlias: "개인 업무보조",

    brandAccentColor: "#000000",
    schoolAccentColor: "#000000",

    heroImage: "/static/alien.jpg",
    routes: {
      home: "/",
      notice: "/notice/",
      faq: "/faq/",
      contact: "/contact/",
      guideForNewMembers: "/guide-for-new-members/",
      scheduler: "/work-scheduler/",
      links: "/links/",
      memo: "/memo/"
    },
    usePublicThemeToggle: false,
    copyProtection: false,
    lightOnly: true
  };

  function mergeBrand(raw) {
    const cfg = raw || {};
    return Object.assign({}, FALLBACK, cfg, {
      routes: Object.assign({}, FALLBACK.routes, cfg.routes || {})
    });
  }

  function resolvePath(obj, path) {
    return String(path || "")
      .split(".")
      .filter(Boolean)
      .reduce(function (acc, key) {
        return acc && Object.prototype.hasOwnProperty.call(acc, key) ? acc[key] : undefined;
      }, obj);
  }

  function interpolate(template, cfg) {
    return String(template || "").replace(/\{([^}]+)\}/g, function (_, key) {
      const value = resolvePath(cfg, key.trim());
      return value === undefined || value === null ? "" : String(value);
    });
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function isExternalUrl(href) {
    return /^https?:\/\//i.test(String(href || ""));
  }

  function externalLinkAttrs(href) {
    return isExternalUrl(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
  }

  function ensureMeta(name, content) {
    let meta = document.querySelector('meta[name="' + name + '"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", name);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
    return meta;
  }

  function ensureProperty(property, content) {
    let meta = document.querySelector('meta[property="' + property + '"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("property", property);
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", content);
    return meta;
  }

  function ensureCanonical(href) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);
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

  function applyLightOnly(cfg) {
    const brandAccent = cfg.brandAccentColor || FALLBACK.brandAccentColor;
    const schoolAccent = cfg.schoolAccentColor || FALLBACK.schoolAccentColor;

    ensureMeta("color-scheme", "light");
    document.documentElement.setAttribute("data-light-only", cfg.lightOnly ? "true" : "false");
    document.documentElement.removeAttribute("data-theme");

    document.documentElement.style.setProperty("--brand-accent", brandAccent);
    document.documentElement.style.setProperty("--school-accent", schoolAccent);
    document.documentElement.style.setProperty("--brand-accent-color", brandAccent);
    document.documentElement.style.setProperty("--school-accent-color", schoolAccent);

    if (document.body) {
      document.body.classList.add("brand-site");
      document.body.classList.remove("theme-retro", "theme-classic");
      if (isHomePage()) document.body.classList.add("page-home", "home-page");
    }
  }

  function applyMeta(cfg) {
    const titleTemplate = document.querySelector('meta[name="x-brand-title"]');
    const rawTitle = titleTemplate && titleTemplate.content ? interpolate(titleTemplate.content, cfg) : document.title;
    const currentTitle = String(rawTitle || "").replace(/\s*[|•]\s*savinghaey 개인 업무보조\s*$/g, "").trim();
    const title = isHomePage() ? cfg.siteTitle : (currentTitle ? currentTitle + " | " + cfg.masterBrand : cfg.siteTitle);

    document.title = title;

    const url = location.origin + location.pathname;

    ensureCanonical(url);
    ensureMeta("description", cfg.siteDescription);
    ensureProperty("og:type", "website");
    ensureProperty("og:site_name", cfg.masterBrand);
    ensureProperty("og:locale", "ko_KR");
    ensureProperty("og:title", title);
    ensureProperty("og:description", cfg.siteDescription);
    ensureProperty("og:url", url);
    ensureProperty("og:image", location.origin + cfg.heroImage);
    ensureMeta("twitter:card", "summary");
    ensureMeta("twitter:title", title);
    ensureMeta("twitter:description", cfg.siteDescription);
    ensureMeta("twitter:image", location.origin + cfg.heroImage);
  }

  function applyBrandText(cfg) {
    document.querySelectorAll("[data-brand-key]").forEach(function (el) {
      const key = el.getAttribute("data-brand-key");
      const value = resolvePath(cfg, key);

      if (value === undefined || value === null) return;

      if (el.hasAttribute("data-brand-html")) {
        el.innerHTML = String(value);
      } else {
        el.textContent = String(value);
      }
    });

    document.querySelectorAll("[data-brand-template]").forEach(function (el) {
      const rendered = interpolate(el.getAttribute("data-brand-template"), cfg);

      if (el.hasAttribute("data-brand-html")) {
        el.innerHTML = rendered;
      } else {
        el.textContent = rendered;
      }
    });

    document.querySelectorAll("[data-brand-route]").forEach(function (el) {
      const key = el.getAttribute("data-brand-route");
      const href = resolvePath(cfg, "routes." + key);

      if (!href) return;

      el.setAttribute("href", href);

      if (isExternalUrl(href)) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  function injectHeader(cfg) {
    document.querySelectorAll("header.brand-site-header[data-brand-header]").forEach(function (node) {
      node.remove();
    });

    const homeHref = cfg.routes.home || "/";
    const feedbackHref = cfg.routes.feedback || "";
    const feedbackLabel = cfg.feedbackLabel || "";

    const feedbackButton = feedbackHref
      ? '      <a class="btn-home brand-feedback-link" href="' + escapeAttribute(feedbackHref) + '"' + externalLinkAttrs(feedbackHref) + ">" + escapeHtml(feedbackLabel) + "</a>"
      : "";

    const header = toElement([
      '<header class="site-header brand-site-header" data-brand-header="true">',
      '  <div class="shell">',
      '    <a class="brand-home-link" href="' + escapeAttribute(homeHref) + '" aria-label="메인으로 이동"><span>' + escapeHtml(cfg.masterBrand) + "</span></a>",
      '    <div class="brand-site-header__right">',
      '      <span class="brand-site-header__tagline">' + escapeHtml(cfg.slogan) + "</span>",
      feedbackButton,
      '      <a class="btn-home" href="' + escapeAttribute(homeHref) + '">메인</a>',
      "    </div>",
      "  </div>",
      "</header>"
    ].join(""));

    document.body.insertBefore(header, document.body.firstChild);
  }

  function normalizeHomeHero(cfg) {
    if (!isHomePage()) return;

    const main = document.querySelector("main");
    if (main) main.classList.add("container", "wide", "home-main");

    const hero = document.querySelector(".home-hero") || document.querySelector(".hero");
    if (!hero) return;

    hero.classList.add("hero", "hero-with-figure");

    const inner = hero.querySelector(".home-hero-inner") || hero.querySelector(".hero-text") || hero.firstElementChild;
    if (inner) inner.classList.add("hero-text");

    const kicker = hero.querySelector(".home-kicker, .page-kicker");
    if (kicker) {
      kicker.classList.add("page-kicker");
      kicker.textContent = cfg.editionTitle;
    }

    const h1 = hero.querySelector("h1");
    if (h1) h1.innerHTML = cfg.homeHeadline.replace(/\s+업무돋움$/, "<br />업무돋움");

    const subtitle = hero.querySelector(".subtitle, .hero-lead, .page-lead");
    if (subtitle) {
      subtitle.classList.add("hero-lead");
      subtitle.textContent = cfg.homeSubtitle;
    }

    if (!hero.querySelector(".hero-figure")) {
      const figure = toElement(
        '<figure class="hero-figure" aria-hidden="true"><img src="' + escapeAttribute(cfg.heroImage) + '" alt="" loading="eager" /></figure>'
      );
      hero.appendChild(figure);
    }
  }

  function improvePageClasses() {
    document.querySelectorAll("main:not(.container):not(.page-main)").forEach(function (main) {
      const hasWide = main.classList.contains("home-main") || main.classList.contains("home-page");
      main.classList.add("container");
      if (hasWide) main.classList.add("wide");
    });

    document.querySelectorAll(".btn.black, .btn.btn-primary").forEach(function (btn) {
      btn.classList.add("primary");
    });
  }

  function boot() {
    const cfg = mergeBrand(window.SITE_BRAND || FALLBACK);

    applyLightOnly(cfg);
    applyMeta(cfg);
    applyBrandText(cfg);
    injectHeader(cfg);
    normalizeHomeHero(cfg);
    improvePageClasses();

    window.BrandUI = {
      brand: cfg,
      resolvePath: function (path) {
        return resolvePath(cfg, path);
      },
      interpolate: function (template) {
        return interpolate(template, cfg);
      }
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
