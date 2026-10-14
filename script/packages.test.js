"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  sourceInfo,
  normalize,
  bundledOrigins,
  filter,
  installURI,
  versions,
} = require("./package-catalog");
test("mixed catalogs keep source-only entries and exclude private packages and libraries", () => {
  const entries = normalize([
    "lumine-code/example",
    {
      source: "lumine-code/language-python",
      metadata: { name: "language-python", engines: { lumine: "^1" } },
    },
    { source: "lumine-code/aura-theme", metadata: { themes: [{}] } },
    "lumine-code/bacadra-tools",
    "lumine-code/banager-tools",
    { source: "lumine-code/library", metadata: { engines: { node: ">=24" } } },
  ]);
  assert.deepEqual(
    entries.map((x) => x.category),
    ["packages", "grammars", "themes"],
  );
  assert.equal(entries[0].repository, "https://github.com/lumine-code/example");
  assert.throws(() => normalize({}));
});
test("repository links and install sources reject unsafe values", () => {
  for (const source of [
    "javascript:alert(1)",
    "https://user:password@github.com/org/repo",
    "org/repo;echo",
    "org/repo`id`",
    "org/repo$(id)",
    "--help",
    "--option/repo",
    "http://example.com/org/repo",
    "https://github.com/org/repo?x=1",
  ])
    assert.equal(sourceInfo(source), null, source);
  assert.equal(
    sourceInfo("https://gitlab.com/group/repo.git#main").repository,
    "https://gitlab.com/group/repo",
  );
  assert.equal(
    sourceInfo("lumine-code/example#v1.0.0").source,
    "lumine-code/example#v1.0.0",
  );
});
test("bundled status matches repository origin rather than package name or registry ranges", () => {
  const bundled = bundledOrigins({
    dependencies: {
      "@lumine-code/example": "github:lumine-code/example#abc",
      other: "^1.0.0",
    },
  });
  assert.deepEqual([...bundled], ["https://github.com/lumine-code/example"]);
  assert.throws(() => bundledOrigins({}));
});

test("Install links preserve the complete source and encode it as one URI argument", () => {
  for (const source of [
    "lumine-code/jupyter-view",
    "lumine-code/example@v1.0.0",
    "lumine-code/example~feature/demo",
    "https://gitlab.com/group/repo.git#branch:main",
  ]) {
    const uri = new URL(installURI({ source }));
    assert.equal(uri.protocol, "lumine:");
    assert.equal(uri.hostname, "settings-view");
    assert.equal(uri.pathname, "/install");
    assert.equal(uri.searchParams.get("source"), source);
    assert.equal(uri.hash, "");
  }
  assert.equal(
    sourceInfo("lumine-code/example@v1.0.0").repository,
    "https://github.com/lumine-code/example",
  );
  assert.throws(() => installURI({ source: "javascript:alert(1)" }));
});
test("search covers keywords, respects filters, and does not promote featured matches", () => {
  const entries = normalize([
    {
      source: "org/z",
      featured: true,
      metadata: { description: "Python tooling", keywords: ["notebook"] },
    },
    { source: "org/a", metadata: { description: "Python notebook" } },
  ]);
  entries[0].distribution = "optional";
  entries[1].distribution = "bundled";
  assert.deepEqual(
    filter(entries).map((x) => x.name),
    ["z", "a"],
  );
  assert.deepEqual(
    filter(entries, "python notebook").map((x) => x.name),
    ["a", "z"],
  );
  assert.deepEqual(
    filter(entries, "notebook", "all", "optional").map((x) => x.name),
    ["z"],
  );
  assert.deepEqual(filter(entries, "absent"), []);
});
test("all main pages expose Packages, including regenerated API navigation", () => {
  for (const file of [
    "index.html",
    "docs.html",
    "gallery.html",
    "packages.html",
    "api/index.html",
    "script/generate-api-docs.js",
  ]) {
    const html = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    assert.match(html, /href="(?:\.\.\/)?packages.html"/, file);
  }
});

test("version selection retains immutable README revisions and install selectors", () => {
  const item = normalize([
    {
      source: "lumine-code/example",
      selectedRef: { type: "latest", value: "v1.0.0" },
      refs: {
        defaultBranch: "master",
        headSha: "a".repeat(40),
        latestStable: { name: "v1.0.0" },
        tags: [
          { name: "v1.0.0", sha: "b".repeat(40) },
          { name: "v0.9.0", sha: "c".repeat(40) },
        ],
      },
    },
  ])[0];
  const result = versions(item);
  assert.equal(result.defaultId, "tag:v1.0.0");
  assert.deepEqual(
    result.refs.map((ref) => ref.revision),
    ["master", "b".repeat(40), "c".repeat(40)],
  );
  assert.equal(
    new URL(installURI({ source: result.refs[2].source })).searchParams.get(
      "source",
    ),
    "https://github.com/lumine-code/example.git#tag:v0.9.0",
  );
  assert.deepEqual(versions(normalize(["org/example"])[0]), {
    defaultId: "catalog",
    refs: [
      {
        id: "catalog",
        label: "Catalog version",
        source: "org/example",
        revision: "HEAD",
      },
    ],
  });
});
