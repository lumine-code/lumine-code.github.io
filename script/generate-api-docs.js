"use strict";

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const MarkdownIt = require("markdown-it");

const siteRoot = path.resolve(__dirname, "..");

// --check renders everything and compares it with what is committed instead of
// writing. The reference is generated from a checkout of the editor that sits
// beside this one, so nothing here changes when the editor's documentation
// does — the output simply goes quietly out of date, which is how it came to
// still describe 1.132.1-dev.
const checkOnly = process.argv.includes("--check");
const positional = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const sourceManifestPath = path.resolve(
  positional[0] || path.join(siteRoot, "api-sources.json"),
);
const outputRoot = path.resolve(positional[1] || path.join(siteRoot, "api"));
const sourceManifest = require(sourceManifestPath);
const lumineSource = sourceManifest.sources.find(
  ({ packageMetadata }) => packageMetadata,
);
if (!lumineSource)
  throw new Error("One API source must provide a packageMetadata path.");
const packageMetadata = require(
  path.resolve(siteRoot, lumineSource.packageMetadata),
);
const markdown = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : [];
  });
}

function visit(node, ancestors, callback) {
  if (!node || typeof node !== "object") return;
  callback(node, ancestors.at(-1), ancestors);
  for (const [key, value] of Object.entries(node)) {
    if (
      [
        "loc",
        "start",
        "end",
        "leadingComments",
        "trailingComments",
        "innerComments",
      ].includes(key)
    ) {
      continue;
    }
    if (Array.isArray(value))
      value.forEach((child) => visit(child, [...ancestors, node], callback));
    else visit(value, [...ancestors, node], callback);
  }
}

function cleanBlockComment(value) {
  return value
    .replace(/^\*+/, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\* ?/, ""))
    .join("\n")
    .trim();
}

function commentText(comments = []) {
  return comments
    .map((comment) =>
      comment.type === "CommentBlock"
        ? cleanBlockComment(comment.value)
        : comment.value.startsWith(" ")
          ? comment.value.slice(1)
          : comment.value,
    )
    .join("\n")
    .trim();
}

function commentsFor(node, ancestors = []) {
  for (const candidate of [node, ...ancestors.toReversed()]) {
    if (candidate?.leadingComments?.length) return candidate.leadingComments;
  }
  return [];
}

function legacyDoc(raw) {
  const matches = [
    ...raw.matchAll(
      /(?:^|\n)(Essential|Extended|Public|Private|Experimental):\s*/g,
    ),
  ];
  if (!matches.length) return null;
  const match = matches[matches.length - 1];
  const visibility = match[1];
  if (visibility === "Private") return null;
  return {
    visibility,
    markdown: raw.slice(match.index + match[0].length).trim(),
  };
}

function jsdocTag(raw, tag) {
  const match = raw.match(new RegExp(`(?:^|\\n)@${tag}(?:\\s+([^\\n]*))?`));
  return match?.[1]?.trim() || "";
}

function jsdocDescription(raw) {
  const explicit = raw.match(
    /(?:^|\n)@(classdesc|desc)\s+([\s\S]*?)(?=\n@\w+|$)/,
  );
  if (explicit) return explicit[2].trim();
  return raw
    .slice(
      0,
      raw.search(/(?:^|\n)@\w+/) < 0 ? raw.length : raw.search(/(?:^|\n)@\w+/),
    )
    .trim();
}

