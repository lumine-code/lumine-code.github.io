"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "site.js"), "utf8");

function siteHarness(options = {}) {
  const button = {
    textContent: "System",
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  const controls = options.lateControls ? [] : [button];
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
    button,
    stored,
    writes,
    removals,
    focusCalls,
    scrollCalls,
    location,
    click,
    cycleTheme: (defaultPrevented = false) =>
      click("[data-theme-toggle]", defaultPrevented),
    changeSystemPreference(dark) {
      mediaQuery.matches = dark;
      preferenceListener({ matches: dark });
    },
    finishParsing() {
      if (!controls.length) controls.push(button);
      handlers.get("DOMContentLoaded")();
    },
  };
}

function assertThemeButton(button, current, next) {
  const label = `Color theme: ${current}. Switch to ${next}.`;
  assert.equal(button.textContent, current);
  assert.equal(button.attributes["aria-label"], label);
  assert.equal(button.attributes.title, label);
  assert.equal(button.attributes["aria-pressed"], undefined);
  assert.equal(button.attributes["aria-haspopup"], undefined);
}

test("the home page and manual expose the same native theme button and initialize before paint", async () => {
  const { parse } = await import("parse5");
  const elements = (node) => [
    node,
    ...(node.childNodes || []).flatMap(elements),
  ];
  const attribute = (node, name) =>
    node.attrs?.find((entry) => entry.name === name)?.value;
  for (const filename of ["index.html", "docs.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", filename), "utf8");
    const nodes = elements(parse(html));
    const buttons = nodes.filter(
      (node) => attribute(node, "data-theme-toggle") !== undefined,
    );
    assert.equal(buttons.length, 1, filename);
    assert.equal(buttons[0].tagName, "button", filename);
    assert.equal(attribute(buttons[0], "type"), "button", filename);
    const initialization = nodes.find(
      (node) => attribute(node, "src") === "script/site.js",
    );
    assert.equal(initialization.parentNode.tagName, "head", filename);
    assert.equal(attribute(initialization, "defer"), undefined, filename);
    assert.equal(attribute(initialization, "async"), undefined, filename);
    assert.ok(
      html.indexOf('src="script/site.js"') < html.indexOf('href="styles.css"'),
      filename,
    );
  }
});

test("System is the default preference and follows live OS changes without storing them", () => {
  for (const systemDark of [false, true]) {
    const harness = siteHarness({ systemDark });
    assert.equal(harness.root.dataset.theme, systemDark ? "dark" : "light");
    assertThemeButton(harness.button, "System", "Light");
    harness.changeSystemPreference(!systemDark);
    assert.equal(harness.root.dataset.theme, systemDark ? "light" : "dark");
    assertThemeButton(harness.button, "System", "Light");
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
    assertThemeButton(
      harness.button,
      savedTheme === "light" ? "Light" : "Dark",
      savedTheme === "light" ? "Dark" : "System",
    );
    harness.changeSystemPreference(savedTheme === "light");
    assert.equal(harness.root.dataset.theme, savedTheme);
  }
});

test("System and invalid stored values fall back to the live OS preference", () => {
  for (const savedTheme of ["system", "sepia", ""]) {
    const harness = siteHarness({ savedTheme, systemDark: true });
    assert.equal(harness.root.dataset.theme, "dark");
    assertThemeButton(harness.button, "System", "Light");
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
    assertThemeButton(
      harness.button,
      savedTheme === "light"
        ? "Light"
        : savedTheme === "dark"
          ? "Dark"
          : "System",
      savedTheme === "light"
        ? "Dark"
        : savedTheme === "dark"
          ? "System"
          : "Light",
    );
  }
});

test("the button cycles System, Light, Dark and back to System with matching labels", () => {
  const harness = siteHarness({ systemDark: true });
  assertThemeButton(harness.button, "System", "Light");
  for (const preference of ["light", "dark"]) {
    harness.cycleTheme();
    assert.equal(harness.root.dataset.theme, preference);
    assert.equal(harness.stored.get("lumine-theme"), preference);
    assertThemeButton(
      harness.button,
      preference === "light" ? "Light" : "Dark",
      preference === "light" ? "Dark" : "System",
    );
    harness.changeSystemPreference(false);
    harness.changeSystemPreference(true);
    assert.equal(harness.root.dataset.theme, preference);
  }
  harness.cycleTheme();
  assertThemeButton(harness.button, "System", "Light");
  assert.equal(harness.root.dataset.theme, "dark");
  assert.equal(harness.stored.has("lumine-theme"), false);
  assert.deepEqual(harness.writes, [
    ["lumine-theme", "light"],
    ["lumine-theme", "dark"],
  ]);
  assert.deepEqual(harness.removals, ["lumine-theme"]);
});

test("returning to System clears the saved override and immediately follows the current OS", () => {
  const harness = siteHarness({ savedTheme: "dark", systemDark: true });
  harness.changeSystemPreference(false);
  assert.equal(harness.root.dataset.theme, "dark");
  harness.cycleTheme();
  assertThemeButton(harness.button, "System", "Light");
  assert.equal(harness.root.dataset.theme, "light");
  assert.equal(harness.stored.has("lumine-theme"), false);
  assert.deepEqual(harness.removals, ["lumine-theme"]);
  harness.changeSystemPreference(true);
  assert.equal(harness.root.dataset.theme, "dark");
});

test("blocked storage still permits theme selection for the current page", () => {
  const harness = siteHarness({
    blockRead: true,
    blockWrite: true,
    blockRemove: true,
    systemDark: true,
  });
  assert.equal(harness.root.dataset.theme, "dark");
  assert.doesNotThrow(() => harness.cycleTheme());
  assert.equal(harness.root.dataset.theme, "light");
  harness.changeSystemPreference(true);
  assert.equal(harness.root.dataset.theme, "light");
  assert.doesNotThrow(() => harness.cycleTheme());
  assertThemeButton(harness.button, "Dark", "System");
  assert.doesNotThrow(() => harness.cycleTheme());
  assertThemeButton(harness.button, "System", "Light");
  assert.equal(harness.root.dataset.theme, "dark");
  harness.changeSystemPreference(false);
  assert.equal(harness.root.dataset.theme, "light");
  assert.deepEqual(harness.writes, []);
  assert.deepEqual(harness.removals, []);
});

test("a failed storage removal still restores System behavior for the current page", () => {
  const harness = siteHarness({ savedTheme: "dark", blockRemove: true });
  assert.doesNotThrow(() => harness.cycleTheme());
  assert.equal(harness.root.dataset.theme, "light");
  assertThemeButton(harness.button, "System", "Light");
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
  harness.cycleTheme(true);
  assert.deepEqual(harness.focusCalls, []);
  assert.deepEqual(harness.scrollCalls, []);
  assert.deepEqual(harness.writes, []);
  assert.equal(harness.root.dataset.theme, "light");
});
