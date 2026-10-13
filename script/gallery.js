"use strict";

(() => {
  const grid = document.querySelector("#gallery-grid");
  const status = document.querySelector("#gallery-status");
  const query = document.querySelector("#gallery-search");
  const category = document.querySelector("#gallery-category");
  const more = document.querySelector("#gallery-more");
  const dialog = document.querySelector("#gallery-viewer");
  const viewerImage = dialog.querySelector("img");
  const viewerTitle = dialog.querySelector("h2");
  const viewerBadge = dialog.querySelector(".gallery-optional");
  const viewerCaption = dialog.querySelector("p");
  const viewerSource = dialog.querySelector(".gallery-source");
  const previous = dialog.querySelector("[data-previous]");
  const next = dialog.querySelector("[data-next]");
  let entries = [],
    filtered = [],
    visible = 0,
    active = 0,
    opener;
  const pageSize = 18;
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  function preview(index) {
    active = index;
    const item = filtered[index];
    viewerTitle.textContent = item.repo;
    viewerBadge.hidden = item.distribution !== "optional";
    viewerCaption.textContent = item.caption;
    viewerImage.alt = item.caption;
    viewerImage.width = item.width;
    viewerImage.height = item.height;
    viewerImage.src = item.src;
    viewerSource.href = item.source;
    previous.disabled = index === 0;
    next.disabled = index === filtered.length - 1;
    dialog.querySelector(".gallery-position").textContent =
      `${index + 1} / ${filtered.length}`;
    if (!dialog.open) dialog.showModal();
  }
  function append() {
    const end = Math.min(visible + pageSize, filtered.length);
    const fragment = document.createDocumentFragment();
    for (let index = visible; index < end; index++) {
      const item = filtered[index];
      const card = make("article", "gallery-card");
      const button = make("button", "gallery-preview");
      button.type = "button";
      button.setAttribute(
        "aria-label",
        `Enlarge ${item.repo}: ${item.caption}`,
      );
      const img = make("img", "");
      Object.assign(img, {
        src: item.src,
        alt: item.caption,
        width: item.width,
        height: item.height,
        loading: "lazy",
        decoding: "async",
      });
      img.addEventListener("error", () => {
        button.classList.add("image-unavailable");
        button.setAttribute(
          "aria-label",
          `${item.repo}: preview unavailable. Open the repository below.`,
        );
        button.disabled = true;
      });
      const imageFrame = make("span", "gallery-image");
      imageFrame.append(img);
      button.append(imageFrame);
      button.addEventListener("click", () => {
        opener = button;
        preview(index);
      });
      const details = make("div", "gallery-card-details");
      const heading = make("h2", "");
      const link = make("a", "", item.repo);
      link.href = item.repository;
      heading.append(link);
      const headingRow = make("div", "gallery-card-heading");
      headingRow.append(heading);
      if (item.distribution === "optional") {
        const badge = make("span", "gallery-optional", "optional");
        badge.title = "Installed separately";
        headingRow.append(badge);
      }
      details.append(headingRow, make("p", "", item.caption));
      card.append(button, details);
      fragment.append(card);
    }
    grid.append(fragment);
    visible = end;
    more.hidden = visible >= filtered.length;
    status.textContent = filtered.length
      ? `${visible} of ${filtered.length} screenshots`
      : "No screenshots match. Try a different search or category.";
  }
  function filter() {
    const terms = query.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    filtered = entries.filter(
      (item) =>
        (category.value === "all" || item.category === category.value) &&
        terms.every((term) =>
          `${item.repo} ${item.description} ${item.caption}`
            .toLowerCase()
            .includes(term),
        ),
    );
    visible = 0;
    grid.replaceChildren();
    append();
    const params = new URLSearchParams();
    if (query.value.trim()) params.set("q", query.value.trim());
    if (category.value !== "all") params.set("category", category.value);
    history.replaceState(
      null,
      "",
      location.pathname + (params.size ? `?${params}` : ""),
    );
  }
  const params = new URLSearchParams(location.search);
  query.value = params.get("q") || "";
  if (
    [...category.options].some(
      (option) => option.value === params.get("category"),
    )
  )
    category.value = params.get("category");
  query.addEventListener("input", filter);
  category.addEventListener("change", filter);
  document.querySelector("#gallery-clear").addEventListener("click", () => {
    query.value = "";
    category.value = "all";
    filter();
    query.focus();
  });
  more.addEventListener("click", () => {
    const first = visible;
    append();
    grid.children[first]
      ?.querySelector("button")
      .focus({ preventScroll: true });
  });
  previous.addEventListener("click", () => preview(active - 1));
  next.addEventListener("click", () => preview(active + 1));
  dialog
    .querySelector("[data-close]")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () =>
    opener?.focus({ preventScroll: true }),
  );
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" && active > 0) {
      event.preventDefault();
      preview(active - 1);
    }
    if (event.key === "ArrowRight" && active < filtered.length - 1) {
      event.preventDefault();
      preview(active + 1);
    }
  });
  fetch("gallery.json")
    .then((response) => {
      if (!response.ok) throw new Error("Unable to load gallery");
      return response.json();
    })
    .then((data) => {
      entries = data.entries;
      filter();
      document.querySelector("#gallery-total").textContent =
        `${entries.length} screenshots · ${new Set(entries.map((item) => item.repo)).size} repositories`;
    })
    .catch(() => {
      status.textContent =
        "The gallery could not load. Reload this page to try again, or explore the repositories on GitHub.";
      more.hidden = true;
    });
})();
