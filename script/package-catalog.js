"use strict";

// Shared by the browser and the catalog behavior tests. No per-package requests.
((root) => {
  function sourceInfo(source) {
    if (
      typeof source !== "string" ||
      !/^[a-zA-Z0-9]/.test(source) ||
      !/^[a-zA-Z0-9._~:/#@+-]+$/.test(source)
    )
      return null;
    const shorthand = source.match(/^([\w.-]+\/[\w.-]+)(?:[@#~].+)?$/);
    if (!shorthand && !source.startsWith("https://")) return null;
    let url;
    try {
      url = new URL(shorthand ? `https://github.com/${shorthand[1]}` : source);
    } catch {
      return null;
    }
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !url.hostname.includes(".")
    )
      return null;
    const parts = url.pathname
      .replace(/\.git$/, "")
      .split("/")
      .filter(Boolean);
    if (parts.length < 2 || parts.some((p) => p === "." || p === ".."))
      return null;
    url.hash = "";
    url.pathname = `/${parts.join("/")}`;
    return { source, repository: url.href, name: parts.at(-1) };
  }
  function normalize(catalog) {
    if (!Array.isArray(catalog))
      throw new Error("The catalog is not an array.");
    const seen = new Set();
    return catalog.flatMap((entry) => {
      const info = sourceInfo(
        typeof entry === "string" ? entry : entry?.source,
      );
      if (!info || seen.has(info.repository)) return [];
      if (
        [
          "https://github.com/lumine-code/bacadra-tools",
          "https://github.com/lumine-code/banager-tools",
        ].includes(info.repository)
      )
        return [];
      seen.add(info.repository);
      const metadata = entry?.metadata || {};
      if (metadata.engines && !metadata.engines.lumine) return [];
      const name =
        typeof metadata.name === "string" ? metadata.name : info.name;
      const keywords = Array.isArray(metadata.keywords)
        ? metadata.keywords.filter((k) => typeof k === "string")
        : [];
      return [
        {
          ...info,
          name,
          description:
            typeof metadata.description === "string"
              ? metadata.description
              : "See the repository for package details.",
          version: typeof metadata.version === "string" ? metadata.version : "",
          keywords,
          license: typeof metadata.license === "string" ? metadata.license : "",
          engine:
            typeof metadata.engines?.lumine === "string"
              ? metadata.engines.lumine
              : "",
          refs: entry?.refs || {},
          selectedRef: entry?.selectedRef || null,
          resolvedSha: entry?.resolvedSha || "",
          featured: entry?.featured === true,
          category: name.startsWith("language-")
            ? "grammars"
            : Array.isArray(metadata.themes) && metadata.themes.length
              ? "themes"
              : "packages",
        },
      ];
    });
  }
  function bundledOrigins(manifest) {
    if (
      !manifest ||
      typeof manifest.dependencies !== "object" ||
      !manifest.dependencies
    )
      throw new Error("Missing editor dependencies.");
    return new Set(
      Object.values(manifest.dependencies).flatMap((value) => {
        if (typeof value !== "string" || !value.startsWith("github:"))
          return [];
        const info = sourceInfo(value.slice(7));
        return info ? [info.repository] : [];
      }),
    );
  }
  function filter(entries, query = "", category = "all", distribution = "all") {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return entries
      .filter(
        (item) =>
          (category === "all" || item.category === category) &&
          (distribution === "all" || item.distribution === distribution) &&
          terms.every((term) =>
            `${item.name} ${item.description} ${item.keywords.join(" ")}`
              .toLowerCase()
              .includes(term),
          ),
      )
      .sort((a, b) => {
        if (!terms.length && a.featured !== b.featured)
          return Number(b.featured) - Number(a.featured);
        const score = (item) =>
          item.name.toLowerCase() === query.trim().toLowerCase()
            ? 2
            : item.name.toLowerCase().startsWith(query.trim().toLowerCase())
              ? 1
              : 0;
        return score(b) - score(a) || a.name.localeCompare(b.name);
      });
  }
  function installURI(item) {
    if (!sourceInfo(item.source)) throw new Error("Invalid package source.");
    return `lumine://settings-view/install?source=${encodeURIComponent(item.source)}`;
  }
  function versions(item) {
    const refs = [];
    const add = (id, label, type, value, sha) => {
      if (!value || refs.some((ref) => ref.id === id)) return;
      refs.push({
        id,
        label,
        source: `${item.repository}.git#${type}:${value}`,
        revision:
          type === "tag" && /^[a-f0-9]{40}$/i.test(sha || "") ? sha : value,
      });
    };
    if (typeof item.refs.defaultBranch === "string")
      add(
        "branch:" + item.refs.defaultBranch,
        item.refs.defaultBranch + " (branch)",
        "branch",
        item.refs.defaultBranch,
        item.refs.headSha,
      );
    for (const tag of Array.isArray(item.refs.tags) ? item.refs.tags : []) {
      if (typeof tag?.name === "string")
        add("tag:" + tag.name, tag.name, "tag", tag.name, tag.sha);
    }
    const selected = item.selectedRef;
    let defaultId =
      selected?.type === "latest" && item.refs.latestStable?.name
        ? "tag:" + item.refs.latestStable.name
        : selected?.type === "tag"
          ? "tag:" + selected.value
          : selected?.type === "branch"
            ? "branch:" + selected.value
            : "branch:" + item.refs.defaultBranch;
    if (
      !refs.some((ref) => ref.id === defaultId) ||
      !["default", "latest", "tag", "branch"].includes(selected?.type)
    ) {
      defaultId = "catalog";
      refs.unshift({
        id: defaultId,
        label: selected?.value || "Catalog version",
        source: item.source,
        revision: /^[a-f0-9]{40}$/i.test(item.resolvedSha)
          ? item.resolvedSha
          : "HEAD",
      });
    }
    return { refs, defaultId };
  }
  const api = {
    sourceInfo,
    normalize,
    bundledOrigins,
    filter,
    installURI,
    versions,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LumineCatalog = api;
})(globalThis);
