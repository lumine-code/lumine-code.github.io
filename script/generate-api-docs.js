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

function resolveReference(
  target,
  label,
  classNames,
  memberAnchors,
  currentClass,
) {
  const token = (kind, href = null) => ({ kind, label, href });
  if (/^(?:https?:|mailto:)/.test(target)) return token("ref", target);
  const normalized = target
    .replace(/^#/, `${currentClass || ""}#`)
    .replace(/^\./, `${currentClass || ""}.`);
  if (classNames.has(normalized))
    return token("type", classNames.get(normalized));
  const match = normalized.match(/^([^#.]+)(#|\.)(.+)$/);
  if (match && classNames.has(match[1])) {
    const id = `${slug(match[1])}-${match[2] === "." ? "static" : "instance"}-${slug(match[3])}`;
    return token("ref", memberAnchors.has(id) ? `#${id}` : null);
  }
  return token("type");
}

// References are Markdown tokens, so source HTML can be escaped independently
// without escaping the links we generate. Code spans and fences never enter
// this inline rule and retain their literal examples.
markdown.inline.ruler.before("link", "api_reference", (state, silent) => {
  if (
    !state.env.classNames ||
    state.linkLevel > 0 ||
    state.src[state.pos] !== "{"
  )
    return false;
  const match = state.src
    .slice(state.pos, state.posMax)
    .match(/^\{@link\s+([^}\s|]+)(?:\|([^}]+)|\s+([^}]+))?\}/);
  if (!match) return false;
  if (!silent) {
    const reference = resolveReference(
      match[1],
      match[2] || match[3] || match[1],
      state.env.classNames,
      state.env.memberAnchors,
      state.env.currentClass,
    );
    if (reference.href) {
      const opening = state.push("link_open", "a", 1);
      opening.attrs = [
        ["class", `api-${reference.kind}`],
        ["href", reference.href],
      ];
      state.push("text", "", 0).content = reference.label;
      state.push("link_close", "a", -1);
    } else {
      const literal = state.push("code_inline", "code", 0);
      literal.attrs = [["class", `api-${reference.kind}`]];
      literal.content = reference.label;
    }
  }
  state.pos += match[0].length;
  return true;
});

// A broken example must remain text rather than closing the API layout. kbd is
// the one intentional inline HTML convention in the source documentation.
markdown.renderer.rules.html_inline = (tokens, index) =>
  /^<\/?kbd\s*>$/i.test(tokens[index].content)
    ? tokens[index].content
    : escapeHtml(tokens[index].content);
markdown.renderer.rules.html_block = (tokens, index) =>
  `<pre><code>${escapeHtml(tokens[index].content)}</code></pre>\n`;

function renderDoc(
  text,
  classNames,
  memberAnchors,
  currentClass,
  firstHeadingLevel = 5,
) {
  const environment = {
    classNames,
    memberAnchors,
    currentClass,
  };
  return renderDocTokens(
    markdown.parse(text, environment),
    environment,
    firstHeadingLevel,
  );
}

function renderDocTokens(tokens, environment, firstHeadingLevel) {
  const html = markdown.renderer.render(tokens, markdown.options, environment);
  const headings = [...html.matchAll(/<h([1-6])(?:\s|>)/g)].map((match) =>
    Number(match[1]),
  );
  const originalFirstLevel = Math.min(...headings);
  return html.replace(
    /<(\/?)h([1-6])(\b[^>]*)>/g,
    (_tag, closing, level, attributes) =>
      `<${closing}h${Math.min(6, firstHeadingLevel + Number(level) - originalFirstLevel)}${attributes}>`,
  );
}

markdown.renderer.rules.api_heading_anchor = (tokens, index) => {
  const { id, label } = tokens[index].meta;
  return `<a class="api-anchor api-description-anchor" href="#${id}" aria-label="Link to ${escapeHtml(label)}">#</a>`;
};

function renderClassDescription(item, classNames, memberAnchors) {
  const description = item.description?.trim();
  if (!description) return "";
  const environment = { classNames, memberAnchors, currentClass: item.name };
  const tokens = markdown.parse(description, environment);
  const headingPrefix = `${slug(item.name)}-description-section`;
  const headingCounts = new Map();
  const headingTargets = new Map();
  for (let index = 0; index < tokens.length; index++) {
    if (tokens[index].type !== "heading_open") continue;
    const inline = tokens[index + 1];
    const label = (inline.children || [])
      .filter((token) => ["text", "code_inline"].includes(token.type))
      .map((token) => token.content)
      .join("");
    const headingSlug = slug(label) || "section";
    const count = (headingCounts.get(headingSlug) || 0) + 1;
    headingCounts.set(headingSlug, count);
    const id = `${headingPrefix}-${headingSlug}${count > 1 ? `-${count}` : ""}`;
    tokens[index].attrSet("id", id);
    if (!headingTargets.has(headingSlug)) headingTargets.set(headingSlug, id);
    inline.children.push({
      type: "api_heading_anchor",
      nesting: 0,
      content: "",
      meta: { id, label },
    });
  }
  // References within a class contract resolve to that class's own headings,
  // while generated API references keep their member or class destinations.
  const apiTargets = new Set([
    ...classNames.values(),
    ...[...memberAnchors].map((id) => `#${id}`),
  ]);
  for (const token of tokens.flatMap((entry) => entry.children || [])) {
    if (token.type !== "link_open") continue;
    const href = token.attrGet("href");
    if (!href?.startsWith("#") || apiTargets.has(href)) continue;
    const target = headingTargets.get(href.slice(1));
    if (target) token.attrSet("href", `#${target}`);
  }
  const structured = tokens.some((token) =>
    [
      "heading_open",
      "fence",
      "code_block",
      "bullet_list_open",
      "ordered_list_open",
      "table_open",
    ].includes(token.type),
  );
  if (description.length <= 400 && !structured) {
    return `<div class="api-description-body api-class-description">${renderDocTokens(tokens, environment, 3)}</div>`;
  }
  const firstParagraphEnd =
    tokens[0]?.type === "paragraph_open"
      ? tokens.findIndex(
          (token) => token.type === "paragraph_close" && token.level === 0,
        ) + 1
      : 0;
  const brief = firstParagraphEnd
    ? renderDocTokens(tokens.slice(0, firstParagraphEnd), environment, 3)
    : `<p>${renderInlineDoc(item.summary || item.name, classNames, memberAnchors, item.name)}</p>`;
  const remainder = renderDocTokens(
    tokens.slice(firstParagraphEnd),
    environment,
    3,
  );
  const prefix = `${slug(item.name)}-description`;
  return `<div class="api-description-body api-class-description api-class-description-folded"><div class="api-class-summary" id="${prefix}-intro">${brief}</div><details class="api-class-description-details" data-api-class-description><summary aria-label="Full description of ${escapeHtml(item.name)}" aria-controls="${prefix}-intro ${prefix}-body"><span class="api-class-description-disclosure" aria-hidden="true"></span>Full description</summary><div class="api-class-description-content" id="${prefix}-body">${remainder}</div></details></div>`;
}

function renderInlineDoc(text, classNames, memberAnchors, currentClass) {
  return markdown.renderInline(text, {
    classNames,
    memberAnchors,
    currentClass,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderType(type, classNames, breakIdentifiers = false) {
  if (!type) return "";

  let html = "";
  let offset = 0;
  for (const match of type.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
    html += escapeHtml(type.slice(offset, match.index));
    const token = match[0];
    const label = breakIdentifiers
      ? renderIdentifier(token)
      : escapeHtml(token);
    html += classNames.has(token)
      ? `<a href="${classNames.get(token)}">${label}</a>`
      : label;
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

// Some legacy parameter docs encode a Markdown list inline as
// `...: * __first__: ... * __second__: ...`. Restore only that unambiguous
// pattern to block Markdown so long option definitions keep a readable shape.
function restoreInlineDefinitionList(text) {
  let first = true;
  return text.replace(/\s+\*\s+(__[\w-]+__:\s*)/g, (_, label) => {
    const prefix = first ? "\n\n" : "\n";
    first = false;
    return `${prefix}* ${label}`;
  });
}

function renderEntryDetails(entry, classNames, memberAnchors, currentClass) {
  const presentation = presentEntry(entry);
  const sections = [];

  if (presentation.parameters.length) {
    const rows = presentation.parameters
      .map((parameter) => {
        const restoredDescription = restoreInlineDefinitionList(
          parameter.description || "",
        );
        const description = parameter.description
          ? `<div class="api-argument-copy">${
              restoredDescription === parameter.description
                ? renderInlineDoc(
                    parameter.description,
                    classNames,
                    memberAnchors,
                    currentClass,
                  )
                : renderDoc(
                    restoredDescription,
                    classNames,
                    memberAnchors,
                    currentClass,
                  )
            }</div>`
          : "";
        const type = renderType(parameter.type, classNames);
        const notes = parameter.notes.length
          ? `<span class="api-argument-note">${escapeHtml(parameter.notes.join(", "))}</span>`
          : "";
        return `<tr><td><span class="api-argument-name" style="--api-argument-depth:${parameter.depth}"><code>${escapeHtml(parameter.displayName)}</code>${notes}</span></td><td class="api-argument-type">${type}</td><td><div class="api-argument-description">${description || (!type ? '<span class="api-empty">No description.</span>' : "")}</div></td></tr>`;
      })
      .join("");
    sections.push(
      `<div class="api-argument-table-wrap"><table class="api-argument-table"><thead><tr><th scope="col">Argument</th><th scope="col">Type</th><th scope="col">Description</th></tr></thead><tbody>${rows}</tbody></table></div>`,
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

  if (entry.throws?.length) {
    sections.push(
      `<section class="api-return-section api-throws-section"><h5>Throws</h5><div>${entry.throws
        .map(
          (error) =>
            `<p class="api-return-value">${renderType(error.type, classNames)}${error.description ? ` — ${renderInlineDoc(error.description, classNames, memberAnchors, currentClass)}` : ""}</p>`,
        )
        .join("")}</div></section>`,
    );
  }

  return sections.join("");
}

function renderIdentifier(identifier) {
  return escapeHtml(identifier).replace(/([a-z0-9])([A-Z])/g, "$1<wbr>$2");
}

function renderSignature(signature) {
  const openingParen = signature.indexOf("(");
  if (openingParen === -1) {
    return `<code class="api-signature"><span class="api-signature-name">${renderIdentifier(signature)}</span></code>`;
  }
  return `<code class="api-signature"><span class="api-signature-name">${renderIdentifier(signature.slice(0, openingParen))}</span><span class="api-signature-parameters">${escapeHtml(signature.slice(openingParen))}</span></code>`;
}

// The article and the section index split a class the same way, so they read the
// same grouping: declaration order, using JSDoc sections and member overrides.
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
  const [overviewClass, ...otherClasses] = api.classes;
  if (!overviewClass)
    throw new Error("The generated API has no overview class.");
  const overviewId = `class-${slug(overviewClass.name)}`;
  const apiTypes = [...api.classes, ...api.objects];
  const objectNames = new Set(api.objects.map(({ name }) => name));
  const classNames = new Map([
    ...apiTypes.map(({ name }) => [name, `#class-${slug(name)}`]),
    ...api.functions.flatMap(({ name, accessPath }) => [
      [name, `#function-${slug(name)}`],
      [accessPath, `#function-${slug(name)}`],
    ]),
  ]);
  const memberAnchors = new Set(
    apiTypes.flatMap((item) =>
      item.members.map((member) => memberId(item.name, member)),
    ),
  );
  const byName = (left, right) =>
    left.name.localeCompare(right.name, "en", { sensitivity: "base" });
  const sortedClasses = [...otherClasses, ...api.objects].sort(byName);
  const sortedFunctions = [...api.functions].sort(byName);
  const apiIndex = [
    ...sortedClasses.map((item) => ({
      href: `#class-${slug(item.name)}`,
      name: item.name,
    })),
    ...(sortedFunctions.length
      ? [{ href: "#functions", name: "Functions" }]
      : []),
  ]
    .sort(byName)
    .map(
      (item) =>
        `<a class="api-nav-link" href="${item.href}" data-api-nav>${renderIdentifier(item.name)}</a>`,
    )
    .join("\n");
  const apiIndexList = `<a class="api-nav-link api-nav-link-featured" href="#${overviewId}" data-api-nav>Overview</a>${apiIndex}`;
  // Every member of a class comes from the file named beside the class heading,
  // so each row carries only its line number; the full path stays in the link's
  // title. Functions are gathered from across the tree and keep theirs.
  const classes = apiTypes
    .map((item) => {
      const categories = byCategory(item.members);
      const sectionIndex =
        categories.length > 1
          ? `<nav class="api-group-index" aria-label="${escapeHtml(item.name)} sections">${categories.map(([category, entries]) => `<a href="#${groupId(item.name, category)}">${escapeHtml(category)}<span>${entries.length}</span></a>`).join("")}</nav>`
          : "";
      const members = categories
        .map(([category, entries]) => {
          return `
            <section class="api-group api-group-${slug(category)}" id="${groupId(item.name, category)}">
              <h3><span>${escapeHtml(category)}</span><span class="api-group-count">${entries.length}</span></h3>
              <div class="api-group-entries">${entries
                .map((member) => {
                  // A synthesized instance description repeats the linked type.
                  // Keep actual property contracts visible, including objects
                  // whose semantics cannot be inferred from their type alone.
                  const hideDescription =
                    member.kind === "property" &&
                    /^An? \{@link [^}]+\} instance$/.test(member.description);
                  const description =
                    member.description && !hideDescription
                      ? `<div class="api-description-body">${renderDoc(member.description, classNames, memberAnchors, item.name)}</div>`
                      : "";
                  const details = renderEntryDetails(
                    member,
                    classNames,
                    memberAnchors,
                    item.name,
                  );
                  const displaySignature = member.signature.replace(/^::/, "");
                  const displayPropertyType = (
                    member.propertyType || ""
                  ).replace(/^Object<.+>$/, "Object");
                  const memberBadge =
                    member.kind === "property"
                      ? ""
                      : `<span class="api-badge api-badge-${slug(member.visibility)}">${escapeHtml(member.visibility)}</span>`;
                  const descriptionClass = description
                    ? " api-member-has-description"
                    : " api-member-compact";
                  const entryId = memberId(item.name, member);
                  const sourceUrl = `${item.repository}/blob/master/${item.sourcePath}#L${member.line}`;
                  const isOverviewProperty =
                    item === overviewClass && member.kind === "property";
                  // A plain documented type is an unambiguous destination.
                  // Object maps and undocumented types have no class page, so
                  // take readers to their declaration instead of a dead anchor.
                  const propertyTarget = isOverviewProperty
                    ? classNames.get(member.propertyType) || sourceUrl
                    : null;
                  const propertyTargetLabel = propertyTarget?.startsWith("#")
                    ? `Open ${member.name}: ${member.propertyType} API`
                    : `View ${member.name} source`;
                  const propertyName = renderSignature(
                    displaySignature,
                  ).replaceAll("<wbr>", "");
                  const linkedPropertyName = propertyTarget
                    ? `<a class="api-card-link" href="${escapeHtml(propertyTarget)}" aria-label="${escapeHtml(propertyTargetLabel)}" title="${escapeHtml(propertyTargetLabel)}">${propertyName}</a>`
                    : propertyName;
                  const propertyExternal =
                    propertyTarget && !propertyTarget.startsWith("#")
                      ? '<span class="api-card-external" aria-hidden="true">↗</span>'
                      : "";
                  const signature = `${renderSignature(displaySignature)}${member.propertyType ? `<span class="api-property-type">${renderType(displayPropertyType, classNames)}</span>` : ""}`;
                  const propertySignature = `<span class="api-property-signature"><span class="api-property-name">${linkedPropertyName}${member.propertyType ? '<span class="api-property-colon">:</span>' : ""}</span>${member.propertyType ? `<span class="api-property-type">${renderType(displayPropertyType, classNames, true)}</span>` : ""}${propertyExternal}</span>`;
                  const permalink = `<a class="api-anchor" href="#${entryId}" aria-label="Link to ${escapeHtml(member.signature)}">#</a>`;
                  const sourceMeta = `${member.async ? '<span class="api-badge api-badge-async">async</span>' : ""}${memberBadge}<a class="api-source" href="${sourceUrl}" title="${escapeHtml(item.source)}:${member.line}" aria-label="View source for ${escapeHtml(displaySignature)}, line ${member.line}">L${member.line}</a>`;
                  const meta = `${sourceMeta}${permalink}`;
                  const body = `${description}${details || (!member.description && !member.propertyType ? '<p class="api-empty">No description.</p>' : "")}`;
                  const attributes = `id="${entryId}" data-api-entry="${escapeHtml(`${item.name} ${member.name} ${member.signature} ${member.description}`.toLowerCase())}"`;
                  if (member.kind !== "property") {
                    return `
                    <article class="api-member api-member-${member.kind}${descriptionClass}" ${attributes} data-api-expandable>
                      <div class="api-member-heading">
                        <h4><button class="api-member-toggle" id="${entryId}-toggle" type="button" aria-expanded="false" aria-controls="${entryId}-panel"><span class="api-member-disclosure" aria-hidden="true"></span>${signature}</button></h4>
                        <div class="api-member-meta">${meta}</div>
                      </div>
                      <div class="api-member-panel" id="${entryId}-panel" aria-labelledby="${entryId}-toggle" hidden="until-found">${body}</div>
                    </article>`;
                  }
                  return `
                    <article class="api-member api-member-${member.kind}${descriptionClass}${propertyTarget ? " api-member-linked" : ""}" ${attributes}>
                      <div class="api-member-heading">
                        <h4>${propertyTarget ? "" : permalink}${propertySignature}</h4>
                        <div class="api-member-meta">${propertyTarget ? meta : sourceMeta}</div>
                      </div>
                      ${body}
                    </article>`;
                })
                .join("\n")}</div>
            </section>`;
        })
        .join("\n");
      return `
        <section class="api-class" id="class-${slug(item.name)}" data-api-entry="${escapeHtml(`${item.name} ${item.superClass ?? ""} ${item.description}`.toLowerCase())}">
          <header class="api-class-header"><p class="eyebrow">${escapeHtml(item.visibility)} API${objectNames.has(item.name) ? " &middot; Object" : ""}</p>
          <h2>${escapeHtml(item.name)}<a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}">${escapeHtml(item.source)}:${item.line}</a></h2>
          ${item.accessPath ? `<p class="api-access-path"><code>${escapeHtml(item.accessPath)}</code></p>` : ""}
          ${item.superClass && classNames.has(item.superClass) ? `<p class="api-extends">Extends <a href="#class-${slug(item.superClass)}"><code>${escapeHtml(item.superClass)}</code></a></p>` : ""}
          ${sectionIndex}
          ${renderClassDescription(item, classNames, memberAnchors)}</header>
          ${members || (item.description ? "" : '<p class="api-empty">No documented public members.</p>')}
        </section>`;
    })
    .join("\n");

  const functions = api.functions.length
    ? `<section class="api-class" id="functions" data-api-entry="functions utilities exports"><header class="api-class-header"><p class="eyebrow">Public API</p><h2>Functions</h2><div class="api-description-body api-class-description"><p>Public functions with their callable access paths.</p></div></header><section class="api-group"><h3><span>Functions</span><span class="api-group-count">${sortedFunctions.length}</span></h3><div class="api-group-entries api-function-entries">${sortedFunctions
        .map((item) => {
          const entryId = `function-${slug(item.name)}`;
          const description = item.description
            ? `<div class="api-description-body">${renderDoc(item.description, classNames, memberAnchors)}</div>`
            : "";
          const details = renderEntryDetails(item, classNames, memberAnchors);
          return `<article class="api-member${description ? " api-member-has-description" : " api-member-compact"}" id="${entryId}" data-api-entry="${escapeHtml(`${item.name} ${item.description}`.toLowerCase())}" data-api-expandable><div class="api-member-heading"><h4><button class="api-member-toggle" id="${entryId}-toggle" type="button" aria-expanded="false" aria-controls="${entryId}-panel"><span class="api-member-disclosure" aria-hidden="true"></span>${renderSignature(item.signature)}</button></h4><div class="api-member-meta"><span class="api-badge api-badge-${slug(item.visibility)}">${escapeHtml(item.visibility)}</span><a class="api-source" href="${item.repository}/blob/master/${item.sourcePath}#L${item.line}" aria-label="View source for ${escapeHtml(item.signature)}, line ${item.line}">${escapeHtml(item.source)}:${item.line}</a><a class="api-anchor" href="#${entryId}" aria-label="Link to ${escapeHtml(item.name)}">#</a></div></div><div class="api-member-panel" id="${entryId}-panel" aria-labelledby="${entryId}-toggle" hidden="until-found">${description}${details}</div></article>`;
        })
        .join("\n")}</div></section></section>`
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
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <script src="../script/site.js"></script>
    <script src="../script/api-initial-state.js"></script>
    <link rel="stylesheet" href="../styles.css" />
    <link rel="stylesheet" href="styles.css" />
    <script src="../script/api-search.js" defer></script>
  </head>
  <body>
    <a class="skip-link" href="#top">Skip to content</a>
    <header class="nav">
      <a class="brand" href="../index.html" aria-label="Lumine home"><img src="../assets/lumine.svg" alt="" width="34" height="34" /><span>Lumine</span></a>
      <nav class="nav-links" aria-label="Primary navigation"><a href="../docs.html">Docs</a><a href="./" aria-current="page">API</a><a href="../gallery.html">Gallery</a><a class="nav-github" href="https://github.com/lumine-code/lumine" aria-label="GitHub"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg><span>GitHub</span></a><button class="theme-toggle" type="button" data-theme-toggle aria-label="Color theme: System. Switch to Light." title="Color theme: System. Switch to Light.">System</button></nav>
      <div class="page-loading-bar api-loading-bar" aria-hidden="true"></div>
    </header>
    <main class="api-main" id="top" tabindex="-1">
      <header class="api-header"><p class="eyebrow">03 / Reference</p><h1>Lumine API reference</h1><p>Explore the classes and methods you can use to extend Lumine.</p><p class="api-meta">Version ${escapeHtml(api.version)} &middot; ${api.classes.length} classes &middot; ${api.objects.length} objects &middot; ${api.memberCount} documented members</p></header>
      <div class="api-layout"><aside class="api-sidebar" data-api-sidebar>
        <form class="api-search" role="search"><label class="api-rail-heading" for="api-search-input">Find an API</label><div class="api-search-field"><input id="api-search-input" data-api-search type="search" placeholder="Class or method name" autocomplete="off" spellcheck="false" aria-controls="api-search-results" /><button type="button" aria-label="Clear API search" hidden>&times;</button></div></form>
        <p class="api-search-status" data-api-search-status role="status" hidden></p><nav class="api-search-results" id="api-search-results" data-api-search-results aria-label="API search results" hidden></nav>
        <details class="api-tree" open><summary class="api-rail-heading">Browse API</summary><nav class="api-tree-scroll" aria-label="API index">${apiIndexList}</nav></details></aside><article class="api-content">${classes}${functions}</article></div>
    </main>
    <div class="api-toast" data-api-toast role="status" aria-live="polite">Link copied</div>
    <footer class="footer"><a class="footer-brand" href="../index.html"><img src="../assets/lumine.svg" alt="" width="28" height="28" /><span>Lumine</span></a><nav class="footer-links" aria-label="Footer navigation"><a href="../docs.html">Docs</a><a href="./">API</a><a href="https://github.com/lumine-code/lumine">GitHub</a><a href="https://github.com/lumine-code/lumine/issues">Issues</a><a href="https://github.com/lumine-code/lumine/discussions">Discussions</a><a href="https://github.com/lumine-code/lumine/releases">Releases</a></nav><p class="footer-legal">MIT licensed &middot; &copy; 2026 lumine-code</p></footer>
    <script>
      const navLinks = [...document.querySelectorAll('[data-api-nav]')];
      const expandableMembers = [...document.querySelectorAll('[data-api-expandable]')];
      const navigationTrees = [...document.querySelectorAll('details.api-tree')];
      const sections = [...document.querySelectorAll('.api-class')];
      const toast = document.querySelector('[data-api-toast]');
      const sectionIds = new Set(sections.map(section => section.id));
      const compactNavigation = matchMedia('(max-width: 900px)');
      let toastTimer;

      const syncNavigationMode = () => {
        for (const tree of navigationTrees) {
          tree.open = !compactNavigation.matches;
          tree.querySelector('summary').tabIndex = compactNavigation.matches ? 0 : -1;
        }
      };
      compactNavigation.addEventListener('change', syncNavigationMode);
      syncNavigationMode();

      // The class selected by the hash: a class id, or the parent class of a
      // member id. Falls back to the global environment overview.
      const currentKey = () => {
        const hash = location.hash.slice(1);
        if (sectionIds.has(hash)) return hash;
        const el = hash && document.getElementById(hash);
        const parent = el && el.closest('.api-class');
        return parent ? parent.id : '${overviewId}';
      };

      const setMemberExpanded = (member, expanded) => {
        const toggle = member.querySelector('.api-member-toggle');
        const panel = member.querySelector('.api-member-panel');
        member.classList.toggle('is-expanded', expanded);
        toggle.setAttribute('aria-expanded', String(expanded));
        if (expanded) panel.removeAttribute('hidden');
        else panel.setAttribute('hidden', 'until-found');
      };

      for (const member of expandableMembers) {
        const toggle = member.querySelector('.api-member-toggle');
        const panel = member.querySelector('.api-member-panel');
        toggle.addEventListener('click', () => {
          setMemberExpanded(member, toggle.getAttribute('aria-expanded') !== 'true');
        });
        panel.addEventListener('beforematch', () => setMemberExpanded(member, true));
      }

      // Split-pane router: show one class at a time, driven by the hash.
      const showClass = (focusTarget = false) => {
        const key = currentKey();
        for (const section of sections) section.hidden = section.id !== key;
        const hash = location.hash.slice(1);
        const navigationTarget = hash.startsWith('function-') ? 'functions' : key;
        for (const link of navLinks) {
          const on = link.hash.slice(1) === navigationTarget;
          link.classList.toggle('active', on);
          if (on) link.setAttribute('aria-current', 'page');
          else link.removeAttribute('aria-current');
        }
        const target = hash ? document.getElementById(hash) : null;
        const classDescription = target?.closest('details[data-api-class-description]');
        if (classDescription) classDescription.open = true;
        const targetMember = target?.matches('[data-api-expandable]') ? target : null;
        if (targetMember) setMemberExpanded(targetMember, true);
        if (focusTarget) {
          const focus = targetMember?.querySelector('.api-member-toggle') || target?.querySelector('h2') || target;
          if (focus) {
            if (!focus.matches('a, button, input')) focus.tabIndex = -1;
            focus.focus({ preventScroll: true });
          }
        }
        // Releasing the initial CSS gate, layout and scrolling stay in one JS
        // task, so no intermediate class or restored scroll position is painted.
        document.documentElement.removeAttribute('data-api-initializing');
        if (target && !sectionIds.has(hash)) {
          target.scrollIntoView({ behavior: 'auto' });
        } else {
          window.scrollTo(0, 0);
        }
      };

      // Compact navigation closes after a choice. A # anchor copies its deep
      // link as well as navigating to it.
      document.addEventListener('click', (event) => {
        const memberHeading = event.target.closest('[data-api-expandable] .api-member-heading');
        if (memberHeading && !event.target.closest('a, button')) {
          memberHeading.querySelector('.api-member-toggle').click();
          return;
        }
        const navigationLink = event.target.closest('[data-api-sidebar] a');
        if (navigationLink && compactNavigation.matches) {
          navigationLink.closest('details')?.removeAttribute('open');
        }
        const anchor = event.target.closest('.api-anchor');
        if ((navigationLink || anchor)?.hash === location.hash) {
          requestAnimationFrame(() => showClass(true));
        }
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

      window.addEventListener('hashchange', () => showClass(true));
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
const summary = `${api.classes.length} classes, ${api.objects.length} objects and ${api.memberCount} documented members`;

// Timestamps differ on every run and checkout line endings depend on Git's
// platform settings. Everything else — the version, the members,
// the source line each one links to — is a real difference worth failing on:
// a moved line number is a reference link that now points at the wrong code.
function normalizeGeneratedOutput(contents, file) {
  contents = contents.replace(/\r\n/g, "\n");
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
      normalizeGeneratedOutput(before, file) !==
      normalizeGeneratedOutput(contents, file)
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
