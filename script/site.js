"use strict";

// Run in the head so the saved palette is applied before the page is painted.
(() => {
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let savedTheme;
  try {
    savedTheme = window.localStorage.getItem("lumine-theme");
  } catch {
    // Private or restricted browsing still gets a working theme toggle.
  }
  if (savedTheme !== "light" && savedTheme !== "dark") savedTheme = null;

  const updateControls = () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.textContent = nextTheme === "dark" ? "Dark" : "Light";
      button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    });
  };
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    updateControls();
  };
  applyTheme(savedTheme || (systemTheme.matches ? "dark" : "light"));
  document.addEventListener("DOMContentLoaded", updateControls);
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.target.closest?.(".skip-link")) {
      event.preventDefault();
      document.querySelector("main")?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
      return;
    }
    if (!event.target.closest?.("[data-theme-toggle]")) return;
    savedTheme = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(savedTheme);
    try {
      window.localStorage.setItem("lumine-theme", savedTheme);
    } catch {
      // Keep the choice for this page even when storage is unavailable.
    }
  });
  systemTheme.addEventListener("change", (event) => {
    if (!savedTheme) applyTheme(event.matches ? "dark" : "light");
  });
})();
