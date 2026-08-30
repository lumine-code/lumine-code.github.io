# Package system

Lumine installs packages and themes directly from Git repositories at an exact commit. **Settings → Install** combines one or more catalogs that you control; there is no central package server.

A catalog is an untrusted JSON array of Git source strings or validated, pre-resolved snapshots. Snapshots carry the resolved ref and manifest metadata to make browsing fast, while a malformed snapshot falls back to live Git and manifest hydration. Installation still fetches and validates the selected commit before package code can run.

## Where packages live

Every package is identified by the `name` in its `package.json`, not by its directory name. That name is used for activation, settings, and normally command prefixes.

Packages are searched in this order:

| Place                    | What it holds                                               |
| ------------------------ | ----------------------------------------------------------- |
| `~/.lumine/packages-dev` | Development packages, loaded only when Lumine uses `--dev`. |
| `~/.lumine/packages`     | Installed packages.                                         |
| Bundled with Lumine      | Packages shipped with the editor.                           |

Only the first copy of a name loads. A dev copy therefore shadows an installed and bundled copy, while an installed copy shadows a bundled one. If two directories in the same place declare one name, the alphabetically first directory wins.

**Settings → Packages** and **Settings → Themes** list every copy. A shadowed user or dev copy can be uninstalled; a shadowed bundled copy is informational because bundled files cannot be removed. Settings and enabled state belong to the loaded name, not to an inactive copy.

## Origin, name, and directory

Lumine uses three identifiers for different jobs:

- The **origin** is the normalized Git repository identity used to merge catalog entries and track updates. HTTPS and SSH forms of the same repository share an origin.
- The package **name** identifies what loads and prevents unrelated repositories from silently replacing one another.
- The on-disk **directory** identifies a particular copy and is what Uninstall removes.

At most one installed package may occupy an origin or a name. Installing a different origin that declares an occupied name requires an explicit **Replace** action.

## Installing a package

Run `settings-view:install-packages-and-themes` to open **Settings → Install**. Search the configured catalogs and filter by **All**, **Packages**, or **Themes**, or enter an install source such as `owner/repo` directly.

When you click **Install**, Lumine resolves the selected ref to a commit, validates its manifest, prepares the package and production dependencies in staging, and swaps it into `~/.lumine/packages` transactionally. A failed install, update, or replacement leaves the previous copy in place and reports the underlying Git or npm error in a notification.

The install receipt records the credential-free source, origin, selected ref, update policy, and installed SHA. Package updates use that receipt rather than a catalog; see [Updates](updates.md).

### Validation

Before package-controlled installation steps run, Lumine checks that:

- the manifest parses as JSON, JSONC, or CSON;
- `name` is unscoped, lowercase, and safe as a directory name;
- the manifest's Git `repository` has the same origin as the source being installed;
- `engines.lumine` exists and accepts the running Lumine version;
- a semantic tag agrees with the manifest version; and
- the origin and package name do not conflict with another install unless the user chose Replace.

## Install sources and versions

| Source                                  | Meaning                                                         |
| --------------------------------------- | --------------------------------------------------------------- |
| `owner/repo`                            | Highest stable tag, or the default branch when no stable tag exists. |
| `owner/repo@1.2.3`                      | Pin tag `1.2.3` or `v1.2.3`.                                    |
| `owner/repo~branch`                     | Track a branch.                                                 |
| `owner/repo#<commit>`                   | Pin a commit.                                                   |
| `https://host/owner/repo.git`           | Apply the same stable-tag/default-branch selection to a full Git URL. |
| `https://host/owner/repo.git#tag:1.2.3` | Use an explicit `#tag:`, `#branch:`, or `#commit:` selector.    |

The version menu lists repository tags and the default branch. The initial choice is the highest stable tag, even when that tag is incompatible with the current Lumine version; in that case Install is disabled and another tag can be selected. Choosing a version re-fetches and validates its manifest.

Browsing pins the exact SHA shown on the card so a moving ref cannot change during installation. A bare repository still records a policy that follows later stable releases, while a selected branch follows its HEAD. An explicit tag or commit stays pinned.

Manually entered sources may use SSH and private repositories. Catalog-driven sources are restricted to public HTTPS and GitHub shorthand because catalogs hydrate without an interactive trust decision.

## Catalog sources

An `index.json` is a JSON array whose entries are source strings, pre-resolved snapshots, or a mixture of both. A source-only catalog is enough:

```json
[
  "owner/repo",
  "owner/another@2.0.0",
  "https://git.example.com/team/pkg.git#branch:main"
]
```

Snapshots are an optional optimization generated by a catalog maintainer; they include a source, resolved SHA and ref data, and validated manifest metadata. The old object format with `schemaVersion` and a `packages` array is not supported.

Configure catalogs under **Settings → Install → Catalog Sources** or with `settings-view.packageCatalogs`. A source may be a GitHub `owner/repo` containing `index.json`, a public HTTP(S) URL, or a local absolute path or `file://` URL. Lumine's default catalog is `https://raw.githubusercontent.com/lumine-code/packages/HEAD/index.json`.

When catalogs repeat an origin, the Install tab merges it into one card and records which catalogs supplied it. **Fetch** reloads the configured catalogs, shows progress and failures, and can be cancelled; otherwise the last persistent cache is shown immediately.

Catalog entries cannot automatically target local paths, private networks, credential-bearing URLs, SSH, `git://`, or `ext::`. Those restrictions do not apply to a source the user enters manually.

## Install actions

| What already holds the package name     | Action                                              |
| --------------------------------------- | --------------------------------------------------- |
| Nothing                                 | **Install**                                         |
| The same origin                         | **Installed** or **Update**                         |
| A different installed origin            | **Replace**                                         |
| A bundled package from another origin   | **Replace**, installing a copy that shadows it      |
| A package in `~/.lumine/packages-dev`   | **Install**, with a note that the dev copy still loads |

A disabled package still holds its name. Uninstalling the copy that loads hands the name to the next available copy, and its `core.disabledPackages` entry remains while any copy of that name exists.

## Managing and commands

Use **Settings → Packages** and **Settings → Themes** to configure, enable, disable, or uninstall packages; see [Managing packages and themes](managing.md).

Commands available in `lumine-workspace`:

- `settings-view:install-packages-and-themes`: open Install,
- `settings-view:view-installed-packages`: open Packages,
- `settings-view:view-installed-themes`: open Themes,
- `settings-view:check-updates`: open Update and check installed packages.
