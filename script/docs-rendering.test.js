"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { createNavigation } = require("./docs-navigation");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "docs/manifest.json"), "utf8"),
);
const source = fs.readFileSync(path.join(root, "docs.html"), "utf8");

function renderingHarness() {
  // Execute the shipped renderer and its hashchange listener. DOM presentation
  // is stubbed because these regressions concern fetch and navigation order.
  const start = source.indexOf("const cache = new Map();");
  const end = source.indexOf("await render();", start);
  assert.ok(
    start >= 0 && end > start,
    "The manual renderer must be present in docs.html",
  );

  const navigation = createNavigation(manifest);
  const pending = new Map();
  const timers = new Map();
  const failures = [];
  const errors = [];
  const focusedPages = [];
  const loadingEl = { textContent: "" };
  const progressChanges = [];
  let progressHidden = true;
  const progressEl = {
    get hidden() {
      return progressHidden;
    },
    set hidden(value) {
      progressHidden = value;
      progressChanges.push(value);
    },
  };
  let articleHTML = "";
  let articleWrites = 0;
  let nextTimer = 0;
  let hashchange;
  let click;
  const article = {
    get innerHTML() {
      return articleHTML;
    },
    set innerHTML(html) {
      articleHTML = html;
      articleWrites++;
      // A new innerHTML assignment discards every existing DOM node.
      this.contentNode = {};
    },
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
    querySelectorAll: () => [],
  };
  const sourceLink = { hidden: true };
  const document = {
    title: "",
    addEventListener(name, listener) {
      assert.equal(name, "click");
      click = listener;
    },
    querySelector(selector) {
      assert.equal(selector, "[data-doc-source]");
      return sourceLink;
    },
  };
  const location = {
    hash: "",
    replace(href) {
      this.hash = href;
    },
  };
  const context = vm.createContext({
    navigation,
    article,
    loadingEl,
    progressEl,
    tocEl: { hidden: true },
    pagerEl: { replaceChildren() {} },
    document,
    location,
    navEl: { querySelectorAll: () => [] },
    pager() {},
    pageContext() {},
    expandCategory() {},
    slugger: () => () => "",
    scrollToFragment(focusPage) {
      focusedPages.push(focusPage);
    },
    fail(message) {
      failures.push(message);
      context.handleFailure(message);
    },
    console: { error: (error) => errors.push(error) },
    window: {
      marked: { parse: (markdown) => markdown },
      addEventListener(name, listener) {
        assert.equal(name, "hashchange");
        hashchange = listener;
      },
    },
    setTimeout(callback) {
      const id = ++nextTimer;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    fetch(file) {
      assert.ok(!pending.has(file), `Unexpected duplicate fetch: ${file}`);
      return new Promise((resolve, reject) =>
        pending.set(file, { resolve, reject }),
      );
    },
  });
  const failStart = source.indexOf("const fail =");
  const failEnd = source.indexOf("let manifest;", failStart);
  vm.runInContext(
    `{ ${source.slice(failStart, failEnd)}\nglobalThis.handleFailure = fail; }`,
    context,
  );
  vm.runInContext(
    `${source.slice(start, end)}\nglobalThis.testRenderer = { render, cache };`,
    context,
    { filename: "docs.html" },
  );
  assert.equal(typeof hashchange, "function");

  return {
    pages: navigation.pages,
    article,
    loadingEl,
    progressEl,
    progressChanges,
    document,
    location,
    failures,
    errors,
    focusedPages,
    get articleWrites() {
      return articleWrites;
    },
    cache: context.testRenderer.cache,
    navigate(page, fragment = "") {
      location.hash = `#${page.route}${fragment ? "#" + fragment : ""}`;
      return hashchange();
    },
    clickLink(href, eventOptions = {}, linkOptions = {}) {
      const link = {
        target: "",
        hasAttribute: (name) => name === "download" && !!linkOptions.download,
        getAttribute: () => href,
        ...linkOptions,
      };
      const event = {
        button: 0,
        defaultPrevented: false,
        target: { closest: () => link },
        preventDefault() {
          this.defaultPrevented = true;
        },
        ...eventOptions,
      };
      click(event);
      return event;
    },
    showLoaders() {
      for (const callback of timers.values()) callback();
      timers.clear();
    },
    succeed(page, markdown) {
      const request = pending.get(page.file);
      assert.ok(request, `No pending fetch for ${page.file}`);
      pending.delete(page.file);
      request.resolve({ ok: true, text: async () => markdown });
    },
    reject(page) {
      const request = pending.get(page.file);
      assert.ok(request, `No pending fetch for ${page.file}`);
      pending.delete(page.file);
      request.reject(new Error("A delayed fetch failed"));
    },
  };
}

test("returning to a cached page prevents a slower page from replacing it", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  await harness.navigate(pageA);

  const loadingB = harness.navigate(pageB);
  assert.equal(harness.progressEl.hidden, false);
  harness.showLoaders();
  assert.equal(harness.article.innerHTML, "page A");
  assert.equal(harness.loadingEl.textContent, `Loading ${pageB.title}…`);
  await harness.navigate(pageA);
  assert.equal(harness.article.innerHTML, "page A");
  assert.equal(harness.loadingEl.textContent, "");
  assert.equal(harness.progressEl.hidden, true);
  assert.equal(harness.article.attributes.get("aria-busy"), "false");

  harness.succeed(pageB, "page B");
  await loadingB;
  assert.equal(harness.article.innerHTML, "page A");
  assert.equal(harness.location.hash, `#${pageA.route}`);
  assert.equal(harness.document.title, `${pageA.title} — Lumine Documentation`);
  assert.deepEqual(harness.failures, []);
});

