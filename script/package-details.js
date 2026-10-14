"use strict";

(() => {
  const catalog = window.LumineCatalog;
  const detail = document.getElementById("package-details");
  const list = document.getElementById("packages-list");
  const markdown = window.markdownit({ html: true, linkify: true });
  let entries = [],
    controller,
    generation = 0,
    listScroll = 0,
    selectedSource = "";
  const cache = new Map();
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  function renderReadme(text, item, ref, container) {
    const fragment = window.DOMPurify.sanitize(markdown.render(text), {
      USE_PROFILES: { html: true },
      RETURN_DOM_FRAGMENT: true,
      FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select"],
      FORBID_ATTR: ["style", "srcset"],
      SANITIZE_NAMED_PROPS: true,
    });
    const root = `${item.repository}/blob/${encodeURIComponent(ref.revision)}/`;
    const raw = root
      .replace("https://github.com/", "https://raw.githubusercontent.com/")
      .replace("/blob/", "/");
    const slugs = new Map();
    fragment.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((heading) => {
      const slug = heading.textContent
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{N}\s_-]/gu, "")
        .replace(/\s/g, "-");
      const count = slugs.get(slug) || 0;
      slugs.set(slug, count + 1);
      heading.id = `package-readme-${slug}${count ? `-${count}` : ""}`;
    });
    fragment.querySelectorAll("a[href]").forEach((link) => {
      const href = link.getAttribute("href");
      if (href.startsWith("#")) {
        link.addEventListener("click", (event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
            return;
          event.preventDefault();
          let id;
          try {
            id = decodeURIComponent(href.slice(1));
          } catch {
            return;
          }
          document.getElementById(`package-readme-${id}`)?.scrollIntoView();
        });
        link.href = root + "README.md" + href;
      } else {
        const url = new URL(href, root);
        if (["https:", "http:", "mailto:"].includes(url.protocol))
          link.href = url.href;
        else link.removeAttribute("href");
      }
    });
    fragment.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src");
      if (!src) return;
      const url = new URL(src, raw);
      if (url.protocol !== "https:") {
        img.remove();
        return;
      }
      img.src = url.href;
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.replaceWith(
          make("span", "package-image-missing", img.alt || "Image unavailable"),
        );
      });
    });
    container.replaceChildren(fragment);
  }
  async function readRevision(item, ref, signal) {
    const repo = new URL(item.repository);
    if (repo.hostname !== "github.com")
      throw new Error("Read this package on its repository.");
    const root = `https://raw.githubusercontent.com${repo.pathname}/${encodeURIComponent(ref.revision)}/`;
    const key = root;
    if (cache.has(key)) return cache.get(key);
    async function read(file) {
      const response = await fetch(root + file, { signal, cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    }
    const [readme, manifest] = await Promise.allSettled([
      read("README.md"),
      read("package.json").then(JSON.parse),
    ]);
    if (signal.aborted) throw new Error("Cancelled");
    const result = { readme, manifest };
    if (readme.status === "fulfilled" && manifest.status === "fulfilled")
      cache.set(key, result);
    return result;
  }
  async function route() {
    const current = ++generation;
    controller?.abort();
    const params = new URLSearchParams(location.hash.slice(1));
    const source = params.get("package");
    if (!source) {
      detail.hidden = true;
      list.hidden = false;
      document.title = "Packages — Lumine";
      if (selectedSource) {
        window.scrollTo(0, listScroll);
        const link = [...list.querySelectorAll("h2 a")].find(
          (link) =>
            link.hash === `#package=${encodeURIComponent(selectedSource)}`,
        );
        link?.focus({ preventScroll: true });
      }
      selectedSource = "";
      return;
    }
    if (!selectedSource) listScroll = window.scrollY;
    const opening = selectedSource !== source;
    selectedSource = source;
    list.hidden = true;
    detail.hidden = false;
    const back = make("a", "package-back", "← All packages");
    back.href = location.pathname + location.search;
    back.addEventListener("click", (event) => {
      if (
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      location.hash = "";
    });
    const origin = catalog.sourceInfo(source)?.repository;
    const item = entries.find(
      (entry) =>
        entry.source === source || (origin && entry.repository === origin),
    );
    if (!item) {
      detail.replaceChildren(
        back,
        make(
          "p",
          "gallery-status",
          "This package is not in the current catalog.",
        ),
      );
      return;
    }
    document.title = `${item.name} — Lumine Packages`;
    const { refs, defaultId } = catalog.versions(item);
    const ref =
      refs.find((ref) => ref.id === params.get("ref")) ||
      refs.find((ref) => ref.id === defaultId);
    const header = make("header", "package-detail-header");
    const title = make("h1", "", item.name);
    title.id = "package-title";
    title.tabIndex = -1;
    const description = make(
      "p",
      "package-detail-description",
      item.description,
    );
    const controls = make("div", "package-detail-controls");
    const label = make("label", "", "Version");
    const select = make("select", "");
    select.id = "package-version";
    label.htmlFor = select.id;
    refs.forEach((ref) => {
      const option = make("option", "", ref.label);
      option.value = ref.id;
      select.append(option);
    });
    select.value = ref.id;
    select.addEventListener("change", () => {
      const hash = new URLSearchParams({
        package: item.source,
        ref: select.value,
      });
      location.hash = hash.toString();
    });
    label.append(select);
    const actions = make("div", "package-actions");
    const install = make("a", "package-install", "Install");
    install.href = catalog.installURI({ source: ref.source });
    install.title = "Open this version in Lumine";
    const repository = make("a", "", "Repository ↗");
    repository.href = item.repository;
    actions.append(install, repository);
    controls.append(label, actions);
    header.append(title, description, controls);
    const layout = make("div", "package-detail-layout");
    const article = make("article", "prose package-readme");
    article.setAttribute("aria-label", "Package README");
    article.setAttribute("aria-busy", "true");
    article.append(make("p", "", "Loading this version’s README…"));
    const aside = make("aside", "package-facts");
    const facts = make("dl", "");
    const updateFacts = (metadata) => {
      facts.replaceChildren();
      for (const [name, value] of [
        ["Version", metadata.version],
        ["License", metadata.license],
        ["Lumine", metadata.engines?.lumine],
        [
          "Distribution",
          item.distribution === "bundled"
            ? "Bundled with Lumine"
            : item.distribution === "optional"
              ? "Optional"
              : "",
        ],
        ["Source", ref.label],
      ]) {
        if (typeof value === "string" && value)
          facts.append(make("dt", "", name), make("dd", "", value));
      }
    };
    // Version-specific facts appear only after reading that revision's manifest.
    updateFacts({});
    aside.append(make("h2", "", "Package details"), facts);
    if (item.keywords.length)
      aside.append(
        make("h2", "", "Keywords"),
        make("p", "", item.keywords.join(" · ")),
      );
    const readmeLink = make("a", "", "Read on GitHub ↗");
    readmeLink.href = `${item.repository}/blob/${encodeURIComponent(ref.revision)}/README.md`;
    aside.append(readmeLink);
    layout.append(article, aside);
    detail.replaceChildren(back, header, layout);
    if (opening) {
      window.scrollTo(0, 0);
      title.focus({ preventScroll: true });
    } else select.focus({ preventScroll: true });
    const request = (controller = new AbortController());
    const timeout = setTimeout(() => request.abort(), 15000);
    try {
      const result = await readRevision(item, ref, request.signal);
      if (current !== generation) return;
      if (result.manifest.status === "fulfilled") {
        updateFacts(result.manifest.value);
        if (typeof result.manifest.value.description === "string")
          description.textContent = result.manifest.value.description;
      }
      if (result.readme.status === "fulfilled")
        renderReadme(result.readme.value, item, ref, article);
      else throw new Error("README unavailable");
    } catch {
      if (current !== generation) return;
      article.replaceChildren(
        make(
          "p",
          "",
          "This README could not be loaded. Open the selected version in the repository, or try another version.",
        ),
      );
    } finally {
      clearTimeout(timeout);
      if (current === generation) article.setAttribute("aria-busy", "false");
    }
  }
  window.addEventListener("hashchange", () => {
    if (entries.length) route();
  });
  window.LuminePackageDetails = {
    initialize(items) {
      entries = items;
      route();
    },
  };
  if (new URLSearchParams(location.hash.slice(1)).has("package")) {
    list.hidden = true;
    detail.hidden = false;
    detail.append(make("p", "gallery-status", "Loading package…"));
  }
})();
