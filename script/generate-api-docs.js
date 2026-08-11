"use strict";

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const MarkdownIt = require("markdown-it");

const siteRoot = path.resolve(__dirname, "..");

function optionValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a path.`);
  }
  return value;
}

// --check renders everything and compares it with what is committed instead
// of writing.
const checkOnly = process.argv.includes("--check");
const editorOption = optionValue("--editor") || process.env.LUMINE_CORE_ROOT;
if (!editorOption) {
  throw new Error(
    "Pass --editor <path> or set LUMINE_CORE_ROOT to a Lumine editor checkout.",
  );
}
const editorRoot = path.resolve(editorOption);
const outputRoot = path.resolve(
  optionValue("--output") || path.join(siteRoot, "api"),
);
const extractorPath = path.join(editorRoot, "script", "api-extractor.js");
if (!fs.existsSync(extractorPath)) {
  throw new Error(
    `The editor checkout has no canonical API extractor: ${extractorPath}`,
  );
}
const { SCHEMA_VERSION, extractApi } = require(extractorPath);
// Enough of a lexer to colour an example, in every language the doc comments
// actually use. A parser would be exact and would also refuse the fragments
// half of these examples are, so this reads the shapes that are the same
// everywhere: a comment, a string, a number, a word.
const CODE_KEYWORDS = new Set([
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "null",
  "of",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
  // CoffeeScript adds these; the ones that double as ordinary identifiers
  // (`is`, `on`, `by`) are left out rather than colour `emitter.on`.
  "and",
  "loop",
  "not",
  "or",
  "then",
  "unless",
  "until",
  "when",
  "yes",
  "no",
]);

const HASH_COMMENT_LANGUAGES =
  /^(coffee|coffeescript|cson|yaml|yml|sh|bash|shell|python|ruby|toml)$/;

function highlightCode(source, language) {
  const comment = HASH_COMMENT_LANGUAGES.test(language)
    ? String.raw`###[\s\S]*?###|#[^\n]*`
    : String.raw`/\*[\s\S]*?\*/|//[^\n]*`;
  const pattern = new RegExp(
    [
      comment,
      String.raw`<!--[\s\S]*?-->`,
      String.raw`'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|\`(?:\\.|[^\`\\])*\``,
      String.raw`\b\d[\d_.]*(?:[eE][+-]?\d+)?\b`,
      String.raw`[A-Za-z_$][\w$]*`,
    ].join("|"),
    "g",
  );

  let out = "";
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const text = match[0];
    out += escapeHtml(source.slice(last, match.index));
    last = match.index + text.length;

    // A name with a colon after it is a key, quoted or not — which is most of
    // a JSON example, and the reason its keys do not read as one wall of
    // string-coloured text.
    const key = /^[ \t]*:/.test(source.slice(last));
    let kind = null;
    if (/^(\/\/|\/\*|#|<!--)/.test(text)) kind = "comment";
    else if (/^['"`]/.test(text)) kind = key ? "key" : "string";
    else if (/^\d/.test(text)) kind = "number";
    // Before the keyword test: `class:` and `default:` are property names here,
    // however they are spelled.
    else if (key) kind = "key";
    else if (CODE_KEYWORDS.has(text)) kind = "keyword";
    else if (source[last] === "(") kind = "fn";

    out += kind
      ? `<span class="tok-${kind}">${escapeHtml(text)}</span>`
      : escapeHtml(text);
  }
  return out + escapeHtml(source.slice(last));
}

const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: highlightCode,
});