test("a cold slow page fetch preserves the displayed article until the new page is ready", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  await harness.navigate(pageA);
  const currentNode = harness.article.contentNode;

  const loadingB = harness.navigate(pageB);
  assert.equal(harness.progressEl.hidden, false);
  harness.showLoaders();
  assert.equal(harness.article.contentNode, currentNode);
  assert.equal(harness.articleWrites, 1);
  assert.equal(harness.document.title, `${pageA.title} — Lumine Documentation`);
  assert.equal(harness.loadingEl.textContent, `Loading ${pageB.title}…`);

  harness.succeed(pageB, "page B");
  await loadingB;
  assert.equal(harness.article.innerHTML, "page B");
  assert.equal(harness.articleWrites, 2);
  assert.equal(harness.loadingEl.textContent, "");
  assert.equal(harness.progressEl.hidden, true);
  assert.equal(harness.article.attributes.get("aria-busy"), "false");
});

test("heading navigation preserves the current article and cancels an in-flight page switch", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  await harness.navigate(pageA);
  const currentNode = harness.article.contentNode;
  await harness.navigate(pageA, "first-heading");
  assert.equal(harness.article.contentNode, currentNode);

  const loadingB = harness.navigate(pageB);
  harness.showLoaders();
  await harness.navigate(pageA, "second-heading");
  assert.equal(harness.article.contentNode, currentNode);
  assert.equal(harness.article.attributes.get("aria-busy"), "false");
  assert.equal(harness.loadingEl.textContent, "");
  assert.equal(harness.progressEl.hidden, true);
  assert.deepEqual(harness.focusedPages, [false, false, false]);

  harness.succeed(pageB, "page B");
  await loadingB;
  assert.equal(harness.article.contentNode, currentNode);
  assert.equal(harness.articleWrites, 1);
  assert.equal(harness.location.hash, `#${pageA.route}#second-heading`);
});

