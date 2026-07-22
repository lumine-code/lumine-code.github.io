# Installing Lumine

Lumine is currently **source-first**: downloads and platform packages are still settling, so the most reliable way to run it today is to build and run it from source.

## Prerequisites

- **Git** — to clone the repository.
- **Node.js** — the exact version is pinned in the repository's `.nvmrc` (currently Node 24). Using [nvm](https://github.com/nvm-sh/nvm) is the easiest way to match it.
- **Yarn** — provided through Corepack (bundled with modern Node), so you do not install it separately.
- **A C/C++ build toolchain** — some native modules are compiled during install. On Windows this means the Visual Studio Build Tools; on macOS the Xcode command-line tools; on Linux the usual `build-essential`/Python toolchain.

## Build from source

```sh
# Clone the source
git clone https://github.com/lumine-code/lumine.git
cd lumine

# Use the project Node version from .nvmrc
nvm install

# Enable Yarn through Corepack once for this Node version
corepack enable

# Install dependencies, rebuild native modules, and launch
yarn install
yarn build
yarn start
```

`yarn start` runs the editor you just built.

## Building installable binaries

To produce platform binaries instead of running from source:

```sh
yarn dist
```

The output is written to the `binaries/` directory.

## Next steps

- [Launching Lumine](launching-lumine.md) — the `lumine` command and its options.
- [Basics](../using-lumine/basics.md) — find your way around the editor.
