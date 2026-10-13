"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "site.js"), "utf8");

function siteHarness(options = {}) {
  const select = { value: "system" };
  const controls = options.lateControls ? [] : [select];
  const handlers = new Map();
  const stored = new Map();
  if (options.savedTheme != null)
    stored.set("lumine-theme", options.savedTheme);
  const writes = [];
  const removals = [];
  const focusCalls = [];
  const scrollCalls = [];
  const root = { dataset: {} };
  const main = { focus: (settings) => focusCalls.push(settings) };
  let preferenceListener;
  const mediaQuery = {
    matches: !!options.systemDark,
    addEventListener(name, callback) {
      assert.equal(name, "change");
      preferenceListener = callback;
    },
  };
  const location = { hash: options.hash || "#class-texteditor" };
  const context = vm.createContext({
    document: {
      documentElement: root,
      querySelectorAll(selector) {
        assert.equal(selector, "[data-theme-select]");
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
        return mediaQuery;
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
        removeItem(name) {
          if (options.blockRemove) throw new Error("Storage access denied");
          stored.delete(name);
          removals.push(name);
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
    select,
    stored,
    writes,
    removals,
    focusCalls,
    scrollCalls,
    location,
    click,
    selectTheme(value, defaultPrevented = false) {
      select.value = value;
      handlers.get("change")({
        defaultPrevented,
        target: {
          closest: (selector) => selector === "[data-theme-select]" && select,
        },
      });
    },
    changeSystemPreference(dark) {
      mediaQuery.matches = dark;
      preferenceListener({ matches: dark });
    },
    finishParsing() {
      if (!controls.length) controls.push(select);
      handlers.get("DOMContentLoaded")();
    },
  };
}

test("System is the default selection and follows live OS changes without storing them", () => {
  for (const systemDark of [false, true]) {
    const harness = siteHarness({ systemDark });
    assert.equal(harness.root.dataset.theme, systemDark ? "dark" : "light");
    assert.equal(harness.select.value, "system");
    harness.changeSystemPreference(!systemDark);
    assert.equal(harness.root.dataset.theme, systemDark ? "light" : "dark");
    assert.equal(harness.select.value, "system");
    assert.deepEqual(harness.writes, []);
    assert.deepEqual(harness.removals, []);
  }
});

test("existing saved Light and Dark choices override the OS", () => {
  for (const savedTheme of ["light", "dark"]) {
    const harness = siteHarness({
      savedTheme,
      systemDark: savedTheme === "light",
    });
    assert.equal(harness.root.dataset.theme, savedTheme);
    assert.equal(harness.select.value, savedTheme);
    harness.changeSystemPreference(savedTheme === "light");
    assert.equal(harness.root.dataset.theme, savedTheme);
  }
});

test("System and invalid stored values fall back to the live OS preference", () => {
  for (const savedTheme of ["system", "sepia", ""]) {
    const harness = siteHarness({ savedTheme, systemDark: true });
    assert.equal(harness.root.dataset.theme, "dark");
    assert.equal(harness.select.value, "system");
    harness.changeSystemPreference(false);
    assert.equal(harness.root.dataset.theme, "light");
  }
});

test("controls parsed after the head script show the selected preference", () => {
  for (const savedTheme of [undefined, "dark", "light"]) {
    const harness = siteHarness({
      savedTheme,
      lateControls: true,
      systemDark: true,
    });
    assert.equal(harness.root.dataset.theme, savedTheme || "dark");
    harness.finishParsing();
    assert.equal(harness.select.value, savedTheme || "system");
  }
});

test("selecting Dark or Light persists that choice and ignores later OS changes", () => {
  for (const preference of ["dark", "light"]) {
    const harness = siteHarness({ systemDark: preference === "light" });
    harness.selectTheme(preference);
    assert.equal(harness.root.dataset.theme, preference);
    assert.equal(harness.stored.get("lumine-theme"), preference);
    assert.equal(harness.select.value, preference);
    harness.changeSystemPreference(false);
    harness.changeSystemPreference(true);
    assert.equal(harness.root.dataset.theme, preference);
    assert.deepEqual(harness.writes, [["lumine-theme", preference]]);
  }
});

test("returning to System clears the saved override and immediately follows the current OS", () => {
  const harness = siteHarness({ savedTheme: "light" });
  harness.changeSystemPreference(true);
  assert.equal(harness.root.dataset.theme, "light");
  harness.selectTheme("system");
  assert.equal(harness.select.value, "system");
  assert.equal(harness.root.dataset.theme, "dark");
  assert.equal(harness.stored.has("lumine-theme"), false);
  assert.deepEqual(harness.removals, ["lumine-theme"]);
  harness.changeSystemPreference(false);
  assert.equal(harness.root.dataset.theme, "light");
});

test("blocked storage still permits theme selection for the current page", () => {
  const harness = siteHarness({
    blockRead: true,
    blockWrite: true,
    blockRemove: true,
    systemDark: true,
  });
  assert.equal(harness.root.dataset.theme, "dark");
  assert.doesNotThrow(() => harness.selectTheme("light"));
  assert.equal(harness.root.dataset.theme, "light");
  harness.changeSystemPreference(true);
  assert.equal(harness.root.dataset.theme, "light");
  assert.doesNotThrow(() => harness.selectTheme("system"));
  assert.equal(harness.root.dataset.theme, "dark");
  harness.changeSystemPreference(false);
  assert.equal(harness.root.dataset.theme, "light");
  assert.deepEqual(harness.writes, []);
  assert.deepEqual(harness.removals, []);
});

test("a failed storage removal still restores System behavior for the current page", () => {
  const harness = siteHarness({ savedTheme: "dark", blockRemove: true });
  assert.doesNotThrow(() => harness.selectTheme("system"));
  assert.equal(harness.root.dataset.theme, "light");
  assert.equal(harness.select.value, "system");
  harness.changeSystemPreference(true);
  assert.equal(harness.root.dataset.theme, "dark");
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

test("handled events do not repeat skip navigation or theme changes", () => {
  const harness = siteHarness();
  harness.click(".skip-link", true);
  harness.selectTheme("dark", true);
  assert.deepEqual(harness.focusCalls, []);
  assert.deepEqual(harness.scrollCalls, []);
  assert.deepEqual(harness.writes, []);
  assert.equal(harness.root.dataset.theme, "light");
});