test("only the newest cold navigation can update the article or loading status", async () => {
  const harness = renderingHarness();
  const [pageA, pageB, pageC] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  await harness.navigate(pageA);

  const loadingB = harness.navigate(pageB);
  harness.showLoaders();
  const loadingC = harness.navigate(pageC);
  assert.equal(harness.loadingEl.textContent, "");
  assert.equal(harness.progressEl.hidden, false);
  harness.showLoaders();
  assert.equal(harness.loadingEl.textContent, `Loading ${pageC.title}…`);

  harness.succeed(pageB, "page B");
  await loadingB;
  assert.equal(harness.article.innerHTML, "page A");
  assert.equal(harness.loadingEl.textContent, `Loading ${pageC.title}…`);
  assert.equal(harness.article.attributes.get("aria-busy"), "true");
  assert.equal(harness.progressEl.hidden, false);

  harness.succeed(pageC, "page C");
  await loadingC;
  assert.equal(harness.article.innerHTML, "page C");
  assert.equal(harness.articleWrites, 2);
  assert.equal(harness.loadingEl.textContent, "");
  assert.equal(harness.progressEl.hidden, true);
  assert.equal(harness.document.title, `${pageC.title} — Lumine Documentation`);
});

test("a failed page clears loading state and the previously displayed page can be restored", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  await harness.navigate(pageA);

  const loadingB = harness.navigate(pageB);
  harness.showLoaders();
  harness.reject(pageB);
  await loadingB;
  assert.deepEqual(harness.failures, ["Could not load this page."]);
  assert.equal(harness.loadingEl.textContent, "");
  assert.equal(harness.progressEl.hidden, true);
  assert.equal(harness.article.attributes.get("aria-busy"), "false");

  await harness.navigate(pageA, "heading");
  assert.equal(harness.article.innerHTML, "page A");
  assert.equal(harness.articleWrites, 3);
});

test("cached pages and current-page headings never show the loading bar", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  harness.cache.set(pageB.file, "page B");
  await harness.navigate(pageA);
  await harness.navigate(pageA, "heading");
  await harness.navigate(pageB);
  assert.equal(harness.progressEl.hidden, true);
  assert.ok(harness.progressChanges.every((hidden) => hidden));
});

test("clicking the same heading or page link again scrolls without rerendering", async () => {
  const harness = renderingHarness();
  const [page] = harness.pages;
  harness.cache.set(page.file, "page");
  await harness.navigate(page, "heading");
  const currentNode = harness.article.contentNode;
  const progressUpdates = harness.progressChanges.length;

  for (let count = 0; count < 2; count++) {
    const event = harness.clickLink(`#${page.route}#heading`);
    assert.equal(event.defaultPrevented, true);
  }
  assert.deepEqual(harness.focusedPages, [false, false, false]);
  assert.equal(harness.article.contentNode, currentNode);
  assert.equal(harness.progressChanges.length, progressUpdates);

  await harness.navigate(page);
  const event = harness.clickLink(`#${page.route}`);
  assert.equal(event.defaultPrevented, true);
  assert.equal(harness.focusedPages.length, 5);
  assert.equal(harness.articleWrites, 1);
  assert.equal(harness.progressEl.hidden, true);
});

test("same-hash scrolling preserves modified clicks, other destinations and pending navigation", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  await harness.navigate(pageA, "heading");
  const href = harness.location.hash;
  const progressUpdates = harness.progressChanges.length;
  const modifiedClicks = [
    { button: 1 },
    { button: 2 },
    { metaKey: true },
    { ctrlKey: true },
    { shiftKey: true },
    { altKey: true },
  ];
  for (const eventOptions of modifiedClicks)
    assert.equal(harness.clickLink(href, eventOptions).defaultPrevented, false);
  harness.clickLink(href, { defaultPrevented: true });
  for (const linkOptions of [{ target: "_blank" }, { download: true }])
    assert.equal(
      harness.clickLink(href, {}, linkOptions).defaultPrevented,
      false,
    );
  for (const otherHref of [
    "https://example.com/docs.html" + href,
    `#${pageA.route}#another-heading`,
    `#${pageB.route}`,
  ])
    assert.equal(harness.clickLink(otherHref).defaultPrevented, false);
  assert.deepEqual(harness.focusedPages, [false]);
  assert.equal(harness.progressChanges.length, progressUpdates);

  const loadingB = harness.navigate(pageB);
  assert.equal(harness.clickLink(`#${pageB.route}`).defaultPrevented, false);
  assert.deepEqual(harness.focusedPages, [false]);
  assert.equal(harness.progressEl.hidden, false);
  harness.succeed(pageB, "page B");
  await loadingB;
});