function jsdocDoc(raw) {
  if (
    !/(?:^|\n)@(?:class|classdesc|desc|param|returns?|category|function|public)\b/.test(
      raw,
    )
  ) {
    return null;
  }
  if (/(?:^|\n)@private\b/.test(raw)) return null;

  const parts = [];
  const description = jsdocDescription(raw);
  if (description) parts.push(description);

  const params = [
    ...raw.matchAll(
      /(?:^|\n)@param\s+(?:\{([^}]+)\}\s*)?([^\s-]+)\s*(?:-\s*)?([^\n]*)/g,
    ),
  ];
  if (params.length) {
    parts.push(
      params
        .map(
          (match) =>
            `* \`${match[2]}\`${match[1] ? ` {${match[1]}}` : ""} ${match[3]}`,
        )
        .join("\n"),
    );
  }

  const returns = raw.match(/(?:^|\n)@returns?\s+(?:\{([^}]+)\}\s*)?([^\n]*)/);
  if (returns)
    parts.push(
      `Returns${returns[1] ? ` {${returns[1]}}` : ""}${returns[2] ? ` ${returns[2]}` : ""}.`,
    );

  return {
    visibility: "Public",
    markdown: parts.join("\n\n").trim(),
    category: jsdocTag(raw, "category"),
  };
}

// The contiguous run of comments sitting directly above a statement. Babel hands
// the same comment to the preceding statement as a trailing one and to this one
// as a leading one, so anything separated by a blank line documents something
// else and is dropped.
function adjacentComments(statement) {
  const kept = [];
  let nextLine = statement.loc.start.line;
  for (const comment of (statement.leadingComments || []).toReversed()) {
    if (comment.loc.end.line < nextLine - 1) break;
    kept.unshift(comment);
    nextLine = comment.loc.start.line;
  }
  return kept;
}

// A constructor assignment such as `this.workspace = …` is not a class-body
// member, so it needs its own doc reader. Atomdoc ("Public: A {Workspace}
// instance") describes one outright; a bare `@type` annotation carries no prose,
// so the sentence is synthesized from the type it names.
function propertyDoc(comments) {
  if (!comments.length) return null;
  const last = comments.at(-1);
  // A `@type` annotation documents the property by itself. Comments above it are
  // implementation notes written for a reader of the source, not API prose.
  const annotated = /(?:^|\n)@type\b/.test(commentText([last])) ? [last] : comments;
  const raw = commentText(annotated);
  if (!raw || /(?:^|\n)@private\b/.test(raw)) return null;

  const legacy = legacyDoc(raw);
  if (legacy) return legacy;

  const type = raw.match(/(?:^|\n)@type\s*\{([^}]+)\}[ \t]*([^\n]*)/);
  if (!type) return null;
  return {
    visibility: "Public",
    markdown: jsdocDescription(raw) || type[2].trim() || `A {${type[1]}} instance`,
    category: jsdocTag(raw, "category"),
  };
}

function constructorProperties(classNode) {
  const constructorNode = classNode.body.body.find(
    (member) => member.type === "ClassMethod" && member.kind === "constructor",
  );
  if (!constructorNode) return [];

  const properties = [];
  for (const statement of constructorNode.body.body) {
    if (statement.type !== "ExpressionStatement") continue;
    const assignment = statement.expression;
    if (assignment.type !== "AssignmentExpression") continue;
    const target = assignment.left;
    if (
      target.type !== "MemberExpression" ||
      target.object.type !== "ThisExpression" ||
      target.computed ||
      target.property.type !== "Identifier"
    ) {
      continue;
    }
    const doc = propertyDoc(adjacentComments(statement));
    if (!doc) continue;
    properties.push({
      name: target.property.name,
      kind: "property",
      static: false,
      async: false,
      signature: `::${target.property.name}`,
      category: doc.category || "Properties",
      visibility: doc.visibility,
      description: doc.markdown,
      line: statement.loc.start.line,
    });
  }
  return properties;
}

function parseDoc(comments) {
  const raw = commentText(comments);
  if (!raw) return null;
  const doc = legacyDoc(raw) || jsdocDoc(raw);
  if (!doc) return null;
  const sections = [...raw.matchAll(/(?:^|\n)Section:\s*([^\n]+)/g)];
  if (!doc.category && sections.length)
    doc.category = sections[sections.length - 1][1].trim();
  return doc;
}

