# Installing Lumine

Lumine is currently **source-first**: downloads and platform packages are still settling, so the most reliable way to run it today is to build and run it from source.

## Prerequisites

- **Git** — to clone the repository.
- **Node.js** — install the exact version named in `.nvmrc`. On macOS and Linux, [nvm](https://github.com/nvm-sh/nvm) can select it with `nvm install`; on Windows, use the matching Node installer or a Windows-compatible version manager. npm ships with Node.
- **A C/C++ build toolchain** — some native modules are compiled during install. On Windows this means the Visual Studio Build Tools; on macOS the Xcode command-line tools; on Linux the usual `build-essential`/Python toolchain.

Lumine requires an x64 or arm64 system. The macOS minimum is macOS 13 Ventura; Windows builds require 64-bit Windows 10 or later; Linux builds target current 64-bit distributions.

## Build from source

```sh
# Clone the source
git clone https://github.com/lumine-code/lumine.git
cd lumine

# Install dependencies, rebuild native modules, and launch
npm install
npm run build
npm start
```

`npm install` installs dependencies, `npm run build` rebuilds the native modules against Lumine's Electron runtime, and `npm start` runs the editor you just built.

To pass paths or options to a source build, place them after `--`, for example `npm start -- .`. The standalone `lumine` command described on the next page belongs to an installed binary.

## Building installable binaries

To produce platform binaries instead of running from source:

```sh
npm run dist
```

The output is written to the `binaries/` directory.

## Next steps

- [Launching Lumine](launching-lumine.md) — the `lumine` command and its options.
- [Basics](../using-lumine/basics.md) — find your way around the editor.
