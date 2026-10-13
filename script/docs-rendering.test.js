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
  let nextTimer = 0;
  let hashchange;
  const article = { innerHTML: "", querySelectorAll: () => [] };
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
    slugger: () => () => "",
    scrollToFragment() {},
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
