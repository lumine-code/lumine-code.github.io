# What is Lumine

Lumine is a community-led, hyper-hackable text editor. It is easy to use out of the box and just as easy to shape to your needs — from a few settings tweaks to new commands, keybindings, themes, and packages that change how the editor behaves.

## Built on web technology

Lumine is a desktop application built on **Electron 43** and **Node 24**. The interface is HTML and CSS and the editor is scriptable in JavaScript, so the same tools you use to build for the web are the tools you use to customize and extend the editor. The full application programming interface is exposed to packages and to your own init script through the global `atom` object.

## Hackable by design

Almost everything in Lumine is a **package** — many core features are packages that ship with the editor, sitting beside the community packages you install. That keeps the editor open rather than sealed: you can inspect, restyle, rebind, disable, or replace nearly any part of it.

- **Packages** add features and languages. See [The package system](../packages-and-themes/package-system.md).
- **Themes** change the look of the interface and syntax. See [Developing a theme](../developing-for-lumine/developing-a-theme.md).
- **Keymaps, snippets, styles, and an init script** let you customize the editor without writing a package. See [Configuration](../customizing-lumine/configuration.md).

## Community-led and source-first

Lumine is stewarded by the community that uses it, under the `lumine-code` organization on GitHub. The project is evolving quickly and is currently **source-first**: the most reliable way to run it today is to build it from source. See [Installing Lumine](installing-lumine.md).
