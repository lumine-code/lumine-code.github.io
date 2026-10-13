"use strict";

const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const generatorPath = path.join(__dirname, "generate-api-docs.js");
const apiStyles = fs.readFileSync(
  path.resolve(__dirname, "..", "api", "styles.css"),
  "utf8",
);

function attribute(node, name) {
  return node.attrs?.find((entry) => entry.name === name)?.value;
}

function hasClass(node, name) {
  return (attribute(node, "class") || "").split(/\s+/).includes(name);
}

function elements(node) {
  return [node, ...(node.childNodes || []).flatMap(elements)];
}

function textContent(node) {
  return node.nodeName === "#text"
    ? node.value
    : (node.childNodes || []).map(textContent).join("");
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

test("loads shared presentation and an external API stylesheet without embedding styles", async (context) => {
  const fixture = renderFixture(context);
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  const { parse } = await import("parse5");
  const nodes = elements(parse(html));
  assert.deepEqual(
    nodes
      .filter(
        (node) =>
          node.tagName === "link" &&
          attribute(node, "rel") === "stylesheet" &&
          !attribute(node, "href").startsWith("https://"),
      )
      .map((node) => attribute(node, "href")),
    ["../styles.css", "styles.css"],
  );
  assert.equal(
    nodes.some((node) => node.tagName === "style"),
    false,
  );
  assert.ok(
    nodes.some(
      (node) =>
        node.tagName === "script" &&
        attribute(node, "src") === "../script/site.js" &&
        attribute(node, "defer") === undefined,
    ),
  );
  assert.ok(
    html.indexOf('src="../script/site.js"') <
      html.indexOf('href="../styles.css"'),
    "the saved palette must be applied before styles are loaded",
  );
  const main = nodes.find((node) => node.tagName === "main");
  assert.equal(attribute(main, "id"), "top");
  assert.equal(attribute(main, "tabindex"), "-1");
  assert.ok(
    nodes.some(
      (node) =>
        hasClass(node, "skip-link") && attribute(node, "href") === "#top",
    ),
  );
  assert.ok(
    nodes.some(
      (node) =>
        node.tagName === "select" &&
        attribute(node, "data-theme-select") !== undefined &&
        Boolean(attribute(node, "aria-label")),
    ),
  );
  const themeSelect = nodes.find(
    (node) => attribute(node, "data-theme-select") !== undefined,
  );
  assert.deepEqual(
    themeSelect.childNodes
      .filter((node) => node.tagName === "option")
      .map((node) => attribute(node, "value")),
    ["system", "dark", "light"],
  );
  assert.ok(
    nodes.some(
      (node) =>
        node.tagName === "a" &&
        attribute(node, "href") === "./" &&
        attribute(node, "aria-current") === "page",
    ),
  );
});

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

test("keeps property names and colons together while long linked types can wrap independently", async (context) => {
  const fixture = renderFixture(context);
  const property = fixture.api.classes[0].members[0];
  const cases = [
    ["paneItemTransfers", "PaneItemTransferService"],
    ["workspaceDrops", "WorkspaceDropManager"],
    [
      "largeValue",
      "AnUnusuallyLongTypeWithManyDistinctPartsAndAReallyLongUnbrokenIdentifierSegment",
    ],
  ];
  fixture.api.classes[0].members = cases.map(([name, type]) => ({
    ...property,
    name,
    signature: `::${name}`,
    propertyType: type,
    description: "",
  }));
  fixture.api.classes.push(
    ...cases.map(([, name]) => ({
      ...fixture.api.classes[0],
      name,
      description: "A service exposed by the overview.",
      members: [],
    })),
  );
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  const nodes = await assertApiStructure(html, fixture.api);
  for (const [name, type] of cases) {
    const member = nodes.find(
      (node) =>
        attribute(node, "id") === `environment-instance-${name.toLowerCase()}`,
    );
    const signature = elements(member).find((node) =>
      hasClass(node, "api-property-signature"),
    );
    const propertyName = signature.childNodes.find((node) =>
      hasClass(node, "api-property-name"),
    );
    const propertyType = signature.childNodes.find((node) =>
      hasClass(node, "api-property-type"),
    );
    assert.equal(textContent(propertyName), `${name}:`);
    assert.ok(
      !elements(propertyName).some((node) => node.tagName === "wbr"),
      "a property name must not break between its words",
    );
    assert.equal(textContent(propertyType), type);
    assert.ok(
      elements(propertyType).some((node) => node.tagName === "wbr"),
      "long type names need their own wrap opportunities",
    );
    assert.ok(
      elements(propertyType).some(
        (node) =>
          node.tagName === "a" &&
          attribute(node, "href") === `#class-${type.toLowerCase()}`,
      ),
    );
    const metadata = elements(member).find((node) =>
      hasClass(node, "api-member-meta"),
    );
    assert.ok(
      !elements(signature).includes(metadata),
      "source metadata must retain its separate column",
    );
  }
  assert.match(
    apiStyles,
    /@media \(max-width: 1000px\) \{\s*\.api-group-properties \.api-group-entries \{\s*grid-template-columns: 1fr;\s*\}/,
  );
});

test("gives overview tiles native primary links and independent source, permalink and type links", async (context) => {
  const fixture = renderFixture(context);
  const property = fixture.api.classes[0].members[0];
  fixture.api.classes[0].members.push(
    {
      ...property,
      name: "widget",
      signature: "::widget",
      propertyType: "Widget",
      description: "Use {@link Widget} to create a widget.",
    },
    {
      ...property,
      name: "unknown",
      signature: "::unknown",
      propertyType: "UnknownType",
    },
    {
      ...property,
      name: "untyped",
      signature: "::untyped",
      propertyType: null,
    },
  );
  // A property on an ordinary reference page remains a contract, not a tile.
  fixture.api.objects[0].members.push({ ...property, name: "options" });
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  const nodes = await assertApiStructure(html, fixture.api);
  const cards = nodes.filter((node) => hasClass(node, "api-member-linked"));
  assert.equal(cards.length, 4);
  for (const card of cards) {
    const links = elements(card).filter((node) => node.tagName === "a");
    const primary = links.find((node) => hasClass(node, "api-card-link"));
    const source = links.find((node) => hasClass(node, "api-source"));
    const permalink = links.find((node) => hasClass(node, "api-anchor"));
    assert.ok(
      primary,
      "the tile must be a native link, without click handlers",
    );
    assert.ok(source, "source remains a separate link");
    assert.equal(attribute(permalink, "href"), `#${attribute(card, "id")}`);
    assert.equal(attribute(primary, "tabindex"), undefined);
    assert.equal(attribute(primary, "role"), undefined);
    assert.ok(
      !elements(primary).some(
        (node) => node !== primary && node.tagName === "a",
      ),
    );
    if (attribute(card, "id") === "environment-instance-widget") {
      assert.equal(attribute(primary, "href"), "#class-widget");
      assert.equal(attribute(primary, "aria-label"), "Open widget: Widget API");
      assert.equal(
        links.filter((node) => attribute(node, "href") === "#class-widget")
          .length,
        3,
        "the primary, type and description reference links must all survive",
      );
    } else {
      assert.equal(attribute(primary, "href"), attribute(source, "href"));
      assert.match(attribute(primary, "aria-label"), /^View .+ source$/);
      assert.ok(
        elements(card).some((node) => hasClass(node, "api-card-external")),
      );
    }
  }
  const ordinaryProperty = nodes.find(
    (node) => attribute(node, "id") === "widget-instance-options",
  );
  assert.ok(
    !elements(ordinaryProperty).some((node) => hasClass(node, "api-card-link")),
  );
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
  assert.match(
    html,
    /<h3 id="environment-description-section-contracts">Contracts/,
  );
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
  assert.match(
    html,
    /<h3 id="environment-description-section-contracts">Contracts/,
  );
  assert.match(
    html,
    /<h4 id="environment-description-section-details">Details/,
  );
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

test("folds the complete Config and Workspace descriptions without repeating their introduction", async (context) => {
  const fixture = renderFixture(context);
  const corpus = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "..", "api", "api.json"), "utf8"),
  );
  const descriptions = corpus.classes.filter(({ name }) =>
    ["Config", "Workspace"].includes(name),
  );
  assert.equal(descriptions.length, 2);
  fixture.api.classes.push(...descriptions);
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  const nodes = await assertApiStructure(html, fixture.api);
  for (const type of descriptions) {
    const description = nodes.find(
      (node) =>
        hasClass(node, "api-class-description-folded") &&
        owningClass(node) === `class-${type.name.toLowerCase()}`,
    );
    const intro = description.childNodes.find((node) =>
      hasClass(node, "api-class-summary"),
    );
    const details = description.childNodes.find(
      (node) => node.tagName === "details",
    );
    const summary = details.childNodes.find(
      (node) => node.tagName === "summary",
    );
    const body = details.childNodes.find((node) =>
      hasClass(node, "api-class-description-content"),
    );
    assert.equal(
      attribute(details, "open"),
      undefined,
      `${type.name} should begin folded`,
    );
    assert.equal(
      attribute(summary, "aria-label"),
      `Full description of ${type.name}`,
    );
    const controls = attribute(summary, "aria-controls").split(" ");
    assert.deepEqual(controls, [attribute(intro, "id"), attribute(body, "id")]);
    const introduction = textContent(intro).trim();
    assert.ok(introduction.length > 0 && introduction.length < 300);
    assert.equal(
      textContent(body).includes(introduction),
      false,
      `${type.name} repeats its introduction`,
    );
    assert.ok(
      textContent(body).length > 4000,
      `${type.name} lost its detailed contract`,
    );
    assert.ok(elements(body).some((node) => node.tagName === "h3"));
    assert.ok(elements(body).every((node) => node.tagName !== "h2"));
  }
  const ids = nodes.map((node) => attribute(node, "id")).filter(Boolean);
  assert.equal(
    new Set(ids).size,
    ids.length,
    "description anchors must remain unique",
  );
});

test("keeps short class descriptions visible and unfolds long single paragraphs without duplicating them", async (context) => {
  const fixture = renderFixture(context);
  const longParagraph =
    "A detailed description of one class remains available in full. "
      .repeat(15)
      .trim();
  fixture.api.objects[0].description = longParagraph;
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  const nodes = await assertApiStructure(html, fixture.api);
  const overview = nodes.find(
    (node) => attribute(node, "id") === "class-environment",
  );
  assert.equal(
    elements(overview).some(
      (node) => attribute(node, "data-api-class-description") != null,
    ),
    false,
  );
  assert.ok(textContent(overview).includes("The global API."));
  const intro = nodes.find(
    (node) => attribute(node, "id") === "widget-description-intro",
  );
  const body = nodes.find(
    (node) => attribute(node, "id") === "widget-description-body",
  );
  assert.equal(textContent(intro).trim(), longParagraph);
  assert.equal(textContent(body).trim(), "");
  assert.match(apiStyles, /\.api-class-summary \{[^}]*-webkit-line-clamp: 3/);
  assert.match(
    apiStyles,
    /:has\(> \.api-class-description-details\[open\]\)[^}]*overflow: visible/,
  );
});