test("the manifest shows progress while fetching and clears it after success or failure", async (t) => {
  for (const succeeds of [true, false]) {
    await t.test(succeeds ? "success" : "failure", async () => {
      const start = source.indexOf("const fail =");
      const end = source.indexOf("const navigation =", start);
      const progressEl = { hidden: true };
      const article = { setAttribute() {} };
      let finishFetch;
      const context = vm.createContext({
        article,
        progressEl,
        loadingEl: { textContent: "" },
        tocEl: { hidden: true },
        pagerEl: { replaceChildren() {} },
        document: { querySelector: () => ({ hidden: true }) },
        console: { error() {} },
        window: { marked: {} },
        fetch(file) {
          assert.equal(file, "docs/manifest.json");
          return new Promise((resolve) => {
            finishFetch = resolve;
          });
        },
      });
      const loading = vm.runInContext(
        `(async () => { ${source.slice(start, end)} })()`,
        context,
      );
      assert.equal(progressEl.hidden, false);
      finishFetch({ ok: succeeds, status: 503, json: async () => manifest });
      await loading;
      assert.equal(progressEl.hidden, true);
      if (!succeeds) assert.match(article.innerHTML, /role="alert"/);
    });
  }
});

test("page navigation moves focus to the page heading only after the initial page", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  harness.cache.set(pageB.file, "page B");
  await harness.navigate(pageA);
  await harness.navigate(pageB);
  await harness.navigate(pageB);
  assert.deepEqual(harness.focusedPages, [false, true, false]);
  assert.equal(harness.article.attributes.get("aria-busy"), "false");
});

test("the article is busy during a fetch and ready after the requested page renders", async () => {
  const harness = renderingHarness();
  const [page] = harness.pages;
  const rendering = harness.navigate(page);
  assert.equal(harness.article.attributes.get("aria-busy"), "true");
  assert.equal(harness.progressEl.hidden, false);
  harness.succeed(page, "page");
  await rendering;
  assert.equal(harness.article.attributes.get("aria-busy"), "false");
  assert.equal(harness.progressEl.hidden, true);
});

test("collapsed chapter links are hidden and the toggle controls their list", () => {
  const start = source.indexOf("const expandCategory =");
  const end = source.indexOf("// The hash carries", start);
  assert.ok(start >= 0 && end > start);

  function element(tag) {
    const classes = new Set();
    return {
      tag,
      children: [],
      attributes: new Map(),
      dataset: {},
      listeners: new Map(),
      classList: {
        contains: (name) => classes.has(name),
        toggle(name, enabled) {
          const on = enabled ?? !classes.has(name);
          if (on) classes.add(name);
          else classes.delete(name);
          return on;
        },
      },
      appendChild(child) {
        this.children.push(child);
      },
      setAttribute(name, value) {
        this.attributes.set(name, value);
      },
      addEventListener(name, listener) {
        this.listeners.set(name, listener);
      },
      querySelector(selector) {
        return this.children.find((child) =>
          selector === "button"
            ? child.tag === "button"
            : child.className === selector.slice(1),
        );
      },
    };
  }

  const navEl = element("nav");
  const context = vm.createContext({
    manifest,
    navEl,
    document: { createElement: element },
  });
  vm.runInContext(
    `${source.slice(start, end)}\nglobalThis.expandCategory = expandCategory;`,
    context,
  );

  const group = navEl.children[0];
  const heading = group.querySelector("button");
  const list = group.querySelector(".nav-pages");
  assert.equal(heading.attributes.get("aria-controls"), list.id);
  assert.equal(heading.attributes.get("aria-expanded"), "false");
  assert.equal(list.hidden, true);

  heading.listeners.get("click")();
  assert.equal(list.hidden, false);
  assert.equal(heading.attributes.get("aria-expanded"), "true");
  heading.listeners.get("click")();
  assert.equal(list.hidden, true);
  assert.equal(heading.attributes.get("aria-expanded"), "false");

  // Selecting a page in a closed category must reveal its navigation again.
  context.expandCategory(group, true);
  assert.equal(list.hidden, false);
  assert.equal(heading.attributes.get("aria-expanded"), "true");
});

