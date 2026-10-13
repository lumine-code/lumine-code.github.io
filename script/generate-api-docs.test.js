"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const generatorPath = path.join(__dirname, "generate-api-docs.js");

function attribute(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

function hasClass(node, name) {
  return (attribute(node, "class") || "").split(/\s+/).includes(name);
}

function elements(node) {
  return [node, ...(node.childNodes || []).flatMap(elements)];
}

function owningClass(node) {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (hasClass(parent, "api-class")) return attribute(parent, "id");
  }
  return null;
}

function memberAnchor(type, member) {
  const slug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${slug(type.name)}-${member.static ? "static" : "instance"}-${slug(member.name)}`;
}

async function assertApiStructure(html, api) {
  const { parse } = await import("parse5");
  const document = parse(html);
  const nodes = elements(document);
  const byId = new Map(nodes.map((node) => [attribute(node, "id"), node]));
  const types = [...api.classes, ...api.objects];
  const content = nodes.find((node) => hasClass(node, "api-content"));
  const sections = nodes.filter((node) => hasClass(node, "api-class"));
  assert.equal(sections.length, types.length + (api.functions.length ? 1 : 0));
  for (const section of sections) {
    assert.ok(
      section.parentNode === content,
      `${attribute(section, "id")} escaped the API content`,
    );
  }
  for (const type of types) {
    const classId = `class-${type.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;
    for (const member of type.members) {
      const id = memberAnchor(type, member);
      assert.ok(byId.has(id), `Missing member ${id}`);
      assert.equal(
        owningClass(byId.get(id)),
        classId,
        `${id} escaped its class`,
      );
    }
  }
  for (const node of nodes.filter((entry) => hasClass(entry, "api-group"))) {
    assert.ok(owningClass(node), "A method group escaped its class");
  }
  return nodes;
}

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

test("renders linked section navigation, nested headings and typed failure contracts", (context) => {
  const fixture = renderFixture(context);
  fixture.api.classes[0].description =
    "The global API.\n\n## Contracts\n\nRead the property contracts.";
  const method = fixture.api.objects[0].members[0];
  method.description =
    "Run a widget.\n\n## Examples\n\nCall run with valid input.";
  method.category = "Operations";
  method.throws = [
    { type: "Error", description: "When {@link .run} receives invalid input." },
  ];
  fixture.api.objects[0].members.push({
    ...method,
    name: "observe",
    signature: ".observe()",
    category: "Event Subscription",
    throws: [],
  });
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  assert.match(html, /aria-label="Widget sections"/);
  assert.match(
    html,
    /href="#widget-group-operations">Operations<span>1<\/span>/,
  );
  assert.match(
    html,
    /href="#widget-group-event-subscription">Event Subscription<span>1<\/span>/,
  );
  assert.match(html, /<h3>Contracts<\/h3>/);
  assert.match(html, /<h5>Examples<\/h5>/);
  assert.match(html, /api-throws-section"><h5>Throws<\/h5>/);
  assert.match(html, /<code class="api-type-expression">Error<\/code>/);
  assert.match(
    html,
    /When <a class="api-ref" href="#widget-static-run">\.run<\/a> receives invalid input/,
  );
  assert.doesNotMatch(html, /<h2>(?:Contracts|Examples)<\/h2>/);
});

test("normalizes deeply numbered source headings without skipping API heading levels", (context) => {
  const fixture = renderFixture(context);
  fixture.api.classes[0].description =
    "The global API.\n\n#### Contracts\n\n##### Details\n\nProperty details.";
  fixture.api.objects[0].members[0].description =
    "Run a widget.\n\n#### Examples\n\n##### More Examples\n\nCall run.";
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  assert.match(html, /<h3>Contracts<\/h3>/);
  assert.match(html, /<h4>Details<\/h4>/);
  assert.match(html, /<h5>Examples<\/h5>/);
  assert.match(html, /<h6>More Examples<\/h6>/);
});

test("keeps malformed HTML examples inside their method and preserves references and key names", async (context) => {
  const fixture = renderFixture(context);
  const base = fixture.api.objects[0];
  const member = base.members[0];
  fixture.api.classes.push({
    ...base,
    name: "TextEditor",
    members: [
      {
        ...member,
        name: "decorateMarker",
        static: false,
        signature: "::decorateMarker(marker)",
        category: "Decorations",
        description:
          '* Highlight example:\n\n    ```html\n    <div class="highlight">\n <!-- An accidentally outdented example. -->\n <div class="region"></div>\n    </div>\n    ```\n\nUse {@link #getMarkers} or <kbd>Ctrl</kbd>.',
      },
      {
        ...member,
        name: "getMarkers",
        static: false,
        signature: "::getMarkers()",
        category: "Markers",
      },
    ],
  });
  fixture.api.classes.push({
    ...base,
    name: "Workspace",
    members: [
      {
        ...member,
        name: "getCenter",
        static: false,
        signature: "::getCenter()",
      },
    ],
  });
  member.description =
    'Untrusted markup: </div><section id="injected">example</section>. A type is Promise<Boolean>.';
  member.parameters = [
    {
      name: "value",
      type: "String",
      description: "{@link .run} and `{@link .run}`.",
    },
  ];
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  const nodes = await assertApiStructure(html, fixture.api);
  assert.ok(!nodes.some((node) => hasClass(node, "region")));
  assert.ok(!nodes.some((node) => attribute(node, "id") === "injected"));
  assert.ok(!nodes.some((node) => node.tagName === "boolean"));
  assert.ok(nodes.some((node) => node.tagName === "kbd"));
  assert.match(html, /&lt;div class=&quot;region&quot;&gt;/);
  assert.match(html, /class="api-ref" href="#texteditor-instance-getmarkers"/);
  assert.match(html, /<code>\{@link \.run\}<\/code>/);
});

test("every generated API member stays in its class and every class stays in the layout", async () => {
  const apiRoot = path.resolve(__dirname, "..", "api");
  const api = JSON.parse(
    fs.readFileSync(path.join(apiRoot, "api.json"), "utf8"),
  );
  const html = fs.readFileSync(path.join(apiRoot, "index.html"), "utf8");
  await assertApiStructure(html, api);
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

test("checks CRLF checkout output without rewriting it and still detects contract drift", (context) => {
  const fixture = renderFixture(context);
  assert.equal(fixture.generate().status, 0);
  const files = ["api.json", "index.html"].map((file) =>
    path.join(fixture.output, file),
  );
  const before = files.map((file) => {
    const contents = fs.readFileSync(file, "utf8").replace(/\n/g, "\r\n");
    fs.writeFileSync(file, contents);
    return contents;
  });
  const unchanged = fixture.generate(true);
  assert.equal(unchanged.status, 0, unchanged.stderr);
  fixture.api.objects[0].description = "An updated object contract.";
  fixture.saveApi();
  const changed = fixture.generate(true);
  assert.equal(changed.status, 1);
  assert.match(changed.stderr, /api\.json does not match/);
  assert.match(changed.stderr, /index\.html does not match/);
  files.forEach((file, index) =>
    assert.equal(fs.readFileSync(file, "utf8"), before[index]),
  );
});
