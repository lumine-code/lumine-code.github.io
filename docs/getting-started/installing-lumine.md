# Installing Lumine

Lumine is currently **source-first**: downloads and platform packages are still settling, so the most reliable way to run it today is to build and run it from source.

## Prerequisites

- **Git** — to clone the repository.
- **Node.js** — the exact version is pinned in the repository's `.nvmrc` (currently Node 24). Using [nvm](https://github.com/nvm-sh/nvm) is the easiest way to match it. npm ships with Node, so there is nothing else to install for the package manager.
- **A C/C++ build toolchain** — some native modules are compiled during install. On Windows this means the Visual Studio Build Tools; on macOS the Xcode command-line tools; on Linux the usual `build-essential`/Python toolchain.

## Build from source

```sh
# Clone the source
git clone https://github.com/lumine-code/lumine.git
cd lumine

# Use the project Node version from .nvmrc
nvm install

# Install dependencies, rebuild native modules, and launch
npm install
npm run build
npm start
```

`npm install` installs dependencies, `npm run build` rebuilds the native modules against Lumine's Electron runtime, and `npm start` runs the editor you just built.

## Building installable binaries

To produce platform binaries instead of running from source:

```sh
npm run dist
```

The output is written to the `binaries/` directory.

## Next steps

- [Launching Lumine](launching-lumine.md) — the `lumine` command and its options.
- [Basics](../using-lumine/basics.md) — find your way around the editor.