function slug(value) {
  return value
    .toLowerCase()
    .replace(/::/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function memberId(className, member) {
  return `${slug(className)}-${member.static ? "static" : "instance"}-${slug(member.name)}`;
}

function linkReferences(text, classNames, memberAnchors, currentClass) {
  if (!text) return "";
  const token = (kind, label, href) =>
    href
      ? `<a class="api-${kind}" href="${href}">${escapeHtml(label)}</a>`
      : `<code class="api-${kind}">${escapeHtml(label)}</code>`;

  const linkFor = (target, label = target) => {
    const normalized = target
      .replace(/^#/, `${currentClass || ""}#`)
      .replace(/^\./, `${currentClass || ""}.`);
    const match = normalized.match(/^([^#.]+)(#|\.)(.+)$/);
    if (match && classNames.has(match[1])) {
      const id = `${slug(match[1])}-${match[2] === "." ? "static" : "instance"}-${slug(match[3])}`;
      return token("ref", label, memberAnchors.has(id) ? `#${id}` : null);
    }
    if (classNames.has(normalized))
      return token("type", label, `#class-${slug(normalized)}`);
    return token("type", label, null);
  };

  const rewrite = (prose) =>
    prose.replace(
      /\{@link\s+([^}\s|]+)(?:\|([^}]+)|\s+([^}]+))?\}/g,
      (_all, target, pipeLabel, spaceLabel) =>
        linkFor(target, pipeLabel || spaceLabel || target),
    );

  // Only prose. Braces inside a fenced block or a code span are the example's
  // own — an object literal, a destructured argument, a template placeholder —
  // and rewriting them turned every such example into nonsense.
  return text
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`)/g)
    .map((segment, index) => (index % 2 ? segment : rewrite(segment)))
    .join("");
}

function renderDoc(text, classNames, memberAnchors, currentClass) {
  return markdown.render(
    linkReferences(text, classNames, memberAnchors, currentClass),
  );
}

function renderInlineDoc(text, classNames, memberAnchors, currentClass) {
  return markdown.renderInline(
    linkReferences(text, classNames, memberAnchors, currentClass),
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderType(type, classNames) {
  if (!type) return "";

  let html = "";
  let offset = 0;
  for (const match of type.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    html += escapeHtml(type.slice(offset, match.index));
    const token = match[0];
    html += classNames.has(token)
      ? `<a href="#class-${slug(token)}">${escapeHtml(token)}</a>`
      : escapeHtml(token);
    offset = match.index + token.length;
  }
  html += escapeHtml(type.slice(offset));
  return `<code class="api-type-expression">${html}</code>`;
}

// The extractor owns the stable machine-readable schema. The website derives
// a deliberately human-oriented view from it: Atomdoc's compact argument
// table, nested option indentation and prose-like return value. Keeping this
// projection here prevents presentation choices from leaking into api.json or
// the autocomplete consumer.
function presentEntry(entry) {
  const parameters = (entry.parameters || [])
    .filter(
      (parameter) =>
        parameter.name &&
        (parameter.type ||
          parameter.description ||
          parameter.optional ||
          parameter.rest ||
          parameter.defaultValue != null),
    )
    .map((parameter) => {
      const parts = parameter.name.split(".");
      return {
        ...parameter,
        depth: Math.max(0, parts.length - 1),
        displayName: `${parameter.rest ? "..." : ""}${parts.at(-1)}`,
        notes: [
          parameter.optional ? "optional" : null,
          parameter.defaultValue != null
            ? `default: ${parameter.defaultValue}`
            : null,
        ].filter(Boolean),
      };
    });

  return {
    parameters,
    propertyType: entry.propertyType || "",
    returnType: entry.returnType || "",
    returnDescription: entry.returnDescription || "",
  };
}

function renderEntryDetails(entry, classNames, memberAnchors, currentClass) {
  const presentation = presentEntry(entry);
  const sections = [];

  if (presentation.parameters.length) {
    const rows = presentation.parameters
      .map((parameter) => {
        const description = parameter.description
          ? `<div class="api-argument-copy">${renderInlineDoc(
              parameter.description,
              classNames,
              memberAnchors,
              currentClass,
            )}</div>`
          : "";
        const type = renderType(parameter.type, classNames);
        const notes = parameter.notes.length
          ? `<span class="api-argument-note">${escapeHtml(parameter.notes.join(", "))}</span>`
          : "";
        return `<tr><td><span class="api-argument-name" style="--api-argument-depth:${parameter.depth}"><code>${escapeHtml(parameter.displayName)}</code>${notes}</span></td><td><div class="api-argument-description">${type}${description || (!type ? '<span class="api-empty">No description.</span>' : "")}</div></td></tr>`;
      })
      .join("");
    sections.push(
      `<div class="api-argument-table-wrap"><table class="api-argument-table"><thead><tr><th scope="col">Argument</th><th scope="col">Description</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    );
  }

  if (presentation.returnType || presentation.returnDescription) {
    const type = renderType(presentation.returnType, classNames);
    let returnDescription = presentation.returnDescription.trim();
    const punctuation = returnDescription.match(/^[,.;:]\s*/)?.[0].trim();
    if (punctuation)
      returnDescription = returnDescription
        .slice(punctuation.length)
        .trimStart();
    const separator = returnDescription ? " — " : "";
    const description = returnDescription
      ? `<span class="api-return-copy">${renderInlineDoc(
          returnDescription,
          classNames,
          memberAnchors,
          currentClass,
        )}</span>`
      : "";
    sections.push(
      `<section class="api-return-section"><h5>Returns</h5><p class="api-return-value">${type}<span class="api-return-separator">${separator}</span>${description}</p></section>`,
    );
  }

  return sections.join("");
}

function renderSignature(signature) {
  const openingParen = signature.indexOf("(");
  if (openingParen === -1) {
    return `<code class="api-signature"><span class="api-signature-name">${escapeHtml(signature)}</span></code>`;
  }
  return `<code class="api-signature"><span class="api-signature-name">${escapeHtml(signature.slice(0, openingParen))}</span><span class="api-signature-parameters">${escapeHtml(signature.slice(openingParen))}</span></code>`;
}

// The article and the member rail split a class the same way, so they read the
// same grouping: declaration order, one entry per Section: marker.
function byCategory(members) {
  const groups = new Map();
  for (const member of members) {
    if (!groups.has(member.category)) groups.set(member.category, []);
    groups.get(member.category).push(member);
  }
  return [...groups];
}

function groupId(className, category) {
  return `${slug(className)}-group-${slug(category)}`;
}

function renderHtml(api) {
  const classNames = new Set(api.classes.map(({ name }) => name));
  const memberAnchors = new Set(
    api.classes.flatMap((item) =>
      item.members.map((member) => memberId(item.name, member)),
    ),
  );
  // The rail is width-starved, and every instance member would otherwise open
  // with the same two colons. The article carries the full signature, so the
  // rail keeps only what tells entries apart — the leading `.` of a static one.
  const memberShort = (member) => {
    const short = member.signature.includes("(")
      ? `${member.signature.slice(0, member.signature.indexOf("("))}()`
      : member.signature;
    return short.startsWith("::") ? short.slice(2) : short;
  };
  // Left rail: a flat list of class links.
  const classNav = api.classes
    .map(
      (item) =>
        `<a class="api-nav-link" href="#class-${slug(item.name)}" data-api-nav>${escapeHtml(item.name)}</a>`,
    )
    .join("\n");
  // Everything the reference holds that is not a class sits under its own
  // chapter heading, so the class list is not asked to end with something that
  // is not a class.
  const functionNav = api.functions.length
    ? '<p class="api-rail-heading">Others</p><a class="api-nav-link" href="#functions" data-api-nav>Functions</a>'
    : "";
  const classList = `${classNav}${functionNav}`;
  // Right rail: one "On this page" group of members per class; only the group
  // for the class you are reading is shown (toggled by the scroll spy). The rail
  // carries the class's own section names as its headings, so it needs no
  // heading of its own.
  const memberToc = api.classes
    .map((item) => {
      const memberNav = byCategory(item.members)
        .map(
          ([category, entries]) =>
            `<a class="api-toc-heading" href="#${groupId(item.name, category)}">${escapeHtml(category)}</a>${entries
              .map(
                (member) =>
                  `<a class="api-nav-member" href="#${memberId(item.name, member)}" data-api-nav-member="${memberId(item.name, member)}">${escapeHtml(memberShort(member))}</a>`,
              )
              .join("")}`,
        )
        .join("");
      return `<div class="api-toc-group" data-toc-group="class-${slug(item.name)}">${memberNav || '<p class="api-toc-empty">No members.</p>'}</div>`;
    })
    .join("\n");
  const functionToc = api.functions.length
    ? `<div class="api-toc-group" data-toc-group="functions"><a class="api-toc-heading" href="#functions">Functions</a>${api.functions
        .map(
          (item) =>
            `<a class="api-nav-member" href="#function-${slug(item.name)}" data-api-nav-member="function-${slug(item.name)}">${escapeHtml(item.name)}()</a>`,
        )
        .join("")}</div>`
    : "";
  const tocList = `${memberToc}${functionToc}`;
  // Every member of a class comes from the file named beside the class heading,
  // so each row carries only its line number; the full path stays in the link's
  // title. Functions are gathered from across the tree and keep theirs.
  const classes = api.classes
    .map((item) => {
      const members = byCategory(item.members)
        .map(
          ([category, entries]) => `
            <section class="api-group api-group-${slug(category)}" id="${groupId(item.name, category)}">
              <h3><span>${escapeHtml(category)}</span><span class="api-group-count">${entries.length}</span></h3>
              <div class="api-group-entries">${entries
                .map(
                  (member) => `
                    <article class="api-member api-member-${member.kind}" id="${memberId(item.name, member)}" data-api-entry="${escapeHtml(`${item.name} ${member.name} ${member.signature} ${member.description}`.toLowerCase())}">
                      <div class="api-member-heading">
                        <h4><a class="api-anchor" href="#${memberId(item.name, member)}" aria-label="Link to ${escapeHtml(member.signature)}">#</a>${renderSignature(member.signature)}${member.propertyType ? `<span class="api-property-type">${renderType(member.propertyType, classNames)}</span>` : ""}</h4>
                        <div class="api-member-meta">${member.async ? '<span class="api-badge api-badge-async">async</span>' : ""}<span class="api-badge api-badge-${slug(member.visibility)}">${escapeHtml(member.visibility)}</span><a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${member.line}" title="${escapeHtml(item.source)}:${member.line}">L${member.line}</a></div>
                      </div>
                      ${member.description ? `<div class="api-description-body">${renderDoc(member.description, classNames, memberAnchors, item.name)}</div>` : ""}
                      ${renderEntryDetails(member, classNames, memberAnchors, item.name) || (!member.description ? '<p class="api-empty">No description.</p>' : "")}
                    </article>`,
                )
                .join("\n")}</div>
            </section>`,
        )
        .join("\n");
      return `
        <section class="api-class" id="class-${slug(item.name)}" data-api-entry="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}">
          <header class="api-class-header"><p class="eyebrow">${escapeHtml(item.visibility)} API</p>
          <h2>${escapeHtml(item.name)}<a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}">${escapeHtml(item.source)}:${item.line}</a></h2>
          ${item.description ? `<div class="api-description-body api-class-description">${renderDoc(item.description, classNames, memberAnchors, item.name)}</div>` : ""}</header>
          ${members || '<p class="api-empty">No documented public members.</p>'}
        </section>`;
    })
    .join("\n");

  const functions = api.functions.length
    ? `<section class="api-class" id="functions"><p class="eyebrow">Public API</p><h2>Functions</h2>${api.functions
        .map(
          (item) =>
            `<article class="api-member" id="function-${slug(item.name)}" data-api-entry="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}"><div class="api-member-heading"><h4><a class="api-anchor" href="#function-${slug(item.name)}" aria-label="Link to ${escapeHtml(item.name)}">#</a>${renderSignature(item.signature)}</h4><div class="api-member-meta"><span class="api-badge api-badge-${slug(item.visibility)}">${escapeHtml(item.visibility)}</span><a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}">${escapeHtml(item.source)}:${item.line}</a></div></div>${item.description ? `<div class="api-description-body">${renderDoc(item.description, classNames, memberAnchors)}</div>` : ""}${renderEntryDetails(item, classNames, memberAnchors)}</article>`,
        )
        .join("\n")}</section>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lumine API reference</title>
    <meta name="description" content="Generated API reference for Lumine ${escapeHtml(api.version)}." />
    <link rel="icon" type="image/svg+xml" href="../assets/lumine.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="../styles.css" />
    <style>
      html { scroll-behavior: auto; }
      .api-main { width: min(1400px, calc(100% - 48px)); margin: 0 auto; padding: 52px 0 72px; }
      .api-header { max-width: 780px; margin-bottom: 30px; }
      .api-header h1 { margin: 8px 0 10px; font-size: clamp(2.1rem, 5vw, 3.4rem); }
      .api-header p:not(.eyebrow) { margin: 0; color: var(--soft); }
      .api-header .api-meta { margin-top: 6px; color: var(--muted); font-size: .88rem; }
      .api-layout { display: grid; grid-template-columns: 450px minmax(0, 1fr); gap: 40px; align-items: start; }
      .api-sidebar { display: flex; gap: 24px; }
      .api-tree { flex: 1 1 0; min-width: 0; }
      /* Class names are short and known; member signatures are neither, so the
         fixed width goes to the classes and the slack to the members. */
      .api-tree:first-child { flex: 0 0 172px; }
      /* One heading treatment for both rails, so the two columns start on the
         same line and their entries stay level. */
      .api-rail-heading, .api-toc-heading { margin: 24px 0 6px; color: var(--soft); font-size: .72rem; font-weight: 700; line-height: 1.4; letter-spacing: .1em; text-transform: uppercase; }
      .api-tree > .api-rail-heading { margin-top: 0; }
      .api-nav-link { display: block; padding: 4px 0 4px 10px; border-left: 2px solid transparent; color: var(--muted); font-size: .86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: border-color .15s ease, color .15s ease; }
      .api-nav-link:hover { color: var(--gold-strong); }
      .api-nav-link.active { border-left-color: var(--gold-strong); color: var(--gold-strong); font-weight: 600; }
      .api-toc-group { display: none; }
      .api-toc-group.active { display: block; }
      /* A section name is the rail's structure, so it wraps rather than
         truncates — "Managing Cursor Position" must stay readable. */
      .api-toc-heading { display: block; transition: color .15s ease; }
      .api-toc-heading:first-child { margin-top: 0; }
      .api-toc-heading:hover { color: var(--gold-strong); }
      .api-toc-empty { margin: 0; color: var(--muted); font-style: italic; font-size: .8rem; }
      .api-nav-member { display: block; padding: 3px 0 3px 10px; border-left: 2px solid transparent; color: var(--muted); font-family: "JetBrains Mono", monospace; font-size: .74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: border-color .15s ease, color .15s ease; }
      .api-nav-member:hover { color: var(--gold-strong); }
      .api-nav-member.active { border-left-color: var(--gold-strong); color: var(--text); }
      .api-toast { position: fixed; left: 50%; bottom: 26px; z-index: 100; padding: 10px 18px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface-2); color: var(--text); font-size: .85rem; opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(16px); transition: opacity .2s ease, transform .2s ease; }
      .api-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      .api-content { min-width: 0; }
      .api-class { margin-bottom: 48px; scroll-margin-top: 88px; }
      .api-class-header { padding: 22px 24px 24px; border: 1px solid var(--border); border-radius: 12px; background: linear-gradient(135deg, rgba(229, 173, 45, .08), rgba(255, 255, 255, .025) 42%, rgba(98, 213, 208, .035)); box-shadow: 0 18px 44px rgba(0, 0, 0, .14); }
      .api-class-header .eyebrow { margin: 0 0 5px; }
      .api-class-header h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 14px; margin: 0; font-size: clamp(1.7rem, 3vw, 2.15rem); }
      .api-description-body { margin: 10px 0 0; max-width: 82ch; font-size: .94rem; }
      .api-description-body > :first-child { margin-top: 0; }
      .api-description-body > :last-child { margin-bottom: 0; }
      .api-description-body p { margin: 11px 0 0; }
      .api-description-body ul, .api-description-body ol { margin: 9px 0 0; padding-left: 20px; }
      .api-description-body li { margin: 2px 0 0; }
      .api-description-body :is(h1, h2, h3, h4, h5, h6) { margin: 16px 0 0; font-size: 1.02rem; line-height: 1.35; }
      .api-description-body :is(h4, h5, h6) { font-size: .95rem; }
      :is(.api-description-body, .api-argument-copy, .api-return-copy) code { padding: 1px 5px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); font-size: .88em; }
      /* References read like links, not selected tags. Types use the same green
         accent as the old Atom reference, while ordinary inline code stays
         neutral and boxed. */
      :is(.api-description-body, .api-argument-copy, .api-return-copy) :is(.api-type, .api-ref) { padding: 0; border: 0; border-radius: 0; background: none; color: var(--green); font-family: "JetBrains Mono", monospace; font-size: .88em; white-space: nowrap; }
      :is(.api-description-body, .api-argument-copy, .api-return-copy) a:is(.api-type, .api-ref):hover { text-decoration: underline; }
      .api-description-body li > code:first-child:not(.api-type):not(.api-ref) { color: var(--text); font-weight: 600; }
      .api-description-body pre { margin: 10px 0 0; padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
      .api-description-body pre code { padding: 0; border: 0; border-radius: 0; background: none; font-size: .82rem; }
      .api-description-body a { color: var(--green); }
      .api-class-description { max-width: 76ch; margin: 9px 0 0; font-size: .98rem; }
      .api-argument-table-wrap { margin-top: 16px; overflow: hidden; border: 1px solid var(--border); border-radius: 8px; background: rgba(0, 0, 0, .12); }
      .api-argument-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
      .api-argument-table th { padding: 8px 12px; border-bottom: 1px solid var(--border); background: rgba(255, 255, 255, .025); color: var(--muted); font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-align: left; text-transform: uppercase; }
      .api-argument-table th:first-child { width: 11rem; }
      .api-argument-table td { padding: 9px 12px; border-bottom: 1px solid rgba(255, 255, 255, .055); color: var(--soft); line-height: 1.5; vertical-align: top; }
      .api-argument-table tr:last-child td { border-bottom: 0; }
      .api-argument-name { display: flex; align-items: baseline; gap: 7px; margin-left: calc(var(--api-argument-depth) * 1rem); white-space: nowrap; }
      .api-argument-name code { padding: 1px 5px; border: 1px solid rgba(255, 255, 255, .09); border-radius: 4px; background: rgba(255, 255, 255, .035); color: var(--text); font-size: .84rem; }
      .api-argument-note { color: var(--muted); font-size: .67rem; }
      .api-argument-description { display: flex; flex-wrap: wrap; align-items: baseline; gap: 7px; min-width: 0; }
      .api-argument-copy { min-width: 12rem; flex: 1 1 20rem; }
      .api-type-expression { padding: 0; border: 0; background: none; color: var(--green); font-size: .9rem; white-space: nowrap; }
      .api-type-expression a { color: inherit; }
      .api-type-expression a:hover { text-decoration: underline; }
      .api-return-section { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: 12px; align-items: baseline; margin-top: 14px; padding-top: 13px; border-top: 1px solid rgba(255, 255, 255, .07); }
      .api-return-section h5 { margin: 0; color: var(--muted); font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      .api-return-value { margin: 0; color: var(--soft); line-height: 1.55; }
      .api-source { color: var(--muted); font-family: "JetBrains Mono", monospace; font-size: .72rem; font-weight: 400; white-space: nowrap; transition: color .15s ease; }
      .api-source:hover { color: var(--gold-strong); }
      .api-group { margin-top: 34px; scroll-margin-top: 88px; }
      .api-group > h3 { display: flex; align-items: center; gap: 9px; margin: 0 0 11px; color: var(--text); font-size: 1rem; }
      .api-group-count { display: inline-flex; align-items: center; justify-content: center; min-width: 1.55rem; height: 1.25rem; padding: 0 6px; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); font-size: .64rem; font-weight: 600; }
      .api-group-entries { display: grid; gap: 10px; }
      .api-group-properties .api-group-entries { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .api-member { min-width: 0; padding: 18px 20px; border: 1px solid rgba(255, 255, 255, .075); border-radius: 10px; background: rgba(255, 255, 255, .018); scroll-margin-top: 88px; transition: border-color .15s ease, background .15s ease; }
      .api-member:target { border-color: rgba(229, 173, 45, .5); background: rgba(229, 173, 45, .045); }
      .api-member:hover { border-color: rgba(255, 255, 255, .13); }
      .api-member-property { padding: 15px 16px 16px; }
      .api-member-heading { display: flex; gap: 14px; align-items: flex-start; justify-content: space-between; }
      .api-member h4 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 7px; min-width: 0; margin: 0; font-size: .95rem; overflow-wrap: anywhere; }
      .api-signature { font-weight: 500; }
      .api-signature-name { color: var(--green); }
      .api-signature-parameters { color: var(--muted); font-weight: 400; }
      .api-property-type { display: inline-flex; align-items: baseline; gap: 7px; color: var(--muted); font-size: .78rem; font-weight: 400; }
      .api-property-type::before { content: "→"; color: var(--muted); }
      .api-property-type .api-type-expression { font-size: inherit; }
      .api-anchor { flex: none; color: var(--border); font-weight: 400; text-decoration: none; opacity: 0; transition: opacity .15s ease, color .15s ease; }
      .api-member:hover .api-anchor, .api-anchor:focus { opacity: 1; }
      .api-anchor:hover { color: var(--gold-strong); }
      .api-member-meta { display: flex; flex: none; align-items: baseline; gap: 10px; }
      .api-badge { padding: 1px 8px; border: 1px solid var(--border); border-radius: 999px; color: #6f7c8d; font-size: .62rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }
      /* Visibility is a reading order, so it is worth seeing at a glance which
         members are the ones to start with. */
      .api-badge-essential { color: var(--gold-strong); border-color: rgba(229, 173, 45, .38); }
      .api-badge-extended { color: #5d6878; border-color: rgba(255, 255, 255, .07); }
      .api-badge-experimental { color: var(--green); border-color: rgba(135, 211, 124, .34); }
      .api-badge-async { color: var(--cyan); border-color: rgba(98, 213, 208, .4); }
      .api-member p, .api-member li, .api-description-body p, .api-description-body li { color: var(--soft); line-height: 1.58; }
      .api-member-property .api-description-body { margin-top: 7px; font-size: .88rem; }
      .api-member pre, .api-description pre { overflow: auto; }
      .api-empty { margin: 6px 0 0; color: var(--muted); font-style: italic; font-size: .9rem; }
      [hidden] { display: none !important; }
      @media (max-width: 1040px) {
        .api-layout { grid-template-columns: 1fr; }
        .api-sidebar { display: grid; grid-template-columns: minmax(10rem, 1fr) minmax(0, 2fr); gap: 24px; max-height: 22rem; padding: 16px; border: 1px solid var(--border); border-radius: 10px; background: rgba(255, 255, 255, .018); overflow: hidden; }
        .api-tree, .api-tree:first-child { min-width: 0; overflow-y: auto; scrollbar-color: var(--border) transparent; scrollbar-width: thin; }
      }
      @media (max-width: 760px) {
        .api-main { width: min(100% - 30px, 1400px); padding-top: 34px; }
        .api-group-properties .api-group-entries { grid-template-columns: 1fr; }
      }
      @media (max-width: 620px) {
        .api-sidebar { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 14px; max-height: 18rem; padding: 12px; }
        .api-class-header { padding: 18px; }
        .api-member { padding: 16px; }
        .api-member-heading { align-items: flex-start; }
        .api-member-meta { flex-wrap: wrap; justify-content: flex-end; }
        .api-argument-table thead { display: none; }
        .api-argument-table, .api-argument-table tbody, .api-argument-table tr, .api-argument-table td { display: block; width: 100%; }
        .api-argument-table tr { padding: 9px 0; border-bottom: 1px solid rgba(255, 255, 255, .07); }
        .api-argument-table td { padding: 0 10px; border: 0; }
        .api-argument-table td + td { padding-top: 6px; padding-bottom: 8px; }
        .api-return-section { grid-template-columns: 1fr; gap: 5px; }
      }
    </style>
  </head>
  <body>
    <header class="nav">
      <a class="brand" href="../index.html" aria-label="Lumine home"><img src="../assets/lumine.svg" alt="" width="34" height="34" /><span>Lumine</span></a>
      <nav class="nav-links" aria-label="Primary navigation"><a href="../docs.html">Docs</a><a href="./">API</a><a class="nav-github" href="https://github.com/lumine-code/lumine" aria-label="GitHub"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></a></nav>
    </header>
    <main class="api-main">
      <header class="api-header"><p class="eyebrow">Generated documentation</p><h1>Lumine API reference</h1><p>Public APIs extracted directly from Lumine&rsquo;s JSDoc source comments.</p><p class="api-meta">Version ${escapeHtml(api.version)} &middot; ${api.classes.length} classes &middot; ${api.memberCount} documented members</p></header>
      <div class="api-layout"><aside class="api-sidebar" data-api-sidebar><div class="api-tree"><p class="api-rail-heading">Classes</p><div class="api-tree-list">${classList}</div></div><div class="api-tree"><div class="api-tree-list">${tocList}</div></div></aside><article class="api-content">${classes}${functions}</article></div>
    </main>
    <div class="api-toast" data-api-toast role="status" aria-live="polite">Link copied</div>
    <footer class="footer"><a class="footer-brand" href="../index.html"><img src="../assets/lumine.svg" alt="" width="28" height="28" /><span>Lumine</span></a><nav class="footer-links"><a href="../docs.html">Docs</a><a href="./">API reference</a><a href="https://github.com/lumine-code/lumine">GitHub</a></nav><p class="footer-legal">MIT licensed &middot; &copy; 2026 lumine-code</p></footer>
    <script>
      const navLinks = [...document.querySelectorAll('[data-api-nav]')];
      const tocGroups = [...document.querySelectorAll('.api-toc-group')];
      const memberNav = [...document.querySelectorAll('[data-api-nav-member]')];
      const sections = [...document.querySelectorAll('.api-class')];
      const toast = document.querySelector('[data-api-toast]');
      const sectionIds = new Set(sections.map(section => section.id));
      let trackingFrame, toastTimer;

      // The class selected by the hash: a class id, or the parent class of a
      // member id. Falls back to the first class.
      const currentKey = () => {
        const hash = location.hash.slice(1);
        if (sectionIds.has(hash)) return hash;
        const el = hash && document.getElementById(hash);
        const parent = el && el.closest('.api-class');
        return parent ? parent.id : (sections[0] && sections[0].id);
      };

      // Highlight the member you are reading within the shown class.
      const syncMember = () => {
        trackingFrame = null;
        const group = tocGroups.find(g => g.dataset.tocGroup === currentKey());
        let current = null;
        for (const link of memberNav) {
          if (!group || link.closest('.api-toc-group') !== group) continue;
          const section = document.getElementById(link.dataset.apiNavMember);
          if (section && section.getBoundingClientRect().top <= 160) current = link;
        }
        for (const link of memberNav) link.classList.toggle('active', link === current);
      };
      const requestMemberSync = () => {
        if (!trackingFrame) trackingFrame = requestAnimationFrame(syncMember);
      };

      // Split-pane router: show one class at a time, driven by the hash.
      const showClass = () => {
        const key = currentKey();
        for (const section of sections) section.hidden = section.id !== key;
        for (const link of navLinks) {
          const on = link.hash.slice(1) === key;
          link.classList.toggle('active', on);
          if (on) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        }
        for (const group of tocGroups) group.classList.toggle('active', group.dataset.tocGroup === key);
        const hash = location.hash.slice(1);
        if (hash && !sectionIds.has(hash)) {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'auto' });
        } else {
          window.scrollTo(0, 0);
        }
        syncMember();
      };

      // Clicking the # anchor copies a deep link (and still navigates).
      document.addEventListener('click', (event) => {
        const anchor = event.target.closest('.api-anchor');
        if (!anchor || !navigator.clipboard) return;
        navigator.clipboard
          .writeText(location.origin + location.pathname + anchor.getAttribute('href'))
          .then(() => {
            toast.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(() => toast.classList.remove('show'), 1600);
          })
          .catch(() => {});
      });

      window.addEventListener('hashchange', showClass);
      window.addEventListener('scroll', requestMemberSync, { passive: true });
      showClass();
    </script>
  </body>
</html>`;
}

const api = extractApi({ editorRoot, parser });
if (api.schemaVersion !== SCHEMA_VERSION) {
  throw new Error(
    `Unsupported API schema ${api.schemaVersion}; expected ${SCHEMA_VERSION}.`,
  );
}
api.generatedAt = new Date().toISOString();

const rendered = {
  "api.json": `${JSON.stringify(api, null, 2)}\n`,
  "index.html": renderHtml(api).replace(/[ \t]+$/gm, ""),
};
const summary = `${api.classes.length} classes and ${api.memberCount} documented members`;

// The timestamp is the one thing that differs on every run, so comparing it
// would make the check useless. Everything else — the version, the members,
// the source line each one links to — is a real difference worth failing on:
// a moved line number is a reference link that now points at the wrong code.
function withoutTimestamp(contents, file) {
  if (file !== "api.json") return contents;
  return contents.replace(/^(\s*"generatedAt": ).*$/m, "$1null,");
}

if (checkOnly) {
  const stale = [];
  for (const [file, contents] of Object.entries(rendered)) {
    const committed = path.join(outputRoot, file);
    const before = fs.existsSync(committed)
      ? fs.readFileSync(committed, "utf8")
      : null;
    if (before === null) stale.push(`${file} has never been generated`);
    else if (
      withoutTimestamp(before, file) !== withoutTimestamp(contents, file)
    )
      stale.push(
        `${file} does not match the editor source it is generated from`,
      );
  }

  for (const line of stale) console.error(`error: ${line}`);
  console.log(
    `api reference: ${summary}, ${stale.length} file(s) out of date` +
      (stale.length ? " — run npm run docs:api and commit the result" : ""),
  );
  process.exitCode = stale.length > 0 ? 1 : 0;
} else {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const [file, contents] of Object.entries(rendered)) {
    fs.writeFileSync(path.join(outputRoot, file), contents);
  }
  console.log(`Generated ${summary} in ${outputRoot}`);
}
