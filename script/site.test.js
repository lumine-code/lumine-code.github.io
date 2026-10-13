"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "site.js"), "utf8");

function siteHarness(options = {}) {
  const attributes = new Map();
  const button = {
    textContent: "Dark",
    setAttribute(name, value) {
      attributes.set(name, value);
    },
  };
  const controls = options.lateControls ? [] : [button];
  const handlers = new Map();
  const stored = new Map();
  if (options.savedTheme != null)
    stored.set("lumine-theme", options.savedTheme);
  const writes = [];
  const focusCalls = [];
  const scrollCalls = [];
  const root = { dataset: {} };
  const main = { focus: (settings) => focusCalls.push(settings) };
  let preferenceListener;
  const location = { hash: options.hash || "#class-texteditor" };
  const context = vm.createContext({
    document: {
      documentElement: root,
      querySelectorAll(selector) {
        assert.equal(selector, "[data-theme-toggle]");
        return controls;
      },
      querySelector(selector) {
        assert.equal(selector, "main");
        return main;
      },
      addEventListener: (name, callback) => handlers.set(name, callback),
    },
    window: {
      matchMedia(query) {
        assert.equal(query, "(prefers-color-scheme: dark)");
        return {
          matches: !!options.systemDark,
          addEventListener(name, callback) {
            assert.equal(name, "change");
            preferenceListener = callback;
          },
        };
      },
      localStorage: {
        getItem(name) {
          if (options.blockRead) throw new Error("Storage access denied");
          return stored.get(name) ?? null;
        },
        setItem(name, value) {
          if (options.blockWrite) throw new Error("Storage access denied");
          stored.set(name, value);
          writes.push([name, value]);
        },
      },
      scrollTo: (...coordinates) => scrollCalls.push(coordinates),
    },
    location,
  });
  vm.runInContext(source, context, { filename: "site.js" });

  function click(selector, defaultPrevented = false) {
    const event = {
      defaultPrevented,
      target: { closest: (candidate) => candidate === selector && {} },
      preventDefault() {
        this.defaultPrevented = true;
      },
    };
    handlers.get("click")(event);
    return event;
  }

  return {
    root,
    button,
    attributes,
    stored,
    writes,
    focusCalls,
    scrollCalls,
    location,
    click,
    changeSystemPreference(dark) {
      preferenceListener({ matches: dark });
    },
    finishParsing() {
      if (!controls.length) controls.push(button);
      handlers.get("DOMContentLoaded")();
    },
  };
}

test("the palette follows the system preference until a user chooses a theme", () => {
  for (const systemDark of [false, true]) {
    const harness = siteHarness({ systemDark });
    assert.equal(harness.root.dataset.theme, systemDark ? "dark" : "light");
    harness.changeSystemPreference(!systemDark);
    assert.equal(harness.root.dataset.theme, systemDark ? "light" : "dark");
    assert.deepEqual(harness.writes, []);
  }
});

test("a saved theme overrides the system and invalid stored values fall back", () => {
  for (const savedTheme of ["light", "dark"]) {
    const harness = siteHarness({
      savedTheme,
      systemDark: savedTheme === "light",
    });
    assert.equal(harness.root.dataset.theme, savedTheme);
    harness.changeSystemPreference(savedTheme === "light");
    assert.equal(harness.root.dataset.theme, savedTheme);
  }
  const invalid = siteHarness({ savedTheme: "sepia", systemDark: true });
  assert.equal(invalid.root.dataset.theme, "dark");
  invalid.changeSystemPreference(false);
  assert.equal(invalid.root.dataset.theme, "light");
});

test("theme controls created after the head script describe their next action", () => {
  const harness = siteHarness({ savedTheme: "dark", lateControls: true });
  assert.equal(harness.root.dataset.theme, "dark");
  harness.finishParsing();
  assert.equal(harness.button.textContent, "Light");
  assert.equal(harness.attributes.get("aria-label"), "Switch to light theme");
});

test("toggling stores the choice, updates its accessible action and ignores later system changes", () => {
  const harness = siteHarness();
  harness.click("[data-theme-toggle]");
  assert.equal(harness.root.dataset.theme, "dark");
  assert.equal(harness.stored.get("lumine-theme"), "dark");
  assert.equal(harness.button.textContent, "Light");
  assert.equal(harness.attributes.get("aria-label"), "Switch to light theme");
  harness.changeSystemPreference(false);
  assert.equal(harness.root.dataset.theme, "dark");

  harness.click("[data-theme-toggle]");
  assert.equal(harness.root.dataset.theme, "light");
  assert.equal(harness.button.textContent, "Dark");
  assert.equal(harness.attributes.get("aria-label"), "Switch to dark theme");
  assert.deepEqual(harness.writes, [
    ["lumine-theme", "dark"],
    ["lumine-theme", "light"],
  ]);
});

test("blocked storage still permits theme selection for the current page", () => {
  const harness = siteHarness({
    blockRead: true,
    blockWrite: true,
    systemDark: true,
  });
  assert.equal(harness.root.dataset.theme, "dark");
  assert.doesNotThrow(() => harness.click("[data-theme-toggle]"));
  assert.equal(harness.root.dataset.theme, "light");
  harness.changeSystemPreference(true);
  assert.equal(harness.root.dataset.theme, "light");
  assert.deepEqual(harness.writes, []);
});

test("skip links focus the content while preserving manual and API routes", () => {
  for (const hash of [
    "#workspace/layout#tabs-and-previews",
    "#texteditor-instance-gettext",
  ]) {
    const harness = siteHarness({ hash });
    const event = harness.click(".skip-link");
    assert.equal(event.defaultPrevented, true);
    assert.equal(harness.location.hash, hash);
    assert.equal(harness.focusCalls.length, 1);
    assert.equal(harness.focusCalls[0].preventScroll, true);
    assert.deepEqual(harness.scrollCalls, [[0, 0]]);
  }
});

test("handled clicks do not repeat skip navigation or theme changes", () => {
  const harness = siteHarness();
  harness.click(".skip-link", true);
  harness.click("[data-theme-toggle]", true);
  assert.deepEqual(harness.focusCalls, []);
  assert.deepEqual(harness.scrollCalls, []);
  assert.deepEqual(harness.writes, []);
  assert.equal(harness.root.dataset.theme, "light");
});
