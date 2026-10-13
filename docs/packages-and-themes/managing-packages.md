# Packages and themes

Packages add tools and languages; themes control the interface and syntax colors. Use Settings to install and manage them. Each package's card links to its README and documentation.

## Install and manage

Open **Settings → Install**, search the catalog, or enter a Git source such as `lumine-code/terminal`. Review the package and install the version you want. The [default catalog](https://github.com/lumine-code/packages) lists packages maintained by the organization.

**Settings → Packages** lets you configure, disable or uninstall packages. Disabling keeps the files; uninstalling removes that copy. **Settings → Themes** selects your interface and syntax themes. The bundled One Theme supplies light and dark choices.

To install from a terminal:

```sh
lumine --install lumine-code/terminal
lumine --list
lumine --uninstall terminal
```

## Versions and updates

A bare `owner/repo` selects the highest stable tag, or the default branch when there are no stable tags. Add `@1.2.3` to pin a tag, `~branch` to follow a branch, or `#<commit>` to pin a commit.

Open **Settings → Update** to check installed packages. Pinned tags and commits stay pinned; branch installs follow that branch. Failed installs and updates keep the previous copy in place. Some updates require restarting the editor.

Editor releases are separate from package updates. `lumine-updater` reports newer editor releases; it does not download or install them automatically.

## Which copy loads

A package is identified by its manifest name. In development mode, `packages-dev/` has priority, followed by installed `packages/` and then bundled packages. Only the first copy of a name loads. Settings marks inactive copies as shadowed.

An installed copy can replace the bundled version without changing the editor installation. Uninstalling it lets the next copy take over. See [Extending Lumine](../extending-lumine/developing-extensions.md#develop-locally) to link a local working copy.

## Find a workflow guide

Use the package's documentation for setup and commands: [Terminal](https://github.com/lumine-code/terminal#readme), [language servers](https://github.com/lumine-code/ide#readme), [Jupyter](https://github.com/lumine-code/jupyter-repl#readme), [SOFiSTiK](https://github.com/lumine-code/sofistik-tools#readme), [autocomplete](https://github.com/lumine-code/autocomplete#readme), [linting](https://github.com/lumine-code/linter#readme) and [Git](https://github.com/lumine-code/git-center#readme).

If installation fails, check the reported Git/npm error and follow [Troubleshooting](../troubleshooting/diagnosing-problems.md#package-installation).
