"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const MarkdownIt = require("markdown-it");
const { createNavigation } = require("./docs-navigation");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "docs/manifest.json"), "utf8"),
);
const navigation = createNavigation(manifest);
const markdown = new MarkdownIt();

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

function headingIds(page) {
  const tokens = markdown.parse(
    fs.readFileSync(path.join(root, page.file), "utf8"),
    {},
  );
  const seen = new Map();
  return tokens.flatMap((token, index) => {
    if (token.type !== "heading_open") return [];
    const text = tokens[index + 1].content;
    const base =
      text
        .toLowerCase()
        .trim()
        .replace(/[^\w\- ]+/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "") || "section";
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return [count ? `${base}-${count}` : base];
  });
}

function assertInternalTarget(href) {
  const [route, fragment] = href.slice(1).split("#");
  const page = navigation.byRoute.get(route);
  assert.ok(page, `Missing route: ${href}`);
  if (fragment)
    assert.ok(headingIds(page).includes(fragment), `Missing heading: ${href}`);
}

test("the manual contains only seven short pages in six chapters", () => {
  assert.equal(manifest.categories.length, 6);
  assert.equal(navigation.pages.length, 7);
  const expected = navigation.pages
    .map((page) => path.join(root, page.file))
    .sort();
  const actual = files(path.join(root, "docs"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  assert.deepEqual(actual, expected);
  for (const page of navigation.pages) {
    const content = fs.readFileSync(path.join(root, page.file), "utf8");
    assert.ok(content.startsWith(`# ${page.title}\n`), page.file);
    assert.ok(content.split(/\s+/).length < 1000, `Keep ${page.file} concise`);
  }
});

test("every previous manual page still has a direct destination", () => {
  const previous = {
    "getting-started": "what-is-lumine installing-lumine launching-lumine",
    "using-lumine":
      "basics moving-around selections editing-and-deleting finding-and-replacing navigating-your-project folding panes-and-layout terminal ipython autocomplete linting language-servers sofistik code-intelligence version-control",
    "packages-and-themes": "package-system updates managing optional-packages",
    "customizing-lumine":
      "configuration where-customization-is-stored language-settings keybindings snippets the-init-file style-tweaks global-settings",
    "developing-for-lumine":
      "developing-a-package developing-a-theme creating-a-grammar tree-sitter-grammars handling-uris pane-items services jupyter-services file-watching version-control language-server-adapter writing-specs publishing-a-package theme-variables",
    troubleshooting:
      "common-issues developer-tools build-tools performance resetting-to-defaults",
  };
  for (const [category, names] of Object.entries(previous)) {
    for (const name of names.split(" ")) {
      const route = `${category}/${name}`;
      assert.ok(
        manifest.redirects[route],
        `Missing legacy destination: ${route}`,
      );
      const destination = navigation.resolve(`#${route}`).href;
      assert.notEqual(destination, `#${route}`);
      if (destination.startsWith("#")) assertInternalTarget(destination);
      else
        assert.match(
          destination,
          /^https:\/\/github\.com\/lumine-code\/[\w.-]+\/blob\/master\/docs\//,
        );
    }
  }
});

test("all internal redirect fragments land on a real heading", () => {
  for (const [from, to] of Object.entries(manifest.redirects)) {
    if (to.startsWith("https://")) continue;
    assertInternalTarget(navigation.resolve(`#${from}`).href);
  }
});

test("moved sections use their specific owner and unchanged headings survive redirects", () => {
  assert.equal(
    navigation.resolve(
      "#developing-for-lumine/writing-specs#marker-edit-profiling",
    ).href,
    "https://github.com/lumine-code/lumine/blob/master/docs/editor-performance.md#marker-edit-profiling",
  );
  assert.equal(
    navigation.resolve(
      "#using-lumine/ipython#importing-and-exporting-notebooks",
    ).href,
    "https://github.com/lumine-code/jupyter-cells/blob/master/docs/notebook-conversion.md",
  );
  assert.equal(
    navigation.resolve("#using-lumine/terminal#opening-links").href,
    "https://github.com/lumine-code/terminal/blob/master/docs/usage.md#opening-links",
  );
  assert.equal(
    navigation.resolve("#troubleshooting/common-issues#is-it-a-package").href,
    "#troubleshooting/diagnosing-problems#safe-mode",
  );
});

test("Markdown links retain external documents and resolve relative pages and headings", () => {
  const page = navigation.byRoute.get("getting-started/first-steps");
  const external =
    "https://github.com/lumine-code/lumine/blob/master/docs/pane-items.md#moving-and-copying";
  assert.equal(navigation.markdownHref(external, page), external);
  assert.equal(
    navigation.markdownHref("mailto:maintainer@example.com", page),
    "mailto:maintainer@example.com",
  );
  assert.equal(
    navigation.markdownHref("install-and-launch.md#build-from-source", page),
    "#getting-started/install-and-launch#build-from-source",
  );
  assert.equal(
    navigation.markdownHref("../workspace/layout.md#tabs-and-previews", page),
    "#workspace/layout#tabs-and-previews",
  );
  assert.equal(
    navigation.markdownHref("#find-commands", page),
    "#getting-started/first-steps#find-commands",
  );
  assert.equal(
    navigation.markdownHref("../using-lumine/terminal.md#opening-links", page),
    "https://github.com/lumine-code/terminal/blob/master/docs/usage.md#opening-links",
  );
});

test("all links between the new manual pages resolve to existing pages and headings", () => {
  const walk = (tokens) =>
    tokens.flatMap((token) => [token, ...walk(token.children || [])]);
  for (const page of navigation.pages) {
    const content = fs.readFileSync(path.join(root, page.file), "utf8");
    for (const token of walk(markdown.parse(content, {}))) {
      if (token.type !== "link_open") continue;
      const original = token.attrGet("href");
      const href = navigation.markdownHref(original, page);
      if (href.startsWith("#")) assertInternalTarget(href);
      else if (!/^[a-z][a-z0-9+.-]*:/i.test(href))
        assert.ok(
          fs.existsSync(path.resolve(root, href)),
          `Missing link in ${page.file}: ${original}`,
        );
    }
  }
});

test("empty and unknown routes select the start page, while canonical fragments remain intact", () => {
  assert.equal(
    navigation.resolve("").href,
    "#getting-started/install-and-launch",
  );
  assert.equal(
    navigation.resolve("#unknown/page#missing").href,
    "#getting-started/install-and-launch",
  );
  assert.equal(
    navigation.resolve("#/workspace/layout#additional-windows").href,
    "#workspace/layout#additional-windows",
  );
});
