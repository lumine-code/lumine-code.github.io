# lumine-code.github.io

Website and documentation for the Lumine text editor.

A modern, extensible text editor built on the Pulsar and Atom legacy.

This site documents **[Lumine](https://github.com/lumine-code/lumine)**.

Served via GitHub Pages at **https://lumine-code.github.io**.

## Structure

```text
index.html      # landing page
api/            # generated API reference and its presentation stylesheet
docs/           # Markdown documentation rendered by docs.html
styles.css      # shared themes, typography, landing page and manual styles
script/site.js  # theme preference and shared keyboard navigation
assets/         # logo assets
```

The manual has seven pages in six chapters: Getting started, Workspace, Customization, Packages and themes, Troubleshooting, and Extending Lumine. Detailed guides live in the editor's or owning package's `docs/`. `docs/manifest.json` declares the pages and redirects from retired routes, including heading-specific redirects when a section moved separately.

Run `npm run test:docs` to check navigation, legacy redirects and links in the manual. External GitHub documentation links stay external; relative Markdown links and heading links are routed inside the manual.

The landing page, manual and API share light and dark themes. The theme follows the system preference until a visitor chooses one; that choice is saved across pages. Shared colors and typography live in `styles.css`, and API-specific presentation lives in `api/styles.css`. Edit the API markup in `script/generate-api-docs.js`, then regenerate the reference. Run `npm run test:site` to check theme selection, storage fallback and keyboard navigation.

The API search finds classes, methods and properties by name or description. Qualified names such as `TextEditor.getText` work too. Search results open the matching contract, and the index remains available while reading. The manual provides an on-page contents list and a direct link to each guide's source.

## Regenerating the API reference

Install the website's small documentation toolchain and run the generator:

```sh
npm install
npm run docs:api -- --editor /path/to/lumine
```

The generator uses the canonical JSDoc extractor and source registry from the selected editor checkout, then rewrites `api/index.html` and `api/api.json`. Registered dependency sources are resolved from sibling repositories first and the editor's `node_modules` second, so a full workspace keeps `event-kit` beside `lumine`. `LUMINE_CORE_ROOT` may be set instead of passing `--editor`.

A standalone `/** @category Layout */` comment in a class or object body starts a section for following API members. An `@category` tag inside a member's own JSDoc overrides only that member's category. Place it after the description and other tags, preserving the `@public`, `@status`, blank-line header. Public members cannot appear under a category starting with `Private`.

Run `npm run check:api-docs` and `npm run test:api-extractor` in the editor checkout before regenerating. Public methods need a description and typed parameters, including nested options and callback payloads; asynchronous methods declare their Promise result. Typed properties may omit descriptions when the type already explains them. Use `@throws {ErrorType}` for failure conditions. The reference includes documented class fields, typed failure contracts, section links and a consistent heading hierarchy.

## Local preview

Serve the folder over HTTP and open the printed URL:

```sh
npm start
# serves http://127.0.0.1:8000 (pass a port with `npm start -- 8080`)
```

The manual loads its manifest and Markdown with `fetch()`, so preview the site over HTTP instead of opening `docs.html` directly from `file://`. Serve the whole site so the manual and generated API can load their shared styles and theme script.

## Deploying

This repo is named `lumine-code.github.io`, so GitHub Pages serves it at the org root automatically. In the repo's **Settings -> Pages**, set the source to the `master` branch root folder.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
