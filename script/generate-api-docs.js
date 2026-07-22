"use strict";

const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const MarkdownIt = require("markdown-it");

const siteRoot = path.resolve(__dirname, "..");
const sourceManifestPath = path.resolve(
  process.argv[2] || path.join(siteRoot, "api-sources.json"),
);
const outputRoot = path.resolve(process.argv[3] || path.join(siteRoot, "api"));
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

function renderHtml(api) {
  const classNames = new Set(api.classes.map(({ name }) => name));
  const memberAnchors = new Set(
    api.classes.flatMap((item) =>
      item.members.map((member) => memberId(item.name, member)),
    ),
  );
  const memberShort = (member) =>
    member.signature.includes("(")
      ? `${member.signature.slice(0, member.signature.indexOf("("))}()`
      : member.signature;
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
  // for the class you are reading is shown (toggled by the scroll spy).
  const memberToc = api.classes
    .map((item) => {
      const memberNav = item.members
        .map(
          (member) =>
            `<a class="api-nav-member" href="#${memberId(item.name, member)}" data-api-nav-member="${memberId(item.name, member)}">${escapeHtml(memberShort(member))}</a>`,
        )
        .join("");
      return `<div class="api-toc-group" data-toc-group="class-${slug(item.name)}">${memberNav || '<p class="api-toc-empty">No members.</p>'}</div>`;
    })
    .join("\n");
  const functionToc = api.functions.length
    ? `<div class="api-toc-group" data-toc-group="functions">${api.functions
        .map(
          (item) =>
            `<a class="api-nav-member" href="#function-${slug(item.name)}" data-api-nav-member="function-${slug(item.name)}">${escapeHtml(item.name)}()</a>`,
        )
        .join("")}</div>`
    : "";
  const tocList = `${memberToc}${functionToc}`;
  const classes = api.classes
    .map((item) => {
      const groups = new Map();
      for (const member of item.members) {
        if (!groups.has(member.category)) groups.set(member.category, []);
        groups.get(member.category).push(member);
      }
      const members = [...groups]
        .map(
          ([category, entries]) => `
            <section class="api-group">
              <h3>${escapeHtml(category)}</h3>
              ${entries
                .map(
                  (member) => `
                    <article class="api-member" id="${memberId(item.name, member)}" data-api-entry="${escapeHtml(`${item.name} ${member.name} ${member.signature} ${member.description}`.toLowerCase())}">
                      <div class="api-member-heading">
                        <h4><a class="api-anchor" href="#${memberId(item.name, member)}" aria-label="Link to ${escapeHtml(member.signature)}">#</a><code>${escapeHtml(member.signature)}</code></h4>
                        <div class="api-badges">${member.async ? '<span class="api-badge api-badge-async">async</span>' : ""}<span class="api-badge">${escapeHtml(member.visibility)}</span></div>
                      </div>
                      ${member.description ? `<div class="api-description-body">${renderDoc(member.description, classNames, memberAnchors, item.name)}</div>` : '<p class="api-empty">No description.</p>'}
                      <a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${member.line}">${escapeHtml(item.source)}:${member.line}</a>
                    </article>`,
                )
                .join("\n")}
            </section>`,
        )
        .join("\n");
      return `
        <section class="api-class" id="class-${slug(item.name)}" data-api-entry="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}">
          <p class="eyebrow">${escapeHtml(item.visibility)} API</p>
          <h2>${escapeHtml(item.name)}</h2>
          ${item.description ? `<div class="api-description-body api-class-description">${renderDoc(item.description, classNames, memberAnchors, item.name)}</div>` : ""}
          <a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}">${escapeHtml(item.source)}:${item.line}</a>
          ${members || '<p class="api-empty">No documented public members.</p>'}
        </section>`;
    })
    .join("\n");

  const functions = api.functions.length
    ? `<section class="api-class" id="functions"><p class="eyebrow">Public API</p><h2>Functions</h2>${api.functions
        .map(
          (item) =>
            `<article class="api-member" id="function-${slug(item.name)}" data-api-entry="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}"><div class="api-member-heading"><h4><a class="api-anchor" href="#function-${slug(item.name)}" aria-label="Link to ${escapeHtml(item.name)}">#</a><code>${escapeHtml(item.signature)}</code></h4></div>${item.description ? `<div class="api-description-body">${renderDoc(item.description, classNames, memberAnchors)}</div>` : ""}<a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}">${escapeHtml(item.source)}:${item.line}</a></article>`,
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
      .api-main { width: min(1440px, calc(100% - 48px)); margin: 0 auto; padding: 72px 0 96px; }
      .api-header { max-width: 780px; margin-bottom: 40px; }
      .api-header h1 { margin: 8px 0 14px; font-size: clamp(2.4rem, 6vw, 4.6rem); }
      .api-meta { color: var(--muted); }
      .api-layout { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 48px; align-items: start; }
      .api-sidebar { position: sticky; top: 88px; height: calc(100vh - 112px); display: flex; flex-direction: column; }
      .api-sidebar p { margin: 0 0 10px; color: var(--muted); font-size: .75rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
      .api-members-label { margin: 16px 0 10px; padding-top: 14px; border-top: 1px solid var(--border); }
      .api-classlist { flex: 1.3 1 0; min-height: 0; overflow: auto; }
      .api-memberlist { flex: 1 1 0; min-height: 0; overflow: auto; }
      .api-nav-link { display: block; padding: 5px 0 5px 10px; border-left: 2px solid transparent; color: var(--muted); font-size: .9rem; transition: border-color .15s ease, color .15s ease; }
      .api-nav-link:hover { color: var(--gold-strong); }
      .api-nav-link.active { border-left-color: var(--gold-strong); color: var(--gold-strong); font-weight: 600; }
      .api-toc-group { display: none; }
      .api-toc-group.active { display: block; }
      .api-toc-empty { margin: 0; color: var(--muted); font-style: italic; font-size: .8rem; }
      .api-nav-member { display: block; padding: 4px 0 4px 10px; border-left: 2px solid transparent; color: var(--muted); font-family: "JetBrains Mono", monospace; font-size: .76rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: border-color .15s ease, color .15s ease; }
      .api-nav-member:hover { color: var(--gold-strong); }
      .api-nav-member.active { border-left-color: var(--gold-strong); color: var(--text); }
      .api-toast { position: fixed; left: 50%; bottom: 26px; z-index: 100; padding: 10px 18px; border: 1px solid var(--border); border-radius: 999px; background: var(--surface-2); color: var(--text); font-size: .85rem; opacity: 0; pointer-events: none; transform: translateX(-50%) translateY(16px); transition: opacity .2s ease, transform .2s ease; }
      .api-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      .api-nav-functions { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
      .api-class { margin-bottom: 76px; scroll-margin-top: 92px; }
      .api-class > h2 { margin: 5px 0 16px; font-size: 2.35rem; }
      .api-description-body { margin: 10px 0 6px; font-size: 1rem; }
      .api-description-body > :first-child { margin-top: 0; }
      .api-description-body > :last-child { margin-bottom: 0; }
      .api-description-body code { padding: 1px 5px; border-radius: 5px; background: rgba(255, 255, 255, .05); font-size: .88em; }
      .api-description-body pre { padding: 14px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
      .api-description-body pre code { padding: 0; background: none; }
      .api-description-body a { color: var(--gold-strong); }
      .api-class-description { max-width: 760px; margin: 12px 0 4px; font-size: 1.05rem; }
      .api-source { display: inline-block; margin: 8px 0 20px; color: var(--muted); font-family: "JetBrains Mono", monospace; font-size: .76rem; }
      .api-group { margin-top: 36px; }
      .api-group > h3 { padding-bottom: 10px; border-bottom: 1px solid var(--border); }
      .api-member { padding: 22px 0; border-bottom: 1px solid var(--border); scroll-margin-top: 92px; }
      .api-member:last-child { border-bottom: 0; }
      .api-member-heading { display: flex; gap: 16px; align-items: baseline; justify-content: space-between; }
      .api-member h4 { display: flex; align-items: baseline; gap: 8px; min-width: 0; margin: 0; font-size: 1.02rem; overflow-wrap: anywhere; }
      .api-member h4 code { color: var(--gold-strong); }
      .api-anchor { flex: none; color: var(--border); font-weight: 400; text-decoration: none; opacity: 0; transition: opacity .15s ease, color .15s ease; }
      .api-member:hover .api-anchor, .api-anchor:focus { opacity: 1; }
      .api-anchor:hover { color: var(--gold-strong); }
      .api-badges { display: flex; flex: none; gap: 6px; }
      .api-badge { padding: 2px 9px; border: 1px solid var(--border); border-radius: 999px; color: var(--muted); font-size: .66rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }
      .api-badge-async { color: var(--cyan); border-color: rgba(98, 213, 208, .4); }
      .api-member p, .api-member li, .api-description-body p, .api-description-body li { color: var(--muted); line-height: 1.72; }
      .api-member pre, .api-description pre { overflow: auto; }
      .api-empty { color: var(--muted); font-style: italic; }
      [hidden] { display: none !important; }
      @media (max-width: 820px) { .api-layout { grid-template-columns: 1fr; } .api-sidebar { position: static; height: auto; display: block; } .api-classlist, .api-memberlist { max-height: 240px; } }
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
      <div class="api-layout"><aside class="api-sidebar" data-api-sidebar><p>Classes</p><div class="api-classlist" data-api-classlist>${classList}</div><p class="api-members-label">Members</p><div class="api-memberlist" data-api-memberlist>${tocList}</div></aside><article>${classes}${functions}</article></div>
    </main>
    <div class="api-toast" data-api-toast role="status" aria-live="polite">Link copied</div>
    <footer class="footer"><a class="footer-brand" href="../index.html"><img src="../assets/lumine.svg" alt="" width="28" height="28" /><span>Lumine</span></a><nav class="footer-links"><a href="../docs.html">Docs</a><a href="./">API reference</a><a href="https://github.com/lumine-code/lumine">GitHub</a></nav><p class="footer-legal">MIT licensed &middot; &copy; 2026 lumine-code</p></footer>
    <script>
      const navLinks = [...document.querySelectorAll('[data-api-nav]')];
      const tocGroups = [...document.querySelectorAll('.api-toc-group')];
      const memberNav = [...document.querySelectorAll('[data-api-nav-member]')];
      const sections = [...document.querySelectorAll('.api-class')];
      const classlist = document.querySelector('[data-api-classlist]');
      const memberlist = document.querySelector('[data-api-memberlist]');
      const toast = document.querySelector('[data-api-toast]');
      const sectionIds = new Set(sections.map(section => section.id));
      let trackingFrame, toastTimer;

      // Scroll a rail so the given entry stays visible (instant).
      const keepInView = (container, el) => {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        if (top < container.scrollTop) container.scrollTop = top;
        else if (bottom > container.scrollTop + container.clientHeight) {
          container.scrollTop = bottom - container.clientHeight;
        }
      };

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
        if (current) keepInView(memberlist, current);
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
        const activeLink = navLinks.find(link => link.hash.slice(1) === key);
        if (activeLink) keepInView(classlist, activeLink);
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

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(
  path.join(outputRoot, "api.json"),
  `${JSON.stringify(api, null, 2)}\n`,
);
fs.writeFileSync(path.join(outputRoot, "index.html"), renderHtml(api));
console.log(
  `Generated ${api.classes.length} classes and ${api.memberCount} documented members in ${outputRoot}`,
);
