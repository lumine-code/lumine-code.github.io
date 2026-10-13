(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.LumineDocs = factory();
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";

  function createNavigation(manifest) {
    const pages = manifest.categories.flatMap((category) =>
      category.pages.map((page) => ({
        category: category.slug,
        categoryTitle: category.title,
        slug: page.slug,
        title: page.title,
        route: `${category.slug}/${page.slug}`,
        file: `docs/${category.slug}/${page.slug}.md`,
      })),
    );
    const byRoute = new Map(pages.map((page) => [page.route, page]));
    const redirects = manifest.redirects || {};

    function resolve(hash) {
      const requested = String(hash || "").replace(/^#\/?/, "");
      const [route, fragment = ""] = requested.split("#");
      const exactDestination = redirects[requested];
      const destination = exactDestination || redirects[route];
      let target = destination || requested;
      if (
        !exactDestination &&
        destination &&
        fragment &&
        !destination.includes("#")
      )
        target += `#${fragment}`;
      if (/^https:\/\//.test(target)) return { href: target, page: null };
      const [targetRoute, targetFragment = ""] = target.split("#");
      const page = byRoute.get(targetRoute) || pages[0];
      const suffix =
        byRoute.has(targetRoute) && targetFragment ? `#${targetFragment}` : "";
      return { href: `#${page.route}${suffix}`, page };
    }

    function markdownHref(href, page) {
      // External README/docs links must stay external even when they end in .md.
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return href;
      if (href.startsWith("#")) return `#${page.route}${href}`;
      const url = new URL(href, `https://docs.invalid/${page.file}`);
      const match = url.pathname.match(/^\/docs\/([\w-]+)\/([\w-]+)\.md$/);
      if (!match) return href;
      const route = `${match[1]}/${match[2]}`;
      if (!byRoute.has(route) && !redirects[route]) return href;
      return resolve(`#${route}${url.hash}`).href;
    }

    return { pages, byRoute, resolve, markdownHref };
  }

  return { createNavigation };
});
