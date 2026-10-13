"use strict";

// Run in the head so the saved palette is applied before the page is painted.
(() => {
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = "system";
  try {
    const savedTheme = window.localStorage.getItem("lumine-theme");
    if (savedTheme === "light" || savedTheme === "dark")
      preference = savedTheme;
  } catch {
    // Private or restricted browsing still gets a working theme selector.
  }

  const updateControls = () => {
    document.querySelectorAll("[data-theme-select]").forEach((select) => {
      select.value = preference;
    });
  };
  const applyTheme = () => {
    root.dataset.theme =
      preference === "system"
        ? systemTheme.matches
          ? "dark"
          : "light"
        : preference;
    updateControls();
  };
  applyTheme();
  document.addEventListener("DOMContentLoaded", updateControls);
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.target.closest?.(".skip-link")) {
      event.preventDefault();
      document.querySelector("main")?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  });
  document.addEventListener("change", (event) => {
    if (event.defaultPrevented) return;
    const select = event.target.closest?.("[data-theme-select]");
    if (!select || !["system", "dark", "light"].includes(select.value)) return;
    preference = select.value;
    applyTheme();
    try {
      if (preference === "system")
        window.localStorage.removeItem("lumine-theme");
      else window.localStorage.setItem("lumine-theme", preference);
    } catch {
      // Keep the choice for this page even when storage is unavailable.
    }
  });
  systemTheme.addEventListener("change", () => {
    if (preference === "system") applyTheme();
  });
})();