test("page contents follow the introduction and link to the canonical heading route", () => {
  const start = source.indexOf("const pageContext =");
  const end = source.indexOf("const pager =", start);
  assert.ok(start >= 0 && end > start);
  const headings = [
    { id: "build-from-source", textContent: "Build from source" },
    { id: "open-files-and-projects", textContent: "Open files and projects" },
  ];
  const breadcrumbEl = { textContent: "" };
  const sourceLink = { href: "", hidden: true };
  const tocEl = { hidden: true };
  const tocLinksEl = {
    children: [],
    replaceChildren() {
      this.children = [];
    },
    appendChild(child) {
      this.children.push(child);
    },
  };
  const article = {
    querySelectorAll: () => headings,
    insertBefore(node, heading) {
      assert.equal(node, tocEl);
      assert.equal(heading, headings[0]);
    },
  };
  const context = vm.createContext({
    article,
    breadcrumbEl,
    tocEl,
    tocLinksEl,
    document: {
      querySelector(selector) {
        assert.equal(selector, "[data-doc-source]");
        return sourceLink;
      },
      createElement(tag) {
        return {
          tag,
          children: [],
          appendChild(child) {
            this.children.push(child);
          },
        };
      },
    },
  });
  vm.runInContext(
    `${source.slice(start, end)}\nglobalThis.pageContext = pageContext;`,
    context,
  );
  const navigation = createNavigation(manifest);
  const [page] = navigation.pages;
  context.pageContext(page);
  assert.equal(
    sourceLink.href,
    "https://github.com/lumine-code/lumine-code.github.io/blob/master/docs/getting-started/install-and-launch.md",
  );
  assert.equal(sourceLink.hidden, false);
  assert.equal(
    breadcrumbEl.textContent,
    "Getting started / Install and launch",
  );
  assert.equal(tocEl.hidden, false);
  assert.deepEqual(
    tocLinksEl.children.map((item) => item.children[0].href),
    headings.map((heading) => `#${page.route}#${heading.id}`),
  );
  assert.deepEqual(
    tocLinksEl.children.map((item) => item.children[0].textContent),
    headings.map((heading) => heading.textContent),
  );

  headings.pop();
  context.pageContext(navigation.pages[2]);
  assert.equal(breadcrumbEl.textContent, "Workspace");
  assert.equal(tocEl.hidden, true);
  assert.deepEqual(tocLinksEl.children, []);
});

test("a stale fetch failure cannot replace the cached page with an error", async () => {
  const harness = renderingHarness();
  const [pageA, pageB] = harness.pages;
  harness.cache.set(pageA.file, "page A");
  await harness.navigate(pageA);

  const loadingB = harness.navigate(pageB);
  await harness.navigate(pageA);
  harness.showLoaders();
  assert.equal(harness.article.innerHTML, "page A");

  harness.reject(pageB);
  await loadingB;
  assert.equal(harness.errors.length, 1);
  assert.deepEqual(harness.failures, []);
  assert.equal(harness.article.innerHTML, "page A");
  assert.equal(harness.location.hash, `#${pageA.route}`);
  assert.equal(harness.document.title, `${pageA.title} — Lumine Documentation`);
});
