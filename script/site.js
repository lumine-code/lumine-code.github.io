"use strict";

// Run in the head so the saved palette is applied before the page is painted.
(() => {
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const preferences = ["system", "light", "dark"];
  const labels = { system: "System", light: "Light", dark: "Dark" };
  let preference = "system";
  try {
    const savedTheme = window.localStorage.getItem("lumine-theme");
    if (savedTheme === "light" || savedTheme === "dark")
      preference = savedTheme;
  } catch {
    // Private or restricted browsing still gets a working theme button.
  }

  const nextPreference = () =>
    preferences[(preferences.indexOf(preference) + 1) % preferences.length];
  const updateControls = () => {
    const label = `Color theme: ${labels[preference]}. Switch to ${labels[nextPreference()]}.`;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.textContent = labels[preference];
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
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
      return;
    }
    if (!event.target.closest?.("[data-theme-toggle]")) return;
    preference = nextPreference();
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
