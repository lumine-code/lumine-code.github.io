(function (factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else factory().attach(document);
})(function () {
  "use strict";

  function normalize(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function search(entries, query, limit = 40) {
    const normalized = normalize(query);
    if (!normalized) return { total: 0, results: [] };
    const words = normalized.split(/\s+/);
    const matches = [];
    for (const entry of entries) {
      const name = normalize(entry.name);
      const qualified = normalize(entry.owner + " " + entry.name);
      let score = 0;
      if (name === normalized) score = 100;
      else if (qualified === normalized) score = 90;
      else if (name.startsWith(normalized)) score = 80;
      else if (name.includes(normalized)) score = 60;
      else if (words.every((word) => qualified.includes(word))) score = 40;
      else if (words.every((word) => entry.text.includes(word))) score = 10;
      if (score) matches.push({ entry, score });
    }
    matches.sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.owner.localeCompare(b.entry.owner) ||
        a.entry.name.localeCompare(b.entry.name),
    );
    return {
      total: matches.length,
      results: matches.slice(0, limit).map(({ entry }) => entry),
    };
  }

  function attach(document) {
    const input = document.querySelector("[data-api-search]");
    if (!input) return;
    const form = input.closest("form");
    const clear = form.querySelector("button");
    const status = document.querySelector("[data-api-search-status]");
    const results = document.querySelector("[data-api-search-results]");
    const tree = document.querySelector("details.api-tree");
    const entries = [];
    for (const section of document.querySelectorAll(".api-class")) {
      const owner = section.querySelector("h2").firstChild.textContent.trim();
      entries.push({
        id: section.id,
        name: owner,
        label: owner,
        owner: "",
        text: section.dataset.apiEntry,
      });
      for (const member of section.querySelectorAll(".api-member")) {
        const signature = member.querySelector(".api-signature");
        const label = signature.textContent.trim();
        entries.push({
          id: member.id,
          name: label.replace(/\(.*$/s, "").replace(/^new\s+/, ""),
          label,
          owner,
          text: member.dataset.apiEntry,
        });
      }
    }

    function render() {
      const query = input.value.trim();
      results.replaceChildren();
      clear.hidden = !query;
      tree.hidden = !!query;
      results.hidden = !query;
      status.hidden = !query;
      if (!query) return;
      const found = search(entries, query);
      status.textContent =
        found.total === 0
          ? "No matches. Try a class or method name."
          : found.total > found.results.length
            ? `Showing ${found.results.length} of ${found.total} matches. Refine your search to see more.`
            : `${found.total} ${found.total === 1 ? "match" : "matches"}`;
      for (const entry of found.results) {
        const link = document.createElement("a");
        link.href = "#" + entry.id;
        link.className = "api-search-result";
        link.title = entry.owner
          ? entry.owner + ": " + entry.label
          : entry.label;
        const name = document.createElement("span");
        name.className = "api-search-name";
        name.textContent = entry.label.includes("(")
          ? entry.label.slice(0, entry.label.indexOf("(")) + "()"
          : entry.label;
        const owner = document.createElement("span");
        owner.className = "api-search-owner";
        owner.textContent = entry.owner || "Class or object";
        link.append(name, owner);
        results.appendChild(link);
      }
    }

    function reset(focus) {
      input.value = "";
      render();
      revealCurrentLink();
      if (focus) input.focus();
    }
    function revealCurrentLink() {
      if (!tree.open || tree.hidden) return;
      const sidebar = tree.closest("[data-api-sidebar]");
      const active = tree.querySelector('[aria-current="page"]');
      if (active && sidebar.scrollHeight > sidebar.clientHeight) {
        sidebar.scrollTop = Math.max(
          0,
          active.offsetTop - form.offsetHeight - 16,
        );
      }
    }
    document.defaultView.addEventListener("hashchange", () =>
      setTimeout(revealCurrentLink, 0),
    );
    revealCurrentLink();
    input.addEventListener("input", render);
    clear.addEventListener("click", () => reset(true));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      results.querySelector("a")?.click();
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && input.value) {
        event.preventDefault();
        reset(true);
      } else if (event.key === "ArrowDown") {
        const first = results.querySelector("a");
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }
    });
    results.addEventListener("keydown", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      if (event.key === "Escape") {
        event.preventDefault();
        reset(true);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const next =
          event.key === "ArrowDown"
            ? link.nextElementSibling
            : link.previousElementSibling;
        (next || (event.key === "ArrowUp" ? input : link)).focus();
      }
    });
    // The native anchor and the existing API router own navigation. Clear the
    // search on the next task so the router can still identify the clicked link.
    results.addEventListener("click", (event) => {
      if (
        !event.target.closest("a") ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      setTimeout(() => reset(false), 0);
    });
  }

  return { search, attach };
});
