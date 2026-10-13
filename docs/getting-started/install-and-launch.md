# Install and launch

A modern, extensible text editor built on the Pulsar and Atom legacy.

Lumine is an open-source desktop editor built on Electron and Node.js. Packages provide its tools, languages and themes. Start with a source build; the [editor repository](https://github.com/lumine-code/lumine) contains the current build requirements and [releases](https://github.com/lumine-code/lumine/releases) list available binaries.

## Build from source

Install Git, the Node.js version named in the editor's `.nvmrc`, and a C/C++ build toolchain. Windows uses Visual Studio Build Tools with C++; macOS uses the Xcode command-line tools; Linux needs a compiler, make and Python.

```sh
git clone https://github.com/lumine-code/lumine.git
cd lumine
npm install
npm run build
npm start -- .
```

`npm run build` rebuilds native modules for Lumine's Electron runtime. To create installable binaries, run `npm run dist`; the output is written to `binaries/`.

## Open files and projects

An installed binary can be opened from the applications launcher. With `lumine` on your `PATH`, open a project directory or one or more files:

```sh
lumine .
lumine path/to/file
lumine file-a file-b
```

For a source checkout, use `npm start -- <path>` from the editor repository. Use `lumine --new-window <path>` for a separate workspace, `lumine --add <path>` to add a project to the last workspace, or `lumine --wait <path>` when another program should wait for the window to close. Run `lumine --help` for the full option list.

## Your configuration

Personal settings and installed packages normally live in `~/.lumine` (`%USERPROFILE%\.lumine` on Windows). A portable `.lumine` directory beside the installation or the `LUMINE_HOME` environment variable can select another profile. See [Customization](../customization/personalizing-lumine.md).

Continue with [First steps](first-steps.md). If installation or startup fails, see [Troubleshooting](../troubleshooting/diagnosing-problems.md).