function propertyName(node) {
  if (!node) return "unknown";
  if (node.type === "Identifier" || node.type === "PrivateName")
    return node.name || node.id?.name;
  if (node.type === "StringLiteral" || node.type === "NumericLiteral")
    return String(node.value);
  return "computed";
}

function classNameFromFile(filePath) {
  return path
    .basename(filePath, ".js")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function signatureFor(node, source, className) {
  const params = (node.params || [])
    .map((param) => source.slice(param.start, param.end))
    .join(", ");
  if (node.kind === "constructor") return `new ${className}(${params})`;
  const name = propertyName(node.key);
  const prefix = node.static ? "." : "::";
  if (node.kind === "get") return `${prefix}${name}`;
  if (node.kind === "set") return `${prefix}${name} = value`;
  return `${prefix}${name}(${params})`;
}

function parseFile(filePath, sourceInput) {
  const source = fs.readFileSync(filePath, "utf8");
  let ast;
  try {
    ast = parser.parse(source, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: [
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "jsx",
      ],
    });
  } catch (error) {
    throw new Error(`Unable to parse ${filePath}: ${error.message}`, {
      cause: error,
    });
  }

  const classes = [];
  const functions = [];
  visit(ast, [], (node, parent, ancestors) => {
    if (node.type === "ClassDeclaration" || node.type === "ClassExpression") {
      const doc = parseDoc(commentsFor(node, ancestors));
      if (!doc) return;
      const name = node.id?.name || classNameFromFile(filePath);
      const members = [];
      let category = "Methods";

      for (const member of node.body.body) {
        if (!["ClassMethod", "ClassPrivateMethod"].includes(member.type))
          continue;
        const rawComments = member.leadingComments || [];
        const raw = commentText(rawComments);
        const sections = [...raw.matchAll(/(?:^|\n)Section:\s*([^\n]+)/g)];
        if (sections.length) category = sections[sections.length - 1][1].trim();
        const memberDoc = parseDoc(rawComments);
        if (!memberDoc) continue;
        if (memberDoc.category) category = memberDoc.category;
        const memberName =
          member.kind === "constructor"
            ? "constructor"
            : propertyName(member.key);
        members.push({
          name: memberName,
          kind: member.kind,
          static: Boolean(member.static),
          async: Boolean(member.async),
          signature: signatureFor(member, source, name),
          category,
          visibility: memberDoc.visibility,
          description: memberDoc.markdown,
          line: member.loc.start.line,
        });
      }

      // Properties lead the class, the way the section marker used to order them.
      members.unshift(...constructorProperties(node));

      classes.push({
        name,
        visibility: doc.visibility,
        description: doc.markdown,
        source: `${sourceInput.label}/${path.relative(sourceInput.root, filePath).replaceAll("\\", "/")}`,
        sourcePath: `src/${path.relative(sourceInput.root, filePath).replaceAll("\\", "/")}`,
        repository: sourceInput.repository,
        line: node.loc.start.line,
        members,
      });
    }

    if (node.type === "FunctionDeclaration" && parent?.type === "Program") {
      const doc = parseDoc(node.leadingComments || []);
      if (!doc) return;
      const params = node.params
        .map((param) => source.slice(param.start, param.end))
        .join(", ");
      functions.push({
        name: node.id.name,
        signature: `${node.id.name}(${params})`,
        visibility: doc.visibility,
        description: doc.markdown,
        source: `${sourceInput.label}/${path.relative(sourceInput.root, filePath).replaceAll("\\", "/")}`,
        sourcePath: `src/${path.relative(sourceInput.root, filePath).replaceAll("\\", "/")}`,
        repository: sourceInput.repository,
        line: node.loc.start.line,
      });
    }
  });

  return { classes, functions };
}

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
  const linkFor = (target, label = target) => {
    const normalized = target.replace(/^::/, `${currentClass || ""}::`);
    const match = normalized.match(/^([^:.]+)(::|\.)(.+)$/);
    if (match && classNames.has(match[1])) {
      const id = `${slug(match[1])}-${match[2] === "." ? "static" : "instance"}-${slug(match[3])}`;
      return memberAnchors.has(id) ? `[${label}](#${id})` : `\`${label}\``;
    }
    if (classNames.has(normalized))
      return `[${label}](#class-${slug(normalized)})`;
    return `\`${label}\``;
  };

  return text
    .replace(/\[([^\]]+)\]\{([^}]+)\}/g, (_all, label, target) =>
      linkFor(target, label),
    )
    .replace(/\{@link\s+([^}\s]+)(?:\s+([^}]+))?\}/g, (_all, target, label) =>
      linkFor(target, label || target),
    )
    .replace(/\{([^{}]+)\}/g, (_all, target) => linkFor(target));
}