test("class description headings have scoped anchors and deep links reveal the folded contract", async (context) => {
  const fixture = renderFixture(context);
  fixture.api.classes[0].description =
    "The global API.\n\nSee [details](#details).\n\n## Details\n\nA contract.\n\n## Details\n\nAnother contract.";
  fixture.saveApi();
  const result = fixture.generate();
  assert.equal(result.status, 0, result.stderr);
  const html = fs.readFileSync(path.join(fixture.output, "index.html"), "utf8");
  const nodes = await assertApiStructure(html, fixture.api);
  const id = "environment-description-section-details";
  const heading = nodes.find((node) => attribute(node, "id") === id);
  const duplicate = nodes.find((node) => attribute(node, "id") === `${id}-2`);
  assert.ok(heading && duplicate, "duplicate titles need distinct anchors");
  assert.ok(
    nodes.some(
      (node) =>
        node.tagName === "a" &&
        attribute(node, "href") === `#${id}` &&
        textContent(node) === "details",
    ),
  );
  const permalink = heading.childNodes.find((node) =>
    hasClass(node, "api-description-anchor"),
  );
  assert.equal(attribute(permalink, "aria-label"), "Link to Details");

  const section = { id: "class-environment", hidden: true };
  const details = { open: false };
  let scrolls = 0;
  let focuses = 0;
  const target = {
    closest: (selector) => (selector === ".api-class" ? section : details),
    querySelector: () => null,
    matches: () => false,
    focus: (options) => {
      assert.equal(options.preventScroll, true);
      assert.equal(details.open, true);
      focuses++;
    },
    scrollIntoView: () => {
      assert.equal(section.hidden, false);
      assert.equal(
        details.open,
        true,
        "the contract must unfold before scrolling",
      );
      scrolls++;
    },
  };
  const handlers = {};
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  vm.runInNewContext(script, {
    location: { hash: `#${id}` },
    document: {
      querySelectorAll: (selector) =>
        selector === ".api-class" ? [section] : [],
      querySelector: () => null,
      getElementById: () => target,
      addEventListener: (name, callback) => {
        handlers[name] = callback;
      },
    },
    window: { addEventListener: () => {}, scrollTo: () => {} },
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    requestAnimationFrame: (callback) => callback(),
    navigator: {},
  });
  assert.equal(scrolls, 1, "an initial deep link should reveal its contract");
  details.open = false;
  const anchor = { hash: `#${id}` };
  handlers.click({
    target: {
      closest: (selector) => (selector === ".api-anchor" ? anchor : null),
    },
  });
  assert.equal(
    details.open,
    true,
    "a repeated anchor click should reopen the contract",
  );
  assert.equal(scrolls, 2);
  assert.equal(
    focuses,
    1,
    "activating a deep link should focus the revealed heading",
  );
  assert.equal(target.tabIndex, -1);
});

test("every generated API member stays in its class and every class stays in the layout", async () => {
  const apiRoot = path.resolve(__dirname, "..", "api");
  const api = JSON.parse(
    fs.readFileSync(path.join(apiRoot, "api.json"), "utf8"),
  );
  const html = fs.readFileSync(path.join(apiRoot, "index.html"), "utf8");
  const nodes = await assertApiStructure(html, api);
  const ids = new Set(nodes.map((node) => attribute(node, "id")));
  const overviewProperties = api.classes[0].members.filter(
    (member) => member.kind === "property",
  );
  const cards = nodes.filter((node) => hasClass(node, "api-member-linked"));
  assert.equal(cards.length, overviewProperties.length);
  for (const card of cards) {
    const primary = elements(card).find((node) =>
      hasClass(node, "api-card-link"),
    );
    const href = attribute(primary, "href");
    if (href.startsWith("#")) {
      assert.ok(
        ids.has(href.slice(1)),
        `Tile destination does not exist: ${href}`,
      );
    } else {
      const source = elements(card).find((node) =>
        hasClass(node, "api-source"),
      );
      assert.equal(href, attribute(source, "href"));
      assert.match(href, /^https:\/\/github\.com\/lumine-code\/.+#L\d+$/);
    }
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
