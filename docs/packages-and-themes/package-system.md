# Package system

Lumine installs packages and themes directly from Git repositories. There is no
central package server that Lumine depends on: the **Install** tab aggregates one
or more _catalogs_ — untrusted lists of Git repositories that you control — and
fetches every piece of package metadata itself. Installation always clones a Git
repository into `~/.lumine/packages/<name>`.

A catalog does **not** provide names, versions, descriptions, compatibility, or
READMEs. It is only a list of Git sources. Lumine resolves each source to an
exact commit, reads that commit's `package.json`, and validates it before
anything is installed.

> V1 installs a single package located at the **root** of a repository.
> Installing an individual package out of a monorepo subdirectory is out of
> scope.

## Where packages live

Every package is identified by its **name** — the `name` field of its
`package.json`. That name is the install directory
(`~/.lumine/packages/<name>`), the prefix for its commands (`<name>:command`),
its configuration namespace (`<name>.*`), and how it is required and activated.
Because the name is the install directory, **only one package with a given name
can be installed at a time**, even if two different repositories publish a
package by that name.

Bundled packages ship with Lumine. They are not removed by the Install tab, but
a community package of the same name can **override** one (see
[Slots: Install, Update, Replace, Override](#slots-install-update-replace-override)).

## Package identity: origin vs. name

Two identities matter, and they are deliberately different:

- **For browsing and de-duplication**, a package is identified by its
  **origin** — a canonical, transport-independent key derived from the Git URL:
  `host[:port]/path`, with the credentials, transport (`https`, `ssh`, …), a
  trailing `.git`, and any ref selector stripped off. The host is lowercased;
  the path case is preserved on hosts other than GitHub, because Git servers may
  treat paths case-sensitively.
- **For installation**, a package is identified by its **name** — the install
  slot on disk.

Because the origin is transport-independent, the HTTPS and SSH forms of the same
`host/path` resolve to a **single** origin
(`https://github.com/owner/repo.git` and `git@github.com:owner/repo.git` are the
same package). A server-side **redirect is not** treated as an alias: identity
is computed from the source string you provide, never from where a request
happens to land.

Two invariants follow:

- At most **one installation per origin** at a time.
- At most **one package per name** at a time.

The name shown on a browse card is the repository's project name until a valid
manifest is fetched for the selected commit; afterwards it is the real
`package.json` name, which may differ (the repository `pulsar-invert-colors`
ships a package named `invert-colors`). A card is keyed internally by its origin
(`community:<origin>`) or, for a bundled package, by its name
(`builtin:<name>`) — never by name alone — so two repositories that publish the
same name never collide in the UI.

## Installing a package

Open **Settings → Install** (`settings-view:install-packages-and-themes`).

- Type a search term to find packages across your configured catalogs (and, if
  enabled, the Pulsar registry). Filter the results with **All / Packages /
  Themes / Updates**.
- Or type an install source directly (for example `owner/repo`) and press
  Enter to get an install card for that exact repository.

Click **Install** on a card. Lumine:

1. resolves the selected ref to an exact commit SHA and reads that commit's
   manifest,
2. validates the manifest (see [Validation](#validation-before-install)),
3. clones the repository at that exact SHA into a staging directory on the same
   volume, runs `npm install --omit=dev`, and records an install receipt, then
4. atomically swaps the staged copy into `~/.lumine/packages/<name>`.

Install, Update, and Replace are **transactional**: everything is prepared in
staging first; the active copy is unloaded and backed up; the swap is atomic;
and any failure rolls back to the backup and reloads the previous copy. Installs
and uninstalls run asynchronously so the editor stays responsive.

The **install receipt** records a credential-free source, the origin, the ref
you chose, the update policy, and the installed SHA. Updates read this receipt
and never depend on any catalog.

### Validation (before install)

Nothing package-controlled runs before validation passes. Before `npm install`,
Lumine checks the manifest fetched for the selected SHA:

- it parses as JSON, JSONC, or CSON;
- the `name` is an unscoped, lowercase, folder-safe slot name;
- a Git `repository` is present, and its origin is a **syntactic variant of the
  same origin** you are installing from — a fork whose `repository` still points
  upstream, an old address, or a redirect is rejected;
- `engines.atom` is present and the running Lumine satisfies it;
- when the ref is a semantic tag, it matches the manifest `version` (an optional
  leading `v` is ignored);
- the name is free (or held by the same origin), and no other slot already holds
  this origin.

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

- **Browsing then installing pins the exact commit you were looking at.** If a
  card shows `1.2.3`, exactly that SHA is installed even if `1.2.4` was published
  in between — but the recorded update policy still tracks new releases, so an
  update to `1.2.4` is offered afterward.
- **Explicit selectors win.** Typing `owner/repo@0.4.0` installs `0.4.0` and
  keeps that selector; it is never silently upgraded.
- Generic (non-GitHub) Git URLs must carry an explicit `#branch:`, `#tag:`, or
  `#commit:` selector so the ref is never ambiguous.
- A **manually typed** install source may use SSH and private repositories.
  Sources that come from a catalog are held to a stricter safety allowlist (see
  [Catalog safety](#catalog-safety)).

### Choosing a version on the card

The card's **version** is a dropdown. It lists every **tag** (SemVer-descending,
then prereleases, then non-version text tags) plus the repository's **default
branch**. Annotated tags resolve to their commit SHA. Catalog cards already have
this list; on the **Packages**/**Themes** tabs an installed package fetches its
tags the first time you open the dropdown.

- Selecting a **tag** _pins_ that exact release.
- Selecting the **default branch** _tracks_ it — updates follow the new branch
  HEAD.

On a browse (not-installed) card, changing the version re-fetches the manifest
for the new commit and re-validates it; **Install** stays disabled until
validation completes. On an installed card, choosing a different version turns
the action into **Update to X** targeting that exact commit (choosing the
installed version again clears the pending update).

The repository reference beside the version is a link to the repo; **hover over
it** to see the origin, resolved commit, selected ref, catalog provenance, and
validation status.

## Catalog sources

A **catalog** is an `index.json` file: a plain JSON array of Git source
strings, in the same syntax as an install source (a bare repo, `@tag`,
`~branch`, `#commit`, or a full URL with an explicit selector). It carries no
package metadata — Lumine fetches that itself.

```json
["owner/repo", "owner/another@2.0.0", "https://git.example.com/team/pkg.git#branch:main"]
```

> `index.json` is the array-of-sources format above. The **old metadata catalog
> format** (a `schemaVersion` object with a `packages` array of pre-baked names,
> versions, and descriptions) is **no longer supported** and fails with a
> readable error; convert it to a plain array of Git sources.

Catalog sources are configured in **Settings → Install → Catalog Sources**, or
via the `settings-view.communityPackageCatalogs` setting (an ordered array). A
source can be:

- a GitHub shorthand `owner/repo` (resolves to that repo's `index.json` on the
  `main` branch),
- a public HTTP(S) URL to a repository or directly to an `index.json`, or
- a local absolute path (or `file://` URL) to a directory or `index.json`.

The default source is Lumine's own catalog:
`https://raw.githubusercontent.com/lumine-code/packages/main/index.json`.

When the same origin appears in more than one catalog, the entries are
**merged** into a single card: the first catalog sets the initial ref selector,
and the card shows the full provenance (which catalogs list it) and flags a
**selector conflict** when the catalogs disagree on the ref. **Restore Defaults**
clears your customizations back to the default source.

### Catalog safety

Catalogs are untrusted, so automatic hydration of a catalog entry is restricted
to **public HTTPS** URLs and GitHub `owner/repo` shorthand. These are blocked in
catalog entries: local paths, `file:`, `ext::`, `git://`, `localhost` and
`*.local`, private network ranges, and any URL that embeds credentials. (You can
still install from SSH or a private repository by typing the source in
manually — the restriction applies only to catalog-driven hydration.)

## Fetching, cache, and scale

The Install tab is built to handle roughly **1000** unique origins; a hard
safety limit of **2000** entries applies after de-duplication.

- **Nothing is fetched when you open the tab.** On startup the last cached index
  is shown immediately, with no automatic revalidation. The very first run with
  no cache starts indexing automatically.
- **Fetch** (the refresh action) re-reads the catalogs. The old index stays
  visible and is marked as refreshing while records are swapped in progressively.
  A repository that fails to hydrate keeps its previous data as _stale_ (or shows
  an _error_ with a reason) and can be retried. The panel shows
  `processed / total / errors`, the time of the last Fetch, and a **Cancel**
  button; cancelling stops new work and leaves the cache consistent.
- Fetching uses separate work queues — up to **8** concurrent Git operations and
  **16** HTTP requests, with a per-host cap, timeouts, `Retry-After` handling,
  and bounded backoff.
- The cache is **persistent and versioned**, stored under
  `userData/Cache/settings-view`. It holds the catalog lists, provenance, tags,
  default branch, the default manifest, any branches fetched on demand, and the
  last Fetch time. Manifests are cached by origin + SHA (an unchanged SHA reuses
  its manifest on the next Fetch); READMEs use a small size-bounded LRU. The
  cache is written atomically and discarded on a schema change or corruption.
  Changing your catalog configuration drops the results of removed sources and
  marks new sources as pending a Fetch.

All hydrated records participate in search, but the DOM renders **50 cards per
page**. Changing the filter returns to the first page. While the first index is
still building, search results are marked as incomplete.

A package's README is fetched only when you open its details for the selected
SHA. The content is sanitized, and external images are not loaded automatically.

## The Pulsar package registry

The Install tab can additionally live-search the Pulsar package registry
(`api.pulsar-edit.dev`). Enable **Include results from the Pulsar package
registry** (the checkbox next to Restore Defaults, or the
`settings-view.includePulsarPackageResults` setting; off by default).

- Pulsar results are used **only as repository links**. Their registry metadata
  is ignored — Lumine re-hydrates each result from its repository like any other
  source. Results are fetched per search, appended after catalog results, and
  de-duplicated by origin (catalog wins).
- The toggle also governs whether **Check for Updates** consults the registry
  (see [Updates](updates.md)). This is what lets packages that live only in the
  Pulsar registry surface updates.

## Slots: Install, Update, Replace, Override

Because a package's name is its install slot, the action offered on a card
depends on what already holds that slot:

| Slot state                          | Action                                                        |
| ----------------------------------- | ------------------------------------------------------------- |
| Free                                | **Install**                                                   |
| Held by the **same** origin         | **Installed** / **Update**                                    |
| Held by a **different** community origin | **Replace** (swaps the installed package for this one)   |
| Held by a **bundled** package       | **Override** (a community package shadows the bundled one, with a warning) |

A community package deterministically takes precedence over a bundled package of
the same name, including virtual bundled themes; a _disabled_ community package
still occupies the slot. When a community package overrides a bundled one, the
**Packages** tab shows a manageable community card plus an informational card for
the shadowed bundled package. Uninstalling the community package restores the
bundled one, and any existing `core.disabledPackages` entry for that name is
preserved.

The origin of an installed package is read from its install receipt (what it was
actually installed from), not from the `repository` field in its `package.json`,
which in a fork often still points upstream. Older installs whose receipt has a
missing or mismatched origin stay active with a warning, but their next update
must pass strict origin validation.

## Managing installed packages

The **Settings → Packages** and **Settings → Themes** tabs list what is
installed. From a package card you can open its **Settings**,
**Disable / Enable** it, or **Uninstall** it. See
[Managing packages and themes](managing.md).

## Commands

Commands available in `atom-workspace`:

- `settings-view:install-packages-and-themes`: open the Install tab,
- `settings-view:view-installed-packages`: open the Packages tab,
- `settings-view:view-installed-themes`: open the Themes tab,
- `settings-view:check-updates`: open the Install tab and check for updates (see
  [Updates](updates.md)).
