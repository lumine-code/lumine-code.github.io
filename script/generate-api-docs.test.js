"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const generatorPath = path.join(__dirname, "generate-api-docs.js");

function renderFixture(context) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "lumine-api-renderer-"));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, "script"));
  const source = {
    repository: "https://github.com/lumine-code/lumine",
    source: "src/fixture.js",
    sourcePath: "src/fixture.js",
    line: 1,
  };
  const member = {
    name: "run",
    kind: "method",
    static: true,
    async: false,
    signature: ".run()",
    category: "Methods",
    visibility: "Public",
    description: "Run a widget.",
    summary: "Run a widget.",
    parameters: [],
    returnType: "String",
    returnDescription: "The result.",
    propertyType: null,
    line: 20,
  };
  const api = {
    schemaVersion: 3,
    name: "Lumine",
    version: "1.0.0",
    memberCount: 3,
    classes: [
      {
        ...source,
        name: "Environment",
        visibility: "Public",
        superClass: null,
        description: "The global API.",
        summary: "The global API.",
        members: [
          {
            ...member,
            name: "tools",
            kind: "property",
            static: false,
            signature: "::tools",
            category: "Properties",
            propertyType: "Object",
            description: "A property contract that must remain visible.",
            returnType: null,
            returnDescription: "",
          },
        ],
      },
    ],
    objects: [
      {
        ...source,
        name: "Widget",
        accessPath: "require('lumine').Widget",
        visibility: "Public",
        description:
          "Call {@link .run} or {@link lumine.tools.markdown.render}. See {@link https://example.org/reference external reference}.",
        summary: "Widget factories.",
        members: [member],
      },
    ],
    functions: [
      {
        ...source,
        name: "render",
        accessPath: "lumine.tools.markdown.render",
        signature: "lumine.tools.markdown.render(content, options = {})",
        visibility: "Public",
        description: "Render Markdown.",
        summary: "Render Markdown.",
        parameters: [
          {
            name: "options",
            source: "options = {}",
            optional: true,
            rest: false,
            type: "Object",
            description: "Rendering options.",
            defaultValue: "{}",
          },
        ],
        returnType: "String",
        returnDescription: "The HTML.",
      },
    ],
  };
  const output = path.join(root, "output");
  const saveApi = () =>
    fs.writeFileSync(
      path.join(root, "script", "api-extractor.js"),
      `module.exports = { SCHEMA_VERSION: 3, extractApi: () => (${JSON.stringify(api)}) };\n`,
    );
  saveApi();
  const generate = (check = false) =>
    spawnSync(
      process.execPath,
      [
        generatorPath,
        "--editor",
        root,
        "--output",
        output,
        ...(check ? ["--check"] : []),
      ],
      { encoding: "utf8" },
    );
  return { api, output, saveApi, generate };
}

test("renders object APIs, callable paths, property contracts and reference links", (context) => {
  const fixture = renderFixture(context);
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  assert.match(
    html,
    /1 classes &middot; 1 objects &middot; 3 documented members/,
  );
  assert.match(html, /Public API &middot; Object/);
  assert.match(html, /<code>require\('lumine'\)\.Widget<\/code>/);
  assert.match(
    html,
    /api-description-body[^>]*>[^<]*<p>A property contract that must remain visible\./,
  );
  assert.match(html, /href="#widget-static-run"/);
  assert.match(html, /href="#function-render"/);
  assert.match(html, /href="https:\/\/example.org\/reference"/);
  assert.match(html, /Public functions with their callable access paths\./);
  assert.doesNotMatch(html, /Standalone functions exported by Lumine/);
  assert.match(html, /optional/);
  assert.match(html, /default: \{\}/);

  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(ids.has(match[1]), `Missing target for ${match[0]}`);
  }
});

test("checks generated object documentation for drift without rewriting output", (context) => {
  const fixture = renderFixture(context);
  assert.equal(fixture.generate().status, 0);
  assert.equal(fixture.generate(true).status, 0);
  const htmlPath = path.join(fixture.output, "index.html");
  const before = fs.readFileSync(htmlPath, "utf8");
  fixture.api.objects[0].description = "An updated object contract.";
  fixture.saveApi();
  const result = fixture.generate(true);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /api\.json does not match/);
  assert.match(result.stderr, /index\.html does not match/);
  assert.equal(fs.readFileSync(htmlPath, "utf8"), before);
});