function renderDoc(text, classNames, memberAnchors, currentClass) {
  return markdown.render(
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
  const functionNav = api.functions.length
    ? '<a class="api-nav-link api-nav-functions" href="#functions" data-api-nav>Functions</a>'
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
            <section class="api-group" id="${groupId(item.name, category)}">
              <h3>${escapeHtml(category)}</h3>
              ${entries
                .map(
                  (member) => `
                    <article class="api-member" id="${memberId(item.name, member)}" data-api-entry="${escapeHtml(`${item.name} ${member.name} ${member.signature} ${member.description}`.toLowerCase())}">
                      <div class="api-member-heading">
                        <h4><a class="api-anchor" href="#${memberId(item.name, member)}" aria-label="Link to ${escapeHtml(member.signature)}">#</a><code>${escapeHtml(member.signature)}</code></h4>
                        <div class="api-member-meta">${member.async ? '<span class="api-badge api-badge-async">async</span>' : ""}<span class="api-badge">${escapeHtml(member.visibility)}</span><a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${member.line}" title="${escapeHtml(item.source)}:${member.line}">L${member.line}</a></div>
                      </div>
                      ${member.description ? `<div class="api-description-body">${renderDoc(member.description, classNames, memberAnchors, item.name)}</div>` : '<p class="api-empty">No description.</p>'}
                    </article>`,
                )
                .join("\n")}
            </section>`,
        )
        .join("\n");
      return `
        <section class="api-class" id="class-${slug(item.name)}" data-api-entry="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}">
          <p class="eyebrow">${escapeHtml(item.visibility)} API</p>
          <h2>${escapeHtml(item.name)}<a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}">${escapeHtml(item.source)}:${item.line}</a></h2>
          ${item.description ? `<div class="api-description-body api-class-description">${renderDoc(item.description, classNames, memberAnchors, item.name)}</div>` : ""}
          ${members || '<p class="api-empty">No documented public members.</p>'}
        </section>`;
    })
    .join("\n");

  const functions = api.functions.length
    ? `<section class="api-class" id="functions"><p class="eyebrow">Public API</p><h2>Functions</h2>${api.functions
        .map(
          (item) =>
            `<article class="api-member" id="function-${slug(item.name)}" data-api-entry="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}"><div class="api-member-heading"><h4><a class="api-anchor" href="#function-${slug(item.name)}" aria-label="Link to ${escapeHtml(item.name)}">#</a><code>${escapeHtml(item.signature)}</code></h4><div class="api-member-meta"><span class="api-badge">${escapeHtml(item.visibility)}</span><a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}">${escapeHtml(item.source)}:${item.line}</a></div></div>${item.description ? `<div class="api-description-body">${renderDoc(item.description, classNames, memberAnchors)}</div>` : ""}</article>`,
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
      .api-nav-link { display: block; padding: 4px 0 4px 10px; border-left: 2px solid transparent; color: var(--muted); font-size: .86rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: border-color .15s ease, color .15s ease; }
      .api-nav-link:hover { color: var(--gold-strong); }
      .api-nav-link.active { border-left-color: var(--gold-strong); color: var(--gold-strong); font-weight: 600; }
      .api-toc-group { display: none; }
      .api-toc-group.active { display: block; }
      /* A section name is the rail's structure, so it wraps rather than
         truncates — "Managing Cursor Position" must stay readable. */
      .api-toc-heading { display: block; margin: 14px 0 6px; padding-top: 12px; border-top: 1px solid var(--border); color: var(--soft); font-size: .72rem; font-weight: 700; line-height: 1.4; letter-spacing: .1em; text-transform: uppercase; transition: color .15s ease; }
      .api-toc-heading:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
      .api-toc-heading:hover { color: var(--gold-strong); }
      .api-toc-empty { margin: 0; color: var(--muted); font-style: italic; font-size: .8rem; }
      .api-nav-member { display: block; padding: 3px 0 3px 10px; border-left: 2px solid transparent; color: var(--muted); font-family: "JetBrains Mono", monospace; font-size: .74rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: border-color .15s ease, color .15s ease; }
      .api-nav-member:hover { color: var(--gold-strong); }
      .api-nav-member.active { border-left-color: var(--gold-strong); color: var(--text); }
      .api-toast { position: fixed; left: 50%; bottom: 26px; z-index: 100; padding: 10px 18px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface-2); color: var(--text); font-size: .85rem; opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(16px); transition: opacity .2s ease, transform .2s ease; }
      .api-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      .api-nav-functions { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); }
      .api-class { margin-bottom: 48px; scroll-margin-top: 88px; }
      .api-class > h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 14px; margin: 4px 0 10px; font-size: 1.95rem; }
      .api-description-body { margin: 6px 0 0; max-width: 82ch; font-size: .94rem; }
      .api-description-body > :first-child { margin-top: 0; }
      .api-description-body > :last-child { margin-bottom: 0; }
      .api-description-body p { margin: 8px 0 0; }
      .api-description-body ul, .api-description-body ol { margin: 6px 0 0; padding-left: 18px; }
      .api-description-body li { margin: 2px 0 0; }
      .api-description-body :is(h1, h2, h3, h4, h5, h6) { margin: 16px 0 0; font-size: 1.02rem; line-height: 1.35; }
      .api-description-body :is(h4, h5, h6) { font-size: .95rem; }
      .api-description-body code { padding: 1px 5px; border-radius: 5px; background: rgba(255, 255, 255, .05); font-size: .88em; }
      .api-description-body pre { margin: 10px 0 0; padding: 12px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
      .api-description-body pre code { padding: 0; background: none; font-size: .82rem; }
      .api-description-body a { color: var(--gold-strong); }
      .api-class-description { max-width: 78ch; margin: 8px 0 0; font-size: 1rem; }
      .api-source { color: var(--muted); font-family: "JetBrains Mono", monospace; font-size: .72rem; font-weight: 400; white-space: nowrap; transition: color .15s ease; }
      .api-source:hover { color: var(--gold-strong); }
      .api-group { margin-top: 28px; scroll-margin-top: 88px; }
      .api-group > h3 { margin: 0; padding-bottom: 7px; border-bottom: 1px solid var(--border); font-size: 1.02rem; }
      .api-member { padding: 11px 0; border-bottom: 1px solid var(--border); scroll-margin-top: 88px; }
      .api-member:last-child { border-bottom: 0; }
      .api-member-heading { display: flex; gap: 14px; align-items: baseline; justify-content: space-between; }
      .api-member h4 { display: flex; align-items: baseline; gap: 8px; min-width: 0; margin: 0; font-size: .95rem; overflow-wrap: anywhere; }
      .api-member h4 code { color: var(--gold-strong); }
      .api-anchor { flex: none; color: var(--border); font-weight: 400; text-decoration: none; opacity: 0; transition: opacity .15s ease, color .15s ease; }
      .api-member:hover .api-anchor, .api-anchor:focus { opacity: 1; }
      .api-anchor:hover { color: var(--gold-strong); }
      .api-member-meta { display: flex; flex: none; align-items: baseline; gap: 10px; }
      .api-badge { padding: 1px 8px; border: 1px solid var(--border); border-radius: 999px; color: #6f7c8d; font-size: .62rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }
      .api-badge-async { color: var(--cyan); border-color: rgba(98, 213, 208, .4); }
      .api-member p, .api-member li, .api-description-body p, .api-description-body li { color: var(--soft); line-height: 1.6; }
      .api-member pre, .api-description pre { overflow: auto; }
      .api-empty { margin: 6px 0 0; color: var(--muted); font-style: italic; font-size: .9rem; }
      [hidden] { display: none !important; }
      @media (max-width: 1040px) {
        .api-layout { grid-template-columns: 1fr; }
        .api-sidebar { flex-direction: column; gap: 20px; }
        /* Stacked, the rails size to their content: a zero flex-basis in a
           column with no free space to hand out would collapse them outright. */
        .api-tree, .api-tree:first-child { flex: 0 0 auto; }
      }
    </style>
  </head>
  <body>
    <header class="nav">
      <a class="brand" href="../index.html" aria-label="Lumine home"><img src="../assets/lumine.svg" alt="" width="34" height="34" /><span>Lumine</span></a>
      <nav class="nav-links" aria-label="Primary navigation"><a href="../docs.html">Docs</a><a href="./">API</a><a class="nav-github" href="https://github.com/lumine-code/lumine" aria-label="GitHub"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg></a></nav>
      <a class="btn btn-primary nav-cta" href="../docs.html#getting-started/installing-lumine">Build from source</a>
    </header>
    <main class="api-main">
      <header class="api-header"><p class="eyebrow">Generated documentation</p><h1>Lumine API reference</h1><p>Public APIs extracted directly from Lumine&rsquo;s Atomdoc and JSDoc source comments.</p><p class="api-meta">Version ${escapeHtml(api.version)} &middot; ${api.classes.length} classes &middot; ${api.memberCount} documented members</p></header>
      <div class="api-layout"><aside class="api-sidebar" data-api-sidebar><div class="api-tree"><div class="api-tree-list">${classList}</div></div><div class="api-tree"><div class="api-tree-list">${tocList}</div></div></aside><article>${classes}${functions}</article></div>
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

const sourceInputs = sourceManifest.sources.map((source) => ({
  ...source,
  root: path.resolve(siteRoot, source.path),
}));
for (const source of sourceInputs) {
  if (!fs.existsSync(source.root)) {
    throw new Error(`API source does not exist: ${source.root}`);
  }
}
const parsed = sourceInputs.flatMap((sourceInput) =>
  walk(sourceInput.root).map((filePath) => parseFile(filePath, sourceInput)),
);
const classes = parsed
  .flatMap(({ classes: items }) => items)
  .filter(
    (item, index, all) =>
      all.findIndex(({ name }) => name === item.name) === index,
  )
  .sort((left, right) => left.name.localeCompare(right.name));
const functions = parsed
  .flatMap(({ functions: items }) => items)
  .filter(
    (item, index, all) =>
      all.findIndex(({ name }) => name === item.name) === index,
  )
  .sort((left, right) => left.name.localeCompare(right.name));
const api = {
  name: packageMetadata.productName || packageMetadata.name,
  version: packageMetadata.version,
  generatedAt: new Date().toISOString(),
  classes,
  functions,
  memberCount:
    classes.reduce((count, item) => count + item.members.length, 0) +
    functions.length,
};

const rendered = {
  "api.json": `${JSON.stringify(api, null, 2)}\n`,
  "index.html": renderHtml(api),
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
    else if (withoutTimestamp(before, file) !== withoutTimestamp(contents, file))
      stale.push(`${file} does not match the editor source it is generated from`);
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
