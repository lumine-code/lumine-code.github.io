"use strict";

// Read committed media from sibling repositories; the website stores links only.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const site = path.resolve(__dirname, "..");
const workspace = path.resolve(process.argv[2] || path.join(site, ".."));
// Maintainer-only packages stay out even if a repository is publicly readable.
const excludedRepositories = new Set(["bacadra-tools", "banager-tools"]);
const git = (cwd, args) =>
  execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
async function main() {
  const publicRepos = new Set();
  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/orgs/lumine-code/repos?type=public&per_page=100&page=${page}`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (!response.ok)
      throw new Error(
        `Could not verify public repositories: HTTP ${response.status}`,
      );
    const repos = await response.json();
    for (const repo of repos) if (!repo.private) publicRepos.add(repo.name);
    if (repos.length < 100) break;
  }
  const entries = [];
  for (const directory of fs.readdirSync(workspace, { withFileTypes: true })) {
    if (!directory.isDirectory() || directory.name.startsWith(".")) continue;
    const repo = directory.name;
    if (excludedRepositories.has(repo) || !publicRepos.has(repo)) continue;
    const cwd = path.join(workspace, repo);
    try {
      const manifest = JSON.parse(
        git(cwd, ["show", "origin/master:package.json"]),
      );
      if (!manifest.engines?.lumine || repo === "dev-live-reload") continue;
      if (
        !/^https:\/\/github\.com\/lumine-code\//.test(
          git(cwd, ["remote", "get-url", "origin"]),
        )
      )
        continue;
      const metadata = JSON.parse(
        git(cwd, ["show", "origin/master:.github/demo.json"]),
      );
      if (metadata.mode !== "normal" || metadata.fontSettings !== "default")
        continue;
      const readme = git(cwd, ["show", "origin/master:README.md"]);
      const revision = git(cwd, ["rev-parse", "origin/master"]);
      const category = repo.startsWith("language-")
        ? "grammars"
        : manifest.themes
          ? "themes"
          : "packages";
      for (const [index, item] of metadata.images.entries()) {
        if (
          !/^demo(?:-\d+)?\.png$/.test(item.file) ||
          !readme.includes(`](.github/${item.file})`)
        )
          continue;
        git(cwd, ["cat-file", "-e", `origin/master:.github/${item.file}`]);
        entries.push({
          id: `${repo}-${index + 1}`,
          repo,
          category,
          description: manifest.description,
          caption: item.label,
          width: item.width,
          height: item.height,
          src: `https://raw.githubusercontent.com/lumine-code/${repo}/${revision}/.github/${item.file}`,
          repository: `https://github.com/lumine-code/${repo}#features`,
          source: `https://github.com/lumine-code/${repo}/blob/${revision}/.github/${item.file}`,
        });
      }
    } catch {
      // A repository with no published screenshot contributes no preview.
    }
  }
  const main = path.join(workspace, "lumine");
  if (!publicRepos.has("lumine"))
    throw new Error("The editor repository is not public");
  const revision = git(main, ["rev-parse", "origin/master"]);
  const captions = [
    "Edit source code in Lumine.",
    "Preview Markdown beside its source.",
    "Explore installed packages.",
    "View Lumine version information.",
  ];
  for (let index = 1; index <= 4; index++) {
    for (const palette of ["light", "dark"]) {
      const file = `.github/gallery/${String(index).padStart(2, "0")}-${palette}.png`;
      git(main, ["cat-file", "-e", `origin/master:${file}`]);
      entries.push({
        id: `lumine-${index}-${palette}`,
        repo: "lumine",
        category: "editor",
        description: "The Lumine editor.",
        caption: captions[index - 1],
        width: 1600,
        height: 1088,
        src: `https://raw.githubusercontent.com/lumine-code/lumine/${revision}/${file}`,
        repository: "https://github.com/lumine-code/lumine",
        source: `https://github.com/lumine-code/lumine/blob/${revision}/${file}`,
      });
    }
  }
  entries.sort(
    (a, b) =>
      (a.category === "editor" ? 0 : 1) - (b.category === "editor" ? 0 : 1) ||
      a.repo.localeCompare(b.repo) ||
      a.id.localeCompare(b.id, undefined, { numeric: true }),
  );
  fs.writeFileSync(
    path.join(site, "gallery.json"),
    JSON.stringify({ entries }, null, 2) + "\n",
  );
  console.log(
    `${entries.length} published images from ${new Set(entries.map((item) => item.repo)).size} repositories`,
  );
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
