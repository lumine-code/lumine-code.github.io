"use strict";

(() => {
  const catalog = window.LumineCatalog;
  const get = (name) => document.getElementById(`packages-${name}`);
  const query = get("search"),
    category = get("category"),
    distribution = get("distribution");
  const grid = get("grid"),
    status = get("status"),
    more = get("more"),
    retry = get("retry");
  let entries = [],
    filtered = [],
    visible = 0,
    loaded = false;
  const params = new URLSearchParams(location.search);
  query.value = params.get("q") || "";
  for (const [control, key] of [
    [category, "category"],
    [distribution, "distribution"],
  ]) {
    const value = params.get(key);
    if ([...control.options].some((option) => option.value === value))
      control.value = value;
  }
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  function append() {
    const end = Math.min(visible + 24, filtered.length);
    const fragment = document.createDocumentFragment();
    for (const item of filtered.slice(visible, end)) {
      const card = make("article", "gallery-card package-card");
      const heading = make("h2", "");
      const link = make("a", "", item.name);
      link.href = `#package=${encodeURIComponent(item.source)}`;
      heading.append(link);
      const meta = make("p", "package-meta");
      meta.append(
        make(
          "span",
          "",
          { packages: "Package", grammars: "Grammar", themes: "Theme" }[
            item.category
          ],
        ),
      );
      if (item.version) meta.append(make("span", "", `v${item.version}`));
      if (item.distribution)
        meta.append(
          make(
            "span",
            "",
            item.distribution === "bundled"
              ? "Bundled with Lumine"
              : "optional",
          ),
        );
      if (item.featured && !query.value.trim())
        meta.append(make("span", "", "Featured"));
      const actions = make("div", "package-actions");
      const install = make("a", "package-install", "Install");
      install.href = catalog.installURI(item);
      install.setAttribute("aria-label", `Install ${item.name} in Lumine`);
      install.title = "Open installation in Lumine";
      const repository = make("a", "", "Repository ↗");
      repository.href = item.repository;
      actions.append(install, repository);
      card.append(
        meta,
        heading,
        make("p", "package-description", item.description),
        actions,
      );
      fragment.append(card);
    }
    grid.append(fragment);
    visible = end;
    more.hidden = visible >= filtered.length;
    status.textContent = filtered.length
      ? `${visible} of ${filtered.length} packages${query.value.trim() ? ` matching “${query.value.trim()}”` : ""}`
      : "No packages match. Try a different search or clear the filters.";
  }
  function render() {
    const next = new URLSearchParams();
    if (query.value.trim()) next.set("q", query.value.trim());
    if (category.value !== "all") next.set("category", category.value);
    if (distribution.value !== "all")
      next.set("distribution", distribution.value);
    history.replaceState(
      null,
      "",
      location.pathname + (next.size ? `?${next}` : "") + location.hash,
    );
    if (!loaded) return;
    filtered = catalog.filter(
      entries,
      query.value,
      category.value,
      distribution.disabled ? "all" : distribution.value,
    );
    visible = 0;
    grid.replaceChildren();
    append();
  }
  async function fetchJSON(url) {
    const response = await fetch(url, {
      cache: "no-cache",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
  async function load() {
    retry.hidden = true;
    status.textContent = "Loading the latest catalog…";
    get("notice").hidden = true;
    const [result, editor] = await Promise.allSettled([
      fetchJSON(
        "https://raw.githubusercontent.com/lumine-code/packages/master/index.json",
      ),
      fetchJSON(
        "https://raw.githubusercontent.com/lumine-code/lumine/master/package.json",
      ).then(catalog.bundledOrigins),
    ]);
    try {
      if (result.status !== "fulfilled") throw result.reason;
      entries = catalog.normalize(result.value);
      if (!entries.length) throw new Error("Empty catalog");
      if (editor.status === "fulfilled") {
        entries.forEach((item) => {
          item.distribution = editor.value.has(item.repository)
            ? "bundled"
            : "optional";
        });
        distribution.disabled = false;
      } else {
        distribution.disabled = true;
        get("notice").textContent =
          "The catalog is available, but bundled package information could not be loaded.";
        get("notice").hidden = false;
      }
      loaded = true;
      get("total").textContent =
        `${entries.length} packages · Live from GitHub`;
      render();
      window.LuminePackageDetails.initialize(entries);
    } catch {
      loaded = false;
      get("list").hidden = false;
      document.getElementById("package-details").hidden = true;
      status.textContent =
        "The catalog could not be loaded. Try again, or follow the catalog link above to GitHub.";
      retry.hidden = false;
    }
  }
  query.addEventListener("input", render);
  category.addEventListener("change", render);
  distribution.addEventListener("change", render);
  get("clear").addEventListener("click", () => {
    query.value = "";
    category.value = distribution.value = "all";
    render();
    query.focus();
  });
  more.addEventListener("click", append);
  retry.addEventListener("click", load);
  load();
})();
