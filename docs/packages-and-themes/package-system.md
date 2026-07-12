# Package system

Lumine installs packages and themes directly from Git repositories. There is no
central package server that Lumine depends on: the **Install** tab aggregates one
or more _catalogs_ (lists of packages) that you control, and can additionally
live-search the Pulsar package registry. Installation itself always clones a Git
repository into `~/.lumine/packages/<name>`.

## Where packages live

Every package is identified by its **name** — the `name` field of its
`package.json`. That name is the install directory
(`~/.lumine/packages/<name>`), the prefix for its commands (`<name>:command`),
its configuration namespace (`<name>.*`), and how it is required and activated.
Because the name is the install directory, **only one package with a given name
can be installed at a time**, even if two different repositories publish a
package by that name.

Bundled packages ship with Lumine and cannot be replaced or uninstalled from the
Install tab.

## Package identity

Two identities matter, and they are deliberately different:

- **For browsing**, a package is identified by its **repository**
  (`owner/repo`). The same name published from two different repositories shows
  up as two separate cards, each labeled with its `owner/repo` so you can tell
  them apart.
- **For installation**, a package is identified by its **name**. Installing one
  package blocks installing a different package that happens to share its name
  until the first is uninstalled (see [Name conflicts](#name-conflicts)).

The displayed name on a card is the repository's project name until the package
is installed; afterwards it is the real `package.json` name, which may differ
(for example, the repository `pulsar-invert-colors` ships a package named
`invert-colors`).

## Installing a package

Open **Settings → Install** (`settings-view:install-packages-and-themes`).

- Type a search term to find packages across your configured catalogs (and, if
  enabled, the Pulsar registry). Filter the results with **All / Packages /
  Themes / Updates**.
- Or type an install source directly (for example `owner/repo`) and press
  Enter to get an install card for that exact repository.

Click **Install** on a card. Lumine clones the repository at the selected
version into a temporary directory, runs `npm install --omit=dev`, records where
it came from, and moves it into `~/.lumine/packages/<name>`.

Installs and uninstalls run asynchronously so the editor stays responsive even
while copying or deleting a package with a large `node_modules` tree.

### Install sources and version selectors

An install source is either a GitHub shorthand or a full Git URL, optionally
pinned to a specific ref:

| Source                                  | Meaning                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `owner/repo`                            | Latest stable tag (or the default branch if there are no tags).               |
| `owner/repo@1.2.3`                      | The `1.2.3` tag (also matches a `v1.2.3` tag).                                |
| `owner/repo~branch`                     | Track a branch.                                                               |
| `owner/repo#<commit>`                   | A specific commit.                                                            |
| `https://host/owner/repo.git#tag:1.2.3` | Generic Git URL with an explicit `#tag:`, `#branch:`, or `#commit:` selector. |

Notes:

- **Browsing then installing** pins the version you were looking at. If you
  install a catalog package showing `1.2.3`, exactly `1.2.3` is installed even
  if `1.2.4` was published in between — but the recorded update policy still
  tracks new releases, so an update to `1.2.4` will be offered afterward.
- **Explicit selectors win.** Typing `owner/repo@0.4.0` installs `0.4.0` and
  keeps that selector; it is not silently upgraded to the newest tag.
- Generic (non-GitHub) Git URLs must carry an explicit `#branch:`, `#tag:`, or
  `#commit:` selector so the ref is never ambiguous.

## Catalog sources

A **catalog** is a list of packages the Install tab aggregates. Catalog sources
are configured in **Settings → Install → Catalog Sources**, or via the
`settings-view.communityPackageCatalogs` setting (an ordered array). A source can
be:

- a GitHub shorthand `owner/repo` (resolves to that repo's
  `index.json` on the `main` branch),
- an HTTP(S) URL to a repository or directly to an `index.json`, or
- a local absolute path to a directory or `index.json` file.

The default source is Lumine's own catalog:
`https://raw.githubusercontent.com/lumine-code/packages/main/index.json`.

Behavior:

- Nothing is downloaded when you open the tab. Catalogs are fetched on your first
  search, or when you click **Fetch** (which bypasses the cache). Fetched
  catalogs are cached in memory for 5 hours.
- When multiple catalogs are configured, **earlier sources win** if the same
  repository appears in more than one.
- **Restore Defaults** clears your customizations back to the default source.

### Catalog index format

An `index.json` is a JSON document:

```json
{
  "schemaVersion": 1,
  "packages": [
    {
      "name": "invert-colors",
      "repository": "asiloisad/pulsar-invert-colors",
      "version": "0.5.0",
      "description": "Invert view colors for images, editor, and PDF viewer",
      "keywords": ["invert", "colors"],
      "theme": false
    }
  ]
}
```

- `name` and `repository` are required. `repository` is the package identity for
  browsing; within a single catalog it must be unique.
- `installSource` is optional; when omitted, `repository` is used as the install
  source. `version` describes what will install. `theme` (`"ui"`, `"syntax"`, or
  `false`) drives the Packages/Themes filter.
- The catalog repository (`lumine-code/packages`) generates `index.json`
  automatically from a `sources.json` list of bare `owner/repo` entries: for each
  repo it reads the package's `package.json` at its highest stable tag. Authors
  register a package by adding their repository there; they do not hand-edit
  `index.json`.

## The Pulsar package registry

The Install tab can additionally live-search the Pulsar package registry
(`api.pulsar-edit.dev`). Enable **Include results from the Pulsar package
registry** (the checkbox next to Restore Defaults, or the
`settings-view.includePulsarPackageResults` setting; off by default).

- Pulsar results are fetched **per search**, never downloaded in bulk, and are
  appended after catalog results, deduplicated by repository (catalog wins).
- Packages sourced from Pulsar are marked with a distinct (purple) Install
  button.
- The toggle also governs whether **Check for Updates** consults the registry
  (see [Updates](updates.md)).

## Name conflicts

Because a package's name is its install directory, Lumine refuses to overwrite a
package with a different one of the same name:

- In the Install tab, a card for a package whose name is already taken by a
  _different_ repository shows a disabled **Install** button with a hover note
  explaining the conflict. Uninstall the existing package first.
- Reinstalling or updating the _same_ package (same repository of origin) is
  always allowed.
- The origin of an installed package is determined from what it was actually
  installed from (its recorded install source), not from the `repository` field
  in its `package.json` — which, in a fork, often still points upstream.

## Managing installed packages

The **Settings → Packages** and **Settings → Themes** tabs list what is
installed. From a package card you can open its **Settings**, **Disable/Enable**
it, or **Uninstall** it. Uninstalling flips the card to a not-installed state but
keeps it visible until the next full reload, so you can reinstall in one click.

## Commands

Commands available in `atom-workspace`:

- `settings-view:install-packages-and-themes`: open the Install tab,
- `settings-view:view-installed-packages`: open the Packages tab,
- `settings-view:view-installed-themes`: open the Themes tab,
- `settings-view:check-updates`: open the Install tab and check for updates (see
  [Updates](updates.md)).
