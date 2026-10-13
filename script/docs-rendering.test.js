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
  let nextTimer = 0;
  let hashchange;
  const article = {
    innerHTML: "",
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, value);
    },
    querySelectorAll: () => [],
  };
  const document = { title: "" };
  const location = {
    hash: "",
    replace(href) {
      this.hash = href;
    },
  };
  const context = vm.createContext({
    navigation,
    article,
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
      article.innerHTML = message;
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
  vm.runInContext(
    `${source.slice(start, end)}\nglobalThis.testRenderer = { render, cache };`,
    context,
    { filename: "docs.html" },
  );
  assert.equal(typeof hashchange, "function");

  return {
    pages: navigation.pages,
    article,
    document,
    location,
    failures,
    errors,
    focusedPages,
    cache: context.testRenderer.cache,
    navigate(page) {
      location.hash = `#${page.route}`;
      return hashchange();
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
  harness.showLoaders();
  assert.match(harness.article.innerHTML, /Loading/);
  await harness.navigate(pageA);
  assert.equal(harness.article.innerHTML, "page A");

  harness.succeed(pageB, "page B");
  await loadingB;
  assert.equal(harness.article.innerHTML, "page A");
  assert.equal(harness.location.hash, `#${pageA.route}`);
  assert.equal(harness.document.title, `${pageA.title} — Lumine Documentation`);
  assert.deepEqual(harness.failures, []);
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
  harness.succeed(page, "page");
  await rendering;
  assert.equal(harness.article.attributes.get("aria-busy"), "false");
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
