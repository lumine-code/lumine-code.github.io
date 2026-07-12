# Publishing a package

A Lumine package is just a public Git repository with a `package.json`. Anyone can
already install it directly by its `owner/repo`; publishing is about making it
**discoverable** and keeping **versions** tidy.

## Tag your releases

Lumine installs and updates packages from Git **tags**. Give each release a
semver tag (`1.2.0`, or `v1.2.0`), and make sure your `package.json` `version`
matches. This is what powers version pinning and the
[update](../packages-and-themes/updates.md) checks:

- installing `owner/repo` picks your highest stable tag;
- installing `owner/repo@1.2.0` pins that exact tag;
- once installed, a newer tag is offered as an update.

## Requirements

- A valid `package.json` with at least `name`, `repository`, and `version`.
- `"engines": { "atom": "*" }` (or a real range) so Lumine knows it is
  compatible.
- A `name` that does not collide with one of Lumine's bundled packages — the
  install directory is keyed by name. See
  [The package system](../packages-and-themes/package-system.md).

## Getting into the Install tab

Lumine's **Install** tab aggregates one or more community **catalogs**. The
default catalog is the [`lumine-code/packages`](https://github.com/lumine-code/packages)
repository, which lists packages by their `owner/repo`.

To add yours, open a **"Register a package"** issue on that repository and provide
your repository. The catalog then reads your `package.json` at your highest stable
tag and includes your package in the generated index, so it shows up in everyone's
Install tab. You never hand-edit the index — the catalog rebuilds itself from the
registered repositories.

Because catalogs are just index files, anyone can also publish their **own**
catalog and users can add it as a source — you are not limited to the default one.

## The Pulsar registry

Lumine can additionally surface results from the Pulsar package registry when the
user opts in. If your package is published there, it is findable that way too. See
[The package system](../packages-and-themes/package-system.md#the-pulsar-package-registry).
