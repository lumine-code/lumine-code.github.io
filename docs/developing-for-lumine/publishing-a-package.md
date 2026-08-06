# Publishing a package

A Lumine package is just a public Git repository with a `package.json`. Anyone can already install it directly by its `owner/repo`; publishing is about making it **discoverable** and keeping **versions** tidy.

## Tag your releases

Lumine installs and updates packages from Git **tags**. Give each release a semver tag (`1.2.0`, or `v1.2.0`), and make sure your `package.json` `version` matches. This is what powers version pinning and the [update](../packages-and-themes/updates.md) checks:

- installing `owner/repo` picks your highest stable tag;
- installing `owner/repo@1.2.0` pins that exact tag;
- once installed, a newer tag is offered as an update.

The `version` in your manifest names what that tree publishes as, and the tag is what makes it published — so it carries no `-dev` or similar suffix between releases. Cutting a release is one commit: set the version, commit, tag it, push both. Decide whether the work was a patch, a minor or a major **at that moment**, not when you started it; whether anything is released at all is `git tag -l`'s question, and how far you have moved past it is `git describe --tags`'s.

## Requirements

- A valid `package.json` with at least `name`, `repository`, and `version`.
- `"engines": { "lumine": "^1.0.0" }` so Lumine knows it is compatible; a manifest without the `lumine` engine cannot be installed.
- A `name` that does not collide with one of Lumine's bundled packages — the install directory is keyed by name. See [The package system](../packages-and-themes/package-system.md).

## Getting into the Install tab

Lumine's **Install** tab aggregates one or more **catalogs**. The default one is the [`lumine-code/packages`](https://github.com/lumine-code/packages) repository, which lists the packages `lumine-code` maintains — an `index.json` array of `owner/repo` sources, nothing more. Lumine reads each listed repository's `package.json` directly from the ref it resolves, so the catalog carries no copy of your metadata.

A catalog is just an index file, so publishing your own and telling people to add it as a source is a first-class way to be discoverable — the Install tab takes any number of them. And whether or not your package is in a catalog, anyone can install it by typing its `owner/repo`, or pin a release with `owner/repo@1.2.0`.

## The Pulsar registry

Lumine can additionally surface results from the Pulsar package registry when the user opts in. If your package is published there, it is findable that way too. See [The package system](../packages-and-themes/package-system.md#the-pulsar-package-registry).
