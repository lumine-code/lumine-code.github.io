"use strict";

// Builds the index for the service reference.
//
// A package's contract documents are NOT copied here: each lives in the
// repository of the package that owns the service, and docs.html fetches it
// from raw.githubusercontent.com at page load. The exception is the services
// core registers on the hub itself, which belong to no package and so live in
// this repository under docs/services/.
//
// What this script generates is everything that has to be derived from the
// whole workspace and can never be correct in a single package repo — the
// ownership resolution, the source URLs, and the provider/consumer lists.
//
//   node script/generate-services.js [--check]
//
// `--check` writes nothing and exits non-zero if the committed output is stale,
// for use in CI.
//
// Outputs:
//   docs/services.json                            the index docs.html reads
//   docs/developing-for-lumine/services.md        the catalog table, rewritten
//                                                 between its generated markers

const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(__dirname, "..");
const check = process.argv.includes("--check");

const RAW = "https://raw.githubusercontent.com";
const BLOB = "https://github.com";
const ORG = "lumine-code";
const SITE_REPO = "lumine-code.github.io";
const BRANCH = "master";

// Editorial grouping for the catalog and the sidebar order. Every service must
// appear exactly once; the script fails on any that is missing or unknown, so a
// new service cannot quietly land without being placed.
const DOMAINS = [
  {
    title: "Editor chrome",
    services: [
      "status-bar",
      "title-bar",
      "tree-view.selection",
      "tree-view.roots",
      "project-list",
      "recent-list",
      "open-external",
    ],
  },
  {
    title: "Completion and grammars",
    services: [
      "autocomplete.provider",
      "autocomplete.watch-editor",
      "snippets",
      "hyperlink.injection",
      "todo.injection",
      "sofistik.keywords",
    ],
  },
  {
    title: "Language servers and code intelligence",
    services: [
      "ide-client",
      "symbol.provider",
      "hover.provider",
      "hover.signature-provider",
      "outline.provider",
      "refactor.provider",
      "find-references.provider",
      "find-references.markers",
      "hyperclick.provider",
      "code-format.range",
      "code-format.file",
      "code-format.on-type",
      "code-format.on-save",
    ],
  },
  {
    title: "Linting and progress",
    services: [
      "linter.provider",
      "linter.registry",
      "linter.ui",
      "linter.adapter",
      "intentions.list",
      "busy-signal",
    ],
  },
  {
    title: "Scrollbar overview",
    services: ["scrollmap.layer", "scrollmap.widget"],
  },
  {
    title: "Panels",
    services: [
      "search.control",
      "search.adapter",
      "navigation.headers",
      "navigation.adapter",
    ],
  },
  {
    title: "Editors and viewers",
    services: [
      "pdf-view",
      "image-editor",
      "diff-view",
      "bookmarks",
      "bracket-matcher",
      "highlight-selected",
    ],
  },
  {
    title: "Jupyter",
    services: [
      "jupyter.kernel",
      "jupyter.breakpoints",
      "jupyter.adapter",
      "jupyter.notebook",
    ],
  },
  {
    title: "Tools and integrations",
    services: [
      "terminal",
      "terminal-spawn",
      "latex-tools",
      "typst-tools",
      "windows-clip",
      "autosave",
      "git-panel",
      "mcp.bridge",
      "mcp.tools",
      "fuzzy-files.score-modifier",
      "claude-chat",
    ],
  },
  {
    title: "Core extension points",
    services: [
      "icons.provider",
      "project.directory-provider",
      "project.repository-provider",
      "repositories.operations-provider",
      "workspace.search-provider",
    ],
  },
];

function fail(message) {
  console.error(`generate-services: ${message}`);
  process.exit(1);
}

// --- sources ---------------------------------------------------------------

const manifestPath = path.join(siteRoot, "api-sources.json");
if (!fs.existsSync(manifestPath)) fail(`${manifestPath} does not exist`);
const config = JSON.parse(fs.readFileSync(manifestPath, "utf8")).serviceGraph;
if (!config) fail('api-sources.json has no "serviceGraph" block');

const graphModule = path.resolve(siteRoot, config.module);
if (!fs.existsSync(graphModule)) {
  fail(
    `${graphModule} does not exist. The service reference is built from the ` +
      `editor repository checked out beside this one.`,
  );
}
const { CORE, EXTERNAL, buildGraph, ownerFor } = require(graphModule);

const lumineRoot = path.resolve(siteRoot, config.lumineRoot);
const workspaceRoot = path.resolve(siteRoot, config.workspaceRoot);
const { packages, byName, packageNames, graph } = buildGraph({
  lumineRoot,
  workspaceRoot,
});

const communityPackages = packages.filter((p) => p.tree === "community").length;
if (communityPackages === 0) {
  fail(
    `no pkg_lumine packages found under ${workspaceRoot}. Half the services ` +
      `would be reported as undocumented; refusing to write a partial index.`,
  );
}

// --- resolution ------------------------------------------------------------

// Where a service's document lives: its path inside a repository, the raw URL
// docs.html fetches, and the blob URL a reader follows to edit it.
//
// Core services belong to no package, so their documents live here in the site
// rather than in the editor repository — `local: true` marks them, and the page
// loads them by relative path instead of from GitHub raw.
function locate(name, owner) {
  if (owner === EXTERNAL) return null;
  if (owner === CORE) {
    return {
      local: true,
      filePath: `docs/services/${name}.md`,
      localRoot: siteRoot,
    };
  }
  const pkg = byName.get(owner);
  if (!pkg)
    fail(
      `"${name}" is owned by "${owner}", which is not a package in the workspace`,
    );
  return pkg.tree === "bundled"
    ? {
        repo: "lumine",
        filePath: `packages/${pkg.dirname}/docs/${name}.md`,
        localRoot: lumineRoot,
      }
    : { repo: pkg.dirname, filePath: `docs/${name}.md`, localRoot: pkg.dir };
}

