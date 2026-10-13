"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const test = require("node:test");
const root = path.resolve(__dirname, "..");
const { entries } = JSON.parse(
  fs.readFileSync(path.join(root, "gallery.json"), "utf8"),
);

test("the gallery excludes private maintainer packages", () => {
  for (const item of entries) {
    assert.ok(!["bacadra-tools", "banager-tools"].includes(item.repo));
  }
});

test("gallery assets link to immutable public repository images with intrinsic dimensions", () => {
  assert.ok(entries.length > 0);
  assert.equal(new Set(entries.map((item) => item.id)).size, entries.length);
  for (const item of entries) {
    assert.match(
      item.src,
      /^https:\/\/raw\.githubusercontent\.com\/lumine-code\/[a-z\d-]+\/[a-f\d]{40}\/.+\.png$/,
    );
    assert.ok(item.width > 0 && item.height > 0);
    assert.ok(item.caption?.trim());
    assert.match(item.repository, /^https:\/\/github\.com\/lumine-code\//);
    assert.equal(
      item.source,
      item.src
        .replace("raw.githubusercontent.com", "github.com")
        .replace(/(lumine-code\/[^/]+)\//, "$1/blob/"),
    );
    assert.ok(
      ["editor", "packages", "grammars", "themes"].includes(item.category),
    );
  }
});

test("all main surfaces link to the gallery and it reuses the three-state theme control", () => {
  for (const file of [
    "index.html",
    "docs.html",
    "api/index.html",
    "script/generate-api-docs.js",
  ]) {
    assert.match(
      fs.readFileSync(path.join(root, file), "utf8"),
      /href="(?:\.\.\/)?gallery\.html"/,
    );
  }
  const html = fs.readFileSync(path.join(root, "gallery.html"), "utf8");
  assert.match(html, /data-theme-toggle/);
  assert.match(html, /<dialog[^>]+aria-labelledby="gallery-viewer-title"/);
  assert.match(html, /<label\s+for="gallery-search"\s*>/);
  assert.match(html, /<noscript\s*>/);
});