// The document's own one-line summary: the first prose line, under the H1.
// Reading it here rather than restating it centrally is what keeps the catalog
// from drifting into one provider's description of a shared contract.
function summaryOf(file) {
  if (!file || !fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  for (const line of lines.slice(1)) {
    const text = line.trim();
    if (text && !text.startsWith("#")) return text;
  }
  return null;
}

const placed = new Map();
for (const domain of DOMAINS) {
  for (const name of domain.services) {
    if (placed.has(name)) fail(`"${name}" is listed in two DOMAINS groups`);
    placed.set(name, domain.title);
  }
}
for (const name of graph.keys()) {
  if (!placed.has(name)) fail(`"${name}" is not placed in any DOMAINS group`);
}
for (const name of placed.keys()) {
  if (!graph.has(name)) fail(`DOMAINS lists "${name}", which is not a service`);
}

const services = {};
const undocumented = [];
for (const [name, edge] of graph) {
  const owner = ownerFor(name, packageNames);
  const where = locate(name, owner);
  const localFile = where
    ? path.join(where.localRoot, ...where.filePath.split("/"))
    : null;
  const summary = summaryOf(localFile);
  if (where && !summary) undocumented.push(name);

  const versions = [...new Set(edge.providers.flatMap((p) => p.versions))];
  services[name] = {
    name,
    group: placed.get(name),
    summary,
    version: versions[0] ?? "1.0.0",
    owner: owner === CORE ? "core" : owner === EXTERNAL ? null : owner,
    src: !where
      ? null
      : where.local
        ? where.filePath
        : `${RAW}/${ORG}/${where.repo}/${BRANCH}/${where.filePath}`,
    source: !where
      ? null
      : where.local
        ? `${BLOB}/${ORG}/${SITE_REPO}/blob/${BRANCH}/${where.filePath}`
        : `${BLOB}/${ORG}/${where.repo}/blob/${BRANCH}/${where.filePath}`,
    providers: edge.providers.map((p) => p.package ?? p.label),
    consumers: edge.consumers.map((c) => c.package ?? c.label),
  };
}

const index = {
  category: { title: "Service reference", slug: "services" },
  groups: DOMAINS.map((d) => ({ title: d.title, services: d.services })),
  services,
};

// --- catalog ---------------------------------------------------------------

const MARKER_START = "<!-- generated: catalog -->";
const MARKER_END = "<!-- /generated: catalog -->";

function renderCatalog() {
  const out = [MARKER_START, ""];
  for (const domain of DOMAINS) {
    out.push(`### ${domain.title}`, "");
    for (const name of domain.services) {
      const service = services[name];
      const summary = service.summary ?? "_Not documented yet._";
      out.push(
        `**[\`${name}\`](../services/${name}.md)** (\`${service.version}\`) — ${summary}`,
      );
      const from = service.providers.length
        ? `From ${service.providers.map((p) => `\`${p}\``).join(", ")}.`
        : "Provided by a package outside this workspace.";
      const used = service.consumers.length
        ? `Used by ${service.consumers.map((c) => `\`${c}\``).join(", ")}.`
        : "No consumer yet.";
      out.push(`<br>${from} ${used}`, "");
    }
  }
  out.push(MARKER_END);
  return out.join("\n");
}

// --- write -----------------------------------------------------------------

const outputs = [];

outputs.push({
  file: path.join(siteRoot, "docs", "services.json"),
  contents: `${JSON.stringify(index, null, 2)}\n`,
});

const catalogPath = path.join(
  siteRoot,
  "docs",
  "developing-for-lumine",
  "services.md",
);
const catalogPage = fs.readFileSync(catalogPath, "utf8");
const start = catalogPage.indexOf(MARKER_START);
const end = catalogPage.indexOf(MARKER_END);
if (start === -1 || end === -1) {
  fail(
    `${catalogPath} has no "${MARKER_START}" / "${MARKER_END}" pair. ` +
      `The catalog section is generated; the prose above it is not.`,
  );
}
outputs.push({
  file: catalogPath,
  contents:
    catalogPage.slice(0, start) +
    renderCatalog() +
    catalogPage.slice(end + MARKER_END.length),
});

let stale = 0;
for (const { file, contents } of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const relative = path.relative(siteRoot, file).replace(/\\/g, "/");
  if (current === contents) {
    console.log(`  unchanged  ${relative}`);
    continue;
  }
  stale += 1;
  if (check) {
    console.error(`  STALE      ${relative}`);
  } else {
    fs.writeFileSync(file, contents);
    console.log(`  wrote      ${relative}`);
  }
}

const documented = Object.keys(services).length - undocumented.length;
console.log(
  `\n${Object.keys(services).length} services, ${documented} documented` +
    (undocumented.length ? `, missing: ${undocumented.join(", ")}` : ""),
);

if (check && stale > 0) {
  console.error(
    `\n${stale} generated file(s) are out of date. Run: npm run docs:services`,
  );
  process.exit(1);
}
